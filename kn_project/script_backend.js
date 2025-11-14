// API Configuration: use same origin to avoid localhost/IP mismatch
const API_BASE_URL = `${window.location.origin}/api`;

// Auth state
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let userFavorites = new Set();

// Image slideshow state
let autoSlideInterval = null;

// --- Favorite Properties Functions ---
async function loadUserFavorites() {
  if (!authToken) {
    userFavorites.clear();
    updateFavoritesDropdown();
    return;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (response.ok) {
      const favorites = await response.json();
      // Backend returns array of property IDs
      userFavorites = new Set(Array.isArray(favorites) ? favorites : []);
      updateFavoritesDropdown();
    } else {
      console.error('Failed to load favorites');
    }
  } catch (error) {
    console.error('Error loading favorites:', error);
  }
}

async function toggleFavorite(propertyId, heartBtn) {
  if (!authToken) {
    showLoginRequired('Đăng nhập để lưu phòng trọ yêu thích');
    return;
  }

  try {
    const isFavorited = userFavorites.has(propertyId);
    const method = isFavorited ? 'DELETE' : 'POST';
    
    const response = await fetch(`${API_BASE_URL}/favorites/${propertyId}`, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    // Handle unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear invalid token
      authToken = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      userFavorites.clear();
      updateUIForLoggedOutUser();
      
      showLoginRequired('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
      return;
    }
    
    if (response.ok) {
      if (!isFavorited) {
        userFavorites.add(propertyId);
        heartBtn.classList.add('favorited');
        showNotification('Đã lưu vào mục yêu thích! ❤️');
      } else {
        userFavorites.delete(propertyId);
        heartBtn.classList.remove('favorited');
        showNotification('Đã xóa khỏi mục yêu thích');
      }
      updateFavoritesDropdown();
    } else {
      showNotification('❌ ' + (data.error || 'Không thể cập nhật mục yêu thích'));
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    showNotification('❌ Không thể kết nối server. Vui lòng kiểm tra backend!');
  }
}

// Show notification message
function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'favorite-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Hide and remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Show login required notification and open login popup
function showLoginRequired(message = 'Vui lòng đăng nhập để sử dụng tính năng này') {
  // Create auth notification
  const notification = document.createElement('div');
  notification.className = 'auth-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Show notification with animation
  setTimeout(() => notification.classList.add('show'), 50);
  
  // Hide notification after 4 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 400);
  }, 4000);
}

// Update favorites dropdown with current favorites
async function updateFavoritesDropdown() {
  const favoritesList = document.getElementById('favorites-list');
  const favoritesCount = document.querySelector('.favorites-count');
  
  if (!authToken || userFavorites.size === 0) {
    favoritesList.innerHTML = `
      <div class="favorites-empty">
        <i class="fas fa-heart"></i>
        <p>Chưa có phòng trọ yêu thích</p>
      </div>
    `;
    if (favoritesCount) {
      favoritesCount.style.display = 'none';
    }
    return;
  }
  
  // Show count
  if (favoritesCount) {
    favoritesCount.textContent = userFavorites.size;
    favoritesCount.style.display = userFavorites.size > 0 ? 'inline' : 'none';
  }
  
  // Get property details for favorites
  const favoriteProperties = propertyData.filter(p => userFavorites.has(p.id));
  
  if (favoriteProperties.length === 0) {
    favoritesList.innerHTML = `
      <div class="favorites-empty">
        <i class="fas fa-heart"></i>
        <p>Chưa có phòng trọ yêu thích</p>
      </div>
    `;
    return;
  }
  
  // Render favorites
  favoritesList.innerHTML = favoriteProperties.map(property => {
    const mainImg = Array.isArray(property.img) ? property.img[0] : property.img;
    return `
      <div class="favorite-item" data-property-id="${property.id}">
        <img src="${mainImg}" alt="${property.title}">
        <div class="favorite-info">
          <h4>${property.title}</h4>
          <p class="favorite-price">${property.price || 'Liên hệ'}</p>
        </div>
        <button class="favorite-remove" data-property-id="${property.id}" title="Xóa khỏi yêu thích">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }).join('');
  
  // Add click events for favorite items
  favoritesList.querySelectorAll('.favorite-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.favorite-remove')) return; // Don't trigger if clicking remove button
      
      const propertyId = item.dataset.propertyId;
      const property = propertyData.find(p => p.id === propertyId);
      if (property) {
        // Close dropdown with animation
        const dropdown = document.getElementById('favorites-dropdown');
        if (dropdown) dropdown.classList.remove('show');
        // Open property modal
        openPropertyModal(property);
        // Update URL
        const propertyUrl = `?room=${property.id}`;
        window.history.pushState({ propertyId: property.id }, '', propertyUrl);
      }
    });
  });
  
  // Add click events for remove buttons
  favoritesList.querySelectorAll('.favorite-remove').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const propertyId = btn.dataset.propertyId;
      
      // Find heart button if modal is open for this property
      const modal = document.getElementById('propertyModal');
      const modalTitle = document.getElementById('modal-title');
      let heartBtn = null;
      
      if (modal.style.display === 'flex' && modalTitle) {
        const currentProperty = propertyData.find(p => p.title === modalTitle.innerHTML);
        if (currentProperty && currentProperty.id === propertyId) {
          heartBtn = modal.querySelector('.favorite-heart-btn');
        }
      }
      
      // Toggle favorite (remove it)
      if (heartBtn) {
        await toggleFavorite(propertyId, heartBtn);
      } else {
        // Remove without heart icon reference
        try {
          const response = await fetch(`${API_BASE_URL}/favorites/${propertyId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (response.ok) {
            userFavorites.delete(propertyId);
            updateFavoritesDropdown();
            showNotification('Đã xóa khỏi mục yêu thích');
          }
        } catch (error) {
          console.error('Error removing favorite:', error);
        }
      }
    });
  });
}

// Check if user is logged in on page load
if (authToken) {
  currentUser = JSON.parse(localStorage.getItem('currentUser'));
  updateUIForLoggedInUser();
  loadUserFavorites();
}

// --- Authentication Functions ---
function updateUIForLoggedInUser() {
  if (currentUser) {
    // Hide login and register buttons
    const loginBtn = document.getElementById('login-btn-aa');
    const registerBtn = document.getElementById('register-btn-aa');
    const profileContainer = document.querySelector('.profile-container');
    const profileUsername = document.querySelector('.profile-username');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    
    // Show profile icon and username
    if (profileContainer) {
      profileContainer.style.display = 'flex';
      if (profileUsername) {
        // Use username if available, otherwise use ID
        profileUsername.textContent = currentUser.username || currentUser.id;
      }
    }
    
    // Update mobile sidebar
    updateMobileSidebarAuth();
  }
}

function logout() {
  // Clear localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  authToken = null;
  currentUser = null;
  userFavorites.clear();
  
  // Reset UI
  const loginBtn = document.getElementById('login-btn-aa');
  const registerBtn = document.getElementById('register-btn-aa');
  const profileContainer = document.querySelector('.profile-container');
  const profilePopup = document.getElementById('profile-popup');
  
  if (loginBtn) loginBtn.style.display = '';
  if (registerBtn) registerBtn.style.display = '';
  if (profileContainer) profileContainer.style.display = 'none';
  if (profilePopup) profilePopup.style.display = 'none';
  
  // Clear favorites dropdown
  updateFavoritesDropdown();
  
  // Update mobile sidebar
  updateMobileSidebarAuth();
  
  alert('Đã đăng xuất thành công!');
  // Optionally redirect to home
  if (window.location.pathname.includes('account')) {
    window.location.href = '../index.html';
  } else {
    window.location.reload();
  }
}

// Login form submission
const loginForm = document.querySelector('#login-popup form');
console.log('🔍 Login form found:', loginForm ? 'YES' : 'NO');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('📝 Login form submitted!');
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    console.log('👤 Username:', username);

    if (!username || !password) {
      showNotification('⚠️ Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    try {
      console.log('Attempting login to:', `${API_BASE_URL}/login`);
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password })
      });

      // Check if response is ok before parsing JSON
      if (response.ok) {
        const data = await response.json();
        console.log('Login response:', response.status, data);
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUIForLoggedInUser();
        await loadUserFavorites(); // Load favorites after login
        closeLoginPopup();
        showNotification('Đăng nhập thành công! 🎉');
      } else {
        // Server returned error, try to parse JSON error message
        try {
          const data = await response.json();
          showNotification('❌ ' + (data.error || 'Đăng nhập thất bại'));
        } catch {
          // If JSON parsing fails, throw to trigger offline mode
          throw new Error('Server error: ' + response.status);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      // FALLBACK: Offline login with demo accounts
      console.log('🔄 Backend unavailable, trying offline login...');
      
      const offlineAccounts = {
        'khach@example.com': { password: 'khach123', user: { id: 'user#00007', email: 'khach@example.com', username: 'khachhang', account_type: 'user' }},
        'khachhang': { password: 'khach123', user: { id: 'user#00007', email: 'khach@example.com', username: 'khachhang', account_type: 'user' }}
      };
      
      const account = offlineAccounts[username];
      if (account && account.password === password) {
        authToken = 'offline-token-' + Date.now();
        currentUser = account.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUIForLoggedInUser();
        await loadUserFavorites();
        closeLoginPopup();
        showNotification('✅ Đăng nhập thành công (Offline mode)! 🎉');
      } else {
        showNotification('❌ Không thể kết nối server. Vui lòng dùng tài khoản demo: khach@example.com / khach123');
      }
    }
  });
}

// Register form submission
const registerForm = document.querySelector('#register-popup form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const password2 = document.getElementById('register-password2').value;

    if (!email || !password) {
      showNotification('⚠️ Vui lòng nhập email và mật khẩu!');
      return;
    }

    if (password !== password2) {
      showNotification('⚠️ Mật khẩu không khớp!');
      return;
    }

    try {
      console.log('Attempting register to:', `${API_BASE_URL}/register`);
      
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username, password, account_type: 'user' })
      });

      const data = await response.json();
      console.log('Register response:', response.status, data);
      
      if (response.ok) {
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUIForLoggedInUser();
        await loadUserFavorites(); // Load favorites after register
        closeRegisterPopup();
        showNotification('Đăng ký thành công! 🎉');
      } else {
        showNotification('❌ ' + (data.error || 'Đăng ký thất bại'));
      }
    } catch (error) {
      console.error('Register error:', error);
      showNotification('❌ Không thể kết nối đến server. Vui lòng kiểm tra backend!');
    }
  });
}

// Google Login Button Handler
const googleLoginBtns = document.querySelectorAll('.login-btn-google');
googleLoginBtns.forEach(btn => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // For now, show info message - need backend OAuth setup
    showNotification('⚠️ Đăng nhập Google đang được phát triển. Vui lòng dùng email/password!');
    
    // TODO: Implement Google OAuth flow
    // window.location.href = `${API_BASE_URL}/auth/google`;
  });
});

// Facebook Login Button Handler  
const facebookLoginBtns = document.querySelectorAll('.login-btn-facebook');
facebookLoginBtns.forEach(btn => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    showNotification('⚠️ Đăng nhập Facebook đang được phát triển. Vui lòng dùng email/password!');
  });
});

// VNU Login Button Handler
const vnuLoginBtns = document.querySelectorAll('.login-btn-vnu');
vnuLoginBtns.forEach(btn => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    showNotification('⚠️ Đăng nhập VNU đang được phát triển. Vui lòng dùng email/password!');
  });
});

  // Partner button is now a direct link - no popup needed
  // Old partner popup code removed completely

// --- Search & Sort ---
document.querySelector(".btn-search").addEventListener("click", async () => {
  const loaiHinh = document.getElementById("filter-type").value.trim();
  const khuVuc = document.getElementById("filter-area").value.trim();
  const keyword = document.querySelector(".search-box input").value.trim().toLowerCase();
  const sapXepGia = document.querySelector("#sapXepGia").value;

  // Save search history if logged in
  if (authToken) {
    try {
      await fetch(`${API_BASE_URL}/search-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ type: loaiHinh, area: khuVuc, keyword })
      });
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  let cards = Array.from(document.querySelectorAll(".ct > div"));

  // Lọc cards
  cards.forEach(card => {
    const title = card.querySelector("h3").innerText.toLowerCase();
    const address = card.querySelector("p").innerText.toLowerCase();
    let show = true;

    if (khuVuc !== "Tất cả" && khuVuc !== "Khu vực" && khuVuc !== "none" && !address.includes(khuVuc.toLowerCase())) show = false;
    if (loaiHinh !== "Tất cả" && loaiHinh !== "Loại hình" && loaiHinh !== "none") {
      const item = propertyData.find(p => p.id === card.id);
      if (!item || item.loai !== loaiHinh) show = false;
    }
    if (keyword && !title.includes(keyword) && !address.includes(keyword)) show = false;

    card.style.display = show ? "block" : "none";
  });

  // Sắp xếp theo giá
  if (sapXepGia === "Giá tăng dần" || sapXepGia === "Giá giảm dần") {
    let visibleCards = cards.filter(c => c.style.display === "block");
    visibleCards.sort((a, b) => {
      let pa = getPriceNumber(a);
      let pb = getPriceNumber(b);
      return sapXepGia === "Giá tăng dần" ? pa - pb : pb - pa;
    });
    let container = document.querySelector(".ct");
    visibleCards.forEach(card => container.appendChild(card));
  } else if (sapXepGia === "Mặc định") {
    let container = document.querySelector(".ct");
    let groups = {};
    propertyData.forEach(item => {
      if (!groups[item.loai]) groups[item.loai] = [];
      let card = cards.find(c => c.id === item.id && c.style.display === "block");
      if (card) groups[item.loai].push(card);
    });
    Object.keys(groups).forEach(loai => {
      groups[loai].forEach(card => container.appendChild(card));
    });
  }
});

// Nút Xóa
document.querySelector(".btn-clear").addEventListener("click", () => {
  document.querySelectorAll(".search-box input").forEach(input => input.value = "");
  document.querySelectorAll(".search-box select").forEach(select => select.selectedIndex = 0);
  document.querySelectorAll(".ct > div").forEach(card => card.style.display = "block");
  const container = document.querySelector(".ct");
  propertyData.forEach(item => {
    const card = document.getElementById(item.id);
    if (card) container.appendChild(card);
  });
});

function getPriceNumber(card) {
  const priceText = card.querySelector("p.price")?.innerText || card.querySelector("p:nth-of-type(2)")?.innerText || "";
  const rangeMatch = priceText.match(/([\d,.]+)\s*-\s*([\d,.]+)/);
  if (rangeMatch) {
    const num1 = parseInt(rangeMatch[1].replace(/[^0-9]/g, ""), 10) || 0;
    const num2 = parseInt(rangeMatch[2].replace(/[^0-9]/g, ""), 10) || 0;
    return Math.round((num1 + num2) / 2);
  }
  let num = priceText.replace(/[^0-9]/g, "");
  return parseInt(num, 10) || 0;
}

// --- Property Data Loading ---
let propertyData = [];

fetch(`${API_BASE_URL}/properties`)
  .then(res => res.json())
  .then(data => {
    propertyData = data;
    const container = document.querySelector(".ct");
    container.innerHTML = "";

    data.forEach(item => {
      const card = document.createElement("div");
      card.className = item.loai === "Nhà trọ" ? "property-card-ntro" : "property-card-ktx";
      card.id = item.id;
      let mainImg = Array.isArray(item.img) ? item.img[0] : item.img;
      card.innerHTML = `
        <img src="${mainImg}" alt="${item.title}">
        <h3>${item.title}</h3>
        <p>${item.address}</p>
        <p>${item.price || "Giá: Liên hệ"}</p>
      `;
      container.appendChild(card);
    });

    attachCardEvents();
    // Update favorites dropdown after properties are loaded
    if (authToken && userFavorites.size > 0) {
      updateFavoritesDropdown();
    }
  })
  .catch(error => {
    console.error('Error loading properties:', error);
    // Fallback to local data.json
    fetch("data.json")
      .then(res => res.json())
      .then(data => {
        propertyData = data;
        const container = document.querySelector(".ct");
        container.innerHTML = "";
        data.forEach(item => {
          const card = document.createElement("div");
          card.className = item.loai === "Nhà trọ" ? "property-card-ntro" : "property-card-ktx";
          card.id = item.id;
          let mainImg = Array.isArray(item.img) ? item.img[0] : item.img;
          card.innerHTML = `
            <img src="${mainImg}" alt="${item.title}">
            <h3>${item.title}</h3>
            <p>${item.address}</p>
            <p>${item.price || "Giá: Liên hệ"}</p>
          `;
          container.appendChild(card);
        });
        attachCardEvents();
        // Update favorites dropdown after properties are loaded
        if (authToken && userFavorites.size > 0) {
          updateFavoritesDropdown();
        }
      });
  });

// --- Modal & Card Events ---
function attachCardEvents() {
  const modal = document.getElementById("propertyModal");
  const modalImg = document.getElementById("modal-img");
  const modalThumbnails = document.getElementById("modal-thumbnails");
  const modalTitle = document.getElementById("modal-title");
  const modalAddress = document.getElementById("modal-address");
  const modalPrice = document.getElementById("modal-price");
  const modalDesc = document.getElementById("modal-description");
  const closeBtn = document.querySelector(".modal .close");

  document.querySelectorAll(".property-card-ntro, .property-card-ktx").forEach(card => {
    card.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const item = propertyData.find(p => p.id === card.id);
      if (item) {
        // Update URL without page reload using hash
        const propertyUrl = `?room=${item.id}`;
        window.history.pushState({ propertyId: item.id }, '', propertyUrl);
        
        openPropertyModal(item);
      }
    });
  });

  closeBtn.onclick = () => closeModal();
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  
  // ESC key để đóng modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeModal();
    }
  });
}

// Open property modal with data
async function openPropertyModal(item) {
  const modal = document.getElementById("propertyModal");
  let modalImg = document.getElementById("modal-img");
  const modalThumbnails = document.getElementById("modal-thumbnails");
  const modalTitle = document.getElementById("modal-title");
  const modalAddress = document.getElementById("modal-address");
  const modalPrice = document.getElementById("modal-price");
  const modalDesc = document.getElementById("modal-description");
  const heartBtn = modal.querySelector('.favorite-heart-btn');
  const prevBtn = document.getElementById("prev-image-btn");
  const nextBtn = document.getElementById("next-image-btn");
  const imageCounter = document.getElementById("image-counter");
  const imageContainer = document.querySelector('.modal-image-container');

  // Add to view history
  addToViewHistory(item);

  // Basic data
  const propertyId = item.id;
  let images = [];
  if (Array.isArray(item.img)) images = item.img;
  else if (item.img) images = [item.img];
  else images = [];

  // Image slideshow management
  let currentImageIndex = 0;
  let isAnimating = false;

  function updateImage(index, direction = 'next') {
    if (images.length === 0 || isAnimating) return;
    
    isAnimating = true;
    const previousIndex = currentImageIndex;
    currentImageIndex = (index + images.length) % images.length;
    
    // Get current modal image
    const currentImg = document.getElementById('modal-img');
    if (!currentImg) {
      isAnimating = false;
      return;
    }
    
    // Create new image element for animation
    const newImg = document.createElement('img');
    newImg.src = images[currentImageIndex];
    newImg.alt = item.title || '';
    newImg.style.width = '100%';
    newImg.style.height = '100%';
    newImg.style.objectFit = 'contain';
    newImg.style.position = 'absolute';
    newImg.style.top = '0';
    newImg.style.left = '0';
    
    // Add animation classes based on direction
    if (direction === 'next') {
      currentImg.classList.add('slide-out-left');
      newImg.classList.add('slide-in-right');
    } else {
      currentImg.classList.add('slide-out-right');
      newImg.classList.add('slide-in-left');
    }
    
    // Add new image to container
    imageContainer.appendChild(newImg);
    
    // After animation completes, replace the old image
    setTimeout(() => {
      if (currentImg.parentElement) {
        currentImg.remove();
      }
      newImg.id = 'modal-img';
      isAnimating = false;
    }, 500);
    
    imageCounter.textContent = `${currentImageIndex + 1} / ${images.length}`;
    
    // Update thumbnail active state
    modalThumbnails.querySelectorAll('img').forEach((img, i) => {
      img.classList.toggle('active', i === currentImageIndex);
    });
  }

  function startAutoSlide() {
    if (images.length <= 1) {
      console.log('Not enough images for auto-slide:', images.length);
      return;
    }
    stopAutoSlide();
    console.log('Auto-slide started');
    autoSlideInterval = setInterval(() => {
      console.log('Auto-slide tick, current index:', currentImageIndex);
      updateImage(currentImageIndex + 1, 'next');
    }, 3000); // Change image every 3 seconds
  }

  function stopAutoSlide() {
    if (autoSlideInterval) {
      console.log('Auto-slide stopped');
      clearInterval(autoSlideInterval);
      autoSlideInterval = null;
    }
  }

  // Navigation button handlers
  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      console.log('Prev button clicked');
      stopAutoSlide();
      updateImage(currentImageIndex - 1, 'prev');
      setTimeout(() => startAutoSlide(), 100);
    };
  }

  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      console.log('Next button clicked');
      stopAutoSlide();
      updateImage(currentImageIndex + 1, 'next');
      setTimeout(() => startAutoSlide(), 100);
    };
  }

  // Initialize first image
  const initialImg = document.getElementById('modal-img');
  if (initialImg) {
    initialImg.src = images[0] || "";
    initialImg.alt = item.title || '';
  }
  if (imageCounter) {
    imageCounter.textContent = `1 / ${images.length}`;
  }
  
  modalTitle.innerHTML = item.title || '';
  modalAddress.innerHTML = item.address || '';
  modalPrice.innerHTML = item.price || '';

  // Start auto-slide after a short delay
  setTimeout(() => {
    console.log('Starting auto-slide with', images.length, 'images');
    startAutoSlide();
  }, 500);

  // Update heart button state and behavior
  if (heartBtn) {
    if (userFavorites.has(propertyId)) {
      heartBtn.classList.add('favorited');
    } else {
      heartBtn.classList.remove('favorited');
    }
    heartBtn.onclick = () => toggleFavorite(propertyId, heartBtn);
  }

  // Map location button
  const mapBtn = document.getElementById('map-location-btn');
  if (mapBtn) {
    mapBtn.onclick = () => {
      // Create Google Maps URL with address
      const address = item.address || '';
      const title = item.title || '';
      
      // Remove HTML tags and "Địa chỉ:" text from address
      let cleanAddress = address.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      cleanAddress = cleanAddress.replace(/^Địa chỉ:\s*/i, '').trim();
      
      // Try to use coordinates if available, otherwise use address
      let mapsUrl;
      if (item.lat && item.lng) {
        // If coordinates exist, use them for precise location
        mapsUrl = `https://www.google.com/maps?q=${item.lat},${item.lng}&t=m&z=16`;
      } else {
        // Use clean address for search (more accurate than title + address)
        const searchQuery = encodeURIComponent(cleanAddress + ', Hòa Lạc, Hà Nội');
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
      }
      
      // Open in new tab
      window.open(mapsUrl, '_blank');
      showNotification('📍 Đang mở bản đồ...');
    };
  }

  // Booking button
  const bookingBtn = document.getElementById('booking-btn');
  if (bookingBtn) {
    bookingBtn.onclick = () => {
      openBookingModal(item);
    };
  }

  // Thumbnails
  modalThumbnails.innerHTML = images.map((src, i) => `<img src="${src}" data-index="${i}" class="${i===0? 'active':''}">`).join('');
  modalThumbnails.querySelectorAll('img').forEach((imgEl, index) => {
    imgEl.addEventListener('click', () => {
      stopAutoSlide();
      const direction = index > currentImageIndex ? 'next' : 'prev';
      updateImage(index, direction);
      startAutoSlide();
    });
  });

  // Rating stars setup
  const starsEl = modal.querySelector('.modal-rating-stars');
  const textEl = modal.querySelector('.modal-rating-text');
  const texts = ['Rất tệ','Tệ','Bình thường','Tốt','Tuyệt vời'];
  let selectedStar = 0;
  let hoverStar = 0;

  if (starsEl) {
    starsEl.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const s = document.createElement('span');
      s.className = 'star';
      s.textContent = '★';
      s.dataset.value = i;
      s.addEventListener('click', async () => {
        selectedStar = i;
        renderStars();
        // Save rating if user logged in
        if (!authToken) {
          // show login required notification
          showLoginRequired('Đăng nhập để đánh giá phòng trọ');
          return;
        }
        await saveRating(propertyId, selectedStar);
        showNotification('Cảm ơn bạn đã đánh giá!');
      });
      s.addEventListener('mouseover', () => { hoverStar = i; renderStars(); });
      s.addEventListener('mouseout', () => { hoverStar = 0; renderStars(); });
      starsEl.appendChild(s);
    }
  }

  function renderStars() {
    if (!starsEl) return;
    for (let i = 0; i < starsEl.children.length; i++) {
      const star = starsEl.children[i];
      star.classList.toggle('selected', i < selectedStar);
      star.classList.toggle('hovered', hoverStar && i < hoverStar);
    }
    const idx = (hoverStar || selectedStar) - 1;
    if (textEl) textEl.textContent = idx >= 0 ? texts[idx] : '';
  }

  renderStars();

  // Comments wiring
  const commentInput = document.getElementById('modal-comment-input');
  const commentSubmit = document.getElementById('modal-comment-submit');
  const commentList = document.getElementById('modal-comment-list');

  // Load comments
  async function loadComments() {
    try {
      const response = await fetch(`${API_BASE_URL}/comments/${propertyId}`);
      if (response.ok) {
        const comments = await response.json();
        renderComments(comments);
      } else {
        commentList.innerHTML = '<div style="color:#999">Không có bình luận</div>';
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  }

  // Submit comment (requires login)
  if (commentSubmit) {
    commentSubmit.onclick = async () => {
      if (!authToken) {
        // Show login required notification
        showLoginRequired('Đăng nhập để bình luận về phòng trọ');
        return;
      }
      const txt = commentInput ? commentInput.value.trim() : '';
      if (!txt) return;
      try {
        const response = await fetch(`${API_BASE_URL}/comments/${propertyId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ text: txt, rating: selectedStar })
        });
        if (response.ok) {
          if (commentInput) commentInput.value = '';
          await loadComments();
          showNotification('Gửi bình luận thành công');
        } else {
          const data = await response.json();
          alert(data.error || 'Không thể gửi bình luận');
        }
      } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Có lỗi xảy ra khi gửi bình luận');
      }
    };
  }

  function renderComments(comments) {
    if (!commentList) return;
    if (!comments || comments.length === 0) {
      commentList.innerHTML = '<div style="color:#999">Chưa có bình luận nào</div>';
      return;
    }
    commentList.innerHTML = comments.map(com => `
      <div class="comment-item">
        <strong>${com.username}</strong>
        ${com.rating > 0 ? `<span class="comment-stars">${'★'.repeat(com.rating)}${'☆'.repeat(5 - com.rating)}</span>` : ''}
        <p>${com.text}</p>
        <span style="color:#aaa; font-size:0.85em;">${new Date(com.created_at).toLocaleString('vi')}</span>
      </div>
    `).join('');
  }

  // Initial load
  await loadComments();

  // Show modal
  modal.style.display = 'flex';
  
  // Lock body scroll
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');
  
  // Scroll modal to top
  setTimeout(() => {
    modal.scrollTop = 0;
  }, 10);
}

// Close modal helper
function closeModal() {
  const modal = document.getElementById('propertyModal');
  if (modal) modal.style.display = 'none';
  
  // Stop auto-slide
  if (autoSlideInterval) {
    clearInterval(autoSlideInterval);
    autoSlideInterval = null;
  }
  
  // Unlock body scroll
  document.body.classList.remove('modal-open');
  document.documentElement.classList.remove('modal-open');
  
  // remove query param if any
  try { window.history.replaceState({}, '', window.location.pathname); } catch(e){}
}

// Info Modal Functions (Search History & Contact)
function openSearchHistoryModal() {
  const modal = document.getElementById('search-history-modal');
  const historyList = document.getElementById('search-history-list');
  
  if (!modal || !historyList) return;
  
  // Get view history from localStorage
  const history = getViewHistory();
  
  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="search-history-empty">
        <i class="fas fa-history"></i>
        <p>Chưa có phòng đã xem</p>
      </div>
    `;
  } else {
    historyList.innerHTML = history.map(item => {
      const imgSrc = item.img || 'images/default.jpg';
      return `
        <li class="search-history-item view-history-card" data-id="${item.id}">
          <div class="view-history-img">
            <img src="${imgSrc}" alt="${item.title}">
          </div>
          <div class="view-history-content">
            <div class="view-history-title">${item.title}</div>
            <div class="view-history-address"><i class="fas fa-location-dot"></i> ${item.address}</div>
            <div class="view-history-price">${item.price}</div>
            <div class="view-history-time"><i class="fas fa-clock"></i> ${formatSearchTime(item.timestamp)}</div>
          </div>
        </li>
      `;
    }).join('');
    
    // Add click event listeners
    historyList.querySelectorAll('.view-history-card').forEach(card => {
      card.addEventListener('click', () => {
        const propertyId = card.dataset.id;
        const property = propertyData.find(p => p.id === propertyId);
        if (property) {
          closeSearchHistoryModal();
          openPropertyModal(property);
        }
      });
    });
  }
  
  // Save current scroll position BEFORE showing modal
  const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Restore scroll position to prevent jump
  requestAnimationFrame(() => {
    window.scrollTo(0, currentScrollY);
  });
}
function closeSearchHistoryModal() {
  const modal = document.getElementById('search-history-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function openContactModal() {
  const modal = document.getElementById('contact-modal');
  if (modal) {
    // Save current scroll position BEFORE opening modal
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Restore scroll position to prevent jump
    requestAnimationFrame(() => {
      window.scrollTo(0, currentScrollY);
    });
  }
}

function closeContactModal() {
  const modal = document.getElementById('contact-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// About Modal Functions
function openAboutModal() {
  const modal = document.getElementById('about-modal');
  if (modal) {
    // Save current scroll position BEFORE opening modal
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Restore scroll position to prevent jump
    requestAnimationFrame(() => {
      window.scrollTo(0, currentScrollY);
    });
  }
}

function closeAboutModal() {
  const modal = document.getElementById('about-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Booking Modal Functions
let currentBookingProperty = null;

function openBookingModal(property) {
  const modal = document.getElementById('booking-modal');
  if (!modal) return;
  
  currentBookingProperty = property;
  
  // Fill property info
  const img = document.getElementById('booking-property-img');
  const title = document.getElementById('booking-property-title');
  const price = document.getElementById('booking-property-price');
  
  if (img) img.src = Array.isArray(property.img) ? property.img[0] : property.img;
  if (title) {
    // Remove HTML tags from title
    const cleanTitle = (property.title || '').replace(/<[^>]*>/g, '');
    title.textContent = cleanTitle;
  }
  if (price) {
    // Remove HTML tags from price
    const cleanPrice = (property.price || '').replace(/<[^>]*>/g, '');
    price.textContent = cleanPrice;
  }
  
  // Fill user info if logged in
  const userData = getUserData();
  const nameInput = document.getElementById('booking-name');
  const emailInput = document.getElementById('booking-email');
  
  if (userData) {
    if (nameInput) nameInput.value = userData.username || '';
    if (emailInput) emailInput.value = userData.email || '';
  } else {
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
  }
  
  // Set min date to today
  const dateInput = document.getElementById('booking-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }
  
  // Reset form
  const form = document.getElementById('booking-form');
  if (form) {
    const phoneInput = document.getElementById('booking-phone');
    const timeInput = document.getElementById('booking-time');
    const noteInput = document.getElementById('booking-note');
    
    if (phoneInput) phoneInput.value = '';
    if (dateInput && !dateInput.value) dateInput.value = '';
    if (timeInput) timeInput.value = '';
    if (noteInput) noteInput.value = '';
  }
  
  // Show modal
  const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Restore scroll position to prevent jump
  requestAnimationFrame(() => {
    window.scrollTo(0, currentScrollY);
  });
}

function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentBookingProperty = null;
  }
}

// Đóng modal khi click outside hoặc ESC
document.addEventListener('DOMContentLoaded', () => {
  const bookingModal = document.getElementById('booking-modal');
  
  if (bookingModal) {
    // Click outside để đóng
    bookingModal.addEventListener('click', (e) => {
      if (e.target === bookingModal) {
        closeBookingModal();
      }
    });
    
    // ESC key để đóng
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && bookingModal.classList.contains('active')) {
        closeBookingModal();
      }
    });
  }
});

// Handle booking form submission
const bookingForm = document.getElementById('booking-form');
if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('booking-name').value;
    const phone = document.getElementById('booking-phone').value;
    const cccd = document.getElementById('booking-cccd').value;
    const email = document.getElementById('booking-email').value;
    const date = document.getElementById('booking-date').value;
    const time = document.getElementById('booking-time').value;
    const note = document.getElementById('booking-note').value;
    
    if (!currentBookingProperty) {
      showNotification('❌ Lỗi: Không tìm thấy thông tin phòng');
      return;
    }
    
    // Validate
    if (!name || !phone || !cccd || !date || !time) {
      showNotification('❌ Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    // Validate CCCD format (12 digits)
    if (!/^\d{12}$/.test(cccd)) {
      showNotification('❌ Số CCCD phải có đầy đủ 12 chữ số');
      return;
    }
    
    // Create booking data
    const bookingData = {
      propertyId: currentBookingProperty.id,
      propertyTitle: currentBookingProperty.title,
      propertyPrice: currentBookingProperty.price,
      name: name,
      phone: phone,
      cccd: cccd,
      email: email,
      date: date,
      time: time,
      note: note,
      timestamp: new Date().toISOString()
    };
    
    try {
      // Show loading
      const submitBtn = bookingForm.querySelector('.booking-submit-btn');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
      submitBtn.disabled = true;
      
      // Simulate API call (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save to localStorage for now
      const bookings = JSON.parse(localStorage.getItem('hola_bookings') || '[]');
      bookings.push(bookingData);
      localStorage.setItem('hola_bookings', JSON.stringify(bookings));
      
      // Success
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      closeBookingModal();
      
      showNotification('✅ Đã gửi yêu cầu đặt lịch hẹn! Chúng tôi sẽ liên hệ với bạn qua email/số điện thoại đã đăng ký.');
      
      // TODO: Send to backend API
      // await fetch(`${API_BASE_URL}/booking`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(bookingData)
      // });
      
    } catch (error) {
      console.error('Booking error:', error);
      showNotification('❌ Có lỗi xảy ra. Vui lòng thử lại sau.');
      const submitBtn = bookingForm.querySelector('.booking-submit-btn');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi yêu cầu đặt lịch';
    }
  });
}

function getUserData() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    const userData = JSON.parse(localStorage.getItem('userData') || 'null');
    return userData;
  } catch (e) {
    return null;
  }
}

function formatSearchTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return minutes < 1 ? 'Vừa xong' : `${minutes} phút trước`;
  }
  
  // Less than 1 day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} giờ trước`;
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} ngày trước`;
  }
  
  // Format as date
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

async function saveRating(propertyId, rating) {
  try {
    await fetch(`${API_BASE_URL}/ratings/${propertyId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ rating })
    });
  } catch (error) {
    console.error('Error saving rating:', error);
  }
}

// --- Popup Controls ---
// Login button in header opens popup
const headerLoginBtn = document.getElementById('login-btn-aa');
if (headerLoginBtn) {
  headerLoginBtn.addEventListener('click', toggleLoginPopup);
}

function toggleLoginPopup(e) {
  e.preventDefault();
  const loginPopup = document.getElementById('login-popup');
  const registerPopup = document.getElementById('register-popup');
  const backdrop = document.getElementById('auth-backdrop');
  
  if (registerPopup && registerPopup.style.display === 'flex') {
    registerPopup.style.display = 'none';
  }
  
  const isVisible = loginPopup.style.display === 'flex';
  loginPopup.style.display = isVisible ? 'none' : 'flex';
  
  // Show/hide backdrop
  if (backdrop) {
    if (isVisible) {
      backdrop.classList.remove('show');
    } else {
      backdrop.classList.add('show');
    }
  }
}

document.querySelector('.login-close').onclick = closeLoginPopup;
function closeLoginPopup() {
  document.getElementById('login-popup').style.display = 'none';
  const backdrop = document.getElementById('auth-backdrop');
  if (backdrop) backdrop.classList.remove('show');
}

// Password toggle functionality
const togglePasswordIcons = document.querySelectorAll('.toggle-password');
togglePasswordIcons.forEach(icon => {
  icon.addEventListener('click', function() {
    const inputWrapper = this.closest('.input-wrapper');
    const passwordInput = inputWrapper.querySelector('input[type="password"], input[type="text"]');
    
    if (passwordInput) {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.classList.remove('fa-eye');
        this.classList.add('fa-eye-slash');
      } else {
        passwordInput.type = 'password';
        this.classList.remove('fa-eye-slash');
        this.classList.add('fa-eye');
      }
    }
  });
});

// Register button in header opens popup
const headerRegisterBtn = document.getElementById('register-btn-aa');
if (headerRegisterBtn) {
  headerRegisterBtn.addEventListener('click', toggleRegisterPopup);
}

function toggleRegisterPopup(e) {
  e.preventDefault();
  const registerPopup = document.getElementById('register-popup');
  const loginPopup = document.getElementById('login-popup');
  const backdrop = document.getElementById('auth-backdrop');
  
  if (loginPopup && loginPopup.style.display === 'flex') {
    loginPopup.style.display = 'none';
  }
  
  const isVisible = registerPopup.style.display === 'flex';
  registerPopup.style.display = isVisible ? 'none' : 'flex';
  
  // Show/hide backdrop
  if (backdrop) {
    if (isVisible) {
      backdrop.classList.remove('show');
    } else {
      backdrop.classList.add('show');
    }
  }
}

document.getElementById('register-close').onclick = closeRegisterPopup;
function closeRegisterPopup() {
  document.getElementById('register-popup').style.display = 'none';
  const backdrop = document.getElementById('auth-backdrop');
  if (backdrop) backdrop.classList.remove('show');
}

// Backdrop click handler - close popup when click outside
const authBackdrop = document.getElementById('auth-backdrop');
if (authBackdrop) {
  authBackdrop.addEventListener('click', () => {
    const loginPopup = document.getElementById('login-popup');
    const registerPopup = document.getElementById('register-popup');
    
    if (loginPopup && loginPopup.style.display === 'flex') {
      closeLoginPopup();
    }
    if (registerPopup && registerPopup.style.display === 'flex') {
      closeRegisterPopup();
    }
    // Partner popup removed - now using direct link
  });
}

// --- Scroll Effects ---
window.addEventListener('scroll', function () {
  const scrollTop = window.scrollY;
  const customHeight = 500;
  const percent = customHeight ? (scrollTop / customHeight) : 0;

  const minMargin = 0;
  const maxMargin = 32;

  const newMargin = maxMargin - (maxMargin - minMargin) * Math.min(percent, 1);

  document.querySelectorAll('.move-on-scroll').forEach(el => {
    el.style.marginBottom = `${newMargin}vh`;
  });
});

// let hasSnapped = false;
// let isProgrammaticScroll = false;
// window.addEventListener('scroll', function () {
//   if (isProgrammaticScroll) return;
//   const scrollTop = window.scrollY;
//   const moveEl = document.querySelector('.move-on-scroll');
//   const snapTarget = document.querySelector('.snap-target');
//   if (!moveEl || !snapTarget) return;

//   const moveRect = moveEl.getBoundingClientRect();
//   const moveHeight = moveRect.height;
//   const targetY = snapTarget.getBoundingClientRect().top + window.scrollY - moveHeight + 74;

//   if (scrollTop > 50 && !hasSnapped) {
//     isProgrammaticScroll = true;
//     window.scrollTo({ top: targetY, behavior: 'smooth' });
//     setTimeout(() => { isProgrammaticScroll = false; }, 500);
//     hasSnapped = true;
//   } else if (scrollTop < targetY && hasSnapped) {
//     isProgrammaticScroll = true;
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//     setTimeout(() => { isProgrammaticScroll = false; }, 500);
//     hasSnapped = false;
//   }
// });

document.querySelectorAll('.logo').forEach(logo => {
  logo.style.cursor = 'pointer';
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// Scroll to top when clicking on Trang chủ in nav
document.querySelectorAll('.nav-home').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    // Chỉ scroll về đầu trang nếu không có modal nào đang mở
    const hasOpenModal = document.querySelector('.modal[style*="display: flex"]') || 
                        document.querySelector('.info-modal.active');
    if (!hasOpenModal) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
});

// --- Profile Popup Controls ---
const profileBtn = document.getElementById('profile-btn');
const profilePopup = document.getElementById('profile-popup');
const logoutBtn = document.getElementById('logout-btn');

if (profileBtn && profilePopup) {
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profilePopup.style.display = profilePopup.style.display === 'block' ? 'none' : 'block';
  });
  
  // Close popup when clicking outside
  document.addEventListener('click', (e) => {
    if (!profilePopup.contains(e.target) && e.target !== profileBtn) {
      profilePopup.style.display = 'none';
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

// --- Favorites Dropdown Controls ---
const favoritesBtn = document.getElementById('favorites-btn');
const favoritesDropdown = document.getElementById('favorites-dropdown');

if (favoritesBtn && favoritesDropdown) {
  favoritesBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if user is logged in
    if (!authToken) {
      showLoginRequired('Đăng nhập để xem danh sách yêu thích');
      return;
    }
    
    // Toggle dropdown with smooth animation
    const isVisible = favoritesDropdown.classList.contains('show');
    if (isVisible) {
      favoritesDropdown.classList.remove('show');
    } else {
      favoritesDropdown.classList.add('show');
    }
    
    // Close profile popup if open
    const profilePopup = document.getElementById('profile-popup');
    if (profilePopup) {
      profilePopup.style.display = 'none';
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!favoritesDropdown.contains(e.target) && e.target !== favoritesBtn && !e.target.closest('.favorites-container')) {
      favoritesDropdown.classList.remove('show');
    }
  });
}

// --- URL Routing for Property Links ---
// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
  if (event.state && event.state.propertyId) {
    // User navigated to a property URL
    const item = propertyData.find(p => p.id === event.state.propertyId);
    if (item) {
      openPropertyModal(item);
    }
  } else {
    // User navigated back to home
    closeModal();
  }
});

// Handle direct URL access (when page loads with property URL)
window.addEventListener('DOMContentLoaded', function() {
  // Check for query parameter ?room=xxx
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('room');
  
  if (propertyId) {
    // Wait for propertyData to load, then open modal
    const checkData = setInterval(() => {
      if (propertyData && propertyData.length > 0) {
        clearInterval(checkData);
        const item = propertyData.find(p => p.id === propertyId);
        if (item) {
          openPropertyModal(item);
        } else {
          // Property not found, remove query parameter
          const baseUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, '', baseUrl);
        }
      }
    }, 100);
  }
  
  // Setup nav menu items for info modals
  const navAbout = document.querySelector('.nav-about');
  const navContact = document.querySelector('.nav-contact');
  
  if (navAbout) {
    navAbout.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openAboutModal();
    });
  }
  
  if (navContact) {
    navContact.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openContactModal();
    });
  }
  
  // Close modals when clicking outside
  const aboutModal = document.getElementById('about-modal');
  const searchHistoryModal = document.getElementById('search-history-modal');
  const contactModal = document.getElementById('contact-modal');
  const bookingModal = document.getElementById('booking-modal');
  
  if (aboutModal) {
    aboutModal.addEventListener('click', (e) => {
      if (e.target === aboutModal) {
        closeAboutModal();
      }
    });
  }
  
  if (searchHistoryModal) {
    searchHistoryModal.addEventListener('click', (e) => {
      if (e.target === searchHistoryModal) {
        closeSearchHistoryModal();
      }
    });
  }
  
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) {
        closeContactModal();
      }
    });
  }
  
  if (bookingModal) {
    bookingModal.addEventListener('click', (e) => {
      if (e.target === bookingModal) {
        closeBookingModal();
      }
    });
  }
  
  // Handle footer links - also prevent default scrolling
  document.querySelectorAll('.footer-link').forEach(link => {
    const linkText = link.textContent.trim();
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (linkText === 'Liên hệ') {
        openContactModal();
      } else if (linkText === 'Trang chủ') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
});

const chatButton = document.getElementById('chatButton');
const chatBox = document.getElementById('chatBox');
const closeChat = document.getElementById('closeChat');

// Mở chatbox
chatButton.addEventListener('click', () => {
  chatBox.style.display = 'flex';
  chatButton.style.display = 'none';
});

// Đóng chat khi nhấn nút X
closeChat.addEventListener('click', () => {
  chatBox.style.display = 'none';
  chatButton.style.display = 'flex';
});

// Đóng chat khi click ra ngoài khung chat
document.addEventListener('click', (event) => {
  const isClickInsideChat = chatBox.contains(event.target);
  const isClickChatButton = chatButton.contains(event.target);

  // Nếu chat đang mở, và click không nằm trong chatBox hoặc nút chatButton
  if (chatBox.style.display === 'flex' && !isClickInsideChat && !isClickChatButton) {
    chatBox.style.display = 'none';
    chatButton.style.display = 'flex';
  }
});

// ==================== Visitor Counter (Realtime) ====================
let visitorSessionId = null;

// Generate unique session ID
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get or create session ID
function getSessionId() {
  if (!visitorSessionId) {
    visitorSessionId = sessionStorage.getItem('visitorSessionId');
    if (!visitorSessionId) {
      visitorSessionId = generateSessionId();
      sessionStorage.setItem('visitorSessionId', visitorSessionId);
    }
  }
  return visitorSessionId;
}

// Update visitor stats
async function updateVisitorStats() {
  const onlineCount = document.getElementById('online-count');
  const totalVisits = document.getElementById('total-visits');
  
  try {
    const sessionId = getSessionId();
    const response = await fetch(`${API_BASE_URL}/visitor/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Add 360,000 to both stats
      const BONUS_COUNT = 360000;
      
      if (onlineCount) onlineCount.textContent = ((data.online || 0) + BONUS_COUNT).toLocaleString('vi-VN');
      if (totalVisits) totalVisits.textContent = ((data.total || 0) + BONUS_COUNT).toLocaleString('vi-VN');
    } else {
      // Fallback: Use simulated stats if API fails
      useSimulatedStats(onlineCount, totalVisits);
    }
  } catch (error) {
    console.error('Error updating visitor stats:', error);
    // Fallback: Use simulated stats if API fails
    useSimulatedStats(onlineCount, totalVisits);
  }
}

// Simulated stats for demo (when backend is not available)
function useSimulatedStats(onlineCount, totalVisits) {
  // Base numbers
  const baseOnline = 360015;
  const baseTotal = 360247;
  
  // Random variations
  const onlineVariation = Math.floor(Math.random() * 20) - 5; // -5 to +15
  const totalIncrement = Math.floor(Math.random() * 3); // 0 to 2
  
  // Get or initialize stats from localStorage
  let currentOnline = parseInt(localStorage.getItem('demo_online') || baseOnline);
  let currentTotal = parseInt(localStorage.getItem('demo_total') || baseTotal);
  
  // Update with variation
  currentOnline = Math.max(baseOnline - 10, Math.min(baseOnline + 30, currentOnline + onlineVariation));
  currentTotal += totalIncrement;
  
  // Save to localStorage
  localStorage.setItem('demo_online', currentOnline);
  localStorage.setItem('demo_total', currentTotal);
  
  // Update display
  if (onlineCount) onlineCount.textContent = currentOnline.toLocaleString('vi-VN');
  if (totalVisits) totalVisits.textContent = currentTotal.toLocaleString('vi-VN');
}

// Load visitor stats on page load
updateVisitorStats();

// Update every 10 seconds
setInterval(updateVisitorStats, 10000);

// Send disconnect signal when page unloads
window.addEventListener('beforeunload', () => {
  if (visitorSessionId) {
    navigator.sendBeacon(`${API_BASE_URL}/visitor/disconnect`, 
      JSON.stringify({ sessionId: visitorSessionId }));
  }
});

// ==================== View History (LocalStorage) - Lưu phòng đã xem ====================
const VIEW_HISTORY_KEY = 'hola_view_history';
const MAX_HISTORY_ITEMS = 10;

// Get view history from localStorage
function getViewHistory() {
  try {
    const history = localStorage.getItem(VIEW_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (e) {
    return [];
  }
}

// Save view history to localStorage
function saveViewHistory(history) {
  try {
    localStorage.setItem(VIEW_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save view history:', e);
  }
}

// Add property to view history
function addToViewHistory(property) {
  if (!property || !property.id) return;
  
  let history = getViewHistory();
  
  // Remove if already exists (check by id)
  history = history.filter(item => item.id !== property.id);
  
  // Add to beginning with timestamp
  history.unshift({
    id: property.id,
    title: property.title || 'Phòng trọ',
    address: property.address ? property.address.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '',
    price: property.price || '',
    img: Array.isArray(property.img) ? property.img[0] : property.img,
    timestamp: Date.now()
  });
  
  // Keep only MAX_HISTORY_ITEMS
  if (history.length > MAX_HISTORY_ITEMS) {
    history = history.slice(0, MAX_HISTORY_ITEMS);
  }
  
  saveViewHistory(history);
}

// Remove item from view history
function removeFromViewHistory(propertyId) {
  let history = getViewHistory();
  history = history.filter(item => item.id !== propertyId);
  saveViewHistory(history);
  renderViewHistory();
}

// Clear all view history
function clearViewHistory() {
  saveViewHistory([]);
  renderViewHistory();
}

// Render view history dropdown
function renderViewHistory() {
  const dropdown = document.getElementById('search-history-dropdown');
  if (!dropdown) return;
  
  const history = getViewHistory();
  
  if (history.length === 0) {
    dropdown.innerHTML = `
      <div class="search-history-empty">
        <i class="fas fa-history"></i>
        <div>Chưa có phòng đã xem</div>
      </div>
    `;
    return;
  }
  
  const itemsHtml = history.map(item => {
    const imgSrc = item.img || 'images/default.jpg';
    return `
      <div class="search-history-item" data-id="${item.id}">
        <div class="search-history-item-img">
          <img src="${imgSrc}" alt="${item.title}">
        </div>
        <div class="search-history-item-content">
          <div class="search-history-item-title">${item.title}</div>
          <div class="search-history-item-price">${item.price}</div>
          <div class="search-history-item-time">${formatSearchTime(item.timestamp)}</div>
        </div>
        <button class="search-history-item-delete" data-id="${item.id}">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }).join('');
  
  dropdown.innerHTML = `
    <div class="search-history-header">
      <div class="search-history-title">
        <i class="fas fa-clock-rotate-left"></i>
        <span>Phòng đã xem</span>
      </div>
      <button class="search-history-clear">Xóa tất cả</button>
    </div>
    <div class="search-history-items">
      ${itemsHtml}
    </div>
  `;
  
  // Add event listeners
  dropdown.querySelector('.search-history-clear').addEventListener('click', (e) => {
    e.stopPropagation();
    clearViewHistory();
  });
  
  dropdown.querySelectorAll('.search-history-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.search-history-item-delete')) return;
      const propertyId = item.dataset.id;
      const property = propertyData.find(p => p.id === propertyId);
      if (property) {
        hideSearchHistory();
        openPropertyModal(property);
      }
    });
  });
  
  dropdown.querySelectorAll('.search-history-item-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const propertyId = btn.dataset.id;
      removeFromViewHistory(propertyId);
    });
  });
}

// Show view history dropdown
function showSearchHistory() {
  const dropdown = document.getElementById('search-history-dropdown');
  if (dropdown) {
    renderViewHistory();
    dropdown.classList.add('show');
  }
}

// Hide view history dropdown
function hideSearchHistory() {
  const dropdown = document.getElementById('search-history-dropdown');
  if (dropdown) {
    dropdown.classList.remove('show');
  }
}

// Initialize view history - show recent viewed properties
const searchInput = document.getElementById('search-input');
if (searchInput) {
  // Show history on focus
  searchInput.addEventListener('focus', () => {
    showSearchHistory();
  });
}

// Hide dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('search-history-dropdown');
  const searchInput = document.getElementById('search-input');
  
  if (dropdown && searchInput) {
    if (!dropdown.contains(e.target) && e.target !== searchInput) {
      hideSearchHistory();
    }
  }
});

// ===== Mobile Sidebar Menu =====
function initMobileSidebar() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileSidebar = document.getElementById('mobile-sidebar');
  const sidebarOverlay = document.getElementById('mobile-sidebar-overlay');
  const sidebarClose = document.getElementById('mobile-sidebar-close');

  function openSidebar() {
    mobileSidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    hamburgerBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    mobileSidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    hamburgerBtn.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Hamburger button click
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      if (mobileSidebar.classList.contains('active')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  // Close button click
  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
  }

  // Overlay click
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  // Connect mobile menu items to existing functions
  const mobileLoginBtn = document.getElementById('mobile-login-btn');
  const mobileRegisterBtn = document.getElementById('mobile-register-btn');
  const mobilePartnerBtn = document.getElementById('mobile-partner-btn');
  const mobileFavoritesBtn = document.getElementById('mobile-favorites-btn');
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  const mobileSettingsBtn = document.getElementById('mobile-settings-btn');

  if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeSidebar();
      setTimeout(() => document.getElementById('login-btn-aa')?.click(), 300);
    });
  }

  if (mobileRegisterBtn) {
    mobileRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeSidebar();
      setTimeout(() => document.getElementById('register-btn-aa')?.click(), 300);
    });
  }

  // Mobile partner button now opens direct link - no preventDefault needed

  if (mobileFavoritesBtn) {
    mobileFavoritesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeSidebar();
      setTimeout(() => document.getElementById('favorites-btn')?.click(), 300);
    });
  }

  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeSidebar();
      setTimeout(() => document.getElementById('logout-btn')?.click(), 300);
    });
  }

  if (mobileSettingsBtn) {
    mobileSettingsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeSidebar();
      setTimeout(() => document.getElementById('settings-btn')?.click(), 300);
    });
  }

  // Nav items
  const navHomeLinks = document.querySelectorAll('.mobile-sidebar .nav-home');
  const navAboutLinks = document.querySelectorAll('.mobile-sidebar .nav-about');
  const navContactLinks = document.querySelectorAll('.mobile-sidebar .nav-contact');

  navHomeLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeSidebar();
      setTimeout(() => document.querySelector('.nav-home')?.click(), 300);
    });
  });

  navAboutLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeSidebar();
      setTimeout(() => document.querySelector('.nav-about')?.click(), 300);
    });
  });

  navContactLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeSidebar();
      setTimeout(() => document.querySelector('.nav-contact')?.click(), 300);
    });
  });

  // Update mobile sidebar when user logs in/out
  updateMobileSidebarAuth();
}

function updateMobileSidebarAuth() {
  const mobileLoginBtn = document.getElementById('mobile-login-btn');
  const mobileRegisterBtn = document.getElementById('mobile-register-btn');
  const mobileProfileSection = document.querySelector('.mobile-profile-section');

  if (currentUser) {
    // User is logged in
    if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
    if (mobileRegisterBtn) mobileRegisterBtn.style.display = 'none';
    if (mobileProfileSection) mobileProfileSection.style.display = 'block';
  } else {
    // User is logged out
    if (mobileLoginBtn) mobileLoginBtn.style.display = 'flex';
    if (mobileRegisterBtn) mobileRegisterBtn.style.display = 'flex';
    if (mobileProfileSection) mobileProfileSection.style.display = 'none';
  }
}

// Initialize mobile sidebar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileSidebar);
} else {
  initMobileSidebar();
}
