/**
 * main.js
 * 
 * File chính của ứng dụng
 * Quản lý UI, events, và tương tác giữa viewer và models
 */

import ModelViewer from './viewer.js';
import models, { getModelById } from './models.js';

// ============================================
// STATE MANAGEMENT
// ============================================

const state = {
    currentModelId: null,
    isLoading: false,
    isSelectorCollapsed: false
};

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
    canvas: document.getElementById('three-canvas'),
    loadingScreen: document.getElementById('loading-screen'),
    homeSection: document.getElementById('home-section'),
    compactInfo: document.getElementById('compact-info'),
    modelInfo: document.getElementById('model-info'),
    modelSelector: document.getElementById('model-selector'),
    modelList: document.getElementById('model-list'),
    toggleSelector: document.getElementById('toggle-selector'),
    backHomeBtn: document.getElementById('back-home-btn'),
    modelName: document.getElementById('model-name'),
    modelDescription: document.getElementById('model-description')
};

// ============================================
// KHỞI TẠO VIEWER
// ============================================

let viewer;

function initViewer() {
    console.log('Initializing 3D Viewer...');
    
    try {
        viewer = new ModelViewer(elements.canvas);
        console.log('✓ Viewer initialized successfully');
        return true;
    } catch (error) {
        console.error('✗ Error initializing viewer:', error);
        return false;
    }
}

// ============================================
// UI FUNCTIONS
// ============================================

/**
 * Render danh sách models vào sidebar
 */
function renderModelList() {
    elements.modelList.innerHTML = '';
    
    models.forEach((model, index) => {
        const modelItem = createModelItem(model);
        elements.modelList.appendChild(modelItem);
        
        // Animation delay cho mỗi item
        setTimeout(() => {
            modelItem.classList.add('fade-in');
        }, index * 50);
    });
}

/**
 * Tạo HTML element cho một model item
 * @param {object} model - Model data
 * @returns {HTMLElement} Model item element
 */
function createModelItem(model) {
    const item = document.createElement('div');
    item.className = 'model-item';
    item.dataset.modelId = model.id;
    
    // Thumbnail (với fallback nếu không có)
    const thumbnail = document.createElement('img');
    thumbnail.className = 'model-thumbnail';
    thumbnail.src = model.thumbnail;
    thumbnail.alt = model.name;
    thumbnail.loading = 'lazy';
    
    // Xử lý lỗi khi không load được thumbnail
    thumbnail.onerror = () => {
        thumbnail.src = createPlaceholderImage(model.name);
    };
    
    // Info
    const info = document.createElement('div');
    info.className = 'model-item-info';
    
    const name = document.createElement('div');
    name.className = 'model-item-name';
    name.textContent = model.name;
    
    const desc = document.createElement('div');
    desc.className = 'model-item-desc';
    desc.textContent = model.description;
    
    info.appendChild(name);
    info.appendChild(desc);
    
    item.appendChild(thumbnail);
    item.appendChild(info);
    
    // Event listener
    item.addEventListener('click', () => handleModelSelect(model.id));
    
    return item;
}

/**
 * Tạo placeholder image khi không có thumbnail
 * @param {string} text - Text hiển thị
 * @returns {string} Data URL của image
 */
function createPlaceholderImage(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 400, 280);
    gradient.addColorStop(0, '#00d4ff');
    gradient.addColorStop(1, '#7c3aed');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 280);
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 200, 140);
    
    return canvas.toDataURL();
}

/**
 * Xử lý khi chọn một model
 * @param {string} modelId - ID của model được chọn
 */
async function handleModelSelect(modelId) {
    if (state.isLoading || state.currentModelId === modelId) {
        return;
    }
    
    const model = getModelById(modelId);
    if (!model) {
        console.error('Model not found:', modelId);
        return;
    }
    
    console.log('Loading model:', model.name);
    
    // Update state
    state.isLoading = true;
    state.currentModelId = modelId;
    
    // Update UI - show loading
    showLoading('Đang tải model...');
    
    try {
        // Load model
        await viewer.loadModel(
            model.path,
            model,
            (progress) => {
                updateLoadingProgress(progress);
            }
        );
        
        // Load thành công
        updateUIForModelView(model);
        updateActiveModelItem(modelId);
        
        console.log('✓ Model loaded successfully');
        
    } catch (error) {
        console.error('✗ Error loading model:', error);
        alert('Không thể tải model. Vui lòng thử lại.\n\nLỗi: ' + error.message);
        
        // Reset state
        state.currentModelId = null;
        
    } finally {
        state.isLoading = false;
        hideLoading();
    }
}

/**
 * Update UI khi đang xem model
 * @param {object} model - Model data
 */
function updateUIForModelView(model) {
    // Ẩn home section
    elements.homeSection.classList.remove('active');
    
    // Hiện compact info và model info
    elements.compactInfo.classList.add('active');
    elements.modelInfo.classList.add('active');
    
    // Update model info content
    elements.modelName.textContent = model.name;
    elements.modelDescription.innerHTML = model.description;
}

/**
 * Update active state của model items
 * @param {string} modelId - ID của model đang active
 */
function updateActiveModelItem(modelId) {
    // Remove active từ tất cả items
    document.querySelectorAll('.model-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active vào item được chọn
    const activeItem = document.querySelector(`[data-model-id="${modelId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

/**
 * Quay về trang home
 */
function goHome() {
    console.log('Going home...');
    
    // Unload model
    if (viewer.hasModel()) {
        viewer.unloadModel();
    }
    
    // Reset state
    state.currentModelId = null;
    
    // Update UI
    elements.homeSection.classList.add('active');
    elements.compactInfo.classList.remove('active');
    elements.modelInfo.classList.remove('active');
    
    // Remove active từ tất cả model items
    document.querySelectorAll('.model-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Reset camera
    viewer.resetCamera();
}

/**
 * Toggle model selector panel
 */
function toggleSelector() {
    state.isSelectorCollapsed = !state.isSelectorCollapsed;
    
    if (state.isSelectorCollapsed) {
        elements.modelSelector.classList.add('collapsed');
    } else {
        elements.modelSelector.classList.remove('collapsed');
    }
}

/**
 * Show loading screen
 * @param {string} message - Loading message
 */
function showLoading(message = 'Đang tải...') {
    elements.loadingScreen.classList.remove('hidden');
    const loadingText = elements.loadingScreen.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = message;
    }
}

/**
 * Hide loading screen
 */
function hideLoading() {
    elements.loadingScreen.classList.add('hidden');
}

/**
 * Update loading progress
 * @param {number} progress - Progress percentage (0-100)
 */
function updateLoadingProgress(progress) {
    const loadingText = elements.loadingScreen.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = `Đang tải... ${Math.round(progress)}%`;
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Back to home button
    elements.backHomeBtn.addEventListener('click', goHome);
    
    // Toggle selector button
    elements.toggleSelector.addEventListener('click', toggleSelector);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC - Go home
        if (e.key === 'Escape' && state.currentModelId) {
            goHome();
        }
        
        // H - Toggle home/model view
        if (e.key === 'h' || e.key === 'H') {
            if (state.currentModelId) {
                goHome();
            }
        }
        
        // M - Toggle model selector
        if (e.key === 'm' || e.key === 'M') {
            toggleSelector();
        }
        
        // R - Reset camera
        if (e.key === 'r' || e.key === 'R') {
            viewer.resetCamera();
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    console.log('Starting application...');
    
    showLoading('Đang khởi tạo...');
    
    // Khởi tạo viewer
    const viewerInitialized = initViewer();
    if (!viewerInitialized) {
        alert('Không thể khởi tạo 3D Viewer. Vui lòng thử lại.');
        return;
    }
    
    // Render model list
    renderModelList();
    
    // Setup event listeners
    setupEventListeners();
    
    // Delay một chút để animation mượt hơn
    setTimeout(() => {
        hideLoading();
        elements.homeSection.classList.add('active');
        console.log('✓ Application ready');
    }, 500);
}

// ============================================
// START APPLICATION
// ============================================

// Đợi DOM load xong
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ============================================
// EXPORT (cho debugging)
// ============================================

// Export ra window để có thể debug từ console
window.debugApp = {
    state,
    viewer,
    models,
    goHome,
    toggleSelector
};

console.log('💡 Tip: Sử dụng window.debugApp để debug');
console.log('   - window.debugApp.state : Xem state hiện tại');
console.log('   - window.debugApp.viewer : Truy cập viewer instance');
console.log('   - window.debugApp.models : Xem danh sách models');
