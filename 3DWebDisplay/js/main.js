/**
 * main.js
 * 
 * Main application manager for SYNA 3D Studio
 * Handles UI states, model search/filter, HUD controls, keyboard shortcuts, and viewer interactions.
 */

import ModelViewer from './viewer.js';
import models, { getModelById } from './models.js';

// ============================================
// STATE MANAGEMENT
// ============================================

const state = {
    currentModelId: null,
    isLoading: false,
    isSelectorCollapsed: false,
    activeCategory: 'all',
    searchQuery: '',
    isWireframe: false,
    isAutoRotate: false,
    isGridVisible: false,
    activeLighting: 'studio'
};

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
    canvas: document.getElementById('three-canvas'),
    loadingScreen: document.getElementById('loading-screen'),
    loadingBar: document.getElementById('loading-bar'),
    loadingText: document.getElementById('loading-text'),
    homeSection: document.getElementById('home-section'),
    modelInfo: document.getElementById('model-info'),
    modelSelector: document.getElementById('model-selector'),
    modelList: document.getElementById('model-list'),
    modelCount: document.getElementById('model-count'),
    searchInput: document.getElementById('search-input'),
    categoryTabs: document.getElementById('category-tabs'),
    toggleSelector: document.getElementById('toggle-selector'),
    backHomeBtn: document.getElementById('back-home-btn'),
    ctaExploreBtn: document.getElementById('cta-explore-btn'),
    
    // Model Info Readouts
    modelName: document.getElementById('model-name'),
    modelTag: document.getElementById('model-tag'),
    modelDescription: document.getElementById('model-description'),
    statTriangles: document.getElementById('stat-triangles'),
    statVertices: document.getElementById('stat-vertices'),
    statMeshes: document.getElementById('stat-meshes'),

    // Viewport HUD Controls
    viewportHud: document.getElementById('viewport-hud'),
    btnResetView: document.getElementById('btn-reset-view'),
    btnWireframe: document.getElementById('btn-wireframe'),
    btnAutorotate: document.getElementById('btn-autorotate'),
    btnGrid: document.getElementById('btn-grid'),
    btnLightingPreset: document.getElementById('btn-lighting-preset'),
    lightingMenu: document.getElementById('lighting-menu'),
    lightModeLabel: document.getElementById('light-mode-label'),
    btnScreenshotHud: document.getElementById('btn-screenshot-hud'),
    btnScreenshotHeader: document.getElementById('btn-screenshot-header'),

    // Toast
    toast: document.getElementById('toast-notification'),
    toastMsg: document.getElementById('toast-message')
};

// ============================================
// VIEWER INITIALIZATION
// ============================================

let viewer;

function initViewer() {
    console.log('Initializing 3D Studio Engine...');
    try {
        viewer = new ModelViewer(elements.canvas);
        console.log('✓ 3D Studio Engine ready');
        return true;
    } catch (error) {
        console.error('✗ Error initializing 3D viewer:', error);
        return false;
    }
}

// ============================================
// UI RENDERING & FILTERING
// ============================================

/**
 * Render filtered model list based on category and search query
 */
function renderModelList() {
    elements.modelList.innerHTML = '';
    
    const filteredModels = models.filter(model => {
        const matchesCategory = state.activeCategory === 'all' || model.category === state.activeCategory;
        const matchesSearch = !state.searchQuery || 
            model.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
            model.description.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
            (model.tag && model.tag.toLowerCase().includes(state.searchQuery.toLowerCase()));
        
        return matchesCategory && matchesSearch;
    });

    elements.modelCount.textContent = filteredModels.length;

    if (filteredModels.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.style.padding = '24px 12px';
        emptyState.style.textAlign = 'center';
        emptyState.style.color = 'var(--text-dim)';
        emptyState.style.fontFamily = 'var(--font-mono)';
        emptyState.style.fontSize = '12px';
        emptyState.textContent = 'No models match your query';
        elements.modelList.appendChild(emptyState);
        return;
    }

    filteredModels.forEach((model) => {
        const modelItem = createModelItem(model);
        elements.modelList.appendChild(modelItem);
    });

    // Re-highlight active item if selected
    if (state.currentModelId) {
        updateActiveModelItem(state.currentModelId);
    }
}

/**
 * Create HTML element for a model item card
 * @param {object} model
 * @returns {HTMLElement}
 */
function createModelItem(model) {
    const item = document.createElement('div');
    item.className = 'model-item';
    item.dataset.modelId = model.id;

    // Thumbnail container
    const thumbWrapper = document.createElement('div');
    thumbWrapper.className = 'model-thumbnail-wrapper';

    const thumbnail = document.createElement('img');
    thumbnail.className = 'model-thumbnail';
    thumbnail.src = model.thumbnail;
    thumbnail.alt = model.name;
    thumbnail.loading = 'lazy';
    thumbnail.onerror = () => {
        thumbnail.src = createPlaceholderImage(model.name);
    };

    thumbWrapper.appendChild(thumbnail);

    // Info
    const info = document.createElement('div');
    info.className = 'model-item-info';

    const name = document.createElement('div');
    name.className = 'model-item-name';
    name.textContent = model.name;

    const meta = document.createElement('div');
    meta.className = 'model-item-meta';

    const tag = document.createElement('span');
    tag.className = 'model-item-tag';
    tag.textContent = model.tag || '3D MODEL';

    meta.appendChild(tag);
    info.appendChild(name);
    info.appendChild(meta);

    item.appendChild(thumbWrapper);
    item.appendChild(info);

    item.addEventListener('click', () => handleModelSelect(model.id));

    return item;
}

/**
 * Create visual gradient placeholder image when thumbnail is missing
 * @param {string} text
 * @returns {string} Data URL
 */
function createPlaceholderImage(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 120, 120);
    gradient.addColorStop(0, '#00f0ff');
    gradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 120, 120);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.slice(0, 8), 60, 60);

    return canvas.toDataURL();
}

// ============================================
// MODEL SELECTION & VIEW CONTROLS
// ============================================

/**
 * Handle model item selection
 * @param {string} modelId
 */
async function handleModelSelect(modelId) {
    if (state.isLoading || state.currentModelId === modelId) return;

    const model = getModelById(modelId);
    if (!model) return;

    state.isLoading = true;
    state.currentModelId = modelId;

    showLoading(`Loading ${model.name}...`);

    try {
        await viewer.loadModel(model.path, model, (progress) => {
            updateLoadingProgress(progress);
        });

        updateUIForModelView(model);
        updateActiveModelItem(modelId);
        updateModelStats();

        showToast(`Loaded ${model.name}`);
    } catch (error) {
        console.error('Error loading model:', error);
        showToast('Failed to load 3D model file');
        state.currentModelId = null;
    } finally {
        state.isLoading = false;
        hideLoading();
    }
}

/**
 * Update UI for viewer mode when a model is active
 * @param {object} model
 */
function updateUIForModelView(model) {
    elements.homeSection.classList.remove('active');
    elements.modelInfo.classList.add('active');
    elements.backHomeBtn.classList.remove('hidden');

    elements.modelName.textContent = model.name;
    elements.modelTag.textContent = model.tag || '3D MODEL';
    elements.modelDescription.innerHTML = model.description;

    setTimeout(() => viewer.onWindowResize(), 300);
}

/**
 * Read and update polygon / geometry stats in HUD
 */
function updateModelStats() {
    if (!viewer) return;
    const stats = viewer.getModelStats();
    elements.statTriangles.textContent = stats.triangles.toLocaleString();
    elements.statVertices.textContent = stats.vertices.toLocaleString();
    elements.statMeshes.textContent = stats.meshes.toLocaleString();
}

/**
 * Update active state class on list items
 * @param {string} modelId
 */
function updateActiveModelItem(modelId) {
    document.querySelectorAll('.model-item').forEach(item => {
        item.classList.toggle('active', item.dataset.modelId === modelId);
    });
}

/**
 * Return home view
 */
function goHome() {
    if (viewer.hasModel()) {
        viewer.unloadModel();
    }

    state.currentModelId = null;

    elements.homeSection.classList.add('active');
    elements.modelInfo.classList.remove('active');
    elements.backHomeBtn.classList.add('hidden');

    document.querySelectorAll('.model-item').forEach(item => item.classList.remove('active'));

    viewer.resetCamera();
    setTimeout(() => viewer.onWindowResize(), 300);
}

/**
 * Toggle model selector sidebar drawer
 */
function toggleSelector() {
    state.isSelectorCollapsed = !state.isSelectorCollapsed;
    elements.modelSelector.classList.toggle('collapsed', state.isSelectorCollapsed);
    elements.toggleSelector.classList.toggle('collapsed', state.isSelectorCollapsed);
}

// ============================================
// VIEWPORT HUD CONTROLS
// ============================================

function toggleWireframe() {
    state.isWireframe = viewer.toggleWireframe();
    elements.btnWireframe.classList.toggle('active', state.isWireframe);
    showToast(state.isWireframe ? 'Wireframe Enabled' : 'Shaded Mode Enabled');
}

function toggleAutoRotate() {
    state.isAutoRotate = viewer.setAutoRotate();
    elements.btnAutorotate.classList.toggle('active', state.isAutoRotate);
    showToast(state.isAutoRotate ? 'Auto Rotation ON' : 'Auto Rotation OFF');
}

function toggleGridFloor() {
    state.isGridVisible = viewer.toggleGridFloor();
    elements.btnGrid.classList.toggle('active', state.isGridVisible);
    showToast(state.isGridVisible ? 'Floor Grid Enabled' : 'Floor Grid Hidden');
}

function setLightingPreset(preset, label) {
    viewer.setLightingPreset(preset);
    state.activeLighting = preset;
    elements.lightModeLabel.textContent = label;

    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.classList.toggle('active', item.dataset.lighting === preset);
    });

    elements.btnLightingPreset.closest('.hud-dropdown').classList.remove('open');
    showToast(`Lighting: ${label}`);
}

function captureScreenshot() {
    viewer.takeScreenshot();
    showToast('Captured HD Screenshot!');
}

// ============================================
// TOAST NOTIFICATION UTILITY
// ============================================

let toastTimeout;
function showToast(message) {
    clearTimeout(toastTimeout);
    elements.toastMsg.textContent = message;
    elements.toast.classList.add('show');
    toastTimeout = setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2800);
}

// ============================================
// LOADING SCREEN CONTROLS
// ============================================

function showLoading(message = 'Loading 3D Scene...') {
    elements.loadingScreen.classList.remove('hidden');
    elements.loadingText.textContent = message;
    elements.loadingBar.style.width = '10%';
}

function hideLoading() {
    elements.loadingBar.style.width = '100%';
    setTimeout(() => {
        elements.loadingScreen.classList.add('hidden');
    }, 300);
}

function updateLoadingProgress(progress) {
    elements.loadingBar.style.width = `${Math.min(Math.max(progress, 10), 95)}%`;
    elements.loadingText.textContent = `Loading Assets... ${Math.round(progress)}%`;
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
    // Back home button & explore CTA button
    elements.backHomeBtn.addEventListener('click', goHome);
    
    if (elements.ctaExploreBtn) {
        elements.ctaExploreBtn.addEventListener('click', () => {
            if (models.length > 0) {
                // Auto load first tank / model or expand selector
                handleModelSelect(models[1]?.id || models[0].id);
            }
        });
    }

    // Toggle selector drawer
    elements.toggleSelector.addEventListener('click', toggleSelector);

    // Search Input
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderModelList();
    });

    // Category Tabs
    elements.categoryTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.category-tab');
        if (!tab) return;

        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        state.activeCategory = tab.dataset.category;
        renderModelList();
    });

    // Viewport HUD Control Buttons
    elements.btnResetView.addEventListener('click', () => {
        viewer.resetCamera();
        showToast('Camera View Reset');
    });

    elements.btnWireframe.addEventListener('click', toggleWireframe);
    elements.btnAutorotate.addEventListener('click', toggleAutoRotate);
    elements.btnGrid.addEventListener('click', toggleGridFloor);

    // Lighting Dropdown Toggle & Selector
    elements.btnLightingPreset.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.btnLightingPreset.closest('.hud-dropdown').classList.toggle('open');
    });

    document.addEventListener('click', () => {
        elements.btnLightingPreset.closest('.hud-dropdown').classList.remove('open');
    });

    elements.lightingMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item');
        if (item) {
            setLightingPreset(item.dataset.lighting, item.textContent);
        }
    });

    // Screenshots
    elements.btnScreenshotHud.addEventListener('click', captureScreenshot);
    elements.btnScreenshotHeader.addEventListener('click', captureScreenshot);

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // If typing inside search input, ignore hotkeys except Esc
        if (document.activeElement === elements.searchInput) {
            if (e.key === 'Escape') elements.searchInput.blur();
            return;
        }

        if (e.key === '/') {
            e.preventDefault();
            elements.searchInput.focus();
            if (state.isSelectorCollapsed) toggleSelector();
        } else if (e.key === 'Escape') {
            if (state.currentModelId) goHome();
        } else if (e.key === 'r' || e.key === 'R') {
            viewer.resetCamera();
            showToast('Camera View Reset');
        } else if (e.key === 'w' || e.key === 'W') {
            toggleWireframe();
        } else if (e.code === 'Space') {
            e.preventDefault();
            toggleAutoRotate();
        } else if (e.key === 'g' || e.key === 'G') {
            toggleGridFloor();
        } else if (e.key === 'm' || e.key === 'M') {
            toggleSelector();
        }
    });
}

// ============================================
// APPLICATION INIT
// ============================================

async function init() {
    console.log('Starting SYNA 3D Studio...');
    showLoading('Initializing WebGL 3D Studio...');

    const initialized = initViewer();
    if (!initialized) {
        alert('Could not initialize 3D WebGL viewer.');
        return;
    }

    renderModelList();
    setupEventListeners();

    setTimeout(() => {
        hideLoading();
        elements.homeSection.classList.add('active');
        console.log('✓ SYNA 3D Studio fully initialized');
    }, 400);
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Debug API export
window.debugStudio = {
    state,
    viewer,
    models,
    goHome,
    toggleSelector,
    captureScreenshot
};
