"""
Configuration file for Feature Extraction Model
"""

class Config:
    # Model Configuration
    MODEL_NAME = "vinai/phobert-base"  # Pre-trained Vietnamese BERT
    MAX_LENGTH = 256  # Maximum sequence length
    HIDDEN_SIZE = 768  # BERT hidden size
    NUM_LABELS = 100  # Maximum number of feature types
    DROPOUT = 0.1
    
    # Training Configuration
    BATCH_SIZE = 16
    LEARNING_RATE = 2e-5
    NUM_EPOCHS = 10
    WARMUP_STEPS = 500
    WEIGHT_DECAY = 0.01
    
    # Data Configuration
    TRAIN_DATA_PATH = "ai_model/AutoFeatureTags/data/train.csv"
    VAL_DATA_PATH = "ai_model/AutoFeatureTags/data/val.csv"  # Val đóng vai trò test luôn
    
    # Output Configuration
    MODEL_SAVE_PATH = "checkpoints/"
    LOG_DIR = "logs/"
    
    # Feature Configuration
    MIN_FEATURE_CONFIDENCE = 0.5  # Minimum confidence to include a feature
    
    # Device Configuration
    DEVICE = "cuda"  # or "cpu"
