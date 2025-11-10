// API Configuration: use same origin to avoid localhost/IP mismatch
const API_BASE_URL = `${window.location.origin}/api`;

// Auth state
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Check if user is logged in on page load
if (authToken) {
  currentUser = JSON.parse(localStorage.getItem('currentUser'));
  updateUIForLoggedInUser();
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
  }
}

function logout() {
  // Clear localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  authToken = null;
  currentUser = null;
  
  // Reset UI
  const loginBtn = document.getElementById('login-btn-aa');
  const registerBtn = document.getElementById('register-btn-aa');
  const profileContainer = document.querySelector('.profile-container');
  const profilePopup = document.getElementById('profile-popup');
  
  if (loginBtn) loginBtn.style.display = '';
  if (registerBtn) registerBtn.style.display = '';
  if (profileContainer) profileContainer.style.display = 'none';
  if (profilePopup) profilePopup.style.display = 'none';
  
  alert('Đã đăng xuất thành công!');
  // Optionally redirect to home
  if (window.location.pathname.includes('account')) {
    window.location.href = '../index.html';
  } else {
    window.location.reload();
  }
}

// Login form submission
document.querySelector('#login-popup form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password })
    });

    const data = await response.json();
    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      updateUIForLoggedInUser();
      closeLoginPopup();
      alert('Đăng nhập thành công!');
    } else {
      alert(data.error || 'Đăng nhập thất bại');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Có lỗi xảy ra khi đăng nhập');
  }
});

// Register form submission
document.querySelector('#register-popup form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('register-email').value;
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  const password2 = document.getElementById('register-password2').value;

  if (password !== password2) {
    alert('Mật khẩu không khớp');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, account_type: 'user' })
    });

    const data = await response.json();
    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      updateUIForLoggedInUser();
      closeRegisterPopup();
      alert('Đăng ký thành công!');
    } else {
      alert(data.error || 'Đăng ký thất bại');
    }
  } catch (error) {
    console.error('Register error:', error);
    alert('Có lỗi xảy ra khi đăng ký');
  }
});

  // Partner button opens disabled popup
  const partnerBtn = document.getElementById('partner-btn');
  const partnerPopup = document.getElementById('partner-popup');
  const partnerClose = document.getElementById('partner-close');
  if (partnerBtn && partnerPopup) {
    partnerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      partnerPopup.style.display = 'flex';
      document.getElementById('register-popup').style.display = 'none';
      document.getElementById('login-popup').style.display = 'none';
    });
  }
  if (partnerClose && partnerPopup) {
    partnerClose.addEventListener('click', () => {
      partnerPopup.style.display = 'none';
    });
  }
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
    card.addEventListener("click", async () => {
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
}

// Open property modal with data
async function openPropertyModal(item) {
  const modal = document.getElementById("propertyModal");
  const modalImg = document.getElementById("modal-img");
  const modalThumbnails = document.getElementById("modal-thumbnails");
  const modalTitle = document.getElementById("modal-title");
  const modalAddress = document.getElementById("modal-address");
  const modalPrice = document.getElementById("modal-price");
  const modalDesc = document.getElementById("modal-description");
  
  let images = [];
  if (Array.isArray(item.img)) images = item.img;
  else if (item.img) images = [item.img];
  else images = [];

  modalImg.src = images[0] || "";
  modalImg.alt = item.title;
  modalTitle.innerHTML = item.title;
  modalAddress.innerHTML = item.address;
  modalPrice.innerHTML = item.price;

  // Load description
  if (item.description && typeof item.description === 'string' && (item.description.endsWith('.txt') || item.description.endsWith('.html'))) {
    fetch(item.description)
      .then(res => res.text())
      .then(text => {
        modalDesc.innerHTML = text;
      })
      .catch(() => {
        modalDesc.innerText = "Không thể tải mô tả.";
      });
  } else {
    modalDesc.innerHTML = item.description ? item.description : "Không có mô tả";
  }

  // Thumbnails
  modalThumbnails.innerHTML = "";
  images.forEach((src, idx) => {
    const thumb = document.createElement("img");
    thumb.src = src;
    thumb.className = idx === 0 ? "active" : "";
    thumb.onclick = () => {
      modalImg.src = src;
      modalThumbnails.querySelectorAll("img").forEach(i => i.classList.remove("active"));
      thumb.classList.add("active");
    };
    modalThumbnails.appendChild(thumb);
  });

  // Load ratings and comments from backend
  await loadRatingsAndComments(item.id);
  
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("propertyModal");
  modal.style.display = "none";
  document.body.style.overflow = "";
  
  // Remove query parameter and return to clean URL
  const baseUrl = window.location.origin + window.location.pathname;
  window.history.pushState({}, '', baseUrl);
}

// --- Ratings & Comments Integration ---
async function loadRatingsAndComments(propertyId) {
  const starsEl = document.querySelector('.modal-rating-stars');
  const textEl = document.querySelector('.modal-rating-text');
  const commentSubmit = document.getElementById('modal-comment-submit');
  const commentInput = document.getElementById('modal-comment-input');
  const commentList = document.getElementById('modal-comment-list');

  const texts = ["Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"];
  let selectedStar = 0;
  let hoverStar = 0;

  // Render stars
  starsEl.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    star.innerHTML = '&#9733;';
    star.dataset.value = i;

    star.onmouseenter = () => {
      hoverStar = i;
      renderStars();
    };
    star.onmouseleave = () => {
      hoverStar = 0;
      renderStars();
    };
    star.onclick = async () => {
      if (!authToken) {
        alert('Vui lòng đăng nhập để đánh giá');
        return;
      }
      selectedStar = i;
      await saveRating(propertyId, i);
      renderStars();
    };

    starsEl.appendChild(star);
  }

  function renderStars() {
    for (let i = 0; i < 5; i++) {
      const star = starsEl.children[i];
      star.classList.remove('active', 'selected', 'hovered');
      if (hoverStar) {
        if (i < hoverStar) star.classList.add('hovered');
      } else if (selectedStar) {
        if (i < selectedStar) star.classList.add('selected');
      }
    }
    let idx = (hoverStar || selectedStar) - 1;
    textEl.textContent = idx >= 0 ? texts[idx] : "";
  }

  renderStars();

  // Load comments
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${propertyId}`);
    if (response.ok) {
      const comments = await response.json();
      renderComments(comments);
    }
  } catch (error) {
    console.error('Error loading comments:', error);
  }

  // Comment submit
  commentSubmit.onclick = async () => {
    if (!authToken) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }

    const txt = commentInput.value.trim();
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
        commentInput.value = '';
        const commentsResponse = await fetch(`${API_BASE_URL}/comments/${propertyId}`);
        const comments = await commentsResponse.json();
        renderComments(comments);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Có lỗi xảy ra khi gửi bình luận');
    }
  };

  function renderComments(comments) {
    commentList.innerHTML = comments.map(com => `
      <div class="comment-item">
        <strong>${com.username}</strong>
        ${com.rating > 0 ? `<span class="comment-stars">${'★'.repeat(com.rating)}${'☆'.repeat(5 - com.rating)}</span>` : ''}
        <p>${com.text}</p>
        <span style="color:#aaa; font-size:0.85em;">${new Date(com.created_at).toLocaleString('vi')}</span>
      </div>
    `).join('');
  }
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
  if (registerPopup && registerPopup.style.display === 'flex') {
    registerPopup.style.display = 'none';
  }
  loginPopup.style.display = (loginPopup.style.display === 'flex') ? 'none' : 'flex';
}

document.querySelector('.login-close').onclick = closeLoginPopup;
function closeLoginPopup() {
  document.getElementById('login-popup').style.display = 'none';
}

// Register button in header opens popup
const headerRegisterBtn = document.getElementById('register-btn-aa');
if (headerRegisterBtn) {
  headerRegisterBtn.addEventListener('click', toggleRegisterPopup);
}

function toggleRegisterPopup(e) {
  e.preventDefault();
  const registerPopup = document.getElementById('register-popup');
  const loginPopup = document.getElementById('login-popup');
  if (loginPopup && loginPopup.style.display === 'flex') {
    loginPopup.style.display = 'none';
  }
  registerPopup.style.display = (registerPopup.style.display === 'flex') ? 'none' : 'flex';
}

document.getElementById('register-close').onclick = closeRegisterPopup;
function closeRegisterPopup() {
  document.getElementById('register-popup').style.display = 'none';
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

// Scroll to bottom when clicking on Liên hệ in nav
document.querySelectorAll('.nav-contact').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const bottom = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    window.scrollTo({ top: bottom, behavior: 'smooth' });
  });
});

// Scroll to top when clicking on Trang chủ in nav
document.querySelectorAll('.nav-home').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
