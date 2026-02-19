# 📦 Models Folder

Thư mục này chứa các file 3D models (.glb hoặc .gltf).

## 📝 Hướng dẫn thêm model

1. **Đặt file model vào đây**
   - Định dạng: `.glb` hoặc `.gltf`
   - Khuyến nghị: Sử dụng Draco compression
   - Kích thước: Nên giữ dưới 10MB

2. **Cập nhật file `js/models.js`**
   ```javascript
   {
       id: 'my-model',
       name: 'My Awesome Model',
       description: 'Mô tả ngắn gọn',
       path: 'models/my-model.glb',  // ← Đường dẫn đến file ở đây
       thumbnail: 'assets/thumbnails/my-model.jpg',
       scale: 1.0
   }
   ```

3. **Tạo thumbnail** (xem hướng dẫn trong `/doc/MODEL_GUIDE.md`)

## 📐 Yêu cầu model

- ✅ Định dạng glTF 2.0 (.glb/.gltf)
- ✅ PBR Materials (Metallic-Roughness workflow)
- ✅ Polycount hợp lý (< 100K triangles)
- ✅ Textures tối ưu (max 2048x2048)
- ✅ Đã UV unwrap

## 🔧 Tools để tạo/export models

- **Blender** - Free, powerful
- **Maya** - Professional
- **3ds Max** - Professional
- **Cinema 4D** - Motion graphics
- **Sketchfab** - Online models

## 📚 Free Models (for testing)

- [Poly Haven](https://polyhaven.com/models)
- [Sketchfab](https://sketchfab.com/) (CC models)
- [Quaternius](http://quaternius.com/)
- [Kenney](https://www.kenney.nl/assets)

## ⚠️ Lưu ý

- Models phải ở định dạng **glTF 2.0**
- Không hỗ trợ OBJ, FBX, STL
- Kiểm tra model bằng [glTF Validator](https://github.khronos.org/glTF-Validator/)
- Test model với [glTF Viewer](https://gltf-viewer.donmccurdy.com/)

---

💡 Xem hướng dẫn chi tiết tại: `/doc/MODEL_GUIDE.md`
