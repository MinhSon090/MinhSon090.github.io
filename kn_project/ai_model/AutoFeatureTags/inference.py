"""
Inference script for extracting features from new descriptions
"""

import torch
from model import FeatureExtractionPipeline
from config import Config
import argparse


def predict_single(text, model_path='checkpoints/best_model.pt'):
    """
    Extract features from a single description
    
    Args:
        text: Description text
        model_path: Path to trained model
        
    Returns:
        List of features with confidence scores
    """
    # Create pipeline
    pipeline = FeatureExtractionPipeline(model_path=model_path)
    
    # Predict
    features = pipeline.predict(text)
    
    return features


def predict_batch(texts, model_path='checkpoints/best_model.pt'):
    """
    Extract features from multiple descriptions
    
    Args:
        texts: List of description texts
        model_path: Path to trained model
        
    Returns:
        List of feature lists
    """
    # Create pipeline
    pipeline = FeatureExtractionPipeline(model_path=model_path)
    
    # Predict
    results = pipeline.predict_batch(texts)
    
    return results


def main():
    parser = argparse.ArgumentParser(description='Extract features from room descriptions')
    parser.add_argument('--text', type=str, help='Single text to predict')
    parser.add_argument('--model', type=str, default='checkpoints/best_model.pt', 
                       help='Path to trained model')
    
    args = parser.parse_args()
    
    if args.text:
        # Single prediction
        print("Input text:")
        print(args.text)
        print("\n" + "="*50)
        print("Extracting features...")
        print("="*50 + "\n")
        
        features = predict_single(args.text, args.model)
        
        if features:
            print("Extracted features:")
            for feat_info in features:
                print(f"  • {feat_info['feature']} (confidence: {feat_info['confidence']:.3f})")
        else:
            print("No features extracted.")
    else:
        # Demo with examples
        demo_texts = [
            "Tôi thấy phòng trọ này khá là mát, gần tiệm tạp hóa. Phòng có bình nóng lạnh đầy đủ, bàn học và bàn ghế",
            "Phòng trọ rộng rãi, có điều hòa, wifi miễn phí. Gần chợ và trường học",
            "Nhà trọ sạch sẽ, có giường tủ, bàn ghế. Chỗ để xe rộng rãi"
        ]
        
        print("Running demo predictions...\n")
        results = predict_batch(demo_texts, args.model)
        
        for i, (text, features) in enumerate(zip(demo_texts, results), 1):
            print(f"Text {i}:")
            print(f"  {text}")
            print(f"\nExtracted features:")
            if features:
                for feat_info in features:
                    print(f"  • {feat_info['feature']} (confidence: {feat_info['confidence']:.3f})")
            else:
                print("  No features extracted.")
            print("\n" + "-"*50 + "\n")


if __name__ == "__main__":
    main()
