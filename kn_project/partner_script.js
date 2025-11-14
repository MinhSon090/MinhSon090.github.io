// Utility functions
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatCurrency(num) {
    return formatNumber(num) + 'đ';
}

// Show/Hide Success Modal
function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Navigation between sections
function switchSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));

    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Add active class to clicked nav item
    const targetNav = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetNav) {
        targetNav.classList.add('active');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Partner Login and Authentication
document.addEventListener('DOMContentLoaded', function() {
    const loginScreen = document.getElementById('partner-login-screen');
    const dashboard = document.getElementById('partner-dashboard');
    const loginForm = document.getElementById('partner-login-form');
    
    // Check if already logged in
    const isLoggedIn = localStorage.getItem('partnerLoggedIn') === 'true';
    
    if (isLoggedIn) {
        showDashboard();
        initializeDashboard();
    } else {
        showLoginScreen();
    }
    
    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('partner-username').value;
            const password = document.getElementById('partner-password').value;
            const btnLogin = this.querySelector('.btn-login-partner');
            
            // Disable button during login
            btnLogin.disabled = true;
            btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';
            
            try {
                // Call partner login API
                const response = await fetch('http://localhost:5500/api/partner/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: username,
                        password: password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Save login state
                    localStorage.setItem('partnerLoggedIn', 'true');
                    localStorage.setItem('partnerUsername', data.partner.username || data.partner.email);
                    localStorage.setItem('partnerToken', data.token);
                    localStorage.setItem('partnerId', data.partner.id);
                    
                    // Show success animation
                    btnLogin.innerHTML = '<i class="fas fa-check"></i> Đăng nhập thành công!';
                    btnLogin.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                    
                    // Redirect to dashboard after short delay
                    setTimeout(() => {
                        showDashboard();
                        initializeDashboard();
                    }, 800);
                } else {
                    // Show error
                    alert(data.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
                    btnLogin.disabled = false;
                    btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Đăng nhập';
                }
            } catch (error) {
                console.error('Login error:', error);
                
                // FALLBACK: Offline login for partner
                console.log('🔄 Backend unavailable, trying offline partner login...');
                
                const offlinePartners = {
                    'partner@example.com': { password: 'partner123', username: 'example_partner' },
                    'example_partner': { password: 'partner123', username: 'example_partner' }
                };
                
                const partner = offlinePartners[username];
                if (partner && partner.password === password) {
                    localStorage.setItem('partnerLoggedIn', 'true');
                    localStorage.setItem('partnerUsername', partner.username);
                    btnLogin.innerHTML = '<i class="fas fa-check"></i> Đăng nhập thành công!';
                    btnLogin.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                    
                    setTimeout(() => {
                        showDashboard();
                        initializeDashboard();
                    }, 800);
                } else {
                    alert('❌ Không thể kết nối server. Vui lòng dùng: partner@example.com / partner123');
                    btnLogin.disabled = false;
                    btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Đăng nhập';
                }
            }
        });
    }
    
    // Show register form - Link to Google Form
    const showRegisterBtn = document.getElementById('show-register');
    if (showRegisterBtn) {
        // Link already opens in new tab via target="_blank" in HTML
        // No need for additional click handler
    }
    
    function showLoginScreen() {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';
    }
    
    function showDashboard() {
        // Force hide login screen (commented in HTML)
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) {
            dashboard.style.display = 'block';
            dashboard.style.visibility = 'visible';
            dashboard.style.opacity = '1';
        }
        
        // Update username in header
        const username = localStorage.getItem('partnerUsername') || 'Demo Partner';
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = username;
        });
    }
});

// Initialize Dashboard Functions
function initializeDashboard() {
    // Notification bell toggle
    const notificationBell = document.getElementById('notification-bell');
    const notificationDropdown = document.getElementById('notification-dropdown');
    const notificationContainer = document.querySelector('.notification-container');
    
    if (notificationBell && notificationDropdown) {
        notificationBell.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle('show');
        });
        
        // Close notification dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (notificationContainer && !notificationContainer.contains(e.target)) {
                notificationDropdown.classList.remove('show');
            }
        });
    }
    
    // Add click event listeners to nav items
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchSection(section);
        });
    });

    // Logout functionality
    const logoutBtns = document.querySelectorAll('.nav-item.logout');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
                localStorage.removeItem('partnerLoggedIn');
                localStorage.removeItem('partnerUsername');
                location.reload();
            }
        });
    });

    // Image upload preview
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    
    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            imagePreview.innerHTML = '';
            const files = Array.from(e.target.files);
            
            files.forEach((file, index) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const imgContainer = document.createElement('div');
                        imgContainer.style.cssText = 'display: inline-block; position: relative; margin: 10px; width: 120px; height: 120px;';
                        
                        const img = document.createElement('img');
                        img.src = event.target.result;
                        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
                        
                        const removeBtn = document.createElement('button');
                        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                        removeBtn.style.cssText = 'position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 50%; background: #ef4444; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;';
                        removeBtn.onclick = function() {
                            imgContainer.remove();
                        };
                        
                        imgContainer.appendChild(img);
                        imgContainer.appendChild(removeBtn);
                        imagePreview.appendChild(imgContainer);
                    };
                    reader.readAsDataURL(file);
                }
            });
        });
    }

    // Click upload area to open file dialog
    const uploadArea = document.querySelector('.upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('click', function() {
            imageUpload.click();
        });
    }

    // Form submission
    const createPropertyForm = document.getElementById('createPropertyForm');
    if (createPropertyForm) {
        createPropertyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show success modal instead of alert
            showSuccessModal();
            
            // Reset form and preview
            createPropertyForm.reset();
            imagePreview.innerHTML = '';
        });
    }

    // Booking actions
    const approveButtons = document.querySelectorAll('.btn-approve');
    approveButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Xác nhận lịch hẹn này?')) {
                const bookingItem = this.closest('.booking-item, tr');
                bookingItem.classList.remove('pending');
                bookingItem.classList.add('confirmed');
                
                const actions = bookingItem.querySelector('.booking-actions');
                if (actions) {
                    actions.innerHTML = '<span class="status-badge confirmed">Đã xác nhận</span>';
                }
                
                alert('Đã xác nhận lịch hẹn! Email thông báo đã được gửi đến khách hàng.');
            }
        });
    });

    const rejectButtons = document.querySelectorAll('.btn-reject');
    rejectButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const reason = prompt('Lý do từ chối (tùy chọn):');
            if (reason !== null) {
                const bookingItem = this.closest('.booking-item, tr');
                bookingItem.style.opacity = '0.5';
                setTimeout(() => {
                    bookingItem.remove();
                    alert('Đã từ chối lịch hẹn. Khách hàng sẽ nhận được thông báo.');
                }, 300);
            }
        });
    });

    // Message button
    const messageButtons = document.querySelectorAll('.btn-icon.primary');
    messageButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Tính năng nhắn tin đang được phát triển!');
        });
    });

    // Promotion package selection
    const packageButtons = document.querySelectorAll('.btn-package');
    packageButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const packageCard = this.closest('.package-card');
            const packageName = packageCard.querySelector('h3').textContent;
            const packagePrice = packageCard.querySelector('.price').textContent;
            
            if (confirm(`Bạn muốn đăng ký ${packageName} với giá ${packagePrice}?`)) {
                alert('Chuyển đến trang thanh toán...\n(Chức năng thanh toán đang được phát triển)');
            }
        });
    });

    // Contract actions
    const viewButtons = document.querySelectorAll('.btn-view');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Mở chi tiết hợp đồng...\n(Giao diện xem hợp đồng đang được phát triển)');
        });
    });

    const downloadButtons = document.querySelectorAll('.btn-download');
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Đang tải xuống hợp đồng PDF...');
        });
    });

    const renewButtons = document.querySelectorAll('.btn-renew');
    renewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Bạn muốn gia hạn hợp đồng này thêm 12 tháng?')) {
                alert('Hợp đồng đã được gia hạn!\nHợp đồng mới sẽ được gửi qua email.');
            }
        });
    });

    // Property management actions
    const editButtons = document.querySelectorAll('.btn-edit');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Chuyển đến trang chỉnh sửa...');
            switchSection('create-post');
        });
    });

    const statsButtons = document.querySelectorAll('.btn-stats');
    statsButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Xem thống kê chi tiết...');
            switchSection('analytics');
        });
    });

    const promoteButtons = document.querySelectorAll('.btn-promote');
    promoteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            alert('Chọn gói quảng cáo...');
            switchSection('promotion');
        });
    });

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Date range buttons
    const dateButtons = document.querySelectorAll('.date-btn');
    dateButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            dateButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Settings form
    const settingsForms = document.querySelectorAll('.settings-form');
    settingsForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Cài đặt đã được cập nhật thành công!');
        });
    });

    // Notification settings
    const notificationCheckboxes = document.querySelectorAll('.notification-settings input[type="checkbox"]');
    notificationCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const settingName = this.closest('.setting-item').querySelector('strong').textContent;
            const status = this.checked ? 'bật' : 'tắt';
            console.log(`${settingName} đã được ${status}`);
        });
    });

    // Extend promotion
    const extendButtons = document.querySelectorAll('.btn-extend');
    extendButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Bạn muốn gia hạn chiến dịch này thêm 7 ngày?')) {
                alert('Chiến dịch đã được gia hạn!\nVui lòng thanh toán để kích hoạt.');
            }
        });
    });

    // User profile dropdown (placeholder)
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.addEventListener('click', function() {
            // Placeholder for profile menu
            console.log('Profile menu clicked');
        });
    }

    // Initialize with overview section active
    if (!document.querySelector('.content-section.active')) {
        switchSection('overview');
    }

    // Simple chart simulation (placeholder)
    setTimeout(() => {
        const charts = document.querySelectorAll('.analytics-chart canvas');
        charts.forEach(canvas => {
            if (canvas) {
                const ctx = canvas.getContext('2d');
                canvas.width = canvas.parentElement.offsetWidth;
                canvas.height = 200;
                
                // Draw simple placeholder
                ctx.fillStyle = '#667eea';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Biểu đồ thống kê', canvas.width / 2, canvas.height / 2);
                ctx.fillText('(Đang phát triển)', canvas.width / 2, canvas.height / 2 + 20);
            }
        });
    }, 500);
}
