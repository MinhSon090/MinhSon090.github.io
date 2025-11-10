# 🐛 Debug Instructions

## Bước 1: Refresh trang
Nhấn **Ctrl + F5** để tải lại toàn bộ

## Bước 2: Mở Console
Nhấn **F12** → Tab "Console"

## Bước 3: Chạy debug script
Copy và paste đoạn code sau vào Console:

```javascript
// Quick test
console.clear();
console.log('propertyData:', propertyData ? propertyData.length : 'undefined');
console.log('First property:', propertyData?.[0]);

// Test suggestions
if (propertyData && propertyData.length > 0) {
    const test = getRoomSuggestions('Gợi ý trọ', 3);
    console.log('Suggestions:', test);
    test.forEach(s => console.log('  -', s.title, s.price));
}

// Test display
console.log('\n=== Testing display ===');
displayRoomSuggestions('Gợi ý trọ giá rẻ');
console.log('Check chatBody for cards');
```

## Bước 4: Kiểm tra kết quả

### Nếu thấy:
```
✅ propertyData: 10
✅ First property: {id: "ntro1", title: "SUHA HOME", ...}
✅ Suggestions: Array(3)
```
→ **Data đã load thành công**

### Nếu thấy cards trong chat:
→ **Tính năng hoạt động!**

### Nếu KHÔNG thấy cards:
1. Kiểm tra CSS có class `.roomSuggestionCard`
2. Kiểm tra Console có lỗi gì không
3. Chạy lệnh này:
```javascript
document.querySelectorAll('.roomSuggestionCard').length
```
Nếu > 0 → Cards đã được tạo nhưng CSS ẩn

## Bước 5: Test trong chatbot UI

1. Click icon chat góc dưới phải
2. Gõ: **"Gợi ý trọ giá rẻ"**
3. Xem Console logs
4. Kiểm tra cards hiển thị

## Console logs mong đợi:

```
🔍 Finding suggestions for: "Gợi ý trọ giá rẻ"
📊 Total properties available: 10
✅ Found 5 suggestions:
   1. Nhà trọ Trung Hiếu (Score: 8.0)
   2. Trọ Thôn 1 (Score: 6.5)
   ...
🏠 displayRoomSuggestions called
📋 Displaying 5 room cards
   Creating card 1: Nhà trọ Trung Hiếu
   ✅ Card 1 appended to chatBody
   ...
✅ All 5 cards added to chat
```

## Nếu vẫn không hiện:

Chạy lệnh này để kiểm tra CSS:
```javascript
const card = document.querySelector('.roomSuggestionCard');
if (card) {
    const styles = window.getComputedStyle(card);
    console.log('Display:', styles.display);
    console.log('Visibility:', styles.visibility);
    console.log('Opacity:', styles.opacity);
    console.log('Height:', styles.height);
}
```

---

**Sau khi test xong, gửi cho tôi:**
1. Screenshot Console logs
2. Screenshot khung chat (có thẻ hay không)
3. Kết quả của các lệnh test
