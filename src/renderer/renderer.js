// Renderizador: cena, céu, luzes, neblina, sombras e perfis de qualidade.

import * as THREE from 'three';

// Perfis de qualidade (doc 01, seção 7)
export const QUALITY = {
  leve: { name: 'Leve', pixelRatio: 0.75, shadows: false, shadowSize: 512, viewDistance: 140, oceanDetail: 0 },
  media: { name: 'Média', pixelRatio: 1.0, shadows: true, shadowSize: 1024, viewDistance: 260, oceanDetail: 1 },
  alta: { name: 'Alta', pixelRatio: 1.5, shadows: true, shadowSize: 2048, viewDistance: 420, oceanDetail: 2 },
};

const SKY_TOP = new THREE.Color('#5aa7d6');
const SKY_HORIZON = new THREE.Color('#cfe7e4');

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = SKY_HORIZON.clone();
    this.scene.fog = new THREE.Fog(SKY_HORIZON.clone(), 80, 260);
    this.scene.add(this.makeSky());

    this.hemi = new THREE.HemisphereLight('#f4f6ec', '#5b6f60', 1.35);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff1dc', 2.1);
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.sun, this.sun.target);
    this.sunOffset = new THREE.Vector3(40, 70, 28);

    this.camera = new THREE.PerspectiveCamera(58, 1, 0.3, 900);
    this.resolutionScale = 1;
    this.quality = null;
    this.setQuality('media');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  makeSky() {
    const geo = new THREE.SphereGeometry(800, 24, 12);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { top: { value: SKY_TOP }, horizon: { value: SKY_HORIZON } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vDir; void main(){ float h = clamp(vDir.y * 1.6, 0.0, 1.0); gl_FragColor = vec4(mix(horizon, top, pow(h, 0.7)), 1.0); }',
    });
    this.sky = new THREE.Mesh(geo, mat);
    this.sky.renderOrder = -1;
    return this.sky;
  }

  setQuality(id) {
    const q = QUALITY[id] || QUALITY.media;
    this.qualityId = id;
    this.quality = q;
    this.renderer.shadowMap.enabled = q.shadows;
    this.sun.castShadow = q.shadows;
    if (q.shadows) {
      this.sun.shadow.mapSize.set(q.shadowSize, q.shadowSize);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
      const s = q.shadowSize >= 2048 ? 34 : 26;
      Object.assign(this.sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 220 });
      this.sun.shadow.camera.updateProjectionMatrix();
    }
    this.scene.fog.near = q.viewDistance * 0.35;
    this.scene.fog.far = q.viewDistance;
    this.camera.far = q.viewDistance + 60;
    this.camera.updateProjectionMatrix();
    // Materiais precisam recompilar quando as sombras mudam
    this.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
    this.resize();
  }

  setResolutionScale(scale) {
    this.resolutionScale = Math.max(0.5, Math.min(1, scale));
    this.resize();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(Math.min(dpr, this.quality?.pixelRatio ?? 1) * this.resolutionScale);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 1.3 ? 66 : 58;
    this.camera.updateProjectionMatrix();
  }

  // A luz do sol acompanha o jogador para manter a área de sombra pequena e nítida
  follow(target) {
    this.sun.position.copy(target).add(this.sunOffset);
    this.sun.target.position.copy(target);
    this.sky.position.copy(this.camera.position);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
