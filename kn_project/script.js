// --- Search & Sort ---
document.querySelector(".btn-search").addEventListener("click", () => {
  const loaiHinh = document.getElementById("filter-type").value.trim();
  const khuVuc = document.getElementById("filter-area").value.trim();
  const keyword = document.querySelector(".search-box input").value.trim().toLowerCase();
  const sapXepGia = document.querySelector("#sapXepGia").value;

  let cards = Array.from(document.querySelectorAll(".ct > div"));

  // Lọc cards
  cards.forEach(card => {
    const title = card.querySelector("h3").innerText.toLowerCase();
    const address = card.querySelector("p").innerText.toLowerCase();
    let show = true;

    // Nếu khuVuc là "Tất cả" hoặc "" hoặc "none" thì không lọc theo khu vực
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
    // Gom nhóm cards theo loại như trong data.json
    let groups = {};
    propertyData.forEach(item => {
      if (!groups[item.loai]) groups[item.loai] = [];
      let card = cards.find(c => c.id === item.id && c.style.display === "block");
      if (card) groups[item.loai].push(card);
    });
    // Duyệt theo thứ tự loại xuất hiện trong data.json
    Object.keys(groups).forEach(loai => {
      groups[loai].forEach(card => container.appendChild(card));
    });
  }
});

// Nút Xóa: reset input & hiện lại tất cả
document.querySelector(".btn-clear").addEventListener("click", () => {
  document.querySelectorAll(".search-box input").forEach(input => input.value = "");
  document.querySelectorAll(".search-box select").forEach(select => select.selectedIndex = 0);
  document.querySelectorAll(".ct > div").forEach(card => card.style.display = "block");
  // Đưa lại thứ tự card theo data.json
  const container = document.querySelector(".ct");
  propertyData.forEach(item => {
    const card = document.getElementById(item.id);
    if (card) container.appendChild(card);
  });
});

// Hàm lấy số từ chuỗi "Giá: xxx VND/tháng"
function getPriceNumber(card) {
  const priceText = card.querySelector("p.price")?.innerText || card.querySelector("p:nth-of-type(2)")?.innerText || "";
  // Tìm dải giá, ví dụ: "900,000 - 1,200,000"
  const rangeMatch = priceText.match(/([\d,.]+)\s*-\s*([\d,.]+)/);
  if (rangeMatch) {
    const num1 = parseInt(rangeMatch[1].replace(/[^0-9]/g, ""), 10) || 0;
    const num2 = parseInt(rangeMatch[2].replace(/[^0-9]/g, ""), 10) || 0;
    return Math.round((num1 + num2) / 2);
  }
  // Nếu chỉ có 1 giá
  let num = priceText.replace(/[^0-9]/g, "");
  return parseInt(num, 10) || 0;
}





// Content for popup modal
// Load card metadata from JSON
let propertyData = [];

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    propertyData = data;
    const container = document.querySelector(".ct");
    container.innerHTML = ""; // clear cứng nếu có

    data.forEach(item => {
      const card = document.createElement("div");
      card.className = item.loai === "Nhà trọ" ? "property-card-ntro" : "property-card-ktx";
      card.id = item.id;
      // Ảnh đại diện là ảnh đầu tiên, nếu img là mảng thì lấy phần tử đầu
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
    card.addEventListener("click", () => {
      const item = propertyData.find(p => p.id === card.id);
      if (item) {
        // Chuẩn hóa mảng ảnh
        let images = [];
        if (Array.isArray(item.img)) images = item.img;
        else if (item.img) images = [item.img];
        else images = [];

        let currentIndex = 0;
        modalImg.src = images[0] || "";
        modalImg.alt = item.title;

        modalTitle.innerHTML = item.title;
        modalAddress.innerHTML = item.address;
        modalPrice.innerHTML = item.price;

        // --- Xử lý description (nếu là txt thì fetch, nếu là html thì render luôn) ---
        // Nếu là đường dẫn txt, fetch nội dung và render
        if (item.description && typeof item.description === 'string' && (item.description.endsWith('.txt') || item.description.endsWith('.html'))) {
          fetch(item.description)
            .then(res => res.text())
            .then(text => {
              modalDesc.innerHTML = text; // cho phép render HTML từ file txt
            })
            .catch(() => {
              modalDesc.innerText = "Không thể tải mô tả.";
            });
        } else {
          // Nếu là html hoặc text thì render bằng innerHTML
          modalDesc.innerHTML = item.description ? item.description : "Không có mô tả";
        }

        // Hiển thị thumbnail
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

        // Gọi hàm attachRatingStars khi mở modal cho card này
        attachRatingStars(card.id);
      }
      modal.style.display = "block";
      document.body.style.overflow = "hidden";
    });
  });

  closeBtn.onclick = () => closeModal();
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
  // Xử lý đánh giá & nhận xét
  function attachRatingAndComment(cardId) {
    const starsEl = document.querySelector('.modal-rating .stars');
    const commentInput = document.getElementById('modal-comment-input');
    const commentSubmit = document.getElementById('modal-comment-submit');
    const commentList = document.getElementById('modal-comment-list');

    let selectedStar = 0;
    let hoverStar = 0;

    // Simple local store (session only, can replace with localStorage if needed)
    window._modalComments = window._modalComments || {};
    window._modalRatings = window._modalRatings || {};

    // Render stars
    starsEl.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.className = 'star';
      star.innerHTML = '&#9733;'; // unicode ⭐
      star.dataset.value = i;

      // Hover effect
      star.onmouseenter = () => {
        hoverStar = i;
        renderStars();
      };
      star.onmouseleave = () => {
        hoverStar = 0;
        renderStars();
      };
      // Click chọn số sao
      star.onclick = () => {
        selectedStar = i;
        window._modalRatings[cardId] = i;
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
    }
    // Hiển thị số sao đã chọn (nếu có)
    selectedStar = window._modalRatings[cardId] || 0;
    renderStars();

    // Comment submit
    commentSubmit.onclick = () => {
      const txt = commentInput.value.trim();
      if (!txt) return;
      window._modalComments[cardId] = window._modalComments[cardId] || [];
      window._modalComments[cardId].push({
        text: txt,
        star: selectedStar || 0,
        time: new Date().toLocaleString('vi')
      });
      commentInput.value = '';
      renderComments();
    };

    function renderComments() {
      const items = window._modalComments[cardId] || [];
      commentList.innerHTML = items.map(com => `
      <div class="comment-item">
        <span class="comment-stars">${'★'.repeat(com.star)}${'☆'.repeat(5 - com.star)}</span>
        <span class="comment-text">${com.text}</span>
        <span style="float:right; color:#aaa; font-size:0.85em;">${com.time}</span>
      </div>
    `).join('');
    }
    renderComments();
  }
  function attachRatingStars(cardId) {
    const starsEl = document.querySelector('.modal-rating-stars');
    const textEl = document.querySelector('.modal-rating-text');

    const texts = ["Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"];
    let selectedStar = 0;
    let hoverStar = 0;

    window._modalRatings = window._modalRatings || {};

    // Render stars
    starsEl.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.className = 'star';
      star.innerHTML = '&#9733;'; // unicode star
      star.dataset.value = i;

      star.onmouseenter = () => {
        hoverStar = i;
        renderStars();
      };
      star.onmouseleave = () => {
        hoverStar = 0;
        renderStars();
      };
      star.onclick = () => {
        selectedStar = i;
        window._modalRatings[cardId] = i;
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
      // Text
      let idx = (hoverStar || selectedStar) - 1;
      textEl.textContent = idx >= 0 ? texts[idx] : "";
    }

    // Hiển thị số sao đã chọn (nếu có)
    selectedStar = window._modalRatings[cardId] || 0;
    renderStars();
  }
}


// Mở popup khi click nút đăng nhập
document.querySelectorAll('a,button').forEach(el => {
  if (el.textContent.trim().toLowerCase().includes('đăng nhập')) {
    el.addEventListener('click', toggleLoginPopup);
  }
});
function toggleLoginPopup(e) {
  e.preventDefault();
  const loginPopup = document.getElementById('login-popup');
  const registerPopup = document.getElementById('register-popup');
  // Ẩn popup đăng ký nếu đang mở
  if (registerPopup && registerPopup.style.display === 'flex') {
    registerPopup.style.display = 'none';
  }
  loginPopup.style.display = (loginPopup.style.display === 'flex') ? 'none' : 'flex';
}
document.querySelector('.login-close').onclick = closeLoginPopup;
function closeLoginPopup() {
  document.getElementById('login-popup').style.display = 'none';
}

// Mở popup đăng ký khi click nút đăng ký
document.querySelectorAll('a,button').forEach(el => {
  if (el.textContent.trim().toLowerCase().includes('đăng ký')) {
    el.addEventListener('click', toggleRegisterPopup);
  }
});
function toggleRegisterPopup(e) {
  e.preventDefault();
  const registerPopup = document.getElementById('register-popup');
  const loginPopup = document.getElementById('login-popup');
  // Ẩn popup đăng nhập nếu đang mở
  if (loginPopup && loginPopup.style.display === 'flex') {
    loginPopup.style.display = 'none';
  }
  registerPopup.style.display = (registerPopup.style.display === 'flex') ? 'none' : 'flex';
}
document.getElementById('register-close').onclick = closeRegisterPopup;
function closeRegisterPopup() {
  document.getElementById('register-popup').style.display = 'none';
}


// move-on-scroll
window.addEventListener('scroll', function () {
  const scrollTop = window.scrollY;
  const customHeight = 500; // <-- Điền số thủ công (px) ở đây
  const percent = customHeight ? (scrollTop / customHeight) : 0; // từ 0 đến 1

  const minMargin = 0;   // vh nhỏ nhất khi scroll hết
  const maxMargin = 32;  // vh lớn nhất khi ở đầu trang

  const newMargin = maxMargin - (maxMargin - minMargin) * Math.min(percent, 1); // tránh vượt quá

  document.querySelectorAll('.move-on-scroll').forEach(el => {
    el.style.marginBottom = `${newMargin}vh`;
  });
});

// // snap to snap-target at first scroll and snap back to top when scroll back to top
// let hasSnapped = false;
// let isProgrammaticScroll = false;
// window.addEventListener('scroll', function () {
//   if (isProgrammaticScroll) return;
//   const scrollTop = window.scrollY;
//   const moveEl = document.querySelector('.move-on-scroll');
//   const snapTarget = document.querySelector('.snap-target');
//   if (!moveEl || !snapTarget) return;

//   // Tính vị trí snap: snap-target cao hơn moveEl 90% chiều cao của moveEl
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

// Nhấn vào .logo sẽ scroll về đầu trang
document.querySelectorAll('.logo').forEach(logo => {
  logo.style.cursor = 'pointer';
  logo.addEventListener('click', (e) => {
    e.preventDefault(); // nếu logo là link
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
