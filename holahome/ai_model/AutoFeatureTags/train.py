"""
Training script for Feature Extraction Model
Pipeline: Data Loading -> Preprocessing -> Training -> Evaluation -> Save Model
"""

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW  # AdamW moved to torch.optim in newer versions
from transformers import AutoTokenizer, get_linear_schedule_with_warmup
import pandas as pd
import numpy as np
from tqdm import tqdm
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score, precision_score, recall_score
import json

from model import FeatureExtractor
from config import Config


class FeatureDataset(Dataset):
    """
    Dataset class for feature extraction task
    Handles text descriptions and multi-label feature annotations
    """
    
    def __init__(self, texts, features, tokenizer, config, feature_vocab):
        """
        Args:
            texts: List of description texts
            features: List of feature lists (each item is a list of features)
            tokenizer: PhoBERT tokenizer
            config: Configuration object
            feature_vocab: Dictionary mapping feature names to IDs
        """
        self.texts = texts
        self.features = features
        self.tokenizer = tokenizer
        self.config = config
        self.feature_vocab = feature_vocab
        
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = self.texts[idx]
        feature_list = self.features[idx]
        
        # Tokenize text
        encoded = self.tokenizer(
            text,
            max_length=self.config.MAX_LENGTH,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        # Create multi-label target vector
        target = torch.zeros(self.config.NUM_LABELS)
        for feature in feature_list:
            if feature in self.feature_vocab:
                feature_id = self.feature_vocab[feature]
                if feature_id < self.config.NUM_LABELS:
                    target[feature_id] = 1.0
        
        return {
            'input_ids': encoded['input_ids'].squeeze(0),
            'attention_mask': encoded['attention_mask'].squeeze(0),
            'labels': target
        }


def load_data_from_csv(csv_path):
    """
    Load data from CSV file
    Expected format: Column 1 = description text, Column 2 = comma-separated features
    
    Args:
        csv_path: Path to CSV file
        
    Returns:
        texts: List of description texts
        features: List of feature lists
    """
    df = pd.read_csv(csv_path)
    
    # Assume first column is text, second column is features
    texts = df.iloc[:, 0].tolist()
    features_raw = df.iloc[:, 1].tolist()
    
    # Parse features (comma-separated string to list)
    features = []
    for feat_str in features_raw:
        if pd.isna(feat_str):
            features.append([])
        else:
            # Split by comma and clean whitespace
            feat_list = [f.strip() for f in str(feat_str).split(',')]
            features.append(feat_list)
    
    return texts, features


def build_feature_vocabulary(all_features_lists, max_features=None):
    """
    Build vocabulary from all features in dataset
    
    Args:
        all_features_lists: List of feature lists
        max_features: Maximum number of features to include (most frequent)
        
    Returns:
        feature_vocab: Dictionary mapping feature to ID
    """
    # Count feature frequencies
    feature_counts = {}
    for feat_list in all_features_lists:
        for feat in feat_list:
            feature_counts[feat] = feature_counts.get(feat, 0) + 1
    
    # Sort by frequency
    sorted_features = sorted(feature_counts.items(), key=lambda x: x[1], reverse=True)
    
    # Take top features if max_features is specified
    if max_features:
        sorted_features = sorted_features[:max_features]
    
    # Create vocabulary
    feature_vocab = {feat: idx for idx, (feat, count) in enumerate(sorted_features)}
    
    print(f"Built vocabulary with {len(feature_vocab)} features")
    print(f"Top 10 features: {list(feature_vocab.keys())[:10]}")
    
    return feature_vocab


def train_epoch(model, dataloader, optimizer, scheduler, device, config):
    """Train for one epoch"""
    model.train()
    total_loss = 0
    criterion = nn.BCEWithLogitsLoss()
    
    progress_bar = tqdm(dataloader, desc="Training")
    for batch in progress_bar:
        # Move to device
        input_ids = batch['input_ids'].to(device)
        attention_mask = batch['attention_mask'].to(device)
        labels = batch['labels'].to(device)
        
        # Forward pass
        optimizer.zero_grad()
        logits = model(input_ids, attention_mask)
        
        # Calculate loss
        loss = criterion(logits, labels)
        
        # Backward pass
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        scheduler.step()
        
        total_loss += loss.item()
        progress_bar.set_postfix({'loss': loss.item()})
    
    return total_loss / len(dataloader)


def evaluate(model, dataloader, device, config):
    """Evaluate model"""
    model.eval()
    all_preds = []
    all_labels = []
    total_loss = 0
    criterion = nn.BCEWithLogitsLoss()
    
    with torch.no_grad():
        for batch in tqdm(dataloader, desc="Evaluating"):
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)
            
            # Forward pass
            logits = model(input_ids, attention_mask)
            loss = criterion(logits, labels)
            total_loss += loss.item()
            
            # Get predictions (apply sigmoid and threshold)
            probs = torch.sigmoid(logits)
            preds = (probs > config.MIN_FEATURE_CONFIDENCE).float()
            
            all_preds.append(preds.cpu().numpy())
            all_labels.append(labels.cpu().numpy())
    
    # Concatenate all batches
    all_preds = np.vstack(all_preds)
    all_labels = np.vstack(all_labels)
    
    # Calculate metrics
    f1_micro = f1_score(all_labels, all_preds, average='micro', zero_division=0)
    f1_macro = f1_score(all_labels, all_preds, average='macro', zero_division=0)
    precision = precision_score(all_labels, all_preds, average='micro', zero_division=0)
    recall = recall_score(all_labels, all_preds, average='micro', zero_division=0)
    
    avg_loss = total_loss / len(dataloader)
    
    return {
        'loss': avg_loss,
        'f1_micro': f1_micro,
        'f1_macro': f1_macro,
        'precision': precision,
        'recall': recall
    }


def train(config=Config):
    """
    Main training function
    """
    # Set device
    device = torch.device('cuda' if torch.cuda.is_available() and config.DEVICE == 'cuda' else 'cpu')
    print(f"Using device: {device}")
    
    # Create directories
    os.makedirs(config.MODEL_SAVE_PATH, exist_ok=True)
    os.makedirs(config.LOG_DIR, exist_ok=True)
    
    # Load tokenizer
    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(config.MODEL_NAME)
    
    # Load data
    print("Loading training data...")
    train_texts, train_features = load_data_from_csv(config.TRAIN_DATA_PATH)
    print(f"Loaded {len(train_texts)} training samples")
    
    # Build feature vocabulary
    print("Building feature vocabulary...")
    feature_vocab = build_feature_vocabulary(train_features, max_features=config.NUM_LABELS)
    
    # Save vocabulary
    with open(os.path.join(config.MODEL_SAVE_PATH, 'feature_vocab.json'), 'w', encoding='utf-8') as f:
        json.dump(feature_vocab, f, ensure_ascii=False, indent=2)
    
    # Create datasets
    train_dataset = FeatureDataset(train_texts, train_features, tokenizer, config, feature_vocab)
    
    # Load validation data if available
    val_dataset = None
    if os.path.exists(config.VAL_DATA_PATH):
        print("Loading validation data...")
        val_texts, val_features = load_data_from_csv(config.VAL_DATA_PATH)
        val_dataset = FeatureDataset(val_texts, val_features, tokenizer, config, feature_vocab)
        print(f"Loaded {len(val_texts)} validation samples")
    
    # Create dataloaders
    train_loader = DataLoader(train_dataset, batch_size=config.BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=config.BATCH_SIZE) if val_dataset else None
    
    # Create model
    print("Creating model...")
    model = FeatureExtractor(config).to(device)
    model.build_vocab(list(feature_vocab.keys()))
    
    print(f"Model has {sum(p.numel() for p in model.parameters())} parameters")
    
    # Optimizer and scheduler
    optimizer = AdamW(model.parameters(), lr=config.LEARNING_RATE, weight_decay=config.WEIGHT_DECAY)
    total_steps = len(train_loader) * config.NUM_EPOCHS
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=config.WARMUP_STEPS,
        num_training_steps=total_steps
    )
    
    # Training loop
    print("\nStarting training...")
    best_f1 = 0
    training_history = []
    
    for epoch in range(config.NUM_EPOCHS):
        print(f"\n{'='*50}")
        print(f"Epoch {epoch + 1}/{config.NUM_EPOCHS}")
        print(f"{'='*50}")
        
        # Train
        train_loss = train_epoch(model, train_loader, optimizer, scheduler, device, config)
        print(f"Training Loss: {train_loss:.4f}")
        
        # Evaluate
        if val_loader:
            val_metrics = evaluate(model, val_loader, device, config)
            print(f"Validation Loss: {val_metrics['loss']:.4f}")
            print(f"F1 (micro): {val_metrics['f1_micro']:.4f}")
            print(f"F1 (macro): {val_metrics['f1_macro']:.4f}")
            print(f"Precision: {val_metrics['precision']:.4f}")
            print(f"Recall: {val_metrics['recall']:.4f}")
            
            # Save best model
            if val_metrics['f1_micro'] > best_f1:
                best_f1 = val_metrics['f1_micro']
                model_path = os.path.join(config.MODEL_SAVE_PATH, 'best_model.pt')
                model.save_model(model_path)
                print(f"✓ New best model saved! F1: {best_f1:.4f}")
            
            training_history.append({
                'epoch': epoch + 1,
                'train_loss': train_loss,
                'val_loss': val_metrics['loss'],
                'val_f1_micro': val_metrics['f1_micro'],
                'val_f1_macro': val_metrics['f1_macro'],
                'val_precision': val_metrics['precision'],
                'val_recall': val_metrics['recall']
            })
        
        # Save checkpoint every epoch
        checkpoint_path = os.path.join(config.MODEL_SAVE_PATH, f'checkpoint_epoch_{epoch+1}.pt')
        model.save_model(checkpoint_path)
    
    # Save training history
    history_path = os.path.join(config.LOG_DIR, 'training_history.json')
    with open(history_path, 'w') as f:
        json.dump(training_history, f, indent=2)
    
    print("\n" + "="*50)
    print("Training completed!")
    print(f"Best validation F1: {best_f1:.4f}")
    print("="*50)


if __name__ == "__main__":
    # Example: Create sample data for testing
    def create_sample_data():
        """Create sample training data"""
        data = {
            'description': [
                "Tôi thấy phòng trọ này khá là mát, gần tiệm tạp hóa. Phòng có bình nóng lạnh đầy đủ, bàn học và bàn ghế",
                "Phòng trọ rộng rãi, có điều hòa, wifi miễn phí. Gần chợ và trường học",
                "Nhà trọ sạch sẽ, có giường tủ, bàn ghế. Chỗ để xe rộng rãi",
                "Phòng có ban công, thoáng mát. Bao điện nước, có thang máy",
                "Khu vực yên tĩnh, an ninh tốt. Phòng có tủ lạnh, máy giặt chung",
            ],
            'features': [
                "mát, gần tạp hóa, bình nóng lạnh, bàn học, ghế",
                "rộng rãi, điều hòa, wifi miễn phí, gần chợ, gần trường",
                "sạch sẽ, giường, tủ, bàn ghế, chỗ để xe rộng",
                "ban công, thoáng mát, bao điện nước, thang máy",
                "yên tĩnh, an ninh tốt, tủ lạnh, máy giặt chung"
            ]
        }
        
        df = pd.DataFrame(data)
        
        # Create data directory
        os.makedirs('data', exist_ok=True)
        
        # Save as CSV
        df.to_csv('data/train.csv', index=False, encoding='utf-8-sig')
        print("Sample data created at data/train.csv")
        print("\nSample data:")
        print(df)
    
    # Uncomment to create sample data
    # create_sample_data()
    
    # Start training
    config = Config()
    train(config)
