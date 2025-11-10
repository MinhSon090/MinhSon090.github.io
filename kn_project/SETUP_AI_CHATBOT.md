# 🤖 Hướng dẫn cài đặt AI Chatbot với Google Gemini

Chatbot này sử dụng **Google Gemini API** (miễn phí) để trả lời thông minh hơn.

## 📋 Yêu cầu

- Node.js (phiên bản 14 trở lên)
- Tài khoản Google (để lấy API key miễn phí)

## 🚀 Bước 1: Lấy API Key miễn phí

1. Truy cập: **https://makersuite.google.com/app/apikey**
2. Đăng nhập bằng tài khoản Google
3. Click **"Create API Key"**
4. Chọn project có sẵn hoặc tạo project mới
5. Copy API key (dạng: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

**Giới hạn miễn phí:**
- ✅ 15 requests/phút (đủ cho chatbot)
- ✅ Unlimited requests/ngày
- ✅ Không cần thẻ tín dụng

## 🔧 Bước 2: Cài đặt Backend

```powershell
# 1. Vào thư mục backend
cd backend

# 2. Tạo file .env từ mẫu
copy .env.example .env

# 3. Mở file .env và paste API key vào
# notepad .env
# Thay "your_gemini_api_key_here" bằng API key thật

# 4. Cài đặt dependencies
npm install

# 5. Chạy server (Development mode)
npm run dev
```

**Hoặc Production mode:**
```powershell
npm start
```

Server sẽ chạy tại: **http://localhost:3000**

## ✅ Bước 3: Kiểm tra Backend

Mở trình duyệt, truy cập:
- http://localhost:3000 → Sẽ thấy thông tin API
- http://localhost:3000/api/health → Kiểm tra trạng thái

**Nếu thấy:** `"hasApiKey": true` → ✅ Cấu hình thành công!

## 🌐 Bước 4: Mở Frontend

```powershell
# Quay lại thư mục gốc
cd ..

# Mở file index.html bằng trình duyệt
# Hoặc dùng Live Server trong VS Code
```

## 🎯 Cách sử dụng

1. **Backend phải chạy trước** (npm run dev trong folder backend)
2. Mở website, click icon chat góc dưới phải
3. Gõ câu hỏi bất kỳ về phòng trọ
4. Chatbot sẽ trả lời thông minh dựa trên AI

## ⚙️ Cấu hình

Trong file `chatbot.js`, có thể thay đổi:

```javascript
const BACKEND_API_URL = 'http://localhost:3000/api/chat';
const USE_AI_CHATBOT = true; // false = dùng FAQ matching cũ
```

## 🔍 Troubleshooting

### ❌ Lỗi: "Cannot GET /api/chat"
→ Backend chưa chạy. Chạy lại: `npm run dev` trong folder backend

### ❌ Lỗi: "GEMINI_API_KEY not found"
→ Chưa tạo file `.env` hoặc chưa paste API key vào

### ❌ Lỗi: "API key not valid"
→ API key sai. Lấy lại key mới tại https://makersuite.google.com/app/apikey

### ❌ Lỗi: "Cannot find module '@google/generative-ai'"
→ Chạy lại: `npm install` trong folder backend

### ❌ Lỗi CORS
→ Đảm bảo backend đang chạy và URL đúng trong `chatbot.js`

## 📊 Monitoring

Backend sẽ log mỗi lần gọi API:
```
✅ Gemini API called successfully. Message: "Giá phòng bao nhiêu?..."
```

Nếu API lỗi, chatbot tự động fallback về FAQ matching cũ.

## 🎨 Tính năng

✅ **AI thông minh**: Hiểu ngữ cảnh, trả lời linh hoạt
✅ **Tiếng Việt**: Google Gemini hiểu tiếng Việt rất tốt
✅ **Lịch sử hội thoại**: Nhớ 10 tin nhắn gần nhất
✅ **Typing indicator**: Hiệu ứng "đang trả lời..."
✅ **Fallback**: Tự động dùng FAQ nếu API lỗi
✅ **Miễn phí 100%**: Không cần thẻ tín dụng

## 📝 Tùy chỉnh System Prompt

Trong `backend/server.js`, có thể sửa `SYSTEM_PROMPT` để thay đổi:
- Giá phòng
- Tiện ích
- Quy định
- Phong cách trả lời

---

**Cần hỗ trợ?** Kiểm tra console log trong browser (F12) và terminal backend.
