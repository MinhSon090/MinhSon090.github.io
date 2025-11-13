# 🔐 Hệ Thống Tài Khoản Đối Tác & Khách Hàng

## ✅ ĐÃ HOÀN THÀNH

### 1. **Tách Riêng Tài Khoản** ⭐⭐⭐⭐⭐

**Files mới tạo**:
- `account/partner_accounts.json` - Lưu riêng tài khoản đối tác

**Cấu trúc tài khoản**:
```json
{
  "users": {
    "user#00001": {
      "id": "user#00001",
      "email": "customer@example.com",
      "account_type": "user"  // Khách hàng
    }
  }
}
```

```json
{
  "partners": {
    "partner#00001": {
      "id": "partner#00001",
      "email": "partner@example.com",
      "account_type": "partner",  // Đối tác
      "business_name": "Nhà Trọ ABC",
      "verified": true
    }
  }
}
```

**Phân biệt**:
- Khách hàng: ID bắt đầu `user#xxxxx`
- Đối tác: ID bắt đầu `partner#xxxxx`
- Lưu riêng file để dễ quản lý

---

### 2. **Link Đăng Ký Đối Tác → Google Form** ⭐⭐⭐⭐⭐

**Đã sửa trong `partner_dashboard.html`**:
```html
<p>Chưa có tài khoản đối tác? 
   <a href="https://forms.google.com/your-partner-registration-form" 
      target="_blank" 
      id="show-register">Đăng ký ngay</a>
</p>
```

**Cách thay link Google Form của bạn**:
1. Tạo Google Form tại: https://forms.google.com
2. Thêm các trường:
   - Tên chủ trọ
   - Email
   - Số điện thoại
   - Tên cơ sở (nhà trọ/KTX)
   - Địa chỉ
   - Số lượng phòng
   - Giấy phép kinh doanh (upload file)
3. Copy link form (Share → Copy link)
4. Paste vào code thay `https://forms.google.com/your-partner-registration-form`

**Ví dụ link thật**:
```
https://forms.gle/aBc123XyZ456
```

---

### 3. **Logo Nổi Bật** ⭐⭐⭐⭐⭐

**Đã sửa trong `partner_style.css`**:

```css
.login-logo img {
    width: 150px;        /* Tăng từ 100px → 150px */
    height: 150px;       /* To hơn 50% */
    object-fit: contain; /* Giữ tỷ lệ, không crop */
    filter: drop-shadow(0 10px 40px rgba(255, 255, 255, 0.3)); 
    /* Shadow trắng thay vì background */
    animation: logoFloat 3s ease-in-out infinite;
    /* Animation lơ lửng */
}

/* Không có background, không có border-radius */
/* Logo giữ nguyên PNG transparent */
```

**Animation float**:
```css
@keyframes logoFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}
```

**Kết quả**:
- ✅ Logo to hơn 50% (150px vs 100px)
- ✅ Không có background trắng
- ✅ Không có border-radius
- ✅ Shadow mềm mại
- ✅ Animation lơ lửng nhẹ nhàng
- ✅ Nổi bật trên background gradient

---

### 4. **API Riêng Cho Đối Tác** ⭐⭐⭐⭐⭐

**Backend mới (app.py)**:

**POST `/api/partner/login`**:
```python
# Chỉ cho phép đăng nhập nếu account_type = 'partner'
# Kiểm tra email/username trong database partners
# Trả về token JWT riêng
```

**GET `/api/partner/stats`**:
```python
# Lấy thống kê cho partner dashboard
# Cần token authentication
# Trả về: properties, views, bookings, revenue
```

**Frontend (partner_script.js)**:
```javascript
// Gọi API riêng
fetch('http://localhost:5000/api/partner/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
});

// Lưu token riêng
localStorage.setItem('partnerToken', data.token);
localStorage.setItem('partnerId', data.partner.id);
```

---

## 🚀 Cách Sử Dụng

### **Đăng Nhập Đối Tác**:

1. Mở `partner_dashboard.html`
2. Màn hình login xuất hiện
3. Nhập:
   - Email: `partner@example.com`
   - Password: (password của partner account)
4. Click "Đăng nhập"
5. ✅ Kiểm tra account_type = 'partner'
6. ✅ Chuyển vào dashboard

### **Đăng Ký Đối Tác Mới**:

1. Click "Chưa có tài khoản đối tác? Đăng ký ngay"
2. ✅ Mở Google Form trong tab mới
3. Điền thông tin
4. Submit form
5. Admin duyệt và tạo account trong `partner_accounts.json`

---

## 📊 Phân Quyền

### **Khách Hàng (User)**:
- ✅ Xem phòng trọ
- ✅ Đánh giá, bình luận
- ✅ Lưu yêu thích
- ✅ Đặt lịch xem phòng
- ❌ KHÔNG truy cập partner dashboard

### **Đối Tác (Partner)**:
- ✅ Đăng tin phòng trọ
- ✅ Quản lý tin đăng
- ✅ Xem thống kê
- ✅ Quản lý lịch hẹn
- ✅ Quản lý hợp đồng
- ✅ Đẩy tin/quảng cáo
- ❌ KHÔNG truy cập bằng tài khoản user

---

## 🔒 Bảo Mật

**Password Hashing**:
```python
# Backend tự động hash password
from werkzeug.security import generate_password_hash

hashed = generate_password_hash('password123')
# Lưu: "scrypt:32768:8:1$..."
```

**JWT Token**:
```python
# Token có thời hạn 7 ngày
token = jwt.encode({
    'user_id': partner_id,
    'exp': datetime.utcnow() + timedelta(days=7)
}, SECRET_KEY)
```

**Kiểm tra quyền**:
```python
# Mỗi API call đều check
if account_type != 'partner':
    return 401 Unauthorized
```

---

## 📝 Tạo Tài Khoản Partner Mới

### **Cách 1: Qua Google Form (Recommended)**

1. User điền form
2. Admin nhận responses
3. Admin tạo account trong database:

```json
{
  "partner#00002": {
    "id": "partner#00002",
    "email": "newpartner@gmail.com",
    "username": "tronhathanh",
    "password": "scrypt:...",  // Hash password
    "account_type": "partner",
    "business_name": "Nhà Trọ Thanh Nhàn",
    "phone": "0987654321",
    "address": "456 Đường XYZ, Hà Nội",
    "verified": false,  // Chưa xác minh
    "created_at": "2025-11-13T15:30:00"
  }
}
```

4. Gửi email cho partner với username & password

### **Cách 2: API Endpoint (Auto)**

**Tạo endpoint mới** (tùy chọn):
```python
@app.route('/api/partner/register', methods=['POST'])
def partner_register():
    # Nhận data từ Google Form webhook
    # Tự động tạo account
    # Gửi email thông báo
    pass
```

---

## 🎨 Logo Files Sử dụng

**Partner Dashboard**:
- Login screen logo: `logo/white HH logo v3.PNG` (150x150px, transparent)
- Header logo: `logo/white HH logo v3.PNG` (40x40px)
- Avatar: `logo/balck HH logo square.png` (32x32px)

**Main Site**:
- Header: `logo/balck_logo.PNG`
- Footer: `logo/white HH logo v3.PNG`

---

## 🔄 Workflow Hoàn Chỉnh

```
1. Người muốn trở thành đối tác
   ↓
2. Click "Đăng ký ngay" → Google Form
   ↓
3. Điền thông tin (tên, email, SĐT, địa chỉ, giấy phép)
   ↓
4. Admin nhận form responses
   ↓
5. Admin kiểm tra & xác minh
   ↓
6. Admin tạo account trong partner_accounts.json
   ↓
7. Gửi email thông báo username & password
   ↓
8. Partner đăng nhập vào partner_dashboard.html
   ↓
9. Bắt đầu quản lý phòng trọ
```

---

## 🛠️ TODO - Bổ Sung Sau

### Phase 1: Email Integration
```python
# Gửi email tự động khi admin tạo account
import smtplib
send_email(
    to=partner_email,
    subject="Tài khoản đối tác đã được tạo",
    body="Username: ... Password: ..."
)
```

### Phase 2: Verification
```python
# Thêm trường 'verified' để admin duyệt
"verified": false  # Chờ duyệt
"verified": true   # Đã xác minh
```

### Phase 3: Dashboard Features
- Upload CMND/CCCD
- Upload giấy phép kinh doanh
- Xác minh số điện thoại (OTP)
- Xác minh email (link verify)

---

## 📞 Hướng Dẫn Cho Bạn

### **Thay Link Google Form**:

1. Mở file `partner_dashboard.html`
2. Tìm dòng 46:
```html
<a href="https://forms.google.com/your-partner-registration-form" target="_blank">
```
3. Thay bằng link form của bạn:
```html
<a href="https://forms.gle/ABC123XYZ" target="_blank">
```

### **Test Backend**:

1. Start backend:
```powershell
cd backend
python app.py
```

2. Test partner login:
```powershell
curl -X POST http://localhost:5000/api/partner/login `
  -H "Content-Type: application/json" `
  -d '{"email":"partner@example.com","password":"password123"}'
```

3. Kết quả:
```json
{
  "message": "Đăng nhập thành công",
  "token": "eyJ0eXAi...",
  "partner": {
    "id": "partner#00001",
    "email": "partner@example.com",
    "verified": true
  }
}
```

---

## 🎉 Tổng Kết

✅ **Tách riêng tài khoản**: User vs Partner  
✅ **Link Google Form**: Đăng ký đối tác dễ dàng  
✅ **Logo nổi bật**: 150px, transparent, animation float  
✅ **API riêng**: `/api/partner/login`, `/api/partner/stats`  
✅ **Security**: JWT token, password hashing, role-based access  

**Next Steps**:
1. Gửi cho tôi link Google Form → Tôi sẽ update vào code
2. Test backend với partner account
3. Tạo thêm partner accounts để test

Chúc bạn thành công! 🚀
