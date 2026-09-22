import * as THREE from 'three';

/**
 * Hero particle field — one restrained WebGL element with a design job:
 * depth behind the headline + cursor response. Performance contract:
 * capability + reduced-motion + mobile detection, DPR cap, adaptive count,
 * IntersectionObserver pause, full disposal, CSS fallback (canvas hidden).
 */
export class HeroScene {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private points: THREE.Points | null = null;
  private frame = 0;
  private visible = true;
  private mx = 0;
  private my = 0;
  private tx = 0;
  private ty = 0;
  private disposed = false;
  private onMove = (e: PointerEvent) => {
    this.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    this.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  private onResize = () => this.resize();
  private io: IntersectionObserver | null = null;

  static supported(): boolean {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch {
      return false;
    }
  }

  constructor(private canvas: HTMLCanvasElement) {}

  init(): boolean {
    if (this.disposed) return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (!HeroScene.supported()) return false;

    const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const small = Math.min(window.innerWidth, window.innerHeight) < 640;
    const COUNT = coarse || small ? 380 : 1300;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    this.camera.position.z = 15;

    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const cyan = new THREE.Color(0x22d3ee);
    const white = new THREE.Color(0x8a8a93);
    const tmp = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      // Wide shallow field, denser toward the bottom-left (behind headline).
      pos[i * 3] = (Math.random() - 0.5) * 34;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 9;
      tmp.copy(Math.random() < 0.22 ? cyan : white);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.075, vertexColors: true, transparent: true, opacity: 0.75,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    this.points = new THREE.Points(geo, mat);
    this.scene.add(this.points);

    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('resize', this.onResize);
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
    if (this.canvas.parentElement) this.io.observe(this.canvas.parentElement);
    this.resize();
    this.tick();
    return true;
  }

  private resize(): void {
    if (!this.renderer || !this.camera || !this.canvas.parentElement) return;
    const w = this.canvas.parentElement.clientWidth;
    const h = this.canvas.parentElement.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private tick = (): void => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.tick);
    if (!this.visible || !this.renderer || !this.scene || !this.camera || !this.points) return;
    this.mx += (this.tx - this.mx) * 0.035;
    this.my += (this.ty - this.my) * 0.035;
    this.points.rotation.y = this.mx * 0.22;
    this.points.rotation.x = this.my * 0.12;
    const p = this.points.geometry.attributes.position.array as Float32Array;
    const t = performance.now() * 0.00016;
    for (let i = 0; i < p.length; i += 3) {
      p[i + 1] += Math.sin(t * 3 + p[i]) * 0.0016;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('resize', this.onResize);
    this.io?.disconnect();
    this.points?.geometry.dispose();
    (this.points?.material as THREE.Material | undefined)?.dispose();
    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.points = null;
  }
}
