# Chatbot FAQ Integration

## 📋 Mô tả

Tính năng chatbot tích hợp FAQ tự động từ file Excel `FAQ_tro_HoaLac.xlsx`:
- Hiển thị 2 câu hỏi ngẫu nhiên từ FAQ trong hộp gợi ý
- Click vào câu hỏi sẽ nhận được câu trả lời từ cột 2 của Excel
- Tự động refresh 2 câu hỏi mới sau mỗi lần trả lời
- Hỗ trợ tìm kiếm thông minh trong FAQ khi người dùng nhập câu hỏi

## 🚀 Cách sử dụng

### Bước 1: Convert Excel sang JSON

Chạy script Python để convert file Excel:

```bash
cd c:\Users\ADMIN\Documents\GitHub\MinhSon090.github.io\kn_project
python convert_faq.py
```

Script sẽ tạo file `faq/faq_data.json` từ `faq/FAQ_tro_HoaLac.xlsx`

**Yêu cầu:**
```bash
pip install pandas openpyxl
```

### Bước 2: Sử dụng Chatbot

1. Mở website
2. Click vào nút chat 💬 ở góc phải dưới
3. Xem 2 câu hỏi gợi ý trong hộp FAQ
4. Click vào câu hỏi để nhận câu trả lời
5. Hoặc nhập câu hỏi của bạn vào ô chat

## 📁 Cấu trúc File

```
kn_project/
├── faq/
│   ├── FAQ_tro_HoaLac.xlsx    # File Excel gốc (2 cột: Câu hỏi | Câu trả lời)
│   └── faq_data.json           # File JSON đã convert (tự động tạo)
├── chatbot.js                  # Logic chatbot và xử lý FAQ
├── convert_faq.py              # Script convert Excel → JSON
├── index.html                  # Giao diện chat với FAQ box
└── style.css                   # Styles cho FAQ suggestions
```

## 🎨 Giao diện

### FAQ Suggestions Box
- Hiển thị phía trên ô nhập tin nhắn
- Border bo góc, background màu xám nhạt
- 2 câu hỏi có thể click
- Hover effect với màu xanh

### Chat Messages
- Bot messages: nền xanh nhạt, bên trái
- User messages: nền xanh đậm, chữ trắng, bên phải
- Auto scroll xuống tin nhắn mới

## 🔧 Tính năng

### 1. Random FAQ Display
- Mỗi lần load chat hoặc sau khi trả lời: hiển thị 2 câu hỏi ngẫu nhiên
- Đảm bảo người dùng luôn thấy nội dung mới

### 2. Smart FAQ Search
- Khi người dùng gõ câu hỏi, bot tìm trong FAQ
- So khớp keywords (>30% keywords trùng)
- Tự động trả về câu trả lời phù hợp nhất

### 3. Fallback Responses
- Nếu không tìm thấy trong FAQ, trả lời chung chung
- Gợi ý người dùng chọn câu hỏi có sẵn

## 💡 Lưu ý

1. **Format Excel:**
   - Cột 1: Câu hỏi
   - Cột 2: Câu trả lời
   - Không có header row (hoặc sẽ được bỏ qua)

2. **Update FAQ:**
   - Chỉnh sửa file Excel
   - Chạy lại `python convert_faq.py`
   - Refresh website

3. **Fallback Data:**
   - Nếu không tìm thấy `faq_data.json`
   - Chatbot sử dụng 10 câu FAQ mẫu
   - Vẫn hoạt động bình thường

## 🐛 Troubleshooting

**FAQ không hiển thị:**
- Kiểm tra file `faq/faq_data.json` có tồn tại không
- Xem console log: `✓ Loaded X FAQ entries`

**Không convert được Excel:**
```bash
pip install pandas openpyxl
```

**Chatbot không trả lời đúng:**
- Kiểm tra format câu hỏi trong Excel
- Đảm bảo không có ký tự đặc biệt lỗi
- Xem console log để debug

## 📝 Example FAQ Format

Excel file `FAQ_tro_HoaLac.xlsx`:

| Câu hỏi | Câu trả lời |
|---------|-------------|
| Giá phòng trọ ở Hòa Lạc bao nhiêu? | Giá phòng trọ tại Hòa Lạc dao động từ 1.5 - 3 triệu/tháng... |
| Có những tiện ích gì trong khu trọ? | Khu trọ có đầy đủ tiện ích: wifi miễn phí, máy giặt... |
| Điện nước tính như thế nào? | Điện 3,500đ/số, nước 20,000đ/người/tháng... |

## ✨ Demo

Xem chatbot hoạt động:
1. Click nút 💬
2. 2 câu hỏi ngẫu nhiên xuất hiện
3. Click câu hỏi → nhận câu trả lời
4. 2 câu hỏi mới được refresh
5. Hoặc tự gõ câu hỏi để tìm kiếm trong FAQ
