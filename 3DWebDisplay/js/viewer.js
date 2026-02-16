/**
 * viewer.js
 * 
 * Three.js 3D Model Viewer
 * Quản lý scene, camera, lighting, và load/unload models
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

class ModelViewer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.currentModel = null;
        this.currentModelData = null;
        this.loadingCallbacks = [];
        
        this.init();
    }

    /**
     * Khởi tạo scene, camera, renderer, controls, lights
     */
    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e1a);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0.8, 5);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Controls (chỉ rotate và zoom, không roll, hạn chế pan)
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 20;
        this.controls.maxPolarAngle = Math.PI; // Cho phép xoay 360 độ
        
        // Lighting
        this.setupLighting();
        
        // GLTF Loader với Draco compression
        this.gltfLoader = new GLTFLoader();
        
        // Draco loader (cho compressed models)
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        dracoLoader.setDecoderConfig({ type: 'js' });
        this.gltfLoader.setDRACOLoader(dracoLoader);
        
        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Bắt đầu render loop
        this.animate();
    }

    /**
     * Thiết lập lighting cho scene
     */
    setupLighting() {
        // Ambient light - ánh sáng tổng thể
        const ambientLight = new THREE.AmbientLight(0xffffff, 5);
        this.scene.add(ambientLight);
        
        // Main directional light (key light)
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        mainLight.position.set(5, 5, 5);
        this.scene.add(mainLight);
        
        // Fill light (từ phía bên kia)
        const fillLight = new THREE.DirectionalLight(0x00d4ff, 0.5);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);
        
        // Rim light (ánh sáng viền từ phía sau)
        const rimLight = new THREE.DirectionalLight(0x7c3aed, 0.8);
        rimLight.position.set(0, 5, -5);
        this.scene.add(rimLight);
        
        // Hemisphere light (bầu trời -> mặt đất)
        const hemiLight = new THREE.HemisphereLight(0x00d4ff, 0x0a0e1a, 0.3);
        this.scene.add(hemiLight);
    }

    /**
     * Load model từ path
     * @param {string} modelPath - Đường dẫn đến file model
     * @param {object} modelData - Data của model (name, description, etc.)
     * @param {function} onProgress - Callback khi đang load
     * @returns {Promise} Promise resolve khi load xong
     */
    async loadModel(modelPath, modelData = {}, onProgress = null) {
        // Unload model hiện tại nếu có
        if (this.currentModel) {
            this.unloadModel();
        }

        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                modelPath,
                (gltf) => {
                    // Load thành công
                    this.currentModel = gltf.scene;
                    this.currentModelData = modelData;
                    
                    // Add model vào scene
                    this.scene.add(this.currentModel);
                    
                    // Auto center và scale model
                    this.centerAndScaleModel(modelData.scale || 1.0);
                    
                    // Set camera target về center của model
                    this.focusOnModel();
                    
                    console.log('✓ Model loaded:', modelData.name || modelPath);
                    resolve(gltf);
                },
                (xhr) => {
                    // Progress callback
                    const percentComplete = (xhr.loaded / xhr.total) * 100;
                    if (onProgress) {
                        onProgress(percentComplete);
                    }
                },
                (error) => {
                    // Error callback
                    console.error('✗ Error loading model:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Tự động center model về gốc tọa độ và scale phù hợp viewport
     * @param {number} scaleMultiplier - Hệ số scale bổ sung
     */
    centerAndScaleModel(scaleMultiplier = 1.0) {
        if (!this.currentModel) return;

        // Tính bounding box của model
        const box = new THREE.Box3().setFromObject(this.currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Center model về gốc tọa độ
        this.currentModel.position.x = -center.x;
        this.currentModel.position.y = -center.y;
        this.currentModel.position.z = -center.z;
        
        // Tính scale factor để model fit trong viewport
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 3; // Kích thước mục tiêu
        const scale = (targetSize / maxDim) * scaleMultiplier;
        
        this.currentModel.scale.setScalar(scale);
        
        console.log(`Model centered. Size: ${maxDim.toFixed(2)}, Scale: ${scale.toFixed(2)}`);
    }

    /**
     * Đặt camera focus vào model
     */
    focusOnModel() {
        if (!this.currentModel) return;

        const box = new THREE.Box3().setFromObject(this.currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Set camera target
        this.controls.target.copy(center);
        
        // Tính khoảng cách camera phù hợp
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraDistance *= 2.5; // Thêm khoảng cách buffer
        
        // Đặt camera position
        const direction = this.camera.position.clone().sub(center).normalize();
        this.camera.position.copy(direction.multiplyScalar(cameraDistance).add(center));
        
        this.controls.update();
    }

    /**
     * Unload model hiện tại và giải phóng bộ nhớ
     */
    unloadModel() {
        if (!this.currentModel) return;

        // Traverse qua tất cả children và dispose geometry + material
        this.currentModel.traverse((child) => {
            if (child.isMesh) {
                // Dispose geometry
                if (child.geometry) {
                    child.geometry.dispose();
                }
                
                // Dispose material(s)
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => this.disposeMaterial(material));
                    } else {
                        this.disposeMaterial(child.material);
                    }
                }
            }
        });

        // Remove từ scene
        this.scene.remove(this.currentModel);
        
        console.log('✓ Model unloaded and memory freed');
        
        this.currentModel = null;
        this.currentModelData = null;
    }

    /**
     * Dispose material và textures
     * @param {THREE.Material} material - Material cần dispose
     */
    disposeMaterial(material) {
        // Dispose tất cả textures trong material
        Object.keys(material).forEach((key) => {
            const value = material[key];
            if (value && typeof value === 'object' && 'minFilter' in value) {
                // Đây là texture
                value.dispose();
            }
        });
        
        material.dispose();
    }

    /**
     * Reset camera về vị trí mặc định
     */
    resetCamera() {
        if (this.currentModel) {
            // Nếu có model, focus lại vào model
            this.focusOnModel();
        } else {
            // Nếu không có model, về vị trí mặc định
            this.camera.position.set(0, 1.5, 5);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }

    /**
     * Xử lý khi resize window
     */
    onWindowResize() {
        // Update camera
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update controls (damping)
        this.controls.update();
        
        // Optional: Tự động xoay model nhẹ khi idle
        // if (this.currentModel) {
        //     this.currentModel.rotation.y += 0.001;
        // }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Get thông tin model hiện tại
     * @returns {object|null} Model data hoặc null
     */
    getCurrentModelData() {
        return this.currentModelData;
    }

    /**
     * Kiểm tra xem có model đang load không
     * @returns {boolean}
     */
    hasModel() {
        return this.currentModel !== null;
    }

    /**
     * Update background color
     * @param {string|number} color - Màu background
     */
    setBackgroundColor(color) {
        this.scene.background = new THREE.Color(color);
    }

    /**
     * Toggle auto rotate
     * @param {boolean} enabled - Enable/disable auto rotate
     * @param {number} speed - Tốc độ xoay
     */
    setAutoRotate(enabled, speed = 1.0) {
        this.controls.autoRotate = enabled;
        this.controls.autoRotateSpeed = speed;
    }
}

// Export class
export default ModelViewer;
