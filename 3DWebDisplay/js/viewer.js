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
            this.canvas.clientWidth / this.canvas.clientHeight,
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
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Controls (chỉ rotate và zoom, không roll, hạn chế pan)
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = true; // needed for touch two-finger pan
        this.controls.minDistance = 1;
        this.controls.maxDistance = 20;
        this.controls.maxPolarAngle = Math.PI; // Cho phép xoay 360 độ
        this.controls.zoomSpeed = 1.0;    // ← độ nhạy zoom (mouse wheel & pinch), mặc định 1.0
        this.controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };
        
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

        // Grid floor helper
        this.gridHelper = new THREE.GridHelper(20, 40, 0x00d4ff, 0x1e293b);
        this.gridHelper.position.y = -1.5;
        this.gridHelper.visible = false;
        this.scene.add(this.gridHelper);

        // State trackers
        this.isWireframeEnabled = false;
        this.activeLightingPreset = 'studio';
        
        // Bắt đầu render loop
        this.animate();
    }

    /**
     * Thiết lập lighting cho scene
     */
    setupLighting() {
        this.lightsGroup = new THREE.Group();
        
        // Ambient light - ánh sáng tổng thể
        this.ambientLight = new THREE.AmbientLight(0xffffff, 4.0);
        this.lightsGroup.add(this.ambientLight);
        
        // Main directional light (key light)
        this.mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.mainLight.position.set(5, 5, 5);
        this.lightsGroup.add(this.mainLight);
        
        // Fill light (từ phía bên kia)
        this.fillLight = new THREE.DirectionalLight(0x00d4ff, 0.8);
        this.fillLight.position.set(-5, 3, -5);
        this.lightsGroup.add(this.fillLight);
        
        // Rim light (ánh sáng viền từ phía sau)
        this.rimLight = new THREE.DirectionalLight(0x7c3aed, 1.0);
        this.rimLight.position.set(0, 5, -5);
        this.lightsGroup.add(this.rimLight);
        
        // Hemisphere light (bầu trời -> mặt đất)
        this.hemiLight = new THREE.HemisphereLight(0x00d4ff, 0x0a0e1a, 0.4);
        this.lightsGroup.add(this.hemiLight);

        this.scene.add(this.lightsGroup);
    }

    /**
     * Set lighting preset
     * @param {string} preset - 'studio' | 'cyberpunk' | 'dramatic' | 'ambient'
     */
    setLightingPreset(preset) {
        this.activeLightingPreset = preset;
        switch (preset) {
            case 'cyberpunk':
                this.ambientLight.intensity = 2.0;
                this.ambientLight.color.setHex(0x0a0e1a);
                this.mainLight.intensity = 2.0;
                this.mainLight.color.setHex(0x00f0ff);
                this.fillLight.intensity = 1.5;
                this.fillLight.color.setHex(0xff007f);
                this.rimLight.intensity = 2.2;
                this.rimLight.color.setHex(0x7c3aed);
                this.scene.background = new THREE.Color(0x050714);
                break;
            case 'dramatic':
                this.ambientLight.intensity = 1.0;
                this.ambientLight.color.setHex(0xffffff);
                this.mainLight.intensity = 3.5;
                this.mainLight.color.setHex(0xffffff);
                this.fillLight.intensity = 0.2;
                this.fillLight.color.setHex(0x00d4ff);
                this.rimLight.intensity = 2.5;
                this.rimLight.color.setHex(0x00f0ff);
                this.scene.background = new THREE.Color(0x030408);
                break;
            case 'ambient':
                this.ambientLight.intensity = 6.0;
                this.ambientLight.color.setHex(0xffffff);
                this.mainLight.intensity = 0.5;
                this.mainLight.color.setHex(0xffffff);
                this.fillLight.intensity = 0.5;
                this.fillLight.color.setHex(0xffffff);
                this.rimLight.intensity = 0.2;
                this.rimLight.color.setHex(0xffffff);
                this.scene.background = new THREE.Color(0x111827);
                break;
            case 'studio':
            default:
                this.ambientLight.intensity = 4.0;
                this.ambientLight.color.setHex(0xffffff);
                this.mainLight.intensity = 1.5;
                this.mainLight.color.setHex(0xffffff);
                this.fillLight.intensity = 0.8;
                this.fillLight.color.setHex(0x00d4ff);
                this.rimLight.intensity = 1.0;
                this.rimLight.color.setHex(0x7c3aed);
                this.scene.background = new THREE.Color(0x0a0e1a);
                break;
        }
    }

    /**
     * Toggle Wireframe mode
     * @param {boolean} [enable] - Optional override
     * @returns {boolean} New wireframe state
     */
    toggleWireframe(enable) {
        this.isWireframeEnabled = enable !== undefined ? enable : !this.isWireframeEnabled;
        
        if (this.currentModel) {
            this.currentModel.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.wireframe = this.isWireframeEnabled);
                    } else {
                        child.material.wireframe = this.isWireframeEnabled;
                    }
                }
            });
        }
        return this.isWireframeEnabled;
    }

    /**
     * Toggle grid floor helper
     * @param {boolean} [show]
     * @returns {boolean} New grid visibility
     */
    toggleGridFloor(show) {
        this.gridHelper.visible = show !== undefined ? show : !this.gridHelper.visible;
        return this.gridHelper.visible;
    }

    /**
     * Compute statistics for loaded model (vertices, triangles, meshes)
     * @returns {object} { vertices, triangles, meshes }
     */
    getModelStats() {
        let vertices = 0;
        let triangles = 0;
        let meshes = 0;

        if (this.currentModel) {
            this.currentModel.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    meshes++;
                    const geom = child.geometry;
                    if (geom.index) {
                        triangles += geom.index.count / 3;
                    } else if (geom.attributes.position) {
                        triangles += geom.attributes.position.count / 3;
                    }
                    if (geom.attributes.position) {
                        vertices += geom.attributes.position.count;
                    }
                }
            });
        }

        return { vertices, triangles: Math.round(triangles), meshes };
    }

    /**
     * Capture HD PNG screenshot of the current 3D canvas view
     */
    takeScreenshot() {
        // Re-render scene to make sure drawing buffer is active
        this.renderer.render(this.scene, this.camera);
        const dataUrl = this.canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        const name = (this.currentModelData && this.currentModelData.name) ? 
            this.currentModelData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : '3d_model';
        link.download = `syna_3d_${name}_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
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
                    
                    // Re-apply wireframe if previously enabled
                    if (this.isWireframeEnabled) {
                        this.toggleWireframe(true);
                    }
                    
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
     * Tự động center model, scale vừa màn hình và đặt chân model đứng trên mặt lưới (y=0)
     * @param {number} scaleMultiplier - Hệ số scale bổ sung
     */
    centerAndScaleModel(scaleMultiplier = 1.0) {
        if (!this.currentModel) return;

        // Reset scale & position để tính toán bounding box chính xác
        this.currentModel.scale.set(1, 1, 1);
        this.currentModel.position.set(0, 0, 0);
        this.currentModel.updateMatrixWorld(true);

        // 1. Tính bounding box ban đầu
        const rawBox = new THREE.Box3().setFromObject(this.currentModel);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        
        // 2. Tính scale factor để fit vừa viewport
        const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
        const targetSize = 3.5; // Kích thước khung cảnh tiêu chuẩn
        const scale = (targetSize / maxDim) * scaleMultiplier;
        
        this.currentModel.scale.setScalar(scale);
        this.currentModel.updateMatrixWorld(true);

        // 3. Tính bounding box sau khi đã scale
        const scaledBox = new THREE.Box3().setFromObject(this.currentModel);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        const scaledMinY = scaledBox.min.y;

        // 4. Đặt vị trí model: X và Z ở tâm (0,0), Y để đáy model nằm chính xác tại y = 0
        this.currentModel.position.x = -scaledCenter.x;
        this.currentModel.position.y = -scaledMinY; // Chân model chạm mặt lưới y=0
        this.currentModel.position.z = -scaledCenter.z;

        // 5. Đặt mặt sàn grid nằm ngay bên dưới đáy model (y = -0.01 để tránh z-fighting)
        if (this.gridHelper) {
            this.gridHelper.position.set(0, -0.01, 0);
        }

        console.log(`Model grounded at y=0. Size: ${maxDim.toFixed(2)}, Scale: ${scale.toFixed(2)}`);
    }

    /**
     * Đặt camera focus vào tâm model
     */
    focusOnModel() {
        if (!this.currentModel) return;

        this.currentModel.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(this.currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Target camera vào tâm của model đã đặt vị trí
        this.controls.target.copy(center);
        
        // Tính khoảng cách camera phù hợp
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraDistance *= 2.0; // Khoảng cách quan sát dễ nhìn
        
        // Đặt camera ở góc nghiêng nhẹ nhìn vào tâm model
        this.camera.position.set(
            center.x,
            center.y + maxDim * 0.2,
            center.z + cameraDistance
        );
        
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
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;

        // Update camera
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();

        // Update renderer – false = don't override CSS-set canvas size
        this.renderer.setSize(w, h, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update controls (damping & auto-rotate)
        this.controls.update();
        
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
     * @param {boolean} [enabled] - Enable/disable auto rotate
     * @param {number} speed - Tốc độ xoay
     * @returns {boolean} New autoRotate state
     */
    setAutoRotate(enabled, speed = 1.0) {
        this.controls.autoRotate = enabled !== undefined ? enabled : !this.controls.autoRotate;
        this.controls.autoRotateSpeed = speed;
        return this.controls.autoRotate;
    }
}

// Export class
export default ModelViewer;
