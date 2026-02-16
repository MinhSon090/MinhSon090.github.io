# ⚡ Performance Optimization Guide

Hướng dẫn tối ưu hóa hiệu năng cho 3D Portfolio Website.

## 📊 Performance Targets

### Load Time
- ⚡ **Initial Load**: < 2s (Fast 3G)
- ⚡ **Time to Interactive**: < 3s
- ⚡ **Model Load**: < 5s (per model)

### Runtime Performance
- 🎯 **FPS**: 60fps stable
- 💾 **Memory**: < 500MB (với 1 model loaded)
- 🔋 **CPU**: < 30% trên mid-range device

### Lighthouse Scores (Goals)
- 🟢 **Performance**: > 90
- 🟢 **Accessibility**: > 90
- 🟢 **Best Practices**: > 90
- 🟢 **SEO**: > 90

## 🎨 Model Optimization

### 1. Geometry Optimization

#### Polycount
```
Mobile:    < 50K triangles
Desktop:   < 100K triangles
High-end:  < 500K triangles
```

**Tools:**
- Blender: Decimate modifier
- Instant Meshes: Auto retopology
- Simplygon: Professional tool

**Example (Blender):**
```python
# Decimate geometry
1. Select object
2. Add Modifier → Decimate
3. Ratio: 0.5 (giảm 50%)
4. Apply modifier
```

#### Remove Hidden Geometry
- Xóa faces bên trong
- Xóa faces không nhìn thấy
- Merge vertices gần nhau

### 2. Texture Optimization

#### Resolution Guidelines
```
Desktop:  2048x2048  (max)
Desktop:  1024x1024  (recommended)
Mobile:   512x512    (recommended)
Mobile:   256x256    (minimal quality)
```

#### Format Selection
- **Base Color**: JPG (sRGB, quality 85%)
- **Normal/Roughness/etc**: PNG (Non-Color)
- **Transparency**: PNG with alpha

#### Texture Atlas
Combine nhiều textures nhỏ thành một texture lớn:

```
Before:  10 textures × 512×512 = 2.6MB
After:   1 texture × 2048×2048 = 1.2MB
```

**Tools:**
- Blender: Smart UV Project + Texture Atlas
- Substance Painter: Export atlas
- TexturePacker: Sprite sheet tool

### 3. Material Optimization

#### Bake Complex Materials
Bake node setup phức tạp thành textures:

```
Emission + HDR + Procedural
    ↓ Bake
Single Albedo Texture
```

**Blender Baking:**
1. Setup materials
2. Add new Image Texture node
3. Select image node
4. Render → Bake → Combined
5. Save image

#### Use PBR Workflow
```
✅ Metallic-Roughness (khuyến nghị)
❌ Specular-Glossiness (deprecated)
```

### 4. Compression

#### Draco Compression
Giảm file size 70-90%:

```bash
# Với gltf-pipeline
gltf-pipeline -i model.glb -o model-compressed.glb -d

# Với Draco CLI
draco_encoder -i model.obj -o model.drc

# Aggressive compression
gltf-pipeline -i model.glb -o compressed.glb -d \
  --draco.compressionLevel=10
```

**Trade-offs:**
- ✅ File size giảm mạnh
- ❌ Decode time tăng ~100ms
- ❌ Nhẹ loss quality (thường không nhận ra)

#### Texture Compression
```bash
# Convert to WebP
cwebp input.png -o output.webp -q 85

# Optimize PNG
pngquant --quality=65-80 input.png

# Optimize JPG
jpegoptim --max=85 input.jpg
```

## 🚀 Loading Optimization

### 1. Lazy Loading

✅ **Implemented** - Models chỉ load khi được chọn

```javascript
// Don't load all models on init
// Load on demand when user clicks
handleModelSelect(modelId) {
    await viewer.loadModel(model.path);
}
```

### 2. Progressive Loading

Load model theo từng phần (future feature):

```javascript
// Level of Detail (LOD)
1. Load low-poly first  → Quick preview
2. Load high-poly       → Full detail
3. Load textures        → Final quality
```

### 3. Caching Strategy

```javascript
// Service Worker caching (future)
- Cache static assets (HTML, CSS, JS)
- Cache models sau khi load lần đầu
- Update cache khi có phiên bản mới
```

### 4. Preloading

Preload model tiếp theo khi user đang xem:

```javascript
// Future implementation
function preloadNextModel(currentIndex) {
    const nextModel = models[currentIndex + 1];
    if (nextModel) {
        // Silent load in background
        preloadModel(nextModel.path);
    }
}
```

## 🎮 Runtime Optimization

### 1. Rendering

#### Giảm Draw Calls
Merge objects cùng material:

```javascript
// Before: 100 objects = 100 draw calls
// After:  1 merged object = 1 draw call

// Blender: Ctrl+J để join objects
```

#### Frustum Culling
✅ **Auto** - Three.js tự động cull objects ngoài viewport

#### Occlusion Culling
Ẩn objects bị che khuất (manual implementation):

```javascript
// Check if object is visible
if (isOccluded(object)) {
    object.visible = false;
}
```

### 2. Lighting

#### Baked Lighting
Bake shadows và lighting vào textures:

```
✅ 0 realtime lights (fast)
❌ 10 realtime lights (slow)
```

**Performance Impact:**
```
0 lights:       60 FPS
3 lights:       55 FPS
10 lights:      30 FPS
10 + shadows:   15 FPS
```

#### Light Types Performance
```
Ambient Light:          Very Fast   ✅
Hemisphere Light:       Very Fast   ✅
Directional Light:      Fast        ✅
Point Light:            Medium      ⚠️
Spot Light:             Slow        ❌
Point + Shadows:        Very Slow   ❌
```

### 3. Shadows

```javascript
// Disable shadows cho better performance
renderer.shadowMap.enabled = false;

// Or optimize shadow map size
renderer.shadowMap.mapSize.set(1024, 1024); // Lower = faster
```

### 4. Post-processing

Tránh overuse post-processing effects:

```javascript
// Each pass = extra render cost
✅ 0-2 passes: Good
⚠️ 3-5 passes: Medium
❌ 6+ passes:  Slow
```

## 💾 Memory Management

### 1. Dispose Unused Resources

✅ **Implemented** - Auto dispose khi unload model

```javascript
unloadModel() {
    model.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            disposeMaterial(child.material);
        }
    });
}
```

### 2. Texture Memory

Monitor texture memory usage:

```javascript
// Estimate texture memory
function calculateTextureMemory(texture) {
    const width = texture.image.width;
    const height = texture.image.height;
    const bytes = width * height * 4; // RGBA
    return bytes / 1024 / 1024; // MB
}
```

**Limits:**
```
Desktop:  500MB textures OK
Mobile:   100MB textures max
```

### 3. Memory Leaks

Common causes và cách fix:

```javascript
// ❌ Leak: Event listener không remove
canvas.addEventListener('click', handler);

// ✅ Fix: Remove khi dispose
canvas.removeEventListener('click', handler);

// ❌ Leak: Global references
window.myModel = model;

// ✅ Fix: Cleanup
window.myModel = null;
```

## 📱 Mobile Optimization

### 1. Device Detection

Adjust quality dựa trên device:

```javascript
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

if (isMobile) {
    // Lower quality settings
    renderer.setPixelRatio(1);
    textureSize = 512;
} else {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    textureSize = 1024;
}
```

### 2. Touch Performance

Optimize touch events:

```javascript
// Use passive listeners
canvas.addEventListener('touchstart', handler, { passive: true });
canvas.addEventListener('touchmove', handler, { passive: true });
```

### 3. Reduce Visual Effects

```javascript
if (isMobile) {
    // Disable expensive effects
    disableBloom();
    disableShadows();
    reduceLightCount();
}
```

## 🔍 Performance Monitoring

### 1. Stats.js

Add FPS monitor:

```javascript
import Stats from 'three/addons/libs/stats.module.js';

const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
    stats.begin();
    render();
    stats.end();
}
```

### 2. Performance API

Measure load times:

```javascript
const t0 = performance.now();
await loadModel(path);
const t1 = performance.now();
console.log(`Load time: ${(t1 - t0).toFixed(2)}ms`);
```

### 3. Memory Monitoring

```javascript
// Chrome DevTools → Performance Monitor
// Watch: JS Heap Size, DOM Nodes, GPU Memory
```

### 4. Lighthouse Audit

```bash
# Run Lighthouse
lighthouse https://yoursite.com --view

# Focus on Performance score
```

## ✅ Optimization Checklist

### Models
- [ ] Polycount < 100K triangles
- [ ] Textures ≤ 1024×1024
- [ ] Draco compression enabled
- [ ] Materials baked
- [ ] UV optimized

### Code
- [ ] Lazy loading implemented
- [ ] Dispose unused resources
- [ ] Event listeners cleaned up
- [ ] No memory leaks
- [ ] Efficient rendering

### Assets
- [ ] Images compressed
- [ ] Textures WebP/optimized
- [ ] File sizes minimized
- [ ] CDN for libraries

### Mobile
- [ ] Responsive design
- [ ] Touch optimized
- [ ] Lower quality on mobile
- [ ] Fast load time

## 🎯 Performance Troubleshooting

### Low FPS?

1. **Check Stats**
   - Enable Stats.js
   - Monitor FPS, MS, MB

2. **Profile in DevTools**
   - Chrome → Performance → Record
   - Find bottlenecks

3. **Common Fixes**
   ```javascript
   // Reduce polycount
   // Fewer lights
   // Disable shadows
   // Lower texture resolution
   ```

### High Memory Usage?

1. **Check for Leaks**
   - Chrome → Memory → Take snapshot
   - Look for detached DOM nodes

2. **Dispose Resources**
   ```javascript
   // Call dispose on geometry, material, texture
   geometry.dispose();
   material.dispose();
   texture.dispose();
   ```

### Slow Loading?

1. **Compress Assets**
   - Use Draco for models
   - Optimize textures
   - Minify code

2. **Use CDN**
   - Serve from fast CDN
   - Enable browser caching

---

## 📚 Resources

- [Three.js Performance Tips](https://threejs.org/docs/#manual/en/introduction/Optimizing-performance)
- [Web Performance](https://web.dev/performance/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

---

⚡ **Remember**: Optimize cho user experience, không cần perfect 100 score!
