// Add a .glb file to public/models, then append a record here to extend the gallery.
// Paths are relative to Vite's BASE_URL so deployments in a subdirectory also work.
export const modelCategories = [
  { id: 'all', label: 'All' },
  { id: 'tanks', label: 'Tanks' },
  { id: 'spaag', label: 'Air defense' },
  { id: 'mecha', label: 'Mecha' },
  { id: 'demo', label: 'Studies' },
];

export const models = [
  {
    id: 'leopard2a4',
    name: 'Leopard 2 A4',
    category: 'tanks',
    tag: 'Main Battle Tank',
    description: 'A study of the Leopard 2 A4 tank, exploring mechanical design through form, proportion, and detailed 3D modeling.',
    note: 'An artistic interpretation; not fully accurate to real-world specifications.',
    path: 'models/leopard2a4.glb',
    thumbnail: 'thumbnails/leopard2a4.jpg',
    scale: 1,
  },
  {
    id: 'phaelynx',
    name: 'Phaelynx Mech',
    category: 'mecha',
    tag: 'Robotic Mech',
    description: 'A fictional single-seat battle robot inspired by Titanfall, exploring the intersection of mechanical design and imagination.',
    note: 'A fictional design.',
    path: 'models/phaelynx.glb',
    thumbnail: null,
    scale: 1,
  },
  {
    id: 'leopard2a4pl',
    name: 'Leopard 2 A4 PL',
    category: 'tanks',
    tag: 'Main Battle Tank',
    description: 'A model inspired by the Leopard 2PL, the Polish Armed Forces modernization of the Leopard 2A4.',
    note: 'An artistic interpretation; not fully accurate to real-world specifications.',
    path: 'models/leopard2a4pl.glb',
    thumbnail: null,
    scale: 1,
  },
  {
    id: '2s25',
    name: '2S25 Sprut-SD',
    category: 'tanks',
    tag: 'Light Tank',
    description: 'A 3D model of the 2S25 Sprut-SD light tank, with an emphasis on proportion, structure, and mechanical detail.',
    note: 'An artistic interpretation; not fully accurate to real-world specifications.',
    path: 'models/2s25.glb',
    thumbnail: null,
    scale: 1,
  },
  {
    id: '2s38',
    name: '2S38 Derivatsiy-PVO',
    category: 'spaag',
    tag: 'Self-Propelled Anti-Aircraft',
    description: 'A form and detail study of the 2S38 self-propelled anti-aircraft vehicle, brought into an interactive 3D space.',
    note: 'An artistic interpretation; not fully accurate to real-world specifications.',
    path: 'models/2s38.glb',
    thumbnail: 'thumbnails/2s38.jpg',
    scale: 1,
  },
  {
    id: 'gepard1a2',
    name: 'Flakpanzer Gepard 1A2',
    category: 'spaag',
    tag: 'Self-Propelled Anti-Aircraft',
    description: 'A model of the Gepard 1A2 self-propelled anti-aircraft vehicle, built around the Leopard 1 chassis.',
    note: 'An artistic interpretation; not fully accurate to real-world specifications.',
    path: 'models/gepard1a2.glb',
    thumbnail: null,
    scale: 1,
  },
  {
    id: 'leopard2a4sn',
    name: 'Leopard 2 A4 SYNA',
    category: 'tanks',
    tag: 'Fictional Variant',
    description: 'A fictional Leopard 2 A4 variant inspired by the Leopard 2 A6, featuring additional spaced armor.',
    note: 'A fictional design.',
    path: 'models/leopard2a4sn.glb',
    thumbnail: null,
    scale: 1,
  },
  {
    id: 'demo-cube',
    name: 'Demo Cube',
    category: 'demo',
    tag: 'Geometry Study',
    description: 'A simple geometric study for experimenting with materials, lighting, and movement in 3D space.',
    path: 'models/cube.glb',
    thumbnail: 'thumbnails/cube.jpg',
    scale: 1,
  },
];

// The original catalog also mentioned T-90M, but no t90m.glb was supplied.
// Add it here once its asset is available; unavailable files are not shown as projects.
export const getModelById = (id) => models.find((model) => model.id === id) ?? null;
export default models;
