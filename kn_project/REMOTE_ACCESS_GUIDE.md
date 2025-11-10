# Hướng Dẫn Mở Website Ra Internet

## ✅ Backend đã sẵn sàng
Flask server đã được cấu hình `host='0.0.0.0'` - có thể nhận request từ bất kỳ IP nào.

---

## 🚀 PHƯƠNG ÁN 1: Dùng Ngrok (KHUYẾN NGHỊ - DỄ NHẤT)

### Bước 1: Cài đặt Ngrok
```powershell
winget install Ngrok.Ngrok
```

### Bước 2: Đăng ký tài khoản Ngrok (FREE)
1. Truy cập: https://ngrok.com/
2. Đăng ký tài khoản miễn phí
3. Copy authtoken từ dashboard

### Bước 3: Xác thực Ngrok
```powershell
ngrok config add-authtoken <YOUR_AUTHTOKEN>
```

### Bước 4: Chạy Flask backend
```powershell
cd backend
python app.py
```
Backend sẽ chạy ở `http://localhost:5000`

### Bước 5: Mở tunnel Ngrok (Terminal mới)
```powershell
ngrok http 5000
```

**Kết quả:** Ngrok sẽ cho bạn URL dạng:
```
Forwarding: https://abcd-1234-xyz.ngrok-free.app -> http://localhost:5000
```

### Bước 6: Cập nhật API_BASE_URL trong frontend
Mở `script_backend.js` và thay:
```javascript
const API_BASE_URL = window.location.origin + '/api';
```
Thành:
```javascript
const API_BASE_URL = 'https://abcd-1234-xyz.ngrok-free.app/api';
```

### Bước 7: Deploy frontend
- Đưa frontend (index.html, style.css, script.js, script_backend.js, images) lên GitHub Pages
- Hoặc dùng Netlify/Vercel (free hosting)

**✨ Xong! Giờ ai cũng có thể truy cập website của bạn!**

---

## 🏠 PHƯƠNG ÁN 2: Port Forwarding (Cần Router Access)

### Yêu cầu:
- Quyền admin router
- IP tĩnh hoặc dùng Dynamic DNS (No-IP, DuckDNS)

### Các bước:
1. **Tìm IP nội bộ của máy:**
   ```powershell
   ipconfig
   ```
   Tìm "IPv4 Address" (VD: 192.168.1.100)

2. **Tìm IP Public:**
   - Truy cập: https://whatismyipaddress.com/

3. **Cấu hình Router:**
   - Đăng nhập router (thường 192.168.1.1)
   - Tìm "Port Forwarding" hoặc "Virtual Server"
   - Thêm rule:
     - External Port: 5000
     - Internal IP: 192.168.1.100 (IP máy bạn)
     - Internal Port: 5000
     - Protocol: TCP

4. **Mở Firewall Windows:**
   ```powershell
   New-NetFirewallRule -DisplayName "Flask Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
   ```

5. **Truy cập từ bên ngoài:**
   ```
   http://YOUR_PUBLIC_IP:5000
   ```

### ⚠️ LƯU Ý BẢO MẬT:
- Đổi `SECRET_KEY` trong app.py
- Đặt `debug=False` khi deploy
- Cân nhắc thêm HTTPS với Let's Encrypt
- Cân nhắc thêm rate limiting

---

## 🌐 PHƯƠNG ÁN 3: Deploy Lên Cloud (PRODUCTION)

### Backend Options:
1. **Heroku** (Free tier)
2. **Railway** (Free $5/month credit)
3. **Render** (Free tier)
4. **PythonAnywhere** (Free tier với limit)

### Frontend Options:
1. **GitHub Pages** (Free, cho static files)
2. **Netlify** (Free tier)
3. **Vercel** (Free tier)

---

## 🔍 So Sánh Các Phương Án

| Phương Án | Độ Khó | Chi Phí | Tốc Độ | Bảo Mật | Phù Hợp |
|-----------|--------|---------|--------|---------|---------|
| Ngrok | ⭐ Dễ | FREE | Chậm hơn | Tốt | Development, Demo |
| Port Forward | ⭐⭐ Trung Bình | FREE | Nhanh | Rủi Ro | Home Server |
| Cloud Deploy | ⭐⭐⭐ Khó | FREE-$5 | Nhanh | Tốt Nhất | Production |

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra Flask có chạy không: `http://localhost:5000`
2. Kiểm tra CORS config trong app.py
3. Kiểm tra firewall
4. Xem log lỗi trong terminal

**Khuyến nghị:** Dùng Ngrok cho testing, sau đó deploy lên Cloud cho production!
