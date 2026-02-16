# ❓ Frequently Asked Questions (FAQ)

Các câu hỏi thường gặp về 3D Portfolio Website.

## 📦 Models

### Q: Model nào được hỗ trợ?
**A:** Chỉ hỗ trợ **glTF 2.0** (.glb hoặc .gltf). Không hỗ trợ OBJ, FBX, STL, 3DS, hoặc format khác.

### Q: Làm sao convert model sang glTF?
**A:** Sử dụng Blender:
1. Import model (File → Import)
2. Export as glTF 2.0 (File → Export → glTF 2.0)
3. Chọn format glTF Binary (.glb)
4. Enable Draco compression
5. Export!

### Q: Model tối đa bao nhiêu MB?
**A:** Khuyến nghị < 10MB sau khi compress. GitHub Pages có limit 100MB/file.

### Q: Model hiển thị bị tối/sáng quá?
**A:** 
```javascript
// Adjust trong viewer.js
renderer.toneMappingExposure = 1.5; // Tăng để sáng hơn
```

### Q: Model bị lộn ngược?
**A:** Trong Blender, apply transforms (Ctrl+A → All Transforms) trước khi export.

### Q: Có thể có animation không?
**A:** Có! glTF hỗ trợ animations. Hiện tại code chưa implement animation controls, nhưng có thể thêm sau.

## 🎨 UI & Design

### Q: Làm sao thay đổi màu sắc?
**A:** Edit file `css/style.css`, phần `:root` variables:
```css
:root {
    --accent-primary: #00d4ff;    /* Đổi màu này */
    --accent-secondary: #7c3aed;  /* Và màu này */
}
```

### Q: Làm sao thêm logo?
**A:** 
```html
<!-- Thêm vào index.html -->
<div class="compact-content">
    <img src="assets/logo.png" alt="Logo" class="logo">
    <h2 class="compact-title">3D Portfolio</h2>
</div>
```

### Q: Có thể thay đổi font chữ?
**A:** Thêm Google Fonts:
```html
<!-- Trong <head> của index.html -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
```
```css
/* Trong style.css */
body {
    font-family: 'Poppins', sans-serif;
}
```

### Q: Làm sao ẩn model selector mặc định?
**A:** Trong `js/main.js`, thêm:
```javascript
state.isSelectorCollapsed = true; // Thay false thành true
elements.modelSelector.classList.add('collapsed'); // Sau khi init
```

## 💻 Technical

### Q: Website chạy offline được không?
**A:** Không hoàn toàn. Three.js load từ CDN nên cần internet lần đầu. Có thể download Three.js về local để chạy offline hoàn toàn.

### Q: Tại sao phải chạy qua server, không mở file trực tiếp?
**A:** ES6 modules yêu cầu HTTP protocol. Mở file:// sẽ gặp CORS error.

### Q: Browser nào được hỗ trợ?
**A:** 
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ❌ Internet Explorer (không hỗ trợ)

### Q: Có thể dùng TypeScript không?
**A:** Có! Convert files sang .ts và setup build process với:
- Vite
- Webpack + ts-loader
- Parcel

### Q: Làm sao add backend?
**A:** Website này static, nhưng có thể thêm backend cho:
- User authentication
- Upload models
- Comments/ratings
- Analytics

Dùng:
- Firebase
- Supabase  
- Vercel Serverless Functions
- Netlify Functions

## 🚀 Performance

### Q: Website load chậm?
**A:** 
1. Compress models với Draco
2. Optimize textures (resize về 1024x1024)
3. Enable CDN caching
4. Minify CSS/JS (nếu cần)

### Q: FPS thấp trên mobile?
**A:** Giảm quality settings:
```javascript
if (isMobile) {
    renderer.setPixelRatio(1);
    // Load smaller textures
    // Disable shadows
}
```

### Q: Memory leak?
**A:** Đảm bảo gọi `dispose()` khi unload model. Code đã implement sẵn.

### Q: Làm sao measure performance?
**A:** 
```javascript
// Add Stats.js
import Stats from 'three/addons/libs/stats.module.js';
const stats = new Stats();
document.body.appendChild(stats.dom);
```

## 🌐 Deployment

### Q: Deploy lên đâu tốt nhất?
**A:** Tùy nhu cầu:
- **GitHub Pages**: Free, đơn giản nhất
- **Netlify**: Free, nhiều features
- **Vercel**: Free, fast CDN
- **Cloudflare Pages**: Unlimited bandwidth

### Q: Custom domain giá bao nhiêu?
**A:** 
- .com: ~$10-15/năm
- .dev: ~$12-15/năm
- .io: ~$30-40/năm
- .me: ~$20-25/năm

### Q: Có cần hosting phí không?
**A:** Không! Tất cả platform trên đều có free tier đủ dùng.

### Q: HTTPS free không?
**A:** Có! Tất cả platforms trên đều include free SSL/HTTPS.

## 🔧 Customization

### Q: Thêm Google Analytics?
**A:** Thêm vào `<head>`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR_GA_ID');
</script>
```

### Q: Thêm contact form?
**A:** Dùng service:
- Formspree (free tier)
- Netlify Forms (nếu host trên Netlify)
- EmailJS
- Google Forms

### Q: Thêm loading bar thay vì spinner?
**A:** Update `showLoading()` trong `main.js`:
```javascript
function showLoading(message, progress = 0) {
    // Update progress bar width
    document.querySelector('.progress-bar').style.width = progress + '%';
}
```

### Q: Multi-language support?
**A:** Implement i18n:
```javascript
const translations = {
    en: { home: 'Home', models: 'Models' },
    vi: { home: 'Trang chủ', models: 'Mô hình' }
};

function t(key) {
    return translations[currentLang][key];
}
```

## 🎓 Learning

### Q: Tôi mới học Three.js, bắt đầu từ đâu?
**A:** 
1. [Three.js Journey](https://threejs-journey.com/) - Paid course (best)
2. [Three.js Fundamentals](https://threejs.org/manual/) - Free
3. [Bruno Simon's Portfolio](https://bruno-simon.com/) - Inspiration
4. Code trong project này - Study & modify

### Q: Tài nguyên học glTF?
**A:**
- [glTF 2.0 Quick Reference](https://www.khronos.org/files/gltf20-reference-guide.pdf)
- [glTF Tutorial](https://github.khronos.org/glTF-Tutorials/)
- [Three.js glTF Guide](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)

### Q: Làm sao tạo models đẹp?
**A:**
1. Học Blender basic
2. Học PBR workflow
3. Study existing models
4. Practice, practice, practice!

Resources:
- [Blender Guru](https://www.youtube.com/user/AndrewPPrice) - YouTube
- [Grant Abbitt](https://www.youtube.com/user/mediagabbitt) - YouTube
- [Poly Haven](https://polyhaven.com/) - Free models để study

## 🐛 Troubleshooting

### Q: Console báo lỗi "Failed to load module"?
**A:** 
```
Nguyên nhân: Không chạy qua server
Fix: Dùng local server (VSCode Live Server, Python, etc.)
```

### Q: Model không hiển thị, không có lỗi?
**A:**
```
Kiểm tra:
1. File path đúng không?
2. Model có hợp lệ không? → Test trên gltf-viewer.donmccurdy.com
3. Model có quá lớn không?
4. Console có warnings không?
```

### Q: UI bị vỡ trên Safari?
**A:**
```
Có thể do CSS properties chưa hỗ trợ.
Fix: Add vendor prefixes hoặc fallback styles
```

### Q: Touch controls không work trên mobile?
**A:**
```
OrbitControls tự động hỗ trợ touch.
Nếu không work:
1. Check console errors
2. Ensure canvas có correct size
3. Test trên device thật (không chỉ emulator)
```

## 💡 Best Practices

### Q: Structure code như thế nào cho dự án lớn?
**A:**
```
js/
├── main.js           # Entry point
├── viewer/
│   ├── ModelViewer.js
│   ├── LightManager.js
│   └── CameraController.js
├── ui/
│   ├── UIManager.js
│   ├── ModelSelector.js
│   └── InfoPanel.js
└── utils/
    ├── loader.js
    └── helpers.js
```

### Q: Naming convention cho models?
**A:**
```
✅ Good:
- spaceship-01.glb
- character-idle.glb
- environment-forest.glb

❌ Bad:
- Model 1.glb
- final_FINAL_v3.glb
- ãĩôũ.glb
```

### Q: Git workflow cho team?
**A:**
```bash
# Feature branch workflow
git checkout -b feature/add-new-model
# Make changes
git add .
git commit -m "feat: add spaceship model"
git push origin feature/add-new-model
# Create PR on GitHub
# Review → Merge
```

## 🎯 Use Cases

### Q: Có thể dùng cho portfolio nghề gì?
**A:**
- 3D Artist
- Game Developer
- Product Designer
- Architect
- VFX Artist
- Technical Artist

### Q: Dùng cho mục đích thương mại được không?
**A:** Có! MIT License cho phép sử dụng thương mại miễn phí.

### Q: Có thể embedded vào website khác?
**A:** Có! Dùng iframe:
```html
<iframe src="https://yoursite.com" width="800" height="600"></iframe>
```

### Q: Làm product viewer cho e-commerce?
**A:** Có thể! Thêm features:
- Multiple views/angles
- Color variants
- AR preview (WebXR)
- Add to cart button

## 📱 Mobile

### Q: Touch gestures gì được hỗ trợ?
**A:**
- ✅ 1 finger drag = rotate
- ✅ 2 finger pinch = zoom
- ✅ 2 finger drag = pan

### Q: Làm sao tối ưu cho mobile?
**A:**
```javascript
if (isMobile) {
    // Lower resolution
    renderer.setPixelRatio(1);
    
    // Smaller textures
    maxTextureSize = 512;
    
    // Fewer lights
    useLightCount = 3;
}
```

### Q: Có thể làm AR viewer?
**A:** Có! Dùng WebXR:
```html
<!-- Quick AR button -->
<model-viewer src="model.glb" ar></model-viewer>
```

Hoặc implement custom với Three.js + WebXR API.

## 🆘 Still Need Help?

### Không tìm thấy câu trả lời?

1. **Check Documentation**
   - README.md
   - QUICKSTART.md
   - Doc files trong /doc

2. **Search Issues**
   - GitHub Issues của project
   - Three.js GitHub Issues
   - Stack Overflow

3. **Ask Community**
   - Three.js Discourse
   - Three.js Discord
   - Reddit r/threejs

4. **Contact**
   - Create issue trên GitHub
   - Email: your.email@example.com

---

💡 **Tip**: Đa số issues đã được trả lời trong docs. Hãy search trước khi hỏi!
