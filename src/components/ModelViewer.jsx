import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import models, { modelCategories } from '../data/models';

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
const numberFormat = new Intl.NumberFormat('en-US');

function Icon({ name, ...props }) {
  const paths = {
    rotate: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.2 7a7 7 0 0 1 11.5-2L20 8M4 16l2.3 3A7 7 0 0 0 18 17" /></>,
    grid: <><path d="M3 7l9-5 9 5v10l-9 5-9-5zM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5v10M7.5 19.5v-10l9-5" /></>,
    reset: <><path d="M3 10a9 9 0 1 1 3 9M3 4v6h6" /></>,
    save: <><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    cube: <><path d="m12 3 9 5v9l-9 5-9-5V8zM3 8l9 5 9-5M12 13v9" /></>,
    arrow: <path d="M7 17 17 7M7 7h10v10" />,
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

function disposeObject(object) {
  if (!object) return;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const images = new Set();
  object.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    const list = Array.isArray(child.material) ? child.material : [child.material];
    list.filter(Boolean).forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value) => {
        if (value?.isTexture) {
          textures.add(value);
          if (value.source?.data?.close) images.add(value.source.data);
        }
      });
    });
    child.skeleton?.dispose();
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
  images.forEach((bitmap) => bitmap.close());
}

function setWireframe(object, enabled) {
  object?.traverse((child) => {
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach((material) => { material.wireframe = enabled; });
  });
}

function fitCamera(runtime) {
  if (!runtime.model) return;
  const box = new THREE.Box3().setFromObject(runtime.model);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const verticalFov = THREE.MathUtils.degToRad(runtime.camera.fov);
  const tanVertical = Math.tan(verticalFov / 2);
  const tanHorizontal = tanVertical * runtime.camera.aspect;
  const direction = new THREE.Vector3(1.05, 0.65, 1.4).normalize();
  const right = new THREE.Vector3().crossVectors(runtime.camera.up, direction).normalize();
  const up = new THREE.Vector3().crossVectors(direction, right).normalize();
  // Fit the actual box in camera space rather than its sphere, which leaves
  // excessive empty space around long, low models. Include depth for perspective.
  let distance = 0;
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        const corner = new THREE.Vector3(x, y, z).sub(sphere.center);
        const depth = corner.dot(direction);
        const widthDistance = Math.abs(corner.dot(right)) / tanHorizontal;
        const heightDistance = Math.abs(corner.dot(up)) / tanVertical;
        distance = Math.max(distance, depth + Math.max(widthDistance, heightDistance) * 1.15);
      }
    }
  }
  runtime.controls.target.copy(sphere.center);
  runtime.camera.position.copy(sphere.center).add(direction.multiplyScalar(distance));
  runtime.controls.minDistance = sphere.radius * 0.65;
  runtime.controls.maxDistance = distance * 3;
  runtime.camera.near = Math.max(0.01, distance / 100);
  runtime.camera.far = Math.max(100, distance * 20);
  runtime.camera.updateProjectionMatrix();
  runtime.controls.update();
  runtime.controls.saveState();
}

async function fetchModel(path, signal, onProgress) {
  const response = await fetch(assetUrl(path), { signal });
  if (!response.ok) throw new Error(`Model request failed: ${response.status}`);
  const total = Number(response.headers.get('content-length'));
  if (!response.body || !total) return response.arrayBuffer();
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress(Math.min(95, Math.round(received / total * 95)));
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  chunks.forEach((chunk) => { bytes.set(chunk, offset); offset += chunk.length; });
  return bytes.buffer;
}

export default function ModelViewer() {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const runtimeRef = useRef(null);
  const wireframeRef = useRef(false);
  const [active, setActive] = useState(() => typeof window !== 'undefined' && !('IntersectionObserver' in window));
  const [selectedId, setSelectedId] = useState('leopard2a4');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframeState] = useState(false);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState(null);
  const [saved, setSaved] = useState(false);
  const selected = models.find((model) => model.id === selectedId) ?? models[0];
  const filtered = useMemo(() => models.filter((model) => (
    (category === 'all' || model.category === category)
    && `${model.name} ${model.tag}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  )), [category, search]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setActive(true); observer.disconnect(); }
    }, { rootMargin: '240px' });
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    let runtime;
    let resizeObserver;
    let visibilityObserver;
    let onContextLost;
    let onVisibilityChange;
    const canvas = canvasRef.current;
    try {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#f3f4f0');
      const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
      camera.position.set(4, 3, 5);
      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.enablePan = false;
      controls.autoRotateSpeed = 0.8;
      controls.maxPolarAngle = Math.PI * 0.49;
      scene.add(new THREE.HemisphereLight(0xffffff, 0xb0b9a1, 1.8));
      const key = new THREE.DirectionalLight(0xffffff, 2.8);
      key.position.set(4, 6, 5);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xe6edf9, 1);
      fill.position.set(-4, 3, -3);
      scene.add(fill);
      const grid = new THREE.GridHelper(12, 24, 0xd1d5c8, 0xe4e7de);
      grid.position.y = -0.015;
      grid.material.transparent = true;
      grid.material.opacity = 0.6;
      scene.add(grid);
      const draco = new DRACOLoader();
      draco.setDecoderPath(assetUrl('draco/'));
      draco.setWorkerLimit(2);
      const loader = new GLTFLoader().setDRACOLoader(draco);
      runtime = { renderer, scene, camera, controls, loader, draco, model: null, visible: true, disposed: false };
      runtimeRef.current = runtime;
      const resize = () => {
        const { width, height } = stageRef.current.getBoundingClientRect();
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        if (runtime.model) fitCamera(runtime);
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(stageRef.current);
      resize();
      let previousTime = 0;
      const renderFrame = (time) => {
        if (!runtime.visible || document.hidden || runtime.disposed) { previousTime = time; return; }
        const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.1) : 1 / 60;
        previousTime = time;
        controls.update(delta);
        renderer.render(scene, camera);
      };
      const syncAnimation = () => {
        previousTime = 0;
        renderer.setAnimationLoop(runtime.visible && !document.hidden && !runtime.contextLost ? renderFrame : null);
      };
      if ('IntersectionObserver' in window) {
        visibilityObserver = new IntersectionObserver(([entry]) => { runtime.visible = entry.isIntersecting; syncAnimation(); });
        visibilityObserver.observe(stageRef.current);
      }
      onVisibilityChange = syncAnimation;
      document.addEventListener('visibilitychange', onVisibilityChange);
      syncAnimation();
      onContextLost = (event) => {
        event.preventDefault();
        runtime.contextLost = true;
        syncAnimation();
        setStatus('error');
      };
      canvas.addEventListener('webglcontextlost', onContextLost);
    } catch (error) {
      console.error('Unable to initialize 3D viewer:', error);
      // WebGL is an external system; expose its initialization failure to the UI.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('error');
    }
    return () => {
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      if (onContextLost) canvas.removeEventListener('webglcontextlost', onContextLost);
      if (onVisibilityChange) document.removeEventListener('visibilitychange', onVisibilityChange);
      if (!runtime) return;
      runtime.disposed = true;
      runtime.renderer.setAnimationLoop(null);
      runtime.controls.dispose();
      runtime.draco.dispose();
      disposeObject(runtime.scene);
      runtime.renderer.dispose();
      if (runtimeRef.current === runtime) runtimeRef.current = null;
    };
  }, [active, revision]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!active || !runtime) return undefined;
    const abort = new AbortController();
    let cancelled = false;
    setStatus('loading');
    setProgress(0);
    setStats(null);
    setSaved(false);
    if (runtime.model) {
      runtime.scene.remove(runtime.model);
      disposeObject(runtime.model);
      runtime.model = null;
    }
    async function load() {
      try {
        const buffer = await fetchModel(selected.path, abort.signal, (value) => { if (!cancelled) setProgress(value); });
        if (cancelled) return;
        const gltf = await runtime.loader.parseAsync(buffer, new URL(assetUrl('models/'), window.location.href).href);
        if (cancelled || runtime.disposed || runtime.contextLost) { disposeObject(gltf.scene); return; }
        const model = gltf.scene;
        model.updateMatrixWorld(true);
        const rawBox = new THREE.Box3().setFromObject(model);
        const size = rawBox.getSize(new THREE.Vector3());
        const largest = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(largest) || largest <= 0) { disposeObject(model); throw new Error('Empty model'); }
        model.scale.multiplyScalar(3.8 / largest * (selected.scale ?? 1));
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.add(new THREE.Vector3(-center.x, -box.min.y, -center.z));
        model.updateMatrixWorld(true);
        runtime.model = model;
        runtime.scene.add(model);
        setWireframe(model, wireframeRef.current);
        fitCamera(runtime);
        let vertices = 0;
        let triangles = 0;
        let meshes = 0;
        model.traverse((child) => {
          if (!child.isMesh || !child.geometry) return;
          meshes += 1;
          const positions = child.geometry.attributes.position;
          vertices += positions?.count ?? 0;
          triangles += (child.geometry.index?.count ?? positions?.count ?? 0) / 3;
        });
        setStats({ vertices, triangles: Math.round(triangles), meshes });
        setProgress(100);
        setStatus('ready');
      } catch (error) {
        if (cancelled || error.name === 'AbortError') return;
        console.error(`Unable to load ${selected.name}:`, error);
        setStatus('error');
      }
    }
    load();
    return () => { cancelled = true; abort.abort(); };
  }, [active, selected, revision]);

  useEffect(() => {
    if (runtimeRef.current) runtimeRef.current.controls.autoRotate = autoRotate;
  }, [autoRotate, active, revision]);

  useEffect(() => {
    wireframeRef.current = wireframe;
    setWireframe(runtimeRef.current?.model, wireframe);
  }, [wireframe]);

  function handleKeyboard(event) {
    const runtime = runtimeRef.current;
    if (!runtime || status !== 'ready') return;
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') { fitCamera(runtime); return; }
    const spherical = new THREE.Spherical().setFromVector3(runtime.camera.position.clone().sub(runtime.controls.target));
    if (event.key === 'ArrowLeft') spherical.theta -= 0.12;
    if (event.key === 'ArrowRight') spherical.theta += 0.12;
    if (event.key === 'ArrowUp') spherical.phi -= 0.1;
    if (event.key === 'ArrowDown') spherical.phi += 0.1;
    if (event.key === '+' || event.key === '=') spherical.radius *= 0.9;
    if (event.key === '-') spherical.radius *= 1.1;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi, 0.05, runtime.controls.maxPolarAngle);
    spherical.radius = THREE.MathUtils.clamp(spherical.radius, runtime.controls.minDistance, runtime.controls.maxDistance);
    runtime.camera.position.copy(runtime.controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    runtime.controls.update();
  }

  function saveImage() {
    const runtime = runtimeRef.current;
    if (!runtime || status !== 'ready') return;
    try {
      runtime.renderer.render(runtime.scene, runtime.camera);
      const link = document.createElement('a');
      link.download = `${selected.id}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
      setSaved(true);
    } catch (error) {
      console.error('Unable to save image:', error);
      setSaved(false);
    }
  }

  return (
    <div className="viewer">
      <div className="viewer-workspace">
        <div className="viewer-stage" ref={stageRef} aria-busy={status === 'loading'}>
          <canvas key={revision} className="viewer-canvas" ref={canvasRef} tabIndex={0} onKeyDown={handleKeyboard}
            aria-label={`3D model: ${selected.name}. Drag to rotate and scroll to zoom. Use arrow keys to rotate, plus or minus to zoom, and Home to reset the view.`} />
          <div className="viewer-stage-label"><span className="viewer-live-dot" /> 3D STUDIO <span className="viewer-stage-format">GLB / INTERACTIVE</span></div>
          {status !== 'ready' && (
            <div className="viewer-status" role="status" aria-live="polite">
              {status === 'error' ? <>
                <Icon name="cube" width="28" height="28" />
                <strong>Unable to display this model</strong>
                <span>Try again or choose another model. Your browser needs WebGL support.</span>
                <button className="viewer-retry" type="button" onClick={() => setRevision((value) => value + 1)}>Try again <Icon name="reset" /></button>
              </> : <>
                <span className="viewer-spinner" aria-hidden="true" />
                <strong>{status === 'loading' ? 'Preparing your model' : 'Ready to explore'}</strong>
                <span>{status === 'loading' ? `${selected.name}${progress ? ` · ${progress}%` : ''}` : 'The model loads when this section comes into view.'}</span>
                {status === 'loading' && <progress className="viewer-progress" value={progress} max="100" aria-label="Model loading progress" />}
              </>}
            </div>
          )}
          <div className="viewer-toolbar" aria-label="3D model controls">
            <button type="button" className={`viewer-tool ${autoRotate ? 'is-active' : ''}`} aria-pressed={autoRotate} disabled={status !== 'ready'} onClick={() => setAutoRotate((value) => !value)} title="Turn automatic rotation on or off"><Icon name="rotate" /><span>Auto rotate</span></button>
            <button type="button" className={`viewer-tool ${wireframe ? 'is-active' : ''}`} aria-pressed={wireframe} disabled={status !== 'ready'} onClick={() => setWireframeState((value) => !value)} title="Show the model's wireframe structure"><Icon name="grid" /><span>Wireframe</span></button>
            <button type="button" className="viewer-tool" disabled={status !== 'ready'} onClick={() => fitCamera(runtimeRef.current)} title="Reset the camera view"><Icon name="reset" /><span>Reset view</span></button>
            <button type="button" className="viewer-tool" disabled={status !== 'ready'} onClick={saveImage} title="Save the current view as a PNG image"><Icon name="save" /><span>Save image</span></button>
          </div>
          <div className="viewer-stage-hint">Drag to rotate <span>·</span> Scroll to zoom <span>·</span> Touch to explore</div>
        </div>
        <aside className="viewer-library" aria-label="Model library">
          <div className="viewer-library-header"><h3>The collection</h3><span>{String(models.length).padStart(2, '0')} models</span></div>
          <label className="viewer-search"><Icon name="search" /><input type="search" placeholder="Search models…" aria-label="Search models" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <div className="viewer-filters" aria-label="Filter model categories">
            {modelCategories.map((item) => <button type="button" key={item.id} className={`viewer-filter ${category === item.id ? 'is-active' : ''}`} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}
          </div>
          <div className="viewer-model-list">
            {filtered.map((model) => <button key={model.id} type="button" className={`viewer-model ${selectedId === model.id ? 'is-selected' : ''}`} aria-pressed={selectedId === model.id} onClick={() => setSelectedId(model.id)}>
              <span className={`viewer-thumbnail ${model.thumbnail ? '' : 'viewer-thumbnail-placeholder'}`}>
                {model.thumbnail ? <img src={assetUrl(model.thumbnail)} alt="" loading="lazy" /> : <Icon name="cube" width="28" height="28" />}
              </span>
              <span className="viewer-model-copy"><strong>{model.name}</strong><span>{model.tag}</span></span>
              <span className="viewer-selected-mark">{selectedId === model.id ? <Icon name="check" width="14" height="14" /> : <Icon name="arrow" width="14" height="14" />}</span>
            </button>)}
            {filtered.length === 0 && <p className="viewer-empty">No models found. Try another search or category.</p>}
          </div>
        </aside>
      </div>
      <div className="viewer-details">
        <div className="viewer-details-copy">
          <div className="viewer-details-heading"><span className="viewer-detail-tag">{selected.tag}</span><h3>{selected.name}</h3></div>
          <p className="viewer-description">{selected.description}</p>
          {selected.note && <p className="viewer-note">{selected.note}</p>}
        </div>
        <div className="viewer-stats" aria-live="polite">
          {[['meshes', 'Meshes'], ['vertices', 'Vertices'], ['triangles', 'Triangles']].map(([key, label]) => <div className="viewer-stat" key={key}><strong>{stats ? numberFormat.format(stats[key]) : '—'}</strong><span>{label}</span></div>)}
        </div>
      </div>
      <span className="sr-only" role="status" aria-live="polite">{saved ? `Saved an image of ${selected.name}.` : ''}</span>
    </div>
  );
}
