# 🔧 Hướng dẫn Debug Chatbot

## ✅ Đã sửa xung đột

### Vấn đề đã fix:

1. **Xung đột biến `propertyData`**
   - ❌ Trước: Khai báo trong cả `chatbot.js` và `script_backend.js`
   - ✅ Sau: Chỉ khai báo trong `script_backend.js`, chatbot dùng chung

2. **File JavaScript chưa được load**
   - ❌ Trước: Chỉ có `script_backend.js` trong HTML
   - ✅ Sau: Thêm `chatbot.js` sau `script_backend.js`

3. **Timing issue**
   - ❌ Trước: Chatbot load trước khi propertyData có dữ liệu
   - ✅ Sau: Wait for propertyData với promise + interval check

## 🧪 Cách kiểm tra

### 1. Mở trình duyệt và console (F12)

### 2. Kiểm tra các biến đã load:

```javascript
// Copy paste vào console
console.log('propertyData:', propertyData);
console.log('commentsData:', commentsData);
console.log('ratingsData:', ratingsData);
```

**Kết quả mong đợi:**
```
propertyData: Array(10) [{id: "ntro1", ...}, ...]
commentsData: {ntro3: Array(2), ntro6: Array(3), ...}
ratingsData: {ntro3: Array(1), ntro1: Array(1), ...}
```

### 3. Kiểm tra functions:

```javascript
console.log(typeof isAskingForRoomSuggestions); // "function"
console.log(typeof getRoomSuggestions);         // "function"
console.log(typeof displayRoomSuggestions);     // "function"
console.log(typeof openPropertyModal);          // "function"
```

### 4. Test gợi ý trọ:

Trong chatbox, gõ:
```
Gợi ý trọ giá rẻ
```

**Kết quả mong đợi:**
- Bot trả lời: "Dưới đây là những trọ/ktx phù hợp..."
- Hiện 5 thẻ trọ với ảnh, tên, giá, rating
- Click thẻ → Mở popup chi tiết

### 5. Kiểm tra console logs:

```
✓ Using 10 properties from script_backend.js
✓ Loaded comments data
✓ Loaded ratings data
✓ Chatbot initialized successfully
```

## 🐛 Các lỗi thường gặp

### Lỗi 1: "propertyData is not defined"
**Nguyên nhân:** `chatbot.js` load trước `script_backend.js`

**Giải pháp:** Kiểm tra thứ tự trong `index.html`:
```html
<script src="script_backend.js"></script>
<script src="chatbot.js"></script>  <!-- Phải sau script_backend.js -->
```

### Lỗi 2: "Cannot read property 'length' of undefined"
**Nguyên nhân:** `propertyData` chưa load xong

**Giải pháp:** Đã có wait logic, check console xem có lỗi fetch không

### Lỗi 3: Thẻ trọ không hiện
**Nguyên nhân:** 
- CSS class `.roomSuggestionCard` bị thiếu
- Images không load được

**Giải pháp:**
```javascript
// Test CSS
document.querySelector('.roomSuggestionCard'); // Phải khác null nếu có thẻ

// Test images
console.log(propertyData[0].img); // Phải có đường dẫn ảnh
```

### Lỗi 4: Click thẻ không mở popup
**Nguyên nhân:** `openPropertyModal` không hoạt động

**Giải pháp:**
```javascript
// Test manual
const testProperty = propertyData[0];
openPropertyModal(testProperty);  // Phải mở popup
```

### Lỗi 5: Chatbot không phản hồi
**Nguyên nhân:** Event handlers không setup

**Giải pháp:** Check console:
```javascript
console.log('Chat input:', document.querySelector('.chatInput input'));
console.log('Send button:', document.querySelector('.chatInput button'));
```

## 📊 Debug Script

Để chạy test tự động, load file `debug_chatbot.js`:

```html
<!-- Thêm vào index.html tạm thời -->
<script src="debug_chatbot.js"></script>
```

Hoặc copy paste nội dung file vào console.

## 🎯 Checklist hoạt động

- [x] `script_backend.js` load trước `chatbot.js`
- [x] `propertyData` chỉ khai báo 1 lần
- [x] Chatbot wait for data với promise
- [x] FAQ suggestions hiển thị
- [x] Room suggestions trigger đúng
- [x] Room cards hiển thị với ảnh + thông tin
- [x] Click card mở popup
- [x] Console không có error

## 🚀 Test Production

1. Mở index.html trong trình duyệt
2. Mở console (F12)
3. Click icon chat góc dưới phải
4. Gõ: "Gợi ý trọ giá rẻ"
5. Kiểm tra:
   - ✅ Bot trả lời
   - ✅ Hiện 5 thẻ trọ
   - ✅ Click thẻ → Popup mở
   - ✅ Không có lỗi trong console

---

**Nếu vẫn có lỗi:** Copy toàn bộ console log và báo lại!
