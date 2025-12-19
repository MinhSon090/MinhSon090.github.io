"""
Example usage of the Feature Extraction Model
Ví dụ sử dụng model trích xuất đặc điểm
"""

import os
import sys

# Uncomment the lines below if you want to run the full pipeline

def example_1_prepare_data():
    """
    Example 1: Prepare sample data
    Ví dụ 1: Chuẩn bị dữ liệu mẫu
    """
    print("="*60)
    print("Example 1: Preparing sample data")
    print("Ví dụ 1: Chuẩn bị dữ liệu mẫu")
    print("="*60)
    
    from prepare_data import create_sample_dataset, prepare_data
    
    # Create sample dataset
    df = create_sample_dataset()
    print("\nDataset preview:")
    print(df.head())
    
    # Split and save
    train_df, val_df, test_df = prepare_data(df)
    
    print("\n✓ Data preparation completed!")


def example_2_train_model():
    """
    Example 2: Train the model
    Ví dụ 2: Huấn luyện model
    
    NOTE: This requires GPU and will take time. 
    Uncomment to run actual training.
    """
    print("="*60)
    print("Example 2: Training model")
    print("Ví dụ 2: Huấn luyện model")
    print("="*60)
    
    from train import train
    from config import Config
    
    # Modify config for quick demo
    config = Config()
    config.NUM_EPOCHS = 3  # Reduce epochs for demo
    config.BATCH_SIZE = 8   # Smaller batch size
    
    print("\nStarting training with demo config...")
    print("Note: This is a demo with reduced epochs.")
    print("For full training, use default config.\n")
    
    # Uncomment to actually train
    # train(config)
    
    print("\n(Training skipped in demo. Uncomment code to run.)")


def example_3_inference():
    """
    Example 3: Use trained model for prediction
    Ví dụ 3: Sử dụng model đã train để dự đoán
    
    NOTE: Requires a trained model at checkpoints/best_model.pt
    """
    print("="*60)
    print("Example 3: Feature extraction (Inference)")
    print("Ví dụ 3: Trích xuất đặc điểm (Dự đoán)")
    print("="*60)
    
    # Check if model exists
    model_path = 'checkpoints/best_model.pt'
    if not os.path.exists(model_path):
        print(f"\n⚠ Model not found at {model_path}")
        print("Please train the model first using example_2_train_model()")
        return
    
    from inference import predict_single, predict_batch
    
    # Single prediction
    print("\n--- Single Prediction ---")
    text = "Tôi thấy phòng trọ này khá là mát, gần tiệm tạp hóa. Phòng có bình nóng lạnh đầy đủ, bàn học và bàn ghế"
    print(f"Input: {text}")
    
    features = predict_single(text, model_path)
    
    print("\nExtracted features:")
    for feat_info in features:
        print(f"  • {feat_info['feature']} (confidence: {feat_info['confidence']:.3f})")
    
    # Batch prediction
    print("\n--- Batch Prediction ---")
    texts = [
        "Phòng trọ rộng rãi, có điều hòa, wifi miễn phí. Gần chợ và trường học",
        "Nhà trọ sạch sẽ, có giường tủ, bàn ghế. Chỗ để xe rộng rãi",
        "Phòng có ban công, thoáng mát. Bao điện nước, có thang máy"
    ]
    
    results = predict_batch(texts, model_path)
    
    for i, (text, features) in enumerate(zip(texts, results), 1):
        print(f"\nText {i}: {text}")
        print("Features:")
        for feat_info in features:
            print(f"  • {feat_info['feature']} (confidence: {feat_info['confidence']:.3f})")


def example_4_custom_pipeline():
    """
    Example 4: Custom pipeline usage in code
    Ví dụ 4: Sử dụng pipeline tùy chỉnh trong code
    """
    print("="*60)
    print("Example 4: Custom pipeline usage")
    print("Ví dụ 4: Sử dụng pipeline tùy chỉnh")
    print("="*60)
    
    # Check if model exists
    model_path = 'checkpoints/best_model.pt'
    if not os.path.exists(model_path):
        print(f"\n⚠ Model not found at {model_path}")
        print("Please train the model first.")
        return
    
    from model import FeatureExtractionPipeline
    
    # Initialize pipeline
    print("\nInitializing pipeline...")
    pipeline = FeatureExtractionPipeline(model_path=model_path)
    
    # Custom processing
    print("\nProcessing room descriptions...")
    
    descriptions = [
        "Phòng mới xây, có gác lửng, giờ giấc tự do. Có bảo vệ 24/7",
        "Gần siêu thị, bệnh viện. Phòng có cửa sổ lớn, ánh sáng tốt",
        "Có chỗ nấu ăn riêng, tủ bếp đầy đủ. Không chung chủ"
    ]
    
    all_features = []
    for desc in descriptions:
        features = pipeline.predict(desc)
        all_features.append(features)
        
        print(f"\n📝 {desc}")
        print("   Features:", ", ".join([f['feature'] for f in features]))
    
    print("\n✓ Processing completed!")


def main():
    """
    Main function to run examples
    """
    print("\n" + "="*60)
    print("Feature Extraction Model - Examples")
    print("Ví dụ sử dụng Model Trích xuất Đặc điểm")
    print("="*60)
    
    print("\nAvailable examples:")
    print("1. Prepare sample data (Chuẩn bị dữ liệu mẫu)")
    print("2. Train model (Huấn luyện model)")
    print("3. Inference with trained model (Dự đoán với model đã train)")
    print("4. Custom pipeline usage (Sử dụng pipeline tùy chỉnh)")
    print("5. Run all examples")
    print("0. Exit")
    
    while True:
        try:
            choice = input("\nSelect example (0-5): ").strip()
            
            if choice == '0':
                print("Goodbye!")
                break
            elif choice == '1':
                example_1_prepare_data()
            elif choice == '2':
                example_2_train_model()
            elif choice == '3':
                example_3_inference()
            elif choice == '4':
                example_4_custom_pipeline()
            elif choice == '5':
                example_1_prepare_data()
                print("\n" + "="*60 + "\n")
                # example_2_train_model()  # Uncomment to train
                print("\n" + "="*60 + "\n")
                # example_3_inference()  # Uncomment after training
                print("\n" + "="*60 + "\n")
                # example_4_custom_pipeline()  # Uncomment after training
            else:
                print("Invalid choice. Please select 0-5.")
                
        except KeyboardInterrupt:
            print("\n\nInterrupted. Goodbye!")
            break
        except Exception as e:
            print(f"\nError: {e}")
            print("Make sure all dependencies are installed: pip install -r requirements.txt")


if __name__ == "__main__":
    main()
