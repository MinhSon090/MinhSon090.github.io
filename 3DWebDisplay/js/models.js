/**
 * models.js
 * 
 * File chứa danh sách tất cả các 3D models
 * 
 * Để thêm model mới, chỉ cần thêm object vào mảng models với các thông tin:
 * - id: ID duy nhất (string)
 * - name: Tên hiển thị của model
 * - description: Mô tả ngắn
 * - path: Đường dẫn đến file model (.glb hoặc .gltf)
 * - thumbnail: Đường dẫn đến ảnh thumbnail
 * - scale: (Optional) Hệ số scale mặc định
 * - position: (Optional) Vị trí mặc định {x, y, z}
 */

const models = [
    {
        id: 'demo-cube',
        name: 'Demo Cube',
        description: 'Model demo đơn giản - một hình khối với texture',
        path: 'models/cube.glb',
        thumbnail: 'assets/thumbnails/cube.jpg',
        scale: 1.0
    },
    {
        id: 'leopard2a4pl',
        name: 'Leopard 2 A4 PL',
        description: 'The Leopard 2PL is a main battle tank used by the Polish Armed Forces, and is a modernized version of the older Leopard 2A4 tank, phased out by Germany and first acquired by Poland in the 2000s. The modernisation is currently being carried out in cooperation with Rheinmetall and the Polish Armaments Group.<br><br>*<i>This model is <strong>fictional</strong>, not 100% accurate compared to actual specifications</i>*',
        path: 'models/leopard2a4pl.glb',
        thumbnail: 'assets/thumbnails/leopard2a4pl.jpg',
        scale: 1.0
    },
    {
        id: '2s25', // normal 2s25 version
        name: '2S25',
        description: 'The 2S25 Sprut-SD (Russian: 2C25 «Спрут-СД»; 2S25 "Octopus-SD") is a light self-propelled anti-tank gun/tank developed and to be manufactured by the Volgograd Tractor Plant to meet the requirements of the VDV.<br><br>*<i>This model is <strong>fictional</strong>, not 100% accurate compared to actual specifications</i>*',
        path: 'models/2s25.glb',
        thumbnail: 'assets/thumbnails/2s25.jpg',
        scale: 1.0
    },
    {
        id: 'leopard2a4',
        name: 'Leopard 2 A4',
        description: 'Leopard 2 A4 - a German main battle tank, widely used by many countries around the world.<br><br>*<i>This model is <strong>fictional</strong>, not 100% accurate compared to actual specifications</i>*',
        path: 'models/leopard2a4.glb',
        thumbnail: 'assets/thumbnails/leopard2a4.jpg',
        scale: 1.0
    },
    {
        id: '2s38',
        name: '2S38 Derivatsiy-PVO',
        description: '2S38 - a Russian self-propelled anti-aircraft gun designed for airborne troops.<br><br>*<i>This model is <strong>fictional</strong>, not 100% accurate compared to actual specifications</i>*',
        path: 'models/2s38.glb',
        thumbnail: 'assets/thumbnails/2s38.jpg',
        scale: 1.0
    },
    {
        id: 'gepard1a2',
        name: 'Flakpanzer Gepard 1A2',
        description: 'Flakpanzer Gepard 1A2 - a German self-propelled anti-aircraft gun based on the Leopard 1 chassis.<br><br>*<i>This model is <strong>fictional</strong>, not 100% accurate compared to actual specifications</i>*',
        path: 'models/gepard1a2.glb',
        thumbnail: 'assets/thumbnails/gepard1a2.jpg',
        scale: 1.0
    },
    {
        id: 'leopard2a4sn',
        name: 'Leopard 2 A4 SYNA',
        description: 'Pure fictional variant of the Leopard 2 A4, based on the Leopard 2 A6 design, with extra space armor',
        path: 'models/leopard2a4sn.glb',
        thumbnail: 'assets/thumbnails/leopard2a4sn.jpg',
        scale: 1.0
    },
    {
        id: 't90m',
        name: 'T-90M (incomplete)',
        description: 'T-90M - a Russian main battle tank, an improved version of the T-72.<br><br>*<i>This model is <strong>fictional</strong>, not 100% accurate compared to actual specifications</i>*',
        path: 'models/t90m.glb',
        thumbnail: 'assets/thumbnails/t90m.jpg',
        scale: 1.0
    },
    {
        id: 'phaelynx',
        name: 'Phaelynx',
        description: 'Single-seat main battle robot. A fictional design by me, inspired by Titanfall.',
        path: 'models/phaelynx.glb',
        thumbnail: 'assets/thumbnails/phaelynx.jpg',
        scale: 1.0
    },
    
    // ============================================
    // THÊM MODEL MỚI VÀO ĐÂY
    // ============================================
    // {
    //     id: 'your-model-id',
    //     name: 'Tên Model',
    //     description: 'Mô tả model của bạn',
    //     path: 'models/your-model.glb',
    //     thumbnail: 'assets/thumbnails/your-thumbnail.jpg',
    //     scale: 1.0,
    //     position: { x: 0, y: 0, z: 0 } // Optional
    // },
];

/**
 * Hàm helper để lấy model theo ID
 * @param {string} id - ID của model
 * @returns {object|null} Model object hoặc null nếu không tìm thấy
 */
export function getModelById(id) {
    return models.find(model => model.id === id) || null;
}

/**
 * Hàm helper để lấy tất cả models
 * @returns {Array} Mảng tất cả các models
 */
export function getAllModels() {
    return models;
}

/**
 * Hàm helper để kiểm tra xem model có tồn tại không
 * @param {string} id - ID của model
 * @returns {boolean} True nếu model tồn tại
 */
export function modelExists(id) {
    return models.some(model => model.id === id);
}

// Export mặc định
export default models;
