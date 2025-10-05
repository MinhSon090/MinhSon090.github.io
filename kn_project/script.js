// --- Search & Sort ---
document.querySelector(".btn-search").addEventListener("click", () => {
  const loaiHinh = document.getElementById("filter-type").value.trim();
  const khuVuc   = document.getElementById("filter-area").value.trim();
  const keyword  = document.querySelector(".search-box input").value.trim().toLowerCase();
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
        if (item.description && typeof item.description === 'string' && item.description.endsWith('.txt')) {
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
}


// Mở popup khi click nút đăng nhập
document.querySelectorAll('a,button').forEach(el => {
  if(el.textContent.trim().toLowerCase().includes('đăng nhập')) {
    el.addEventListener('click', showLoginPopup);
  }
});
function showLoginPopup(e) {
  e.preventDefault();
  document.getElementById('login-popup').style.display = 'flex';
}
document.querySelector('.login-close').onclick = closeLoginPopup;
function closeLoginPopup() {
  document.getElementById('login-popup').style.display = 'none';
}

// move-on-scroll
window.addEventListener('scroll', function() {
  const scrollTop = window.scrollY;
  const customHeight = 500; // <-- Điền số thủ công (px) ở đây
  const percent = customHeight ? (scrollTop / customHeight) : 0; // từ 0 đến 1

  const minMargin = 0;   // vh nhỏ nhất khi scroll hết
  const maxMargin = 22;  // vh lớn nhất khi ở đầu trang

  const newMargin = maxMargin - (maxMargin - minMargin) * Math.min(percent, 1); // tránh vượt quá

  document.querySelectorAll('.move-on-scroll').forEach(el => {
    el.style.marginTop = `${newMargin}vh`;
    el.style.marginBottom = `${newMargin}vh`;
  });
});

// snap to snap-target at first scroll and snap back to top when scroll back to top
let hasSnapped = false;
let isProgrammaticScroll = false;
window.addEventListener('scroll', function() {
  if (isProgrammaticScroll) return;
  const scrollTop = window.scrollY;
  const moveEl = document.querySelector('.move-on-scroll');
  const snapTarget = document.querySelector('.snap-target');
  if (!moveEl || !snapTarget) return;

  // Tính vị trí snap: snap-target cao hơn moveEl 90% chiều cao của moveEl
  const moveRect = moveEl.getBoundingClientRect();
  const moveHeight = moveRect.height;
  const targetY = snapTarget.getBoundingClientRect().top + window.scrollY - moveHeight + 160;

  if (scrollTop > 50 && !hasSnapped) {
    isProgrammaticScroll = true;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
    setTimeout(() => { isProgrammaticScroll = false; }, 500);
    hasSnapped = true;
  } else if (scrollTop < targetY && hasSnapped) {
    isProgrammaticScroll = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { isProgrammaticScroll = false; }, 500);
    hasSnapped = false;
  }
});
// Thêm class "move-on-scroll" vào phần tử cần hiệu ứng
