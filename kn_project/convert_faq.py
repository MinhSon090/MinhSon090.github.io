"""
Convert FAQ_tro_HoaLac.xlsx to JSON format
Usage: python convert_faq.py
"""
import pandas as pd
import json
import os

def convert_faq_to_json():
    excel_file = 'faq/FAQ_tro_HoaLac.xlsx'
    json_file = 'faq/faq_data.json'
    
    print("="*60)
    print("FAQ Excel to JSON Converter")
    print("="*60)
    
    # Check if Excel file exists
    if not os.path.exists(excel_file):
        print(f"❌ Error: File '{excel_file}' not found!")
        return
    
    try:
        # Read Excel file
        print(f"\n📂 Reading Excel file: {excel_file}")
        df = pd.read_excel(excel_file)
        
        print(f"✓ Loaded {len(df)} rows")
        print(f"✓ Columns: {list(df.columns)}")
        
        # Convert to list of dictionaries
        faq_data = []
        for index, row in df.iterrows():
            # Skip empty rows
            if pd.isna(row.iloc[0]) or pd.isna(row.iloc[1]):
                continue
                
            faq_data.append({
                'question': str(row.iloc[0]).strip(),  # Column 1 - question
                'answer': str(row.iloc[1]).strip()      # Column 2 - answer
            })
        
        print(f"\n✓ Processed {len(faq_data)} FAQ entries")
        
        # Save to JSON
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(faq_data, f, ensure_ascii=False, indent=2)
        
        print(f"✓ Saved to: {json_file}")
        
        # Display sample FAQs
        print(f"\n📋 Sample FAQs (first 3):")
        for i, faq in enumerate(faq_data[:3], 1):
            q_preview = faq['question'][:60] + "..." if len(faq['question']) > 60 else faq['question']
            a_preview = faq['answer'][:60] + "..." if len(faq['answer']) > 60 else faq['answer']
            print(f"\n{i}. Q: {q_preview}")
            print(f"   A: {a_preview}")
        
        print("\n" + "="*60)
        print("✅ Conversion completed successfully!")
        print("="*60)
        print("\nThe FAQ data is now ready for the chatbot.")
        print("Refresh your webpage to see the updated FAQ suggestions.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure you have installed required packages:")
        print("  pip install pandas openpyxl")

if __name__ == "__main__":
    convert_faq_to_json()

