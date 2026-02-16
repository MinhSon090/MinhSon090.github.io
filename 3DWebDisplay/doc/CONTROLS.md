# ⌨️ Keyboard Shortcuts & Controls

Danh sách đầy đủ các phím tắt và cách điều khiển trong ứng dụng.

## 🖱️ Mouse Controls

### Camera Controls

| Action | Control | Description |
|--------|---------|-------------|
| **Xoay camera** | `Chuột trái + Kéo` | Xoay camera quanh model theo trục ngang và dọc |
| **Zoom In/Out** | `Cuộn chuột` | Phóng to hoặc thu nhỏ (scroll lên = zoom in) |
| **Pan camera** | `Chuột phải + Kéo` | Di chuyển camera theo phương ngang/dọc |
| **Pan camera** | `Chuột giữa + Kéo` | Di chuyển camera (alternative) |

### UI Interactions

| Action | Control | Description |
|--------|---------|-------------|
| **Chọn model** | `Click vào model item` | Load và hiển thị model |
| **Toggle selector** | `Click toggle button` | Ẩn/hiện model selector panel |
| **Về trang Home** | `Click Home button` | Quay về trang chủ và unload model |
| **Social links** | `Click social icon` | Mở link trong tab mới |

## ⌨️ Keyboard Shortcuts

### Navigation

| Key | Action | Description |
|-----|--------|-------------|
| `ESC` | Go Home | Quay về trang Home và unload model |
| `H` | Toggle Home/Model | Chuyển đổi giữa Home và Model view |
| `M` | Toggle Model Selector | Ẩn/hiện panel chọn model |
| `R` | Reset Camera | Đặt lại camera về vị trí mặc định |

### Future Shortcuts (Planned)

| Key | Action | Description |
|-----|--------|-------------|
| `Space` | Toggle Auto-rotate | Bật/tắt tự động xoay model |
| `F` | Focus Model | Tự động focus camera vào model |
| `1-9` | Quick Select | Chọn nhanh model theo số thứ tự |
| `←/→` | Previous/Next Model | Chuyển sang model trước/sau |
| `W/A/S/D` | WASD Movement | Di chuyển camera như FPS game |
| `Shift` | Speed Modifier | Tăng tốc độ di chuyển/xoay |
| `Ctrl/Cmd` | Precision Mode | Giảm tốc độ để điều chỉnh chính xác |
| `G` | Toggle Grid | Hiện/ẩn grid helper |
| `L` | Toggle Lights | Hiện/ẩn light helpers |
| `T` | Toggle Stats | Hiện/ẩn FPS và performance stats |

## 📱 Touch Controls (Mobile)

### Single Touch

| Gesture | Action | Description |
|---------|--------|-------------|
| **Tap** | Select | Chọn model hoặc tương tác UI |
| **Drag** | Rotate | Xoay camera quanh model |

### Two Fingers

| Gesture | Action | Description |
|---------|--------|-------------|
| **Pinch** | Zoom | Zoom in/out bằng hai ngón tay |
| **Two-finger drag** | Pan | Di chuyển camera |

## 🎮 Camera Constraints

### Rotation
- ✅ Cho phép xoay 360° theo trục ngang
- ✅ Cho phép xoay 360° theo trục dọc
- ❌ Không cho phép roll (xoay nghiêng)

### Zoom
- 🔒 Min distance: **1 unit**
- 🔒 Max distance: **20 units**
- ⚡ Auto-adjust dựa trên kích thước model

### Pan
- ✅ Cho phép pan ngang và dọc
- ❌ Pan bị hạn chế (screen space panning)

## 🎯 Pro Tips

### Điều khiển Camera hiệu quả

1. **Xem nhiều góc độ nhanh**
   - Giữ chuột trái và quay tròn để xem 360°
   - Dùng scroll để tìm góc nhìn phù hợp

2. **Focus vào chi tiết**
   - Zoom in gần model
   - Dùng pan để di chuyển camera đến vùng cần xem

3. **Reset nhanh**
   - Press `R` để reset camera về vị trí mặc định
   - Press `ESC` để về Home và bắt đầu lại

### Workflow hiệu quả

1. **Chọn model nhanh**
   ```
   Click vào model selector → Chọn model → Model tự động load
   ```

2. **So sánh models**
   ```
   Xem model 1 → ESC → Chọn model 2 → So sánh
   ```

3. **Ẩn UI để screenshot**
   ```
   M (ẩn selector) → F11 (fullscreen) → Screenshot → F11 (exit)
   ```

## 🔧 Tùy chỉnh Controls

### Thay đổi sensitivity

File: `js/viewer.js`

```javascript
// Trong constructor của OrbitControls
this.controls.rotateSpeed = 1.0;      // Tốc độ xoay (mặc định: 1.0)
this.controls.zoomSpeed = 1.2;        // Tốc độ zoom (mặc định: 1.2)
this.controls.panSpeed = 0.8;         // Tốc độ pan (mặc định: 0.8)
```

### Thay đổi damping

```javascript
this.controls.enableDamping = true;   // Bật damping
this.controls.dampingFactor = 0.05;   // Độ mượt (0.01-0.1)
```

### Thay đổi zoom limits

```javascript
this.controls.minDistance = 1;        // Gần nhất
this.controls.maxDistance = 20;       // Xa nhất
```

### Disable controls

```javascript
this.controls.enableRotate = false;   // Tắt xoay
this.controls.enableZoom = false;     // Tắt zoom
this.controls.enablePan = false;      // Tắt pan
```

## 📝 Custom Controls (Advanced)

### Thêm custom keyboard shortcut

File: `js/main.js`

```javascript
// Trong setupEventListeners()
document.addEventListener('keydown', (e) => {
    // Thêm shortcut mới
    if (e.key === 'f' || e.key === 'F') {
        viewer.focusOnModel();
    }
    
    if (e.key === 'ArrowLeft') {
        // Previous model
    }
    
    if (e.key === 'ArrowRight') {
        // Next model
    }
});
```

### Thêm custom mouse control

```javascript
canvas.addEventListener('dblclick', () => {
    // Double click để focus vào model
    viewer.focusOnModel();
});
```

## 🎮 Controller Support (Future)

### Gamepad Mapping (Planned)

| Button | Action |
|--------|--------|
| Left Stick | Rotate camera |
| Right Stick | Pan camera |
| L2/R2 | Zoom in/out |
| A/X | Select model |
| B/Circle | Go back/Home |
| Start | Toggle menu |

## ⚠️ Lưu ý

- Một số shortcuts có thể conflict với browser defaults
- `F11` mở fullscreen (browser default)
- `Ctrl+W` đóng tab (browser default, không override)
- Touch gestures tùy thuộc vào device

## 🐛 Troubleshooting

### Controls không hoạt động?

1. **Kiểm tra focus** - Click vào canvas trước
2. **Check console** - Xem có lỗi không
3. **Reload trang** - Hard refresh (`Ctrl+Shift+R`)

### Camera bị "stuck"?

1. **Press `R`** để reset camera
2. **Press `ESC`** để về Home
3. **Reload trang** nếu vẫn lỗi

### Performance kém khi điều khiển?

1. Giảm damping factor
2. Tắt animations không cần thiết
3. Giảm polycount của model

---

💡 **Tip**: Thực hành với controls để quen thuộc và điều khiển mượt mà hơn!
