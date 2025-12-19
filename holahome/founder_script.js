document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and load user info
    const founderToken = localStorage.getItem('founderToken');
    const founderUser = JSON.parse(localStorage.getItem('founderUser') || 'null');
    
    if (!founderToken || !founderUser) {
        window.location.href = 'founder_login.html';
        return;
    }

    // Display user information
    const headerUsername = document.getElementById('header-username');
    const headerRole = document.getElementById('header-role');
    
    if (headerUsername) {
        headerUsername.textContent = founderUser.name;
    }
    
    if (headerRole) {
        if (founderUser.role === 'developer') {
            headerRole.innerHTML = '<i class="fas fa-crown" style="color: #ffd700; margin-right: 5px;"></i>' + (founderUser.specialization || 'Developer');
        } else {
            headerRole.innerHTML = '<i class="fas fa-crown" style="color: #ffd700; margin-right: 5px;"></i>Founder';
        }
    }

    // Show Developer Tools for developers
    if (founderUser.role === 'developer') {
        const devMenuItems = document.querySelectorAll('.nav-item.developer-only');
        devMenuItems.forEach(item => {
            item.style.display = 'flex';
        });
        
        // Set Overview as active for all users (developers and founders)
        const overviewNav = document.querySelector('.nav-item[data-section="overview"]');
        const overviewSection = document.getElementById('overview-section');
        if (overviewNav && overviewSection) {
            overviewNav.classList.add('active');
            overviewSection.classList.add('active');
        }
    } else {
        // For founders, hide only developer-only items (settings, developer tools)
        const devMenuItems = document.querySelectorAll('.nav-item.developer-only');
        devMenuItems.forEach(item => {
            item.style.display = 'none';
        });
        
        // Set Overview as default active section for founders too
        const overviewNav = document.querySelector('.nav-item[data-section="overview"]');
        const overviewSection = document.getElementById('overview-section');
        
        if (overviewNav && overviewSection) {
            overviewNav.classList.add('active');
            overviewSection.classList.add('active');
        }
    }

    // Navigation
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => section.classList.remove('active'));
            
            // Show selected section
            const sectionId = this.getAttribute('data-section') + '-section';
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Load data when switching to approve-posts section
            const sectionName = this.getAttribute('data-section');
            if (sectionName === 'approve-posts') {
                loadPendingPosts();
            }
        });
    });

    // Logout functionality
    const logoutBtn = document.querySelector('.nav-item.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                localStorage.removeItem('founderToken');
                localStorage.removeItem('founderUser');
                window.location.href = 'index.html';
            }
        });
    }

    // Sample data and interactions
    initializeDashboard();
    
    // Load pending posts if on approve-posts section
    loadPendingPosts();
});

function initializeDashboard() {
    // Initialize charts (placeholder)
    console.log('Dashboard initialized');


    const btnIcons = document.querySelectorAll('.btn-icon');
    btnIcons.forEach(btn => {
        btn.addEventListener('click', function() {
            const title = this.getAttribute('title');
            alert(title);
        });
    });

    // Contract actions
    // const contractActions = document.querySelectorAll('.contract-actions button');
    // contractActions.forEach(btn => {
    //     btn.addEventListener('click', function() {
    //         const text = this.textContent.trim();
    //         alert(text);
    //     });
    // });
}

// Load pending posts from API
async function loadPendingPosts() {
    try {
        const response = await fetch('http://localhost:5000/api/posts?status=pending');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Pending posts response:', result);
        
        // Handle both array and object response
        let posts = [];
        if (Array.isArray(result)) {
            posts = result;
        } else if (result.success && result.posts) {
            posts = result.posts;
        } else if (result.posts) {
            posts = result.posts;
        }
        
        // Update badge
        const badge = document.getElementById('pending-posts-badge');
        if (badge) {
            if (posts.length > 0) {
                badge.textContent = posts.length;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
        
        // Update stats
        const pendingCountEl = document.getElementById('pendingPostsCount');
        if (pendingCountEl) {
            pendingCountEl.textContent = posts.length;
        }
        
        // Count approved/rejected today
        const today = new Date().toISOString().split('T')[0];
        const allResponse = await fetch('http://localhost:5000/api/posts?status=all');
        const allResult = await allResponse.json();
        
        let allPosts = [];
        if (Array.isArray(allResult)) {
            allPosts = allResult;
        } else if (allResult.success && allResult.posts) {
            allPosts = allResult.posts;
        } else if (allResult.posts) {
            allPosts = allResult.posts;
        }
        
        const approvedToday = allPosts.filter(p => 
            p.status === 'approved' && p.approved_at && p.approved_at.startsWith(today)
        ).length;
        const rejectedToday = allPosts.filter(p => 
            p.status === 'rejected' && p.approved_at && p.approved_at.startsWith(today)
        ).length;
        
        const approvedEl = document.getElementById('approvedTodayCount');
        const rejectedEl = document.getElementById('rejectedTodayCount');
        if (approvedEl) approvedEl.textContent = approvedToday;
        if (rejectedEl) rejectedEl.textContent = rejectedToday;
        
        // Render posts
        renderPendingPosts(posts);
        
    } catch (error) {
        console.error('Error loading pending posts:', error);
        const container = document.getElementById('pendingPostsContainer');
        if (container) {
            container.innerHTML = 
                `<p style="text-align: center; color: #ef4444; padding: 40px;">
                    ⚠️ Không thể tải danh sách tin đăng<br>
                    <small>Lỗi: ${error.message}</small><br>
                    <small>Vui lòng kiểm tra backend đang chạy tại http://localhost:5000</small>
                </p>`;
        }
    }
}

function renderPendingPosts(posts) {
    const container = document.getElementById('pendingPostsContainer');
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-check-circle" style="font-size: 64px; color: #10b981; margin-bottom: 20px;"></i>
                <h3 style="color: #1e293b; margin-bottom: 10px;">Không có tin đăng</h3>
                <p style="color: #64748b;">Tất cả tin đăng đã được xử lý</p>
            </div>
        `;
        return;
    }
    
    const html = posts.map(post => `
        <div class="card" style="margin-bottom: 25px;">
            <div style="display: flex; gap: 25px;">
                ${post.images && post.images.length > 0 ? `
                <div style="width: 250px; flex-shrink: 0;">
                    <img src="${post.images[0]}" alt="${post.title}" 
                         style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    ${post.images.length > 1 ? `
                    <div style="display: flex; gap: 5px; margin-top: 8px;">
                        ${post.images.slice(1, 4).map(img => `
                            <img src="${img}" alt="" style="width: calc(33.33% - 4px); height: 60px; object-fit: cover; border-radius: 6px;">
                        `).join('')}
                        ${post.images.length > 4 ? `<div style="width: calc(33.33% - 4px); height: 60px; background: rgba(0,0,0,0.6); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">+${post.images.length - 4}</div>` : ''}
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div>
                            <h3 style="margin-bottom: 8px; color: #1e293b;">${post.title}</h3>
                            <p style="color: #64748b; font-size: 14px;">
                                <i class="fas fa-user"></i> Partner #${post.partner_id} | 
                                <i class="fas fa-clock"></i> ${formatDate(post.created_at)}
                                ${post.images ? ` | <i class="fas fa-image"></i> ${post.images.length} ảnh` : ''}
                            </p>
                        </div>
                        <span class="status-badge pending">Chờ duyệt</span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                        <div>
                            <p style="color: #64748b; font-size: 13px; margin-bottom: 5px;">Loại hình</p>
                            <p style="font-weight: 600;">${post.type}</p>
                        </div>
                        <div>
                            <p style="color: #64748b; font-size: 13px; margin-bottom: 5px;">Giá thuê</p>
                            <p style="font-weight: 600; color: #667eea;">${formatPrice(post.price)}</p>
                        </div>
                        <div>
                            <p style="color: #64748b; font-size: 13px; margin-bottom: 5px;">Diện tích</p>
                            <p style="font-weight: 600;">${post.area} m²</p>
                        </div>
                        <div>
                            <p style="color: #64748b; font-size: 13px; margin-bottom: 5px;">Địa chỉ</p>
                            <p style="font-weight: 600;">${post.district}, ${post.city}</p>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <p style="color: #64748b; font-size: 13px; margin-bottom: 8px;">Mô tả</p>
                        <p style="color: #334155; line-height: 1.6;">${post.description || 'Không có mô tả'}</p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <p style="color: #64748b; font-size: 13px; margin-bottom: 8px;">Tiện nghi</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${(post.amenities || []).map(a => `
                                <span style="background: rgba(102, 126, 234, 0.1); color: #667eea; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
                                    <i class="fas fa-check"></i> ${formatAmenity(a)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-primary" onclick="approvePost(${post.id})" style="flex: 1;">
                            <i class="fas fa-check"></i> Duyệt tin
                        </button>
                        <button class="btn-secondary" onclick="rejectPost(${post.id})" style="flex: 1; background: rgba(239, 68, 68, 0.1); color: #ef4444;">
                            <i class="fas fa-times"></i> Từ chối
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

async function approvePost(postId) {
    if (!confirm('Bạn có chắc muốn duyệt tin đăng này?')) return;
    
    try {
        const founderUser = JSON.parse(localStorage.getItem('founderUser'));
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                founder_id: founderUser.id || founderUser.userId
            })
        });
        
        const result = await response.json();
        if (result.success) {
            alert('✅ ' + result.message);
            loadPendingPosts(); // Reload list
        } else {
            alert('❌ ' + result.error);
        }
    } catch (error) {
        console.error('Error approving post:', error);
        alert('❌ Có lỗi xảy ra');
    }
}

async function rejectPost(postId) {
    const reason = prompt('Lý do từ chối (tùy chọn):');
    if (reason === null) return; // Cancelled
    
    try {
        const founderUser = JSON.parse(localStorage.getItem('founderUser'));
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                founder_id: founderUser.id || founderUser.userId,
                reason: reason
            })
        });
        
        const result = await response.json();
        if (result.success) {
            alert('✅ ' + result.message);
            loadPendingPosts(); // Reload list
        } else {
            alert('❌ ' + result.error);
        }
    } catch (error) {
        console.error('Error rejecting post:', error);
        alert('❌ Có lỗi xảy ra');
    }
}

function formatDate(isoDate) {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    
    if (hours < 1) return 'Vừa xong';
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function formatAmenity(amenity) {
    const map = {
        'wifi': 'WiFi',
        'ac': 'Máy lạnh',
        'parking': 'Chỗ để xe',
        'wm': 'Máy giặt',
        'kitchen': 'Bếp nấu',
        'fridge': 'Tủ lạnh',
        'heater': 'Nóng lạnh',
        'security': 'An ninh 24/7'
    };
    return map[amenity] || amenity;
}

// Helper function to switch sections programmatically
function switchSection(sectionName) {
    const targetSection = document.getElementById(sectionName + '-section');
    const targetNav = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
    
    if (targetSection && targetNav) {
        // Remove active from all
        document.querySelectorAll('.nav-item[data-section]').forEach(nav => {
            nav.classList.remove('active');
        });
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Add active to target
        targetNav.classList.add('active');
        targetSection.classList.add('active');
    }
}

// Contract PDF functions
function openContractPDF() {
    const pdfUrl = 'accounts/partner/partner_contract/partner_examaple_hd_demo/hopdongdemo.pdf';
    
    // Create modal for PDF viewer
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content-founder" style="width: 90%; max-width: 1200px; height: 90vh;">
            <div class="modal-header-section">
                <h2><i class="fas fa-file-pdf"></i> Hợp đồng hợp tác - Partner Example & HOLA HOME Founders</h2>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove(); document.body.style.overflow = '';">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body-section" style="padding: 0; flex: 1; overflow: hidden;">
                <iframe src="${pdfUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove(); document.body.style.overflow = '';">
                    <i class="fas fa-times"></i> Đóng
                </button>
                <button class="btn-primary" onclick="downloadContractPDF()">
                    <i class="fas fa-download"></i> Tải xuống
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function downloadContractPDF() {
    const pdfUrl = 'accounts/partner/partner_contract/partner_examaple_hd_demo/hopdongdemo.pdf';
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'HopDong_PartnerExample_HolaHome.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show notification
    showNotification('Đang tải xuống hợp đồng...', 'success');
}

function showNotification(message, type = 'success') {
    // Remove existing notification
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
