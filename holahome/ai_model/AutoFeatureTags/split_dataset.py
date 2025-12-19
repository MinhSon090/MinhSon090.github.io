"""
Script to split dataset.csv into train (80%) and test/val (20%)
Chia dataset.csv thành train (80%) và test/val (20%)
"""

import csv
import random
import os

def split_dataset(input_file='ai_model/AutoFeatureTags/dataset.csv', train_ratio=0.8, random_seed=42):
    """
    Split dataset into train and test sets
    
    Args:
        input_file: Path to input CSV file
        train_ratio: Ratio for training set (default 0.8 = 80%)
        random_seed: Random seed for reproducibility
    """
    print("="*60)
    print("Dataset Splitting Script")
    print("="*60)
    
    # Check if file exists
    if not os.path.exists(input_file):
        print(f"❌ Error: File '{input_file}' not found!")
        return
    
    # Read dataset
    print(f"\n📂 Reading dataset from '{input_file}'...")
    
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        header = next(reader)  # Skip header
        data = list(reader)
    
    print(f"✓ Loaded {len(data)} rows")
    print(f"✓ Columns: {header}")
    
    # Show sample
    print(f"\n📝 Sample data (first 3 rows):")
    for i, row in enumerate(data[:3], 1):
        desc = row[0][:60] + "..." if len(row[0]) > 60 else row[0]
        feat = row[1][:60] + "..." if len(row[1]) > 60 else row[1]
        print(f"   {i}. {desc}")
        print(f"      → {feat}")
    
    # Shuffle data
    random.seed(random_seed)
    random.shuffle(data)
    
    # Split dataset
    split_idx = int(len(data) * train_ratio)
    train_data = data[:split_idx]
    test_data = data[split_idx:]
    
    print(f"\n📊 Splitting dataset:")
    print(f"   Train: {train_ratio*100:.0f}%")
    print(f"   Test/Val: {(1-train_ratio)*100:.0f}%")
    print(f"\n✓ Split completed:")
    print(f"   Train set: {len(train_data)} samples")
    print(f"   Test/Val set: {len(test_data)} samples")
    
    # Create data directory
    os.makedirs('data', exist_ok=True)
    
    # Save train set
    train_path = 'data/train.csv'
    with open(train_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['description', 'features'])  # Rename columns
        writer.writerows(train_data)
    
    # Save test set
    test_path = 'data/val.csv'  # Using val.csv as the test file
    with open(test_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['description', 'features'])  # Rename columns
        writer.writerows(test_data)
    
    print(f"\n💾 Datasets saved:")
    print(f"   ✓ Train: {train_path}")
    print(f"   ✓ Test/Val: {test_path}")
    
    # Analyze features
    print(f"\n🔍 Feature Analysis:")
    
    def analyze_features(data, name):
        all_features = set()
        total_features = 0
        for row in data:
            if len(row) > 1 and row[1]:
                feats = [f.strip() for f in row[1].split(',')]
                all_features.update(feats)
                total_features += len(feats)
        
        print(f"   {name}:")
        print(f"      - Unique features: {len(all_features)}")
        print(f"      - Total mentions: {total_features}")
        print(f"      - Avg features/sample: {total_features/len(data):.1f}")
        
        return all_features
    
    train_features = analyze_features(train_data, "Train set")
    test_features = analyze_features(test_data, "Test/Val set")
    
    # Show sample features
    sample_feats = list(train_features)[:20]
    print(f"\n   📋 Sample features (top 20):")
    for i in range(0, len(sample_feats), 4):
        batch = sample_feats[i:i+4]
        print(f"      {', '.join(batch)}")
    
    print("\n" + "="*60)
    print("✅ Dataset splitting completed successfully!")
    print("="*60)
    print("\nNext steps:")
    print("   1. Check data/train.csv and data/val.csv")
    print("   2. Run training: python train.py")
    print("="*60)


if __name__ == "__main__":
    split_dataset()
