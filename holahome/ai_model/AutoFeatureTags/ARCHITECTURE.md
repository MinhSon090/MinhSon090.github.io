# 🏗️ Kiến Trúc Mô Hình Feature Extraction

## 📊 Tổng Quan Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE EXTRACTION PIPELINE                   │
└─────────────────────────────────────────────────────────────────┘

Input Text (Vietnamese)
    │
    ├──► "Tôi thấy phòng trọ này khá là mát, gần tiệm tạp hóa.
    │     Phòng có bình nóng lạnh đầy đủ, bàn học và bàn ghế"
    │
    ▼
┌──────────────────┐
│   TOKENIZER      │ ← PhoBERT Tokenizer (Vietnamese)
│  (vinai/phobert) │
└──────────────────┘
    │
    ├──► Token IDs: [0, 245, 1523, 789, ...]
    ├──► Attention Mask: [1, 1, 1, 0, 0, ...]
    │
    ▼
┌──────────────────┐
│  BERT ENCODER    │ ← 12 Transformer Layers
│  (PhoBERT-base)  │   768-dim embeddings
└──────────────────┘
    │
    ├──► Contextualized Embeddings
    │     Shape: [batch, seq_len, 768]
    │
    ▼
┌──────────────────┐
│  POOLING LAYER   │ ← Extract [CLS] token
│  [CLS] token     │   (first token representation)
└──────────────────┘
    │
    ├──► Pooled Output
    │     Shape: [batch, 768]
    │
    ▼
┌──────────────────┐
│    DROPOUT       │ ← Dropout (p=0.1)
│    (p=0.1)       │
└──────────────────┘
    │
    ▼
┌──────────────────┐
│  CLASSIFICATION  │ ← Dense (768 → 768)
│      HEAD        │   ReLU Activation
│   (MLP 2 layers) │   Dropout (p=0.1)
│                  │   Dense (768 → 100)
└──────────────────┘
    │
    ├──► Logits
    │     Shape: [batch, 100]
    │
    ▼
┌──────────────────┐
│    SIGMOID       │ ← Multi-label Classification
│   (Threshold)    │   Confidence > 0.5
└──────────────────┘
    │
    ▼
Output Features
    │
    ├──► ["mát", "gần tạp hóa", "bình nóng lạnh", 
    │     "bàn học", "ghế"]
```

---

## 🏛️ Kiến Trúc Chi Tiết

### 1️⃣ **Input Layer - Tokenization**

**Thành phần:**
- **PhoBERT Tokenizer** (vinai/phobert-base)
- Vocabulary size: ~64,000 tokens
- Supports Vietnamese word segmentation

**Xử lý:**
```python
Input: "Phòng có bình nóng lạnh"
↓
Token IDs: [0, 245, 34, 1523, 789, 234, 2]
Attention Mask: [1, 1, 1, 1, 1, 1, 1]
Position IDs: [0, 1, 2, 3, 4, 5, 6]
```

**Hyperparameters:**
- `MAX_LENGTH = 256` - Cắt/pad đến 256 tokens
- `padding = 'max_length'` - Pad với token [PAD]
- `truncation = True` - Cắt nếu vượt quá

---

### 2️⃣ **Encoder - PhoBERT**

**Kiến trúc:**
```
PhoBERT-base (BERT for Vietnamese)
├── 12 Transformer Encoder Layers
│   ├── Multi-Head Self-Attention (12 heads)
│   │   └── head_dim = 768 / 12 = 64
│   ├── Feed-Forward Network (768 → 3072 → 768)
│   └── Layer Normalization + Residual Connections
│
├── Embedding Layer
│   ├── Token Embeddings (64k vocab → 768 dim)
│   ├── Position Embeddings (512 positions → 768 dim)
│   └── Segment Embeddings (2 segments → 768 dim)
│
└── Parameters: ~86 million
```

**Output:**
- **last_hidden_state**: [batch, seq_len, 768]
  - Contextualized embeddings cho mỗi token
  - Token đầu tiên `[CLS]` chứa representation của toàn bộ câu

**Ví dụ:**
```python
Input tokens: [CLS] Phòng mát gần trường [SEP]
              ↓     ↓    ↓   ↓     ↓     ↓
Embeddings:  e0    e1   e2  e3    e4    e5
              ↓ (Self-Attention × 12 layers)
Contextualized: 
              h0    h1   h2  h3    h4    h5
              ↑
              [CLS] token = Sentence representation
```

---

### 3️⃣ **Pooling Layer**

**Phương pháp:** Extract [CLS] token

```python
outputs = encoder(input_ids, attention_mask)
pooled = outputs.last_hidden_state[:, 0, :]  # Lấy token đầu tiên
```

**Tại sao dùng [CLS]?**
- BERT được pre-train để [CLS] token chứa context của toàn bộ câu
- Suitable cho sentence-level classification tasks
- Shape: `[batch, 768]`

---

### 4️⃣ **Classification Head (Decoder)**

**Kiến trúc:**

```
Input: [batch, 768]
    ↓
┌─────────────────────┐
│    Dropout (0.1)    │ ← Regularization
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Linear(768 → 768)  │ ← Hidden layer
└─────────────────────┘
    ↓
┌─────────────────────┐
│      ReLU()         │ ← Non-linearity
└─────────────────────┘
    ↓
┌─────────────────────┐
│    Dropout (0.1)    │ ← Regularization
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Linear(768 → 100)  │ ← Output layer (100 features)
└─────────────────────┘
    ↓
Output: [batch, 100] logits
```

**Parameters:**
```
Layer 1: 768 × 768 + 768 = 590,592 params
Layer 2: 768 × 100 + 100 = 76,900 params
Total: ~667K params
```

---

### 5️⃣ **Output & Loss**

**Multi-Label Classification:**

```python
# Forward pass
logits = model(input_ids, attention_mask)  # [batch, 100]

# Apply sigmoid (not softmax!)
probs = torch.sigmoid(logits)  # [batch, 100]

# Each output is independent (0-1)
# Example: [0.12, 0.89, 0.67, 0.03, ...]
```

**Loss Function:**
```python
criterion = nn.BCEWithLogitsLoss()
loss = criterion(logits, labels)
```

**BCE Loss cho Multi-Label:**
- Mỗi label độc lập (không loại trừ lẫn nhau)
- Một sample có thể có nhiều labels = 1
- Loss = -Σ[y*log(σ(x)) + (1-y)*log(1-σ(x))]

---

## 📈 Training Pipeline

### Data Flow:

```
dataset.csv (10,000 rows)
    │
    ├──► Column 1: mota (description text)
    ├──► Column 2: dacdiem (features: "mát, gần chợ, wifi")
    │
    ▼
split_dataset.py
    │
    ├──► train.csv (8,000 rows - 80%)
    └──► val.csv (2,000 rows - 20%)
    │
    ▼
FeatureDataset.__getitem__()
    │
    ├──► Tokenize text
    ├──► Parse features → multi-hot vector [0,1,0,1,...]
    │
    ▼
DataLoader (batch_size=16)
    │
    ▼
Training Loop
    │
    ├──► Forward Pass
    ├──► BCEWithLogitsLoss
    ├──► Backward Pass
    ├──► Optimizer.step()
    │
    ▼
Validation
    │
    ├──► F1 Score
    ├──► Precision
    ├──► Recall
    │
    ▼
Save Best Model (best F1)
```

---

## 🔢 Model Capacity

### Total Parameters:

```
Component                Parameters
─────────────────────────────────────
PhoBERT Encoder         ~86,000,000
Classification Head        667,492
─────────────────────────────────────
Total                   ~86,667,492
```

### Memory Requirements:

```
Model Size (fp32):     ~347 MB
Model Size (fp16):     ~173 MB
Inference (batch=1):   ~2 GB GPU
Training (batch=16):   ~8 GB GPU
```

---

## ⚙️ Hyperparameters

### Model Config:
```python
MODEL_NAME = "vinai/phobert-base"
MAX_LENGTH = 256              # Max tokens per input
HIDDEN_SIZE = 768             # BERT embedding dimension
NUM_LABELS = 100              # Number of feature types
DROPOUT = 0.1                 # Dropout probability
```

### Training Config:
```python
BATCH_SIZE = 16               # Samples per batch
LEARNING_RATE = 2e-5          # AdamW learning rate
NUM_EPOCHS = 10               # Training epochs
WARMUP_STEPS = 500            # Linear warmup steps
WEIGHT_DECAY = 0.01           # L2 regularization
MIN_FEATURE_CONFIDENCE = 0.5  # Threshold for predictions
```

### Optimizer:
```python
optimizer = AdamW(
    model.parameters(),
    lr=2e-5,
    weight_decay=0.01
)

scheduler = get_linear_schedule_with_warmup(
    optimizer,
    num_warmup_steps=500,
    num_training_steps=total_steps
)
```

---

## 🎯 Inference Pipeline

### Single Text Prediction:

```python
# 1. Load model
pipeline = FeatureExtractionPipeline(
    model_path='checkpoints/best_model.pt'
)

# 2. Input text
text = "Phòng có điều hòa, wifi, gần trường"

# 3. Extract features
features = pipeline.predict(text)

# 4. Output
[
    {'feature': 'điều hòa', 'confidence': 0.92},
    {'feature': 'wifi', 'confidence': 0.87},
    {'feature': 'gần trường', 'confidence': 0.78}
]
```

### Batch Prediction:

```python
texts = [
    "Phòng rộng, có ban công",
    "Giá rẻ, gần chợ, sạch sẽ"
]

results = pipeline.predict_batch(texts)
```

---

## 📊 Evaluation Metrics

### Multi-Label Metrics:

```python
# Micro-averaged (overall)
F1_micro = 2 * (P_micro * R_micro) / (P_micro + R_micro)

# Macro-averaged (per label)
F1_macro = mean([F1_label1, F1_label2, ...])

# Precision
Precision = TP / (TP + FP)

# Recall
Recall = TP / (TP + FN)
```

### Example Output:
```
Epoch 10/10
Train Loss: 0.0234
Val Loss: 0.0456
F1 (micro): 0.8234
F1 (macro): 0.7891
Precision: 0.8512
Recall: 0.7967
```

---

## 🚀 Optimizations

### Potential Improvements:

1. **Data Augmentation**
   - Back-translation
   - Synonym replacement
   - Random deletion/insertion

2. **Model Architecture**
   - Try PhoBERT-large (110M params)
   - Add attention pooling instead of [CLS]
   - Multi-head classification

3. **Training Tricks**
   - Label smoothing
   - Focal loss for imbalanced labels
   - Gradient accumulation for larger batch size

4. **Post-processing**
   - Confidence threshold tuning
   - Rule-based filtering
   - Feature clustering

---

## 📁 Project Structure

```
AutoFeatureTags/
├── config.py           # Hyperparameters
├── model.py            # Model architecture
├── train.py            # Training script
├── inference.py        # Inference script
├── prepare_data.py     # Data preprocessing
├── split_dataset.py    # 80/20 split
├── requirements.txt    # Dependencies
│
├── data/
│   ├── dataset.csv     # Original data (10k rows)
│   ├── train.csv       # Training set (8k)
│   └── val.csv         # Validation set (2k)
│
├── checkpoints/
│   ├── best_model.pt   # Best model checkpoint
│   ├── feature_vocab.json  # Feature vocabulary
│   └── checkpoint_epoch_*.pt
│
└── logs/
    └── training_history.json
```

---

## 🎓 References

1. **PhoBERT**: Pre-trained language models for Vietnamese
   - Paper: https://arxiv.org/abs/2003.00744
   - Model: vinai/phobert-base

2. **BERT**: Bidirectional Encoder Representations from Transformers
   - Paper: https://arxiv.org/abs/1810.04805

3. **Multi-Label Classification**
   - Sigmoid + BCE Loss for independent labels

---

**Tóm tắt:** Mô hình sử dụng PhoBERT (pre-trained Vietnamese BERT) làm encoder để hiểu ngữ nghĩa, kết hợp với classification head (MLP 2 layers) để dự đoán multi-label features từ mô tả phòng trọ. Training với 8k samples, validation với 2k samples, optimize bằng AdamW với linear warmup scheduler.
