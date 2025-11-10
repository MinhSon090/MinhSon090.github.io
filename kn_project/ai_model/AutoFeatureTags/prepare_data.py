"""
Data preparation utilities
"""

import pandas as pd
import os
from sklearn.model_selection import train_test_split


def create_sample_dataset():
    """
    Create a sample dataset for demonstration
    Format: Column 1 = description, Column 2 = features (comma-separated)
    """
    data = {
        'description': [
            "Tôi thấy phòng trọ này khá là mát, gần tiệm tạp hóa. Phòng có bình nóng lạnh đầy đủ, bàn học và bàn ghế",
            "Phòng trọ rộng rãi, có điều hòa, wifi miễn phí. Gần chợ và trường học",
            "Nhà trọ sạch sẽ, có giường tủ, bàn ghế. Chỗ để xe rộng rãi",
            "Phòng có ban công, thoáng mát. Bao điện nước, có thang máy",
            "Khu vực yên tĩnh, an ninh tốt. Phòng có tủ lạnh, máy giặt chung",
            "Phòng mới xây, có gác lửng, giờ giấc tự do. Có bảo vệ 24/7",
            "Gần siêu thị, bệnh viện. Phòng có cửa sổ lớn, ánh sáng tốt",
            "Có chỗ nấu ăn riêng, tủ bếp đầy đủ. Không chung chủ",
            "Phòng đầy đủ nội thất, dọn vào ở ngay. Giá bao gồm phí dịch vụ",
            "Cho nuôi thú cưng, có sân phơi đồ. Khu vực có nhiều quán ăn",
            "Phòng trọ view đẹp, tầng cao. Có hồ bơi, phòng gym chung",
            "Gần bến xe, dễ dàng đi lại. Có siêu thị mini trong khu",
            "Phòng rộng 25m2, toilet riêng. Có gương, giá treo quần áo",
            "Khu trọ cao cấp, có camera an ninh. Thanh toán theo tháng",
            "Phòng có 2 giường, phù hợp 2 người. Có ban công phơi đồ",
        ],
        'features': [
            "mát, gần tạp hóa, bình nóng lạnh, bàn học, ghế",
            "rộng rãi, điều hòa, wifi miễn phí, gần chợ, gần trường",
            "sạch sẽ, giường, tủ, bàn ghế, chỗ để xe rộng",
            "ban công, thoáng mát, bao điện nước, thang máy",
            "yên tĩnh, an ninh tốt, tủ lạnh, máy giặt chung",
            "mới xây, gác lửng, giờ giấc tự do, bảo vệ 24/7",
            "gần siêu thị, gần bệnh viện, cửa sổ lớn, ánh sáng tốt",
            "chỗ nấu ăn riêng, tủ bếp, không chung chủ",
            "đầy đủ nội thất, dọn vào ở ngay, bao phí dịch vụ",
            "cho nuôi thú cưng, sân phơi, nhiều quán ăn",
            "view đẹp, tầng cao, hồ bơi, phòng gym",
            "gần bến xe, dễ đi lại, siêu thị mini",
            "rộng 25m2, toilet riêng, gương, giá treo quần áo",
            "cao cấp, camera an ninh, thanh toán theo tháng",
            "2 giường, phù hợp 2 người, ban công phơi đồ"
        ]
    }
    
    df = pd.DataFrame(data)
    return df


def prepare_data(df, train_ratio=0.8, output_dir='data'):
    """
    Split dataset into train/val sets (val đóng vai trò test)
    
    Args:
        df: DataFrame with 'description' and 'features' columns
        train_ratio: Ratio for training set (default 0.8 = 80%)
        output_dir: Directory to save split datasets
    """
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Split: train (80%) and val (20%)
    train_df, val_df = train_test_split(df, test_size=(1 - train_ratio), random_state=42)
    
    # Save to CSV
    train_df.to_csv(os.path.join(output_dir, 'train.csv'), index=False, encoding='utf-8-sig')
    val_df.to_csv(os.path.join(output_dir, 'val.csv'), index=False, encoding='utf-8-sig')
    
    print(f"Data split completed:")
    print(f"  Train: {len(train_df)} samples -> {output_dir}/train.csv")
    print(f"  Val:   {len(val_df)} samples -> {output_dir}/val.csv (đóng vai trò test)")
    
    return train_df, val_df


if __name__ == "__main__":
    # Create sample dataset
    print("Creating sample dataset...")
    df = create_sample_dataset()
    
    print("\nSample data preview:")
    print(df.head())
    
    # Split and save
    print("\nSplitting data...")
    train_df, val_df = prepare_data(df)
    
    print("\n✓ Data preparation completed!")
