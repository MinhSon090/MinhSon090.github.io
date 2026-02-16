# 🖼️ Thumbnails Folder

Thư mục này chứa các ảnh thumbnail cho models.

## 📐 Kích thước khuyến nghị

- **Width**: 400px
- **Height**: 280px
- **Aspect ratio**: 10:7
- **Format**: JPG hoặc PNG
- **Size**: < 100KB (sau khi optimize)

## 🎨 Cách tạo thumbnail

### Option 1: Screenshot trong Blender
1. Setup camera view đẹp
2. Render (F12)
3. Save và resize về 400x280px

### Option 2: Screenshot từ online viewer
1. Mở model trong [glTF Viewer](https://gltf-viewer.donmccurdy.com/)
2. Xoay model đến góc đẹp
3. Screenshot và crop về 400x280px

### Option 3: Generate tự động
```javascript
// Code để render thumbnail trong Three.js
const thumbnail = renderer.domElement.toDataURL('image/jpeg', 0.9);
```

## 🎯 Best practices

- **Lighting**: Đảm bảo model được chiếu sáng tốt
- **Angle**: Chọn góc nhìn thể hiện rõ đặc điểm của model
- **Background**: Nền tối hoặc gradient phù hợp với theme
- **Composition**: Center model trong frame

## 🔧 Tools để optimize images

- [TinyPNG](https://tinypng.com/) - Online optimizer
- [Squoosh](https://squoosh.app/) - Google's image optimizer
- [ImageOptim](https://imageoptim.com/) - Mac app
- GIMP/Photoshop - Manual editing

## 📝 Naming convention

Đặt tên thumbnail trùng với model ID để dễ quản lý:

```
models/my-model.glb
    ↓
assets/thumbnails/my-model.jpg
```

## ⚠️ Lưu ý

- Nếu không có thumbnail, placeholder tự động sẽ được tạo
- Thumbnail ảnh hưởng đến trải nghiệm UI
- Nên optimize để giảm thời gian load

---

💡 Xem hướng dẫn chi tiết tại: `/doc/MODEL_GUIDE.md`
