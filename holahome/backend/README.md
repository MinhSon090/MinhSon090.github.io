# Backend API - HolaHome

Backend Flask API cho ứng dụng HolaHome.

## Cài đặt

1. Tạo môi trường ảo Python:
```bash
python -m venv venv
```

2. Kích hoạt môi trường ảo:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Cài đặt thư viện:
```bash
pip install -r requirements.txt
```

4. Cấu hình file .env (tùy chọn cho chatbot):
```bash
# Copy file mẫu
cp .env.example .env

# Thêm API key của bạn vào file .env
```

## Chạy server

```bash
python app.py
```

Server sẽ chạy tại: http://localhost:5000

## API Endpoints

### Xác thực

#### Đăng ký người dùng
- **POST** `/api/register`
- Body: `{ "email", "username", "password" }`

#### Đăng nhập người dùng
- **POST** `/api/login`
- Body: `{ "email", "password" }`

#### Đăng nhập đối tác
- **POST** `/api/partner/login`
- Body: `{ "email", "password" }`

### Bất động sản

#### Lấy danh sách
- **GET** `/api/properties`

#### Chi tiết bất động sản
- **GET** `/api/properties/<property_id>`

#### Tìm kiếm
- **GET** `/api/search?query=<keyword>&type=<type>&min_price=<num>&max_price=<num>`

### Yêu thích

#### Lấy danh sách yêu thích
- **GET** `/api/favorites/<user_id>`

#### Thêm yêu thích
- **POST** `/api/favorites/<user_id>/<property_id>`

#### Xóa yêu thích
- **DELETE** `/api/favorites/<user_id>/<property_id>`

### Bình luận

#### Lấy bình luận
- **GET** `/api/comments/<property_id>`

#### Thêm bình luận
- **POST** `/api/comments/<property_id>`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "text", "rating" }`

### Đánh giá

#### Lấy đánh giá
- **GET** `/api/ratings/<property_id>`

#### Thêm đánh giá
- **POST** `/api/ratings/<property_id>`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "rating", "comment" }`

### Chatbot

#### Chat với AI
- **POST** `/api/chatbot`
- Body: `{ "message" }`

### Người dùng

#### Cập nhật tên đăng nhập
- **PUT** `/api/user/<user_id>/update-username`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "username" }`

#### Cập nhật email
- **PUT** `/api/user/<user_id>/update-email`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "email" }`

#### Cập nhật mật khẩu
- **PUT** `/api/user/<user_id>/update-password`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "current_password", "new_password" }`

### Thống kê

#### Lấy thống kê người truy cập
- **GET** `/api/visitor/stats`

#### Kết nối visitor
- **POST** `/api/visitor/connect`
- Body: `{ "sessionId" }`

#### Ngắt kết nối visitor
- **POST** `/api/visitor/disconnect`
- Body: `{ "sessionId" }`

### Partner

#### Lấy thống kê partner
- **GET** `/api/partner/stats`

## Cấu trúc dữ liệu

### User Account (accounts/user/accounts.json)
```json
{
  "users": {
    "user#00001": {
      "email": "user@example.com",
      "username": "username",
      "password": "hashed_password",
      "created_at": "2024-01-01T00:00:00",
      "account_type": "user"
    }
  },
  "next_user_id": 2
}
```

### Partner Account (accounts/partner/partner_accounts.json)
```json
{
  "partners": {
    "partner#00001": {
      "email": "partner@example.com",
      "username": "partner_name",
      "password": "hashed_password",
      "business_name": "Business Name",
      "verified": true,
      "created_at": "2024-01-01T00:00:00",
      "account_type": "partner"
    }
  },
  "next_partner_id": 2
}
```

## Demo Accounts

### Người dùng
- Username: `khachhang`
- Password: `khach123`

### Đối tác
- Username: `example_partner`
- Password: `partner123`

## Lưu ý

- Backend sử dụng file JSON để lưu trữ dữ liệu (không dùng database)
- JWT token được sử dụng để xác thực
- Mật khẩu được hash bằng Werkzeug (pbkdf2:sha256)
- CORS được bật cho phép frontend kết nối
- Chatbot yêu cầu API key (Gemini hoặc OpenAI)
