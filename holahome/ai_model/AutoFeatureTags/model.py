"""
Feature Extraction Model using BERT + Classification Head
Pipeline: Text -> Tokenizer -> BERT Encoder -> Decoder/Classification -> Features
"""

import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer
from config import Config


class FeatureExtractor(nn.Module):
    """
    Model architecture:
    1. PhoBERT Encoder for Vietnamese text understanding
    2. Pooling layer to aggregate token representations
    3. Multi-label classification head for feature extraction
    """
    
    def __init__(self, config=Config):
        super(FeatureExtractor, self).__init__()
        self.config = config
        
        # Load pre-trained PhoBERT
        self.encoder = AutoModel.from_pretrained(config.MODEL_NAME)
        
        # Classification head
        self.dropout = nn.Dropout(config.DROPOUT)
        self.classifier = nn.Sequential(
            nn.Linear(config.HIDDEN_SIZE, config.HIDDEN_SIZE),
            nn.ReLU(),
            nn.Dropout(config.DROPOUT),
            nn.Linear(config.HIDDEN_SIZE, config.NUM_LABELS)
        )
        
        # Feature vocabulary (will be populated during training)
        self.feature_vocab = {}
        self.id2feature = {}
        
    def forward(self, input_ids, attention_mask):
        """
        Forward pass through the model
        
        Args:
            input_ids: Token IDs from tokenizer
            attention_mask: Attention mask for padding tokens
            
        Returns:
            logits: Multi-label classification logits for each feature
        """
        # Pass through BERT encoder
        outputs = self.encoder(
            input_ids=input_ids,
            attention_mask=attention_mask
        )
        
        # Use [CLS] token representation (first token)
        pooled_output = outputs.last_hidden_state[:, 0, :]
        
        # Apply dropout
        pooled_output = self.dropout(pooled_output)
        
        # Classification
        logits = self.classifier(pooled_output)
        
        return logits
    
    def extract_features(self, text, tokenizer, device='cuda'):
        """
        Extract features from raw text
        
        Args:
            text: Input description text
            tokenizer: PhoBERT tokenizer
            device: Device to run inference on
            
        Returns:
            List of extracted features
        """
        self.eval()
        
        # Tokenize input
        encoded = tokenizer(
            text,
            max_length=self.config.MAX_LENGTH,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        input_ids = encoded['input_ids'].to(device)
        attention_mask = encoded['attention_mask'].to(device)
        
        # Forward pass
        with torch.no_grad():
            logits = self.forward(input_ids, attention_mask)
            probs = torch.sigmoid(logits)
        
        # Extract features above confidence threshold
        features = []
        for idx, prob in enumerate(probs[0]):
            if prob > self.config.MIN_FEATURE_CONFIDENCE:
                if idx in self.id2feature:
                    features.append({
                        'feature': self.id2feature[idx],
                        'confidence': prob.item()
                    })
        
        return features
    
    def build_vocab(self, all_features):
        """
        Build feature vocabulary from training data
        
        Args:
            all_features: List of all unique features in dataset
        """
        self.feature_vocab = {feat: idx for idx, feat in enumerate(all_features)}
        self.id2feature = {idx: feat for feat, idx in self.feature_vocab.items()}
        
        print(f"Built vocabulary with {len(self.feature_vocab)} features")
    
    def save_model(self, path):
        """Save model checkpoint"""
        torch.save({
            'model_state_dict': self.state_dict(),
            'feature_vocab': self.feature_vocab,
            'id2feature': self.id2feature,
            'config': self.config
        }, path)
        print(f"Model saved to {path}")
    
    def load_model(self, path, device='cuda'):
        """Load model checkpoint"""
        checkpoint = torch.load(path, map_location=device)
        self.load_state_dict(checkpoint['model_state_dict'])
        self.feature_vocab = checkpoint['feature_vocab']
        self.id2feature = checkpoint['id2feature']
        print(f"Model loaded from {path}")
        return self


class FeatureExtractionPipeline:
    """
    Complete pipeline for feature extraction
    """
    
    def __init__(self, model_path=None, config=Config):
        self.config = config
        self.device = torch.device('cuda' if torch.cuda.is_available() and config.DEVICE == 'cuda' else 'cpu')
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(config.MODEL_NAME)
        
        # Load or create model
        self.model = FeatureExtractor(config).to(self.device)
        
        if model_path:
            self.model.load_model(model_path, self.device)
    
    def predict(self, text):
        """
        Complete pipeline: Raw text -> Features
        
        Args:
            text: Input description text
            
        Returns:
            List of extracted features with confidence scores
        """
        features = self.model.extract_features(text, self.tokenizer, self.device)
        return features
    
    def predict_batch(self, texts):
        """
        Batch prediction for multiple texts
        
        Args:
            texts: List of input texts
            
        Returns:
            List of feature lists
        """
        results = []
        for text in texts:
            results.append(self.predict(text))
        return results


if __name__ == "__main__":
    # Example usage
    config = Config()
    
    # Create model
    model = FeatureExtractor(config)
    print(f"Model created with {sum(p.numel() for p in model.parameters())} parameters")
    
    # Example forward pass
    tokenizer = AutoTokenizer.from_pretrained(config.MODEL_NAME)
    text = "Tôi thấy phòng trọ này khá là mát, gần tiệm tạp hóa. Phòng có bình nóng lạnh đầy đủ, bàn học và bàn ghế"
    
    encoded = tokenizer(text, max_length=config.MAX_LENGTH, padding='max_length', 
                       truncation=True, return_tensors='pt')
    
    logits = model(encoded['input_ids'], encoded['attention_mask'])
    print(f"Output shape: {logits.shape}")
