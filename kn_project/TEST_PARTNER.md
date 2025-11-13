# 🧪 TEST PARTNER SYSTEM

## Quick Test Steps

### 1. Kiểm tra Logo
✅ Mở `partner_dashboard.html` trong browser  
✅ Logo phải:
- To hơn (150x150px)
- Không có background trắng
- Có shadow mềm
- Lơ lửng nhẹ (animation)

### 2. Test Link Google Form
✅ Click "Chưa có tài khoản đối tác? Đăng ký ngay"  
✅ Phải mở Google Form trong tab mới  
✅ **CHỜ BẠN GỬI LINK** để tôi update vào code

### 3. Test Login (Demo Mode - Không cần backend)
✅ Nhập bất kỳ email + password  
✅ Click "Đăng nhập"  
✅ Phải thấy:
- Nút chuyển màu xanh
- Text "Đăng nhập thành công!"
- Sau 0.8s vào dashboard

### 4. Test Login (With Backend)
```powershell
# Terminal 1: Start backend
cd backend
python app.py

# Terminal 2: Test login API
curl -X POST http://localhost:5000/api/partner/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"partner@example.com\",\"password\":\"password123\"}'
```

## Tạo Partner Account Mới

### Thủ công (Để test):
Thêm vào `account/accounts.json`:

```json
{
  "users": {
    "partner#00001": {
      "id": "partner#00001",
      "email": "test@partner.com",
      "username": "testpartner",
      "password": "password123",
      "account_type": "partner",
      "business_name": "Nhà Trọ Test",
      "verified": true,
      "created_at": "2025-11-13T15:00:00"
    }
  }
}
```

**Sau đó login với**:
- Email: `test@partner.com`
- Password: `password123`

## Files Changed Summary

✅ `partner_dashboard.html`:
- Line 46: Link → Google Form
- Line 15: Logo → `white HH logo v3.PNG`
- Line 56: Header logo → `white HH logo v3.PNG`

✅ `partner_style.css`:
- Line 66-91: Logo styling (150px, no bg, animation)

✅ `partner_script.js`:
- Line 67-123: API login integration
- Line 127-130: Remove old register alert

✅ `backend/app.py`:
- Line 880-960: New partner endpoints

✅ `account/partner_accounts.json`:
- New file: Store partner accounts separately

## Next: Gửi Link Google Form

Khi bạn có link Google Form, gửi cho tôi, tôi sẽ update ngay vào code!

Format:
```
https://forms.gle/aBcDeFg123456
```

hoặc

```
https://docs.google.com/forms/d/e/1FAIpQLSd.../viewform
```
