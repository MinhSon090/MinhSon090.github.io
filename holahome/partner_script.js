// Utility functions
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatCurrency(priceStr) {
    // Handle price range (e.g., "1500000 - 2500000")
    if (typeof priceStr === 'string' && priceStr.includes(' - ')) {
        const parts = priceStr.split(' - ');
        const min = formatNumber(parseInt(parts[0].trim()));
        const max = formatNumber(parseInt(parts[1].trim()));
        return `${min}đ - ${max}đ`;
    }
    
    // Handle single price
    const num = parseInt(priceStr);
    if (isNaN(num)) return '0đ';
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
    
    // Load data when switching sections
    if (sectionName === 'bookings') {
        loadBookings();
    } else if (sectionName === 'my-posts') {
        loadMyPosts();
    }
    
    // Reset draft ID when switching to create-post (starting new post)
    if (sectionName === 'create-post' && !window.isLoadingDraft) {
        currentEditingDraftId = null;
        // Reset form for new post
        const form = document.getElementById('createPropertyForm');
        if (form) form.reset();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Partner Login and Authentication
document.addEventListener('DOMContentLoaded', function() {
    const loginScreen = document.getElementById('partner-login-screen');
    const dashboard = document.getElementById('partner-dashboard');
    
    // Check if already logged in as partner
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const authToken = localStorage.getItem('authToken');
    
    if (authToken && currentUser && currentUser.account_type === 'partner') {
        // User is logged in as partner, show dashboard
        showDashboard();
        initializeDashboard();
    } else {
        // Not logged in as partner, redirect to partner login
        window.location.href = 'partner_login.html';
    }
    
    function showDashboard() {
        // Force hide login screen (if exists)
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) {
            dashboard.style.display = 'block';
            dashboard.style.visibility = 'visible';
            dashboard.style.opacity = '1';
        }
        
        // Update username in header
        const username = currentUser ? (currentUser.username || currentUser.email) : 'Partner';
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = username;
        });
    }
});

// Initialize Dashboard Functions
function initializeDashboard() {
    // Load and display notifications
    loadNotifications();
    
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
    
    // Mark all as read
    const markAllRead = document.getElementById('mark-all-read');
    if (markAllRead) {
        markAllRead.addEventListener('click', function(e) {
            e.preventDefault();
            markAllNotificationsRead();
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
    
    // Load initial data
    loadMyPosts();
    loadBookings(); // Load bookings data for activity reporting
    
    // Load my posts on page load if on that section
    if (window.location.hash === '#my-posts') {
        switchSection('my-posts');
    }

    // Logout functionality
    const logoutBtns = document.querySelectorAll('.nav-item.logout');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
                // Clear auth data
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                // Redirect to homepage
                window.location.href = 'index.html';
            }
        });
    });

    // Image upload preview
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    let uploadedImages = []; // Store base64 images
    
    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            
            // Validate max 10 images
            if (uploadedImages.length + files.length > 10) {
                alert('❌ Tối đa 10 hình ảnh!');
                return;
            }
            
            files.forEach((file, index) => {
                if (file.type.startsWith('image/')) {
                    // Validate file size (5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        alert(`❌ File "${file.name}" quá lớn! Tối đa 5MB.`);
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const base64Image = event.target.result;
                        uploadedImages.push(base64Image);
                        
                        const imgContainer = document.createElement('div');
                        imgContainer.style.cssText = 'display: inline-block; position: relative; margin: 10px; width: 120px; height: 120px;';
                        imgContainer.dataset.imageIndex = uploadedImages.length - 1;
                        
                        const img = document.createElement('img');
                        img.src = base64Image;
                        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
                        
                        const removeBtn = document.createElement('button');
                        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                        removeBtn.style.cssText = 'position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 50%; background: #ef4444; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;';
                        removeBtn.type = 'button';
                        removeBtn.onclick = function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const imageIndex = parseInt(imgContainer.dataset.imageIndex);
                            uploadedImages.splice(imageIndex, 1);
                            imgContainer.remove();
                            // Update indices
                            updateImageIndices();
                        };
                        
                        imgContainer.appendChild(img);
                        imgContainer.appendChild(removeBtn);
                        imagePreview.appendChild(imgContainer);
                        
                        // Update image count message
                        updateImageCountMessage();
                    };
                    reader.readAsDataURL(file);
                }
            });
            
            // Clear file input to allow re-selecting same files
            e.target.value = '';
        });
    }
    
    function updateImageIndices() {
        const containers = imagePreview.querySelectorAll('[data-image-index]');
        containers.forEach((container, index) => {
            container.dataset.imageIndex = index;
        });
    }
    
    function updateImageCountMessage() {
        const count = uploadedImages.length;
        const uploadArea = document.getElementById('uploadArea');
        const existingMsg = uploadArea.querySelector('.image-count-msg');
        
        if (existingMsg) existingMsg.remove();
        
        if (count > 0) {
            const msg = document.createElement('p');
            msg.className = 'image-count-msg';
            msg.style.cssText = `margin-top: 10px; font-weight: bold; color: ${count >= 3 ? '#10b981' : '#ef4444'};`;
            msg.innerHTML = `<i class="fas fa-${count >= 3 ? 'check-circle' : 'exclamation-circle'}"></i> Đã chọn ${count}/10 ảnh ${count >= 3 ? '✓' : '(cần tối thiểu 3 ảnh)'}`;
            uploadArea.appendChild(msg);
        }
    }

    // Click upload area to open file dialog
    const uploadArea = document.querySelector('.upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('click', function(e) {
            if (e.target.tagName !== 'BUTTON') {
                imageUpload.click();
            }
        });
    }

    // Form submission - Create new post
    const createPropertyForm = document.getElementById('createPropertyForm');
    if (createPropertyForm) {
        createPropertyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate images (minimum 3)
            if (uploadedImages.length < 3) {
                alert('❌ Vui lòng tải lên ít nhất 3 hình ảnh!');
                const uploadArea = document.getElementById('uploadArea');
                if (uploadArea) {
                    uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    uploadArea.style.border = '2px solid #ef4444';
                    setTimeout(() => {
                        uploadArea.style.border = '';
                    }, 2000);
                }
                return;
            }
            
            // Get current user data
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const partnerId = currentUser.id || currentUser.partnerId || '1';
            
            // Get form data
            const formData = {
                partner_id: partnerId,
                title: document.getElementById('postTitle').value,
                type: document.getElementById('postType').value,
                price: parseInt(document.getElementById('postPrice').value),
                area: parseFloat(document.getElementById('postArea').value),
                max_people: parseInt(document.getElementById('postMaxPeople').value) || 1,
                address: document.getElementById('postAddress').value,
                district: document.getElementById('postDistrict').value,
                city: document.getElementById('postCity').value,
                distance: parseFloat(document.getElementById('postDistance').value) || null,
                images: uploadedImages, // Send base64 images
                amenities: Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(cb => cb.value),
                description: document.getElementById('postDescription').value
            };
            
            try {
                // Disable submit button
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
                
                // Send to backend
                const response = await fetch('http://localhost:5000/api/posts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Clear draft after successful submission
                    clearDraft();
                    
                    // Show success message
                    alert('✅ ' + result.message + '\n\nTin đăng của bạn đang được chờ duyệt bởi Founder.');
                    
                    // Reset form and images
                    createPropertyForm.reset();
                    uploadedImages = [];
                    const imagePreview = document.getElementById('imagePreview');
                    if (imagePreview) imagePreview.innerHTML = '';
                    updateImageCountMessage();
                    if (imagePreview) imagePreview.innerHTML = '';
                    
                    // Switch to my-posts section and reload
                    switchSection('my-posts');
                    loadMyPosts();
                    
                    // Re-enable button
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                } else {
                    alert('❌ Lỗi: ' + result.error);
                }
                
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                
            } catch (error) {
                console.error('Error creating post:', error);
                alert('❌ Có lỗi xảy ra khi đăng tin. Vui lòng thử lại.');
                
                // Re-enable button
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Đăng tin';
            }
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
    // const viewButtons = document.querySelectorAll('.btn-view');
    // viewButtons.forEach(btn => {
    //     btn.addEventListener('click', function() {
    //         alert('Mở chi tiết hợp đồng...\n(Giao diện xem hợp đồng đang được phát triển)');
    //     });
    // });

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

// ===== PREVIEW POST MODAL =====
function previewPostModal() {
    // Get form data
    const title = document.getElementById('postTitle').value || 'Tên phòng trọ chưa có';
    const price = document.getElementById('postPrice').value || '0';
    const address = document.getElementById('postAddress').value || '';
    const district = document.getElementById('postDistrict').value || '';
    const city = document.getElementById('postCity').value || 'Hà Nội';
    
    // Get first image
    const imageInput = document.getElementById('postImages');
    let imageUrl = 'images/4.jpg'; // default
    if (imageInput && imageInput.files && imageInput.files[0]) {
        imageUrl = URL.createObjectURL(imageInput.files[0]);
    }
    
    // Format location
    let location = address;
    if (district) location += `, ${district}`;
    if (city) location += `, ${city}`;
    location = location.replace(/^,\s*/, ''); // remove leading comma
    
    // Format price
    const formattedPrice = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
    
    // Set modal content
    document.getElementById('previewPostTitle').textContent = title;
    document.getElementById('previewPostPrice').textContent = formattedPrice;
    document.getElementById('previewPostAddress').textContent = location || 'Chưa có địa chỉ';
    document.getElementById('previewPostImage').src = imageUrl;
    
    // Show modal
    const modal = document.getElementById('previewPostModal');
    modal.classList.add('show');
}

function closePreviewModal() {
    const modal = document.getElementById('previewPostModal');
    modal.classList.remove('show');
}

// Close preview modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('previewPostModal');
    if (modal && e.target === modal) {
        closePreviewModal();
    }
});

// ESC key to close preview modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('previewPostModal');
        if (modal && modal.classList.contains('show')) {
            closePreviewModal();
        }
    }
});

// ===== DRAFT MANAGEMENT =====
let currentEditingDraftId = null;

function saveDraft() {
    // Get form data
    const draftData = {
        title: document.getElementById('postTitle').value,
        type: document.getElementById('postType').value,
        price: document.getElementById('postPrice').value,
        area: document.getElementById('postArea').value,
        max_people: document.getElementById('postMaxPeople').value,
        address: document.getElementById('postAddress').value,
        district: document.getElementById('postDistrict').value,
        city: document.getElementById('postCity').value,
        distance: document.getElementById('postDistance').value,
        images: uploadedImages, // Save images with draft
        amenities: Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(cb => cb.value),
        description: document.getElementById('postDescription').value,
        savedAt: new Date().toISOString()
    };
    
    // Get existing drafts
    const drafts = JSON.parse(localStorage.getItem('postDrafts') || '[]');
    
    // Check if updating existing draft or creating new
    const existingIndex = currentEditingDraftId ? drafts.findIndex(d => d.id === currentEditingDraftId) : -1;
    
    if (existingIndex >= 0) {
        // Update existing draft
        drafts[existingIndex] = { ...drafts[existingIndex], ...draftData, id: currentEditingDraftId };
    } else {
        // Add new draft with unique ID
        draftData.id = 'draft_' + Date.now();
        currentEditingDraftId = draftData.id;
        drafts.push(draftData);
    }
    
    // Save to localStorage
    localStorage.setItem('postDrafts', JSON.stringify(drafts));
    
    // Show success message
    alert('💾 Đã lưu bản nháp thành công!\n\nBạn có thể tiếp tục chỉnh sửa sau trong mục "Tin đăng của tôi".');
    
    // Reload my posts if on that page
    if (document.getElementById('myPostsContainer')) {
        loadMyPosts();
    }
}

function loadDraftToForm(draftId) {
    const drafts = JSON.parse(localStorage.getItem('postDrafts') || '[]');
    const draft = drafts.find(d => d.id === draftId);
    
    if (!draft) return;
    
    // Set flag to prevent form reset
    window.isLoadingDraft = true;
    
    // Set current editing draft ID
    currentEditingDraftId = draftId;
    
    // Switch to create-post section
    switchSection('create-post');
    
    // Small delay to ensure section is loaded
    setTimeout(() => {
        // Fill form with draft data
        document.getElementById('postTitle').value = draft.title || '';
        document.getElementById('postType').value = draft.type || '';
        document.getElementById('postPrice').value = draft.price || '';
        document.getElementById('postArea').value = draft.area || '';
        document.getElementById('postMaxPeople').value = draft.max_people || '';
        document.getElementById('postAddress').value = draft.address || '';
        document.getElementById('postDistrict').value = draft.district || '';
        document.getElementById('postCity').value = draft.city || '';
        document.getElementById('postDistance').value = draft.distance || '';
        document.getElementById('postDescription').value = draft.description || '';
        
        // Load images
        if (draft.images && draft.images.length > 0) {
            uploadedImages = draft.images;
            const imagePreview = document.getElementById('imagePreview');
            if (imagePreview) {
                imagePreview.innerHTML = '';
                draft.images.forEach((base64Image, index) => {
                    const imgContainer = document.createElement('div');
                    imgContainer.style.cssText = 'display: inline-block; position: relative; margin: 10px; width: 120px; height: 120px;';
                    imgContainer.dataset.imageIndex = index;
                    
                    const img = document.createElement('img');
                    img.src = base64Image;
                    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                    removeBtn.style.cssText = 'position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 50%; background: #ef4444; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;';
                    removeBtn.type = 'button';
                    removeBtn.onclick = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const imageIndex = parseInt(imgContainer.dataset.imageIndex);
                        uploadedImages.splice(imageIndex, 1);
                        imgContainer.remove();
                        updateImageIndices();
                    };
                    
                    imgContainer.appendChild(img);
                    imgContainer.appendChild(removeBtn);
                    imagePreview.appendChild(imgContainer);
                });
                updateImageCountMessage();
            }
        }
        
        // Check amenities
        if (draft.amenities) {
            draft.amenities.forEach(amenity => {
                const checkbox = document.querySelector(`input[name="amenities"][value="${amenity}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        // Clear flag
        window.isLoadingDraft = false;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
}

function deleteDraft(draftId) {
    if (!confirm('Bạn có chắc muốn xóa bản nháp này?')) return;
    
    const drafts = JSON.parse(localStorage.getItem('postDrafts') || '[]');
    const filtered = drafts.filter(d => d.id !== draftId);
    localStorage.setItem('postDrafts', JSON.stringify(filtered));
    
    // Reload posts
    loadMyPosts();
}

function clearDraft() {
    // Delete the draft being edited if any
    if (currentEditingDraftId) {
        const drafts = JSON.parse(localStorage.getItem('postDrafts') || '[]');
        const filtered = drafts.filter(d => d.id !== currentEditingDraftId);
        localStorage.setItem('postDrafts', JSON.stringify(filtered));
        currentEditingDraftId = null;
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'vài giây trước';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' phút trước';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' giờ trước';
    return Math.floor(seconds / 86400) + ' ngày trước';
}

// ===== MY POSTS MANAGEMENT =====
let currentFilter = 'all';

async function loadMyPosts() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const partnerId = currentUser.id || currentUser.partnerId || '1';
    
    // Get drafts from localStorage
    const drafts = JSON.parse(localStorage.getItem('postDrafts') || '[]');
    
    try {
        const response = await fetch(`http://localhost:5000/api/posts?partner_id=${partnerId}`);
        let posts = [];
        
        if (response.ok) {
            const result = await response.json();
            console.log('My posts response:', result);
            
            // Handle both array and object response formats
            if (result.success && result.posts) {
                posts = result.posts;
            } else if (Array.isArray(result)) {
                posts = result;
            }
        }
        
        // Update stats
        const draftsCount = drafts.length;
        const pendingCount = posts.filter(p => p.status === 'pending').length;
        const approvedCount = posts.filter(p => p.status === 'approved').length;
        const rejectedCount = posts.filter(p => p.status === 'rejected').length;
        
        // Update stat elements safely
        const myDraftsCountEl = document.getElementById('myDraftsCount');
        const myPendingCountEl = document.getElementById('myPendingCount');
        const myApprovedCountEl = document.getElementById('myApprovedCount');
        const myRejectedCountEl = document.getElementById('myRejectedCount');
        const myPostsBadgeEl = document.getElementById('myPostsBadge');
        
        if (myDraftsCountEl) myDraftsCountEl.textContent = draftsCount;
        if (myPendingCountEl) myPendingCountEl.textContent = pendingCount;
        if (myApprovedCountEl) myApprovedCountEl.textContent = approvedCount;
        if (myRejectedCountEl) myRejectedCountEl.textContent = rejectedCount;
        
        const totalPending = pendingCount + draftsCount;
        if (myPostsBadgeEl) {
            myPostsBadgeEl.textContent = totalPending;
            myPostsBadgeEl.style.display = totalPending > 0 ? 'inline-block' : 'none';
        }
        
        // Render posts (combine drafts and posts)
        renderMyPosts(posts, drafts);
    } catch (error) {
        console.error('Error loading my posts:', error);
        // Still show drafts even if API fails
        const myDraftsCountEl = document.getElementById('myDraftsCount');
        if (myDraftsCountEl) myDraftsCountEl.textContent = drafts.length;
        renderMyPosts([], drafts);
    }
}

function renderMyPosts(posts, drafts = []) {
    const container = document.getElementById('myPostsContainer');
    if (!container) return;
    
    // Combine drafts and posts
    let allItems = [];
    
    // Add drafts with status 'draft'
    if (currentFilter === 'all' || currentFilter === 'draft') {
        allItems = allItems.concat(drafts.map(d => ({ ...d, status: 'draft' })));
    }
    
    // Add posts based on filter
    if (currentFilter === 'all') {
        allItems = allItems.concat(posts);
    } else if (currentFilter !== 'draft') {
        allItems = allItems.concat(posts.filter(p => p.status === currentFilter));
    }
    
    if (allItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Không có tin đăng nào</h3>
                <p>${currentFilter === 'all' ? 'Bạn chưa có tin đăng hoặc bản nháp nào' : 'Không có tin đăng ' + getFilterLabel(currentFilter)}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allItems.map(post => {
        if (post.status === 'draft') {
            // Render draft card
            return `
                <div class="my-post-card">
                    <div class="my-post-header">
                        <div>
                            <h3 class="my-post-title">${post.title || 'Bản nháp chưa có tiêu đề'}</h3>
                            <div class="my-post-date">
                                <i class="fas fa-clock"></i> Lưu ${formatDate(post.savedAt)}
                            </div>
                        </div>
                        <span class="post-status-badge draft">
                            <i class="fas fa-save"></i>
                            Bản nháp
                        </span>
                    </div>
                    
                    <div class="my-post-info">
                        ${post.type ? `
                        <div class="post-info-item">
                            <i class="fas fa-home"></i>
                            <span>${post.type}</span>
                        </div>` : ''}
                        ${post.price ? `
                        <div class="post-info-item">
                            <i class="fas fa-money-bill-wave"></i>
                            <strong>${formatPrice(post.price)}</strong>
                        </div>` : ''}
                        ${post.area ? `
                        <div class="post-info-item">
                            <i class="fas fa-expand"></i>
                            <span>${post.area}m²</span>
                        </div>` : ''}
                        ${post.district ? `
                        <div class="post-info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${post.district}${post.city ? ', ' + post.city : ''}</span>
                        </div>` : ''}
                    </div>
                    
                    <div class="property-actions" style="margin-top: 15px;">
                        <button class="btn-edit" onclick="loadDraftToForm('${post.id}')">
                            <i class="fas fa-edit"></i> Tiếp tục chỉnh sửa
                        </button>
                        <button class="btn-delete" onclick="deleteDraft('${post.id}')" style="background: #ef4444;">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Render regular post card
            return `
                <div class="my-post-card">
                    <div class="my-post-header">
                        <div>
                            <h3 class="my-post-title">${post.title}</h3>
                            <div class="my-post-date">
                                <i class="fas fa-clock"></i> Đăng ${formatDate(post.created_at)}
                            </div>
                        </div>
                        <span class="post-status-badge ${post.status}">
                            <i class="fas fa-${getStatusIcon(post.status)}"></i>
                            ${getStatusText(post.status)}
                        </span>
                    </div>
                    
                    <div class="my-post-info">
                        <div class="post-info-item">
                            <i class="fas fa-home"></i>
                            <span>${post.type || 'Phòng trọ'}</span>
                        </div>
                        <div class="post-info-item">
                            <i class="fas fa-money-bill-wave"></i>
                            <strong>${formatPrice(post.price)}</strong>
                        </div>
                        <div class="post-info-item">
                            <i class="fas fa-expand"></i>
                            <span>${post.area}m²</span>
                        </div>
                        <div class="post-info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${post.district}, ${post.city}</span>
                        </div>
                    </div>
                    
                    ${post.status === 'approved' && post.approved_at ? `
                        <div class="post-info-item" style="margin-top: 10px; color: #10b981;">
                            <i class="fas fa-check-circle"></i>
                            <span>Đã duyệt ${formatDate(post.approved_at)}</span>
                        </div>
                    ` : ''}
                    
                    ${post.status === 'rejected' && post.rejected_reason ? `
                        <div class="rejection-reason">
                            <strong><i class="fas fa-exclamation-triangle"></i> Lý do từ chối:</strong>
                            <p>${post.rejected_reason}</p>
                        </div>
                    ` : ''}
                    
                    ${post.status === 'delete_pending' ? `
                        <div style="margin-top: 10px; padding: 10px; background: #fef3c7; border-radius: 5px; color: #92400e;">
                            <i class="fas fa-hourglass-half"></i> <strong>Đang chờ Founder duyệt yêu cầu gỡ bài</strong>
                            ${post.delete_reason ? `<p style="margin: 5px 0 0 0; font-size: 13px;">Lý do: ${post.delete_reason}</p>` : ''}
                        </div>
                    ` : ''}
                    
                    ${post.status === 'approved' && post.status !== 'delete_pending' ? `
                        <div class="property-actions" style="margin-top: 15px;">
                            <button class="btn-delete" onclick="requestDeletePost(${post.id}, '${post.title.replace(/'/g, '\\\'')}')" style="background: #ef4444;">
                                <i class="fas fa-trash-alt"></i> Yêu cầu gỡ bài
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    }).join('');
}

function filterMyPosts(filter) {
    currentFilter = filter;
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.closest('.filter-tab').classList.add('active');
    
    // Reload posts
    loadMyPosts();
}

function getFilterLabel(filter) {
    const labels = {
        'draft': 'ở dạng bản nháp',
        'pending': 'chờ duyệt',
        'approved': 'đã duyệt',
        'rejected': 'bị từ chối'
    };
    return labels[filter] || '';
}

function getStatusText(status) {
    const texts = {
        'draft': 'Bản nháp',
        'pending': 'Chờ duyệt',
        'approved': 'Đã duyệt',
        'rejected': 'Từ chối'
    };
    return texts[status] || status;
}

function getStatusIcon(status) {
    const icons = {
        'pending': 'clock',
        'approved': 'check-circle',
        'rejected': 'times-circle'
    };
    return icons[status] || 'circle';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'vừa xong';
    if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
    if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
    if (diff < 604800) return Math.floor(diff / 86400) + ' ngày trước';
    
    return date.toLocaleDateString('vi-VN');
}

function formatPrice(price) {
    if (!price) return '0đ';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Load draft on page load
window.addEventListener('DOMContentLoaded', function() {
    // Wait for form to be available
    setTimeout(() => {
        if (document.getElementById('createPropertyForm')) {
            loadDraft();
        }
    }, 500);
});

// ===== BOOKINGS MANAGEMENT =====
async function loadBookings() {
    try {
        // Always load from file (backend API handles updates)
        const response = await fetch('backend/bookings.json');
        const data = await response.json();
        
        const bookings = data.bookings || [];
        const today = new Date();
        
        // Calculate stats
        const confirmed = bookings.filter(b => b.status === 'confirmed').length;
        const pending = bookings.filter(b => b.status === 'pending').length;
        const upcoming = bookings.filter(b => new Date(b.visit_date) >= today).length;
        const completed = bookings.filter(b => b.status === 'completed').length;
        
        // Update stats
        const confirmedEl = document.getElementById('confirmedBookingsCount');
        const upcomingEl = document.getElementById('upcomingBookingsCount');
        const completedEl = document.getElementById('completedBookingsCount');
        
        if (confirmedEl) confirmedEl.textContent = confirmed;
        if (upcomingEl) upcomingEl.textContent = upcoming;
        if (completedEl) completedEl.textContent = completed;
        
        // Update sidebar badge
        const bookingsBadge = document.querySelector('[data-section="bookings"] .badge');
        if (bookingsBadge) {
            bookingsBadge.textContent = pending;
            bookingsBadge.style.display = pending > 0 ? 'inline-block' : 'none';
        }
        
        // Render bookings
        renderBookings(bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
        const container = document.getElementById('bookingsContainer');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: #ef4444;">Không thể tải danh sách lịch hẹn</p>';
        }
    }
}

function renderBookings(bookings) {
    const container = document.getElementById('bookingsContainer');
    if (!container) return;
    
    if (bookings.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px; color: #64748b;">
                <i class="fas fa-calendar-times" style="font-size: 48px; margin-bottom: 20px;"></i>
                <h3>Chưa có lịch hẹn nào</h3>
                <p>Các lịch hẹn sẽ hiển thị ở đây</p>
            </div>
        `;
        return;
    }
    
    const getStatusBadge = (status) => {
        const badges = {
            pending: '<span class="status-badge pending"><i class="fas fa-clock"></i> Chờ xác nhận</span>',
            confirmed: '<span class="status-badge confirmed"><i class="fas fa-check-circle"></i> Đã xác nhận</span>',
            cancelled: '<span class="status-badge cancelled"><i class="fas fa-times-circle"></i> Đã hủy</span>',
            completed: '<span class="status-badge completed"><i class="fas fa-check-double"></i> Hoàn thành</span>'
        };
        return badges[status] || badges.pending;
    };
    
    const html = bookings.map(booking => `
        <div class="booking-card ${booking.status}">
            <div class="booking-header">
                <div class="customer-info">
                    <div class="customer-avatar">
                        <i class="fas fa-user-circle" style="font-size: 40px;"></i>
                    </div>
                    <div>
                        <strong>${booking.customer_name}</strong>
                        <span>CCCD: ${booking.customer_cccd}</span>
                    </div>
                </div>
                ${getStatusBadge(booking.status)}
            </div>
            <div class="booking-details">
                <div class="detail-row">
                    <i class="fas fa-building"></i>
                    <span>${booking.property_title}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-money-bill-wave"></i>
                    <strong>${formatCurrency(parseInt(booking.property_price))}</strong>
                </div>
                <div class="detail-row">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(booking.visit_date)} - ${booking.visit_time}</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-phone"></i>
                    <a href="tel:${booking.customer_phone}">${booking.customer_phone}</a>
                </div>
                ${booking.customer_email ? `
                <div class="detail-row">
                    <i class="fas fa-envelope"></i>
                    <a href="mailto:${booking.customer_email}">${booking.customer_email}</a>
                </div>
                ` : ''}
            </div>
            <div class="booking-actions">
                <button class="btn-view" onclick="viewBookingDetails(${booking.id})">
                    <i class="fas fa-eye"></i> Xem chi tiết
                </button>
                ${booking.status === 'pending' ? `
                    <button class="btn-confirm" onclick="confirmBooking(${booking.id})">
                        <i class="fas fa-check"></i> Xác nhận
                    </button>
                    <button class="btn-cancel" onclick="cancelBooking(${booking.id})">
                        <i class="fas fa-times"></i> Hủy
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// View booking details
let currentBookingId = null;

function viewBookingDetails(bookingId) {
    // Load from file
    fetch('backend/bookings.json')
        .then(res => res.json())
        .then(data => {
            const booking = data.bookings.find(b => b.id === bookingId);
            if (!booking) {
                showNotification('Không tìm thấy lịch hẹn', 'error');
                return;
            }
            
            const statusText = {
                pending: 'Chờ xác nhận',
                confirmed: 'Đã xác nhận',
                cancelled: 'Đã hủy',
                completed: 'Hoàn thành'
            };
            
            const detailsHTML = `
                <div class="booking-info-grid">
                    <div class="info-section">
                        <h3><i class="fas fa-user"></i> Thông tin khách hàng</h3>
                        <div class="info-item">
                            <span class="info-label">Họ tên:</span>
                            <span class="info-value">${booking.customer_name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Điện thoại:</span>
                            <span class="info-value"><a href="tel:${booking.customer_phone}">${booking.customer_phone}</a></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">CCCD:</span>
                            <span class="info-value">${booking.customer_cccd}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Email:</span>
                            <span class="info-value"><a href="mailto:${booking.customer_email}">${booking.customer_email}</a></span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3><i class="fas fa-home"></i> Thông tin phòng trọ</h3>
                        <div class="info-item">
                            <span class="info-label">Tên phòng:</span>
                            <span class="info-value">${booking.property_title}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Giá thuê:</span>
                            <span class="info-value"><strong>${formatCurrency(parseInt(booking.property_price))}</strong></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Mã phòng:</span>
                            <span class="info-value">${booking.property_id}</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3><i class="fas fa-calendar-alt"></i> Thời gian hẹn</h3>
                        <div class="info-item">
                            <span class="info-label">Ngày hẹn:</span>
                            <span class="info-value">${formatDate(booking.visit_date)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Giờ hẹn:</span>
                            <span class="info-value">${booking.visit_time}</span>
                        </div>
                        ${booking.note ? `
                        <div class="info-item">
                            <span class="info-label">Ghi chú:</span>
                            <span class="info-value">${booking.note}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="info-section">
                        <h3><i class="fas fa-info-circle"></i> Trạng thái</h3>
                        <div class="info-item">
                            <span class="info-label">Trạng thái:</span>
                            <span class="info-value"><span class="status-badge ${booking.status}">${statusText[booking.status]}</span></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Tạo lúc:</span>
                            <span class="info-value">${new Date(booking.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                        ${booking.confirmed_at ? `
                        <div class="info-item">
                            <span class="info-label">Xác nhận lúc:</span>
                            <span class="info-value">${new Date(booking.confirmed_at).toLocaleString('vi-VN')}</span>
                        </div>
                        ` : ''}
                        ${booking.cancelled_at ? `
                        <div class="info-item">
                            <span class="info-label">Hủy lúc:</span>
                            <span class="info-value">${new Date(booking.cancelled_at).toLocaleString('vi-VN')}</span>
                        </div>
                        ` : ''}
                        ${booking.cancel_reason ? `
                        <div class="info-item">
                            <span class="info-label">Lý do hủy:</span>
                            <span class="info-value" style="color: #ef4444;">${booking.cancel_reason}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            document.getElementById('booking-details-content').innerHTML = detailsHTML;
            document.getElementById('booking-details-modal').classList.add('show');
            document.body.style.overflow = 'hidden';
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Không thể tải thông tin lịch hẹn', 'error');
        });
}

function closeBookingDetailsModal() {
    document.getElementById('booking-details-modal').classList.remove('show');
    document.body.style.overflow = '';
}

// Confirm booking
async function confirmBooking(bookingId) {
    currentBookingId = bookingId;
    
    try {
        // Load from file
        const response = await fetch('backend/bookings.json');
        const data = await response.json();
        
        const booking = data.bookings.find(b => b.id === bookingId);
        if (!booking) {
            showNotification('Không tìm thấy lịch hẹn', 'error');
            return;
        }
        
        document.getElementById('confirm-booking-text').textContent = 
            `Xác nhận lịch hẹn với ${booking.customer_name} vào ${formatDate(booking.visit_date)} lúc ${booking.visit_time}?`;
        document.getElementById('confirm-booking-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error:', error);
        showNotification('Không thể tải thông tin lịch hẹn', 'error');
    }
}

function closeConfirmBookingModal() {
    document.getElementById('confirm-booking-modal').classList.remove('show');
    document.body.style.overflow = '';
    currentBookingId = null;
}

// Show payment QR
function showPaymentQR() {
    if (!currentBookingId) return;
    
    // Update payment content with booking ID
    document.getElementById('payment-content').textContent = `HOLAHOME XN ${currentBookingId}`;
    
    // Close confirm modal first
    document.getElementById('confirm-booking-modal').classList.remove('show');
    
    // Show payment modal (keep currentBookingId for payment processing)
    document.getElementById('payment-qr-modal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closePaymentQRModal() {
    document.getElementById('payment-qr-modal').classList.remove('show');
    document.body.style.overflow = '';
    currentBookingId = null;
}

let isProcessingPayment = false;

function confirmPaymentCompleted() {
    // Prevent double submission
    if (isProcessingPayment) {
        showNotification('Đang xử lý thanh toán, vui lòng đợi...', 'error');
        return;
    }
    
    if (!currentBookingId) {
        showNotification('Không tìm thấy thông tin lịch hẹn', 'error');
        return;
    }
    
    isProcessingPayment = true;
    const bookingId = currentBookingId;
    
    // Get button reference before closing modal
    const paymentBtn = document.querySelector('#payment-qr-modal .btn-primary');
    if (paymentBtn) {
        paymentBtn.disabled = true;
        paymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    }
    
    // Show processing notification
    showNotification('Đang xử lý giao dịch, vui lòng chờ ít phút...', 'success');
    
    // Simulate 10 second payment processing
    setTimeout(async () => {
        try {
            // Call backend API to update booking status
            const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/confirm`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    partner_id: 'partner'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Clear localStorage to force reload from file
                localStorage.removeItem('bookings_data');
                
                // Close modal
                closePaymentQRModal();
                
                // Show success message
                showNotification('Thanh toán thành công! Lịch hẹn đã được xác nhận.', 'success');
                
                // Reload bookings to update display
                loadBookings();
                
                // Re-enable button and reset flag
                isProcessingPayment = false;
                if (paymentBtn) {
                    paymentBtn.disabled = false;
                    paymentBtn.innerHTML = '<i class="fas fa-check"></i> Đã thanh toán';
                }
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error confirming booking:', error);
            closePaymentQRModal();
            showNotification('Có lỗi xảy ra khi xác nhận lịch hẹn!', 'error');
            isProcessingPayment = false;
            if (paymentBtn) {
                paymentBtn.disabled = false;
                paymentBtn.innerHTML = '<i class="fas fa-check"></i> Đã thanh toán';
            }
        }
    }, 10000); // 10 seconds delay
}

// Cancel booking
async function cancelBooking(bookingId) {
    currentBookingId = bookingId;
    
    try {
        // Load from file
        const response = await fetch('backend/bookings.json');
        const data = await response.json();
        
        const booking = data.bookings.find(b => b.id === bookingId);
        if (!booking) {
            showNotification('Không tìm thấy lịch hẹn', 'error');
            return;
        }
        
        document.getElementById('cancel-booking-text').textContent = 
            `Hủy lịch hẹn với ${booking.customer_name} vào ${formatDate(booking.visit_date)} lúc ${booking.visit_time}?`;
        document.getElementById('cancel-reason').value = '';
        document.getElementById('cancel-booking-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error:', error);
        showNotification('Không thể tải thông tin lịch hẹn', 'error');
    }
}

function closeCancelBookingModal() {
    document.getElementById('cancel-booking-modal').classList.remove('show');
    document.body.style.overflow = '';
    currentBookingId = null;
}

async function cancelBookingAction() {
    const reason = document.getElementById('cancel-reason').value.trim();
    
    if (!reason) {
        showNotification('Vui lòng nhập lý do hủy!', 'error');
        return;
    }
    
    if (!currentBookingId) {
        showNotification('Không tìm thấy thông tin lịch hẹn', 'error');
        return;
    }
    
    try {
        // Call backend API to cancel booking
        const response = await fetch(`http://localhost:5000/api/bookings/${currentBookingId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: reason,
                cancelled_by: 'partner'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Đã hủy lịch hẹn thành công!', 'success');
            closeCancelBookingModal();
            loadBookings(); // Reload to show updated status
        } else {
            throw new Error(result.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error canceling booking:', error);
        showNotification('Có lỗi xảy ra khi hủy lịch hẹn!', 'error');
    }
}

// Notification function
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotif = document.querySelector('.notification-toast');
    if (existingNotif) {
        existingNotif.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== REQUEST DELETE POST =====
async function requestDeletePost(postId, title) {
    const reason = prompt(`Lý do muốn gỡ bài "${title}":`);
    if (reason === null) return; // Cancelled
    
    if (!reason.trim()) {
        alert('❌ Vui lòng nhập lý do!');
        return;
    }
    
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const partnerId = currentUser.id || currentUser.partnerId;
        
        const response = await fetch(`http://localhost:5000/api/posts/${postId}/request-delete`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                partner_id: partnerId,
                reason: reason
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ ' + result.message);
            loadMyPosts(); // Reload to show new status
        } else {
            alert('❌ ' + result.error);
        }
    } catch (error) {
        console.error('Error requesting delete:', error);
        alert('❌ Có lỗi xảy ra');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

// ===== NOTIFICATIONS =====
function loadNotifications() {
    const notifications = JSON.parse(localStorage.getItem('partner_notifications') || '[]');
    renderNotifications(notifications);
    updateNotificationBadge(notifications);
}

function renderNotifications(notifications) {
    const container = document.getElementById('notification-list');
    if (!container) return;
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #94a3b8;">
                <i class="fas fa-bell-slash" style="font-size: 32px; margin-bottom: 10px;"></i>
                <p>Chưa có thông báo nào</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}" onclick="markNotificationRead('${notif.id}')">
            <div class="notification-item-title">${notif.title}</div>
            <div class="notification-item-text">${notif.message}</div>
            <div class="notification-item-time">${getTimeAgo(notif.timestamp)}</div>
        </div>
    `).join('');
}

function updateNotificationBadge(notifications) {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notification-badge');
    
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
}

function markNotificationRead(notifId) {
    const notifications = JSON.parse(localStorage.getItem('partner_notifications') || '[]');
    const notif = notifications.find(n => n.id === notifId);
    
    if (notif && !notif.read) {
        notif.read = true;
        localStorage.setItem('partner_notifications', JSON.stringify(notifications));
        updateNotificationBadge(notifications);
        renderNotifications(notifications);
    }
}

function markAllNotificationsRead() {
    const notifications = JSON.parse(localStorage.getItem('partner_notifications') || '[]');
    notifications.forEach(n => n.read = true);
    localStorage.setItem('partner_notifications', JSON.stringify(notifications));
    updateNotificationBadge(notifications);
    renderNotifications(notifications);
}

function addNotification(title, message) {
    const notifications = JSON.parse(localStorage.getItem('partner_notifications') || '[]');
    notifications.unshift({
        id: 'notif_' + Date.now(),
        title: title,
        message: message,
        timestamp: new Date().toISOString(),
        read: false
    });
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
        notifications.splice(50);
    }
    
    localStorage.setItem('partner_notifications', JSON.stringify(notifications));
    updateNotificationBadge(notifications);
    renderNotifications(notifications);
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000); // seconds
    
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
    if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
    if (diff < 604800) return Math.floor(diff / 86400) + ' ngày trước';
    return formatDate(timestamp);
}
