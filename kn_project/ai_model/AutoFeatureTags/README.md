# Feature Extraction Model for Room Descriptions

Hệ thống trích xuất tự động các đặc điểm từ mô tả phòng trọ sử dụng Deep Learning (PhoBERT).

## 🏗️ Kiến trúc Pipeline

```
[Raw mô tả trọ]
        │
        ▼
[Tiền xử lý + Tokenizer (PhoBERT)]
        │
        ▼
[Encoder (PhoBERT - Vietnamese BERT)]
        │
        ▼
[Classification Head (Multi-label)]
        │
        ▼
[Output: Danh sách đặc điểm + confidence scores]
```

## 📋 Yêu cầu

```bash
pip install torch transformers pandas scikit-learn tqdm numpy
```

Hoặc cài đặt từ file:
```bash
pip install -r requirements.txt
```

## 📊 Định dạng Dataset

Dataset cần ở dạng CSV với 2 cột:

| description | features |
|-------------|----------|
| Tôi thấy phòng trọ này khá là mát, gần tiệm tạp hóa. Phòng có bình nóng lạnh đầy đủ, bàn học và bàn ghế | mát, gần tạp hóa, bình nóng lạnh, bàn học, ghế |
| Phòng trọ rộng rãi, có điều hòa, wifi miễn phí. Gần chợ và trường học | rộng rãi, điều hòa, wifi miễn phí, gần chợ, gần trường |

- **Cột 1 (description)**: Văn bản mô tả phòng trọ
- **Cột 2 (features)**: Các đặc điểm cần trích xuất, phân cách bởi dấu phẩy

## 🚀 Cách sử dụng

### 1. Chuẩn bị dữ liệu

Tạo dữ liệu mẫu và chia train/val/test:

```bash
python prepare_data.py
```

Hoặc tự chuẩn bị file CSV và đặt vào thư mục `data/`:
- `data/train.csv`
- `data/val.csv`
- `data/test.csv`

### 2. Huấn luyện model

```bash
python train.py
```

Model sẽ được lưu tại:
- `checkpoints/best_model.pt` - Model tốt nhất (theo F1 score)
- `checkpoints/checkpoint_epoch_X.pt` - Checkpoint mỗi epoch
- `checkpoints/feature_vocab.json` - Từ điển features

### 3. Dự đoán với model đã train

**Dự đoán 1 câu:**
```bash
python inference.py --text "Phòng trọ mát mẻ, có điều hòa và wifi"
```

**Chạy demo với nhiều câu:**
```bash
python inference.py
```

**Sử dụng model khác:**
```bash
python inference.py --model checkpoints/checkpoint_epoch_10.pt --text "Phòng có ban công rộng"
```

### 4. Sử dụng trong code Python

```python
from model import FeatureExtractionPipeline

# Load model
pipeline = FeatureExtractionPipeline(model_path='checkpoints/best_model.pt')

# Predict single text
text = "Phòng trọ gần trường, có máy lạnh và wifi"
features = pipeline.predict(text)

for feat in features:
    print(f"{feat['feature']}: {feat['confidence']:.2f}")

# Predict batch
texts = [
    "Phòng rộng, có giường tủ",
    "Gần chợ, an ninh tốt"
]
results = pipeline.predict_batch(texts)
```

## ⚙️ Cấu hình

Chỉnh sửa file `config.py` để thay đổi các tham số:

```python
class Config:
    # Model
    MODEL_NAME = "vinai/phobert-base"  # Pre-trained model
    MAX_LENGTH = 256                    # Max sequence length
    NUM_LABELS = 100                    # Max number of features
    
    # Training
    BATCH_SIZE = 16
    LEARNING_RATE = 2e-5
    NUM_EPOCHS = 10
    
    # Prediction
    MIN_FEATURE_CONFIDENCE = 0.5  # Threshold for feature extraction
```

## 📁 Cấu trúc thư mục

```
AutoFeatureTags/
├── config.py           # Cấu hình model và training
├── model.py            # Định nghĩa model architecture
├── train.py            # Script huấn luyện
├── inference.py        # Script dự đoán
├── prepare_data.py     # Script chuẩn bị dữ liệu
├── README.md           # File này
├── requirements.txt    # Dependencies
├── data/               # Thư mục chứa dataset
│   ├── train.csv
│   ├── val.csv
│   └── test.csv
├── checkpoints/        # Thư mục lưu model
│   ├── best_model.pt
│   └── feature_vocab.json
└── logs/               # Thư mục lưu training logs
    └── training_history.json
```

## 🎯 Kết quả Training

Training sẽ hiển thị các metrics:
- **Loss**: Training và Validation loss
- **F1 Score** (micro & macro): Đánh giá chất lượng trích xuất
- **Precision**: Độ chính xác của features được trích xuất
- **Recall**: Tỷ lệ features được phát hiện

Example output:
```
==================================================
Epoch 5/10
==================================================
Training Loss: 0.0234
Validation Loss: 0.0312
F1 (micro): 0.8756
F1 (macro): 0.8234
Precision: 0.9012
Recall: 0.8523
✓ New best model saved! F1: 0.8756
```

## 🔧 Troubleshooting

**1. Out of memory error:**
- Giảm `BATCH_SIZE` trong `config.py`
- Giảm `MAX_LENGTH`

**2. Model không học được:**
- Tăng `NUM_EPOCHS`
- Thử `LEARNING_RATE` khác (1e-5 đến 5e-5)
- Kiểm tra data có đúng format không

**3. Không có GPU:**
- Đổi `DEVICE = "cpu"` trong `config.py`
- Training sẽ chậm hơn nhưng vẫn hoạt động

## 📝 Ví dụ Input/Output

**Input:**
```
"Tôi thấy phòng trọ này khá là mát, gần tiệm tạp hóa. 
Phòng có bình nóng lạnh đầy đủ, bàn học và bàn ghế"
```

**Output:**
```python
[
    {'feature': 'mát', 'confidence': 0.92},
    {'feature': 'gần tạp hóa', 'confidence': 0.87},
    {'feature': 'bình nóng lạnh', 'confidence': 0.95},
    {'feature': 'bàn học', 'confidence': 0.89},
    {'feature': 'ghế', 'confidence': 0.85}
]
```

## 📈 Mở rộng

1. **Thêm dữ liệu training**: Càng nhiều data, model càng chính xác
2. **Fine-tune hyperparameters**: Thử nghiệm với learning rate, batch size
3. **Thử model khác**: Có thể thay PhoBERT bằng XLM-RoBERTa hoặc mBERT
4. **Thêm post-processing**: Lọc features trùng lặp, group theo category

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Data format đúng chưa
2. Dependencies đã cài đủ chưa
3. Model path có đúng không
