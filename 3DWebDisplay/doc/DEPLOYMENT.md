# 🚀 Deployment Guide

Hướng dẫn deploy website lên GitHub Pages và các platforms khác.

## 📋 Pre-deployment Checklist

### ✅ Code Ready
- [ ] All features tested và working
- [ ] No console errors
- [ ] Responsive trên mọi devices
- [ ] Models load correctly
- [ ] Performance optimized

### ✅ Content Ready
- [ ] Thông tin cá nhân đã update
- [ ] Social links đã update
- [ ] Models đã được thêm (hoặc có demo models)
- [ ] Thumbnails đã được tạo
- [ ] Images đã optimize

### ✅ Documentation
- [ ] README.md đã update
- [ ] Comments trong code rõ ràng
- [ ] LICENSE file included

## 🌐 GitHub Pages (Khuyến nghị)

### Method 1: Direct Deploy từ Main Branch

**Step 1: Tạo Repository**
```bash
# Khởi tạo git (nếu chưa có)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: 3D Portfolio Website"

# Tạo repo trên GitHub, sau đó:
git remote add origin https://github.com/yourusername/3DWebDisplay.git
git branch -M main
git push -u origin main
```

**Step 2: Enable GitHub Pages**
1. Vào **Settings** của repository
2. Scroll xuống **Pages** section
3. Source: **Deploy from a branch**
4. Branch: **main** / **root**
5. Click **Save**

**Step 3: Wait & Access**
- Đợi 2-5 phút để deploy
- Website sẽ có tại: `https://yourusername.github.io/3DWebDisplay/`
- Check Actions tab để xem progress

### Method 2: GitHub Actions (Advanced)

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

### Troubleshooting GitHub Pages

**❌ 404 Not Found**
```
Nguyên nhân: Đường dẫn sai hoặc chưa deploy xong
Fix:
- Đợi vài phút
- Check Settings → Pages → URL
- Đảm bảo index.html ở root
```

**❌ Models không load**
```
Nguyên nhân: Đường dẫn tương đối sai
Fix:
- Sử dụng đường dẫn tương đối (không có leading /)
- Đúng: 'models/cube.glb'
- Sai:  '/models/cube.glb'
```

**❌ CSS/JS không load**
```
Nguyên nhân: Case-sensitive paths (Linux server)
Fix:
- Đảm bảo tên file match exactly
- style.css không phải Style.css
```

## 🔷 Netlify

### Deployment

**Method 1: Drag & Drop**
1. Vào [Netlify](https://app.netlify.com/)
2. Drag thư mục project vào
3. Done! ✨

**Method 2: Git Integration**
1. Connect GitHub repository
2. Build settings:
   ```
   Build command: (leave empty)
   Publish directory: .
   ```
3. Deploy!

### Custom Domain
```
1. Netlify → Domain Settings → Add custom domain
2. Update DNS records:
   A Record → 75.2.60.5
   CNAME → yourdomain.netlify.app
```

### Advantages
- ✅ Free HTTPS
- ✅ Continuous deployment
- ✅ CDN included
- ✅ Custom domain support
- ✅ Form handling (nếu cần)

## 🔶 Vercel

### Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd 3DWebDisplay
vercel

# Production deployment
vercel --prod
```

### Or via Git
1. Import repository từ GitHub
2. Framework Preset: **Other**
3. Build Command: (leave empty)
4. Output Directory: `.`
5. Deploy!

### Advantages
- ✅ Global CDN
- ✅ Auto HTTPS
- ✅ Github integration
- ✅ Analytics (có phí)

## ☁️ Cloudflare Pages

### Deployment

1. Vào [Cloudflare Pages](https://pages.cloudflare.com/)
2. Connect GitHub repository
3. Build settings:
   ```
   Build command: (none)
   Build output directory: .
   ```
4. Save and Deploy

### Advantages
- ✅ Unlimited bandwidth
- ✅ Unlimited requests
- ✅ Free CDN
- ✅ DDoS protection

## 🗂️ Firebase Hosting

### Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Init project
firebase init hosting

# Settings:
# - Public directory: .
# - Single page app: No
# - GitHub integration: Optional

# Deploy
firebase deploy --only hosting
```

### Advantages
- ✅ Fast CDN
- ✅ Free SSL
- ✅ Custom domain
- ✅ Easy analytics integration

## 🌍 Custom Domain Setup

### Mua Domain
- [Namecheap](https://www.namecheap.com/)
- [Google Domains](https://domains.google/)
- [Cloudflare](https://www.cloudflare.com/products/registrar/)

### Configure DNS

**For GitHub Pages:**
```
A Record:
@ → 185.199.108.153
@ → 185.199.109.153
@ → 185.199.110.153
@ → 185.199.111.153

CNAME:
www → yourusername.github.io
```

**For Netlify/Vercel:**
```
CNAME:
@ → your-site.netlify.app  (hoặc vercel.app)
www → your-site.netlify.app
```

### Add Custom Domain in GitHub

1. Settings → Pages → Custom domain
2. Nhập domain: `yourdomain.com`
3. Wait for DNS check (~24h)
4. ✅ Enforce HTTPS

## 📊 Post-Deployment

### 1. Test Website

- [ ] Open website và test all features
- [ ] Test trên different browsers
- [ ] Test mobile devices
- [ ] Check console cho errors
- [ ] Test load times

### 2. SEO Setup

**Update meta tags** (`index.html`):
```html
<head>
    <!-- Title -->
    <title>Your Name - 3D Portfolio</title>
    
    <!-- Description -->
    <meta name="description" content="Interactive 3D portfolio showcasing models">
    
    <!-- Open Graph (Facebook, LinkedIn) -->
    <meta property="og:title" content="Your Name - 3D Portfolio">
    <meta property="og:description" content="Interactive 3D model viewer">
    <meta property="og:image" content="https://yoursite.com/preview.jpg">
    <meta property="og:url" content="https://yoursite.com">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Your Name - 3D Portfolio">
    <meta name="twitter:description" content="Interactive 3D model viewer">
    <meta name="twitter:image" content="https://yoursite.com/preview.jpg">
</head>
```

**Create preview image:**
- Screenshot website
- Size: 1200x630px (Open Graph)
- Place in root: `preview.jpg`

### 3. Analytics Setup

**Google Analytics:**
```html
<!-- Add before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

**Simple Analytics (Privacy-friendly):**
```html
<script async defer src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
```

### 4. Performance Monitoring

**Lighthouse CI:**
```bash
# Install
npm install -g @lhci/cli

# Run
lhci autorun --upload.target=temporary-public-storage
```

**Web Vitals:**
```html
<script type="module">
import {getCLS, getFID, getFCP, getLCP, getTTFB} from 'https://unpkg.com/web-vitals?module';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
</script>
```

### 5. Sitemap

Create `sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yoursite.com/</loc>
    <lastmod>2026-02-16</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>
```

### 6. robots.txt

Create `robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://yoursite.com/sitemap.xml
```

## 🔒 Security Headers

### Netlify (`netlify.toml`)

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Vercel (`vercel.json`)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

## 📈 Continuous Deployment

### Workflow

```
1. Make changes locally
2. Test thoroughly
3. Commit: git commit -m "feat: add new model"
4. Push: git push
5. Auto deploy (GitHub Pages/Netlify/Vercel)
6. Check live site
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-model

# Make changes, test

# Commit
git add .
git commit -m "feat: add spaceship model"

# Push feature branch
git push origin feature/new-model

# Create PR on GitHub
# Review → Merge to main
# Auto deploy!
```

## 🐛 Common Deployment Issues

### Mixed Content (HTTP/HTTPS)

```
❌ Error: Mixed Content
Fix: Ensure all assets use HTTPS
- CDN links: https://
- Images: relative paths or HTTPS
```

### CORS Errors

```
❌ Error: CORS policy blocked
Fix: 
- Models phải cùng domain
- Or add CORS headers
```

### Large File Warnings

```
⚠️ Warning: File > 100MB
GitHub: Max 100MB per file
Fix:
- Compress models
- Use Git LFS cho files lớn
- Host models externally
```

## 📚 Resources

- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Netlify Docs](https://docs.netlify.com/)
- [Vercel Docs](https://vercel.com/docs)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

---

🎉 **Congratulations!** Website của bạn đã live!

Share link với bạn bè và đồng nghiệp! 🚀
