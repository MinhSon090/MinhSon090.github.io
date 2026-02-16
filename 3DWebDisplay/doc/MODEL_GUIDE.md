# 📐 Hướng dẫn Tạo và Export 3D Models

Tài liệu này hướng dẫn bạn cách tạo và export 3D models để sử dụng với website portfolio.

## 📋 Yêu cầu Model

### Định dạng
- **glTF 2.0** (.glb hoặc .gltf) ✅
- **Embedded textures** (glb) hoặc separate files (gltf) ✅
- **Draco compression** (optional nhưng khuyến nghị) ✅

### Tối ưu hóa
- **Polycount**: Giữ dưới 100K triangles (càng thấp càng tốt)
- **Textures**: Kích thước max 2048x2048 (1024x1024 cho mobile-friendly)
- **File size**: Nên giữ dưới 10MB sau khi compress
- **Materials**: Sử dụng PBR materials (Metallic-Roughness workflow)

## 🎨 Export từ Blender

### Bước 1: Chuẩn bị model trong Blender

1. **Cleanup geometry**
   - Xóa các faces không cần thiết
   - Merge vertices trùng lặp (A → M → By Distance)
   - Remove doubles
   - Apply scale (Ctrl+A → Scale)

2. **Optimize materials**
   - Sử dụng Principled BSDF shader
   - Bake textures nếu có nhiều nodes phức tạp
   - Ensure textures are in correct color space:
     - Base Color: sRGB
     - Normal, Roughness, Metallic: Non-Color

3. **UV Unwrap**
   - Đảm bảo model đã được UV unwrap
   - Không overlapping UVs (trừ khi có mục đích)
   - UVs nằm trong bounds 0-1

### Bước 2: Export settings

1. Mở **File → Export → glTF 2.0**

2. **Cài đặt Export**:
   ```
   Format:
   ✅ glTF Binary (.glb)  // Hoặc glTF Embedded nếu muốn .gltf
   
   Include:
   ✅ Selected Objects    // Hoặc chọn all nếu export cả scene
   ☑️ Custom Properties
   ☑️ Cameras             // Nếu có custom camera
   ☑️ Punctual Lights     // Nếu có lights
   
   Transform:
   ✅ +Y Up
   
   Geometry:
   ✅ Apply Modifiers
   ✅ UVs
   ✅ Normals
   ✅ Tangents
   ☑️ Vertex Colors       // Nếu có
   ☑️ Materials: Export
   ✅ Images: Automatic
   
   Compression:
   ✅ Draco mesh compression
      Compression level: 6
      Quantization:
      - Position: 14
      - Normal: 10
      - Texcoord: 12
      - Color: 8
      - Generic: 12
   ```

3. Click **Export glTF 2.0**

### Bước 3: Kiểm tra model

Sử dụng [glTF Viewer](https://gltf-viewer.donmccurdy.com/) để preview model:
- Kiểm tra materials hiển thị đúng
- Kiểm tra lighting
- Kiểm tra animations (nếu có)
- Xem file size

## 🔧 Export từ Other Software

### Maya

1. Install [Maya2glTF plugin](https://github.com/kashif/maya2gltf)
2. Export với settings tương tự Blender
3. Enable Draco compression nếu có

### 3ds Max

1. Install [Babylon.js Exporter](https://doc.babylonjs.com/resources/3dsmax)
2. Export to .babylon → Convert to glTF
3. Hoặc dùng [max2babylon](https://github.com/BabylonJS/Exporters)

### Cinema 4D

1. Install [C4D to glTF exporter](https://github.com/kopiro/c4d-gltf-exporter)
2. Export với PBR materials

### Sketchfab

1. Download model từ Sketchfab (nếu có quyền)
2. Chọn format **glTF**
3. Download và extract

## 🗜️ Draco Compression

### Tại sao dùng Draco?

- Giảm file size 70-90%
- Giảm thời gian tải
- Tự động decompress khi load trong Three.js

### Cách compress với Draco CLI

1. **Cài đặt Draco**
   ```bash
   # Download từ: https://github.com/google/draco
   # Hoặc compile from source
   ```

2. **Compress model**
   ```bash
   gltf-pipeline -i input.glb -o output.glb -d
   ```

3. **Với compression level cao hơn**
   ```bash
   gltf-pipeline -i input.glb -o output.glb -d \
     --draco.compressionLevel=10 \
     --draco.quantizePositionBits=14 \
     --draco.quantizeNormalBits=10 \
     --draco.quantizeTexcoordBits=12
   ```

### Online tools

- [glTF Transform](https://gltf.report/) - Online optimizer
- [glTF Viewer](https://gltf-viewer.donmccurdy.com/) - Preview và optimize

## 🖼️ Tạo Thumbnails

### Option 1: Screenshot trong Blender

1. Setup camera nhìn vào model ở góc đẹp
2. Render (F12)
3. Save image (Alt+S)
4. Resize về 400x280px trong image editor

### Option 2: Screenshot từ online viewer

1. Upload model lên [glTF Viewer](https://gltf-viewer.donmccurdy.com/)
2. Rotate model đến góc đẹp
3. Screenshot (Print Screen)
4. Crop và resize về 400x280px

### Option 3: Code trong Three.js

Sử dụng code sau để render thumbnail:

```javascript
// Render thumbnail
const thumbnail = renderer.domElement.toDataURL('image/jpeg', 0.9);
// Download hoặc upload thumbnail
```

## ✅ Checklist trước khi export

- [ ] Model đã được optimize (low poly)
- [ ] Textures đã được resize phù hợp
- [ ] Materials sử dụng PBR workflow
- [ ] UV unwrap đúng
- [ ] Scale đã được apply
- [ ] File size dưới 10MB
- [ ] Đã test trong glTF Viewer
- [ ] Thumbnail đã được tạo (400x280px)

## 📚 Resources

### Tools
- [Blender](https://www.blender.org/) - Free 3D software
- [glTF Viewer](https://gltf-viewer.donmccurdy.com/) - Preview models
- [glTF Validator](https://github.khronos.org/glTF-Validator/) - Validate models
- [glTF Transform](https://gltf.report/) - Optimize models
- [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline) - CLI optimizer

### Learning
- [glTF 2.0 Specification](https://www.khronos.org/gltf/)
- [Three.js Documentation](https://threejs.org/docs/)
- [PBR Guide](https://academy.substance3d.com/courses/the-pbr-guide-part-1)
- [Blender to Three.js Tutorial](https://threejs.org/docs/#manual/en/introduction/Loading-3D-models)

### Free Models (for testing)
- [Sketchfab](https://sketchfab.com/feed) - Free CC models
- [Poly Haven](https://polyhaven.com/models) - Free CC0 models
- [Quaternius](http://quaternius.com/) - Free low poly models
- [Kenney](https://www.kenney.nl/assets) - Free game assets

## ⚠️ Common Issues

### Model quá tối/sáng?
- Kiểm tra exposure trong materials
- Adjust toneMappingExposure trong viewer.js
- Kiểm tra lighting setup

### Textures bị lỗi?
- Đảm bảo textures được embed hoặc cùng thư mục
- Kiểm tra color space của textures
- Sử dụng format PNG/JPEG (không dùng TIFF, BMP)

### Model bị deformed?
- Apply all transforms trong Blender
- Apply modifiers trước khi export
- Kiểm tra scale (should be 1, 1, 1)

### File quá lớn?
- Giảm polycount
- Resize textures
- Enable Draco compression
- Xóa unused materials/textures

---

💡 **Tip**: Luôn giữ một bản backup của file source (.blend) trước khi export!
