# 🤖 Hướng dẫn cấu hình Chatbot với OpenAI GPT

## 📋 Tổng quan
Chatbox đã được cấu hình để hỗ trợ 2 AI engines:
1. **OpenAI GPT** (GPT-3.5 hoặc GPT-4) - Tiếng Việt tốt hơn
2. **Google Gemini** (Gemini Pro) - Miễn phí

## 🔧 Cài đặt

### Bước 1: Cài đặt thư viện Python
```bash
cd backend
pip install openai
```

### Bước 2: Tạo file .env
Copy file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

### Bước 3: Chọn AI engine

#### Option A: Sử dụng OpenAI GPT (Recommended)
1. Lấy API key tại: https://platform.openai.com/api-keys
2. Sửa file `.env`:
```env
USE_OPENAI=true
OPENAI_API_KEY=sk-your-actual-api-key-here
```

#### Option B: Sử dụng Google Gemini (Free)
1. Lấy API key tại: https://makersuite.google.com/app/apikey
2. Sửa file `.env`:
```env
USE_OPENAI=false
GEMINI_API_KEY=your-gemini-api-key-here
```

## 🚀 Khởi động

```bash
# Khởi động backend
cd backend
python app.py
```

Backend sẽ chạy tại: http://localhost:5000

## 🧪 Test Chatbot

1. Mở trình duyệt: http://localhost:5000 (hoặc URL của bạn)
2. Click vào icon chatbox ở góc dưới bên phải
3. Gửi tin nhắn test:
   - "Giá phòng bao nhiêu?"
   - "Có điện nước bao nhiêu?"
   - "Gần trường nào?"
   - "Cho phép nấu ăn không?"

## 💰 Chi phí

### OpenAI GPT-3.5
- Input: $0.0005 / 1K tokens (~750 từ)
- Output: $0.0015 / 1K tokens
- Ví dụ: 100 câu hỏi ≈ $0.10 - $0.30

### OpenAI GPT-4
- Input: $0.03 / 1K tokens
- Output: $0.06 / 1K tokens
- Ví dụ: 100 câu hỏi ≈ $3 - $6

### Google Gemini Pro
- **Miễn phí** cho 60 requests/phút
- Giới hạn: 1,500 requests/ngày

## 📝 Tùy chỉnh

### Thay đổi System Prompt
Sửa file `backend/app.py`, dòng ~32:
```python
CHATBOT_SYSTEM_PROMPT = """
Tùy chỉnh hướng dẫn cho AI ở đây...
"""
```

### Thay đổi Model GPT
Sửa file `backend/app.py`, dòng ~730:
```python
model="gpt-3.5-turbo",  # Đổi thành "gpt-4" cho chất lượng tốt hơn
```

### Thay đổi tham số AI
```python
temperature=0.7,      # 0-1: Độ sáng tạo (càng cao càng sáng tạo)
max_tokens=500,       # Độ dài tối đa của câu trả lời
```

## ❌ Xử lý lỗi

### Lỗi: "Import openai could not be resolved"
```bash
pip install openai
```

### Lỗi: "API key not configured"
- Kiểm tra file `.env` có đúng format không
- Kiểm tra API key có đúng không
- Restart backend sau khi sửa `.env`

### Lỗi: "Rate limit exceeded"
- Đợi 1 phút rồi thử lại
- Hoặc nâng cấp plan OpenAI

## 🔍 Debug

Xem logs trong terminal backend:
- `✅ OpenAI GPT configured` - Đã cấu hình thành công
- `✅ OpenAI GPT called successfully` - API call thành công
- `❌ OpenAI API error:` - Có lỗi xảy ra

## 📞 Liên hệ

Nếu gặp vấn đề, kiểm tra:
1. Backend đang chạy: http://localhost:5000/api/chat
2. Console browser (F12) xem lỗi JavaScript
3. Terminal backend xem lỗi Python
