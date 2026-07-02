/* GAMBARDINI · 3D scenes: hero floating objects + atelier product showcase.
   Materials are MeshMatcapMaterial with procedurally drawn matcaps: studio
   lighting baked into a texture. No lights, no PMREM environment — real PBR
   shaders take 30+ seconds to compile on old integrated GPUs and freeze the
   page, matcap compiles instantly and still reads as polished metal. */
import * as THREE from 'three';

const DPR = Math.min(window.devicePixelRatio || 1, 2);

/* ── procedural matcaps ── */
function makeMatcap(stops, highlight) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  for (const [at, col] of stops) grad.addColorStop(at, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  if (highlight) {
    const [hx, hy, hr, ha] = highlight;
    const rad = g.createRadialGradient(hx, hy, 4, hx, hy, hr);
    rad.addColorStop(0, `rgba(255,255,255,${ha})`);
    rad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rad;
    g.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* polished metal: hard horizon line, strong key highlight */
const metalcap = makeMatcap([
  [0.00, '#ffffff'],
  [0.30, '#ececec'],
  [0.47, '#a0a0a0'],
  [0.53, '#4a4a4a'],
  [0.72, '#7e7e7e'],
  [1.00, '#2e2e2e'],
], [88, 66, 112, 1]);

/* diffuse stone / paper: soft top light */
const softcap = makeMatcap([
  [0.00, '#ffffff'],
  [0.45, '#e2e2e2'],
  [1.00, '#8f8f8f'],
], [96, 80, 130, 0.5]);

/* ── finishes: tint over the shared metal matcap ── */
const FINISHES = {
  ottone: 0xd8b26e,
  nero:   0x333333,
  nichel: 0xe4e4e4,
};

function makeRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: true, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(DPR);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

/* soft fake ground shadow */
function makeShadow(y = -1.7, size = 5, opacity = 0.3) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 8, 128, 128, 126);
  grad.addColorStop(0, `rgba(58,42,28,${opacity})`);
  grad.addColorStop(1, 'rgba(58,42,28,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  return mesh;
}

/* ════════════════════════ HERO ════════════════════════ */
const heroCanvas = document.getElementById('hero-canvas');
let hero = null;

if (heroCanvas) {
  const renderer = makeRenderer(heroCanvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7.5);

  const brass = new THREE.MeshMatcapMaterial({ matcap: metalcap, color: FINISHES.ottone });

  /* floating brass objects framing the centred wordmark:
     towel ring (left), robe hook (right), bar (behind, low) */
  const objs = new THREE.Group();

  const ring = new THREE.Group();
  ring.add(new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.13, 32, 120), brass));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 32), brass);
  knob.position.y = 1.12;
  ring.add(knob);
  ring.userData = { base: new THREE.Vector3(-3.7, 1.2, -1.4), fx: 0.4, fy: 0.3, ph: 0, rs: 0.9 };

  const hook = new THREE.Group();
  const hookPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.0, 0),
    new THREE.Vector3(0, 0.2, 0.12),
    new THREE.Vector3(0, -0.55, 0.1),
    new THREE.Vector3(0, -0.9, 0.32),
    new THREE.Vector3(0, -0.72, 0.62),
  ]);
  hook.add(new THREE.Mesh(new THREE.TubeGeometry(hookPath, 64, 0.11, 20), brass));
  const hookBall = new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 32), brass);
  hookBall.position.set(0, -0.7, 0.64);
  hook.add(hookBall);
  const hookTop = new THREE.Mesh(new THREE.SphereGeometry(0.19, 32, 32), brass);
  hookTop.position.set(0, 1.05, 0);
  hook.add(hookTop);
  hook.userData = { base: new THREE.Vector3(3.7, -0.3, -0.8), fx: 0.6, fy: 0.4, ph: 2.1, rs: -0.7 };

  const bar = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 3.6, 8, 24), brass);
  rod.rotation.z = Math.PI / 2;
  bar.add(rod);
  bar.userData = { base: new THREE.Vector3(0.6, -2.2, -2.6), fx: 0.25, fy: 0.18, ph: 4.2, rs: 0.15 };

  const bead = new THREE.Group();
  bead.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 32), brass));
  bead.userData = { base: new THREE.Vector3(-2.2, -1.7, -1.8), fx: 0.5, fy: 0.35, ph: 5.3, rs: 0 };

  const floaters = [ring, hook, bar, bead];
  floaters.forEach((o) => objs.add(o));
  scene.add(objs);

  /* brass dust — normal blending so it reads on the light background */
  const N = 90;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 2.6 + Math.random() * 3.4;
    const t = Math.random() * Math.PI * 2;
    const p = (Math.random() - 0.5) * Math.PI;
    pos[i * 3] = Math.cos(t) * Math.cos(p) * r;
    pos[i * 3 + 1] = Math.sin(p) * r * 0.7;
    pos[i * 3 + 2] = Math.sin(t) * Math.cos(p) * r - 1.5;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sprite = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(143,107,51,0.9)');
    grad.addColorStop(0.6, 'rgba(143,107,51,0.35)');
    grad.addColorStop(1, 'rgba(143,107,51,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const dust = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.07, map: sprite, transparent: true, depthWrite: false, opacity: 0.55,
  }));
  scene.add(dust);

  const layout = () => {
    const w = heroCanvas.clientWidth;
    const s = w > 1100 ? 1 : w > 700 ? 0.78 : 0.55;
    objs.scale.setScalar(s);
  };
  layout();

  const mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  hero = {
    renderer, scene, camera, canvas: heroCanvas, visible: true,
    update(t) {
      for (const o of floaters) {
        const u = o.userData;
        o.position.x += (u.base.x + mouse.x * u.fx - o.position.x) * 0.05;
        o.position.y += (u.base.y - mouse.y * u.fy + Math.sin(t * 0.0007 + u.ph) * 0.16 - o.position.y) * 0.05;
        o.position.z = u.base.z;
        o.rotation.y = Math.sin(t * 0.0004 + u.ph) * 0.5 * u.rs + 0.3;
        o.rotation.z = Math.cos(t * 0.0005 + u.ph) * 0.16 * u.rs;
        o.rotation.x = Math.sin(t * 0.0003 + u.ph) * 0.2;
      }
      dust.rotation.y = t * 0.00003;
    },
    onResize: layout,
  };
}

/* ════════════════════════ ATELIER ════════════════════════ */
const atelierCanvas = document.getElementById('atelier-canvas');
let atelier = null;

if (atelierCanvas) {
  const renderer = makeRenderer(atelierCanvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.55, 7);
  camera.lookAt(0, -0.1, 0);
  scene.add(makeShadow(-1.85, 6, 0.3));

  /* shared materials — one matcap program, reused by every model */
  const metal = new THREE.MeshMatcapMaterial({ matcap: metalcap, color: FINISHES.ottone });
  const marble = new THREE.MeshMatcapMaterial({ matcap: softcap, color: 0xf2eee5 });
  const paper = new THREE.MeshMatcapMaterial({ matcap: softcap, color: 0xf7f4ec });
  const cardboard = new THREE.MeshMatcapMaterial({ matcap: softcap, color: 0xd9d2c2 });

  const M = (geo, mat = metal) => new THREE.Mesh(geo, mat);
  const cyl = (r, h, mat = metal, seg = 48) => M(new THREE.CylinderGeometry(r, r, h, seg), mat);

  /* rosette: wall-mount disc, axis along Z */
  function rosette(x, y, z, r = 0.32) {
    const grp = new THREE.Group();
    const disc = cyl(r, 0.1);
    disc.rotation.x = Math.PI / 2;
    const lip = cyl(r * 0.75, 0.08);
    lip.rotation.x = Math.PI / 2;
    lip.position.z = 0.08;
    grp.add(disc, lip);
    grp.position.set(x, y, z);
    return grp;
  }

  const builders = {

    /* towel bar */
    lungo() {
      const grp = new THREE.Group();
      grp.add(rosette(-1.7, 0, -0.55), rosette(1.7, 0, -0.55));
      for (const sx of [-1.7, 1.7]) {
        const arm = cyl(0.085, 0.6);
        arm.rotation.x = Math.PI / 2;
        arm.position.set(sx, 0, -0.25);
        grp.add(arm);
      }
      const bar = cyl(0.078, 3.9);
      bar.rotation.z = Math.PI / 2;
      bar.position.z = 0.05;
      grp.add(bar);
      for (const sx of [-1.98, 1.98]) {
        const cap = M(new THREE.SphereGeometry(0.12, 32, 32));
        cap.position.set(sx, 0, 0.05);
        grp.add(cap);
      }
      grp.rotation.y = 0.35;
      return grp;
    },

    /* robe hook: tube along a J-curve */
    uncino() {
      const grp = new THREE.Group();
      grp.add(rosette(0, 0.95, -0.4, 0.38));
      const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.95, -0.35),
        new THREE.Vector3(0, 0.95, 0.28),
        new THREE.Vector3(0, 0.55, 0.5),
        new THREE.Vector3(0, -0.5, 0.52),
        new THREE.Vector3(0, -0.95, 0.75),
        new THREE.Vector3(0, -0.75, 1.1),
      ]);
      grp.add(M(new THREE.TubeGeometry(path, 80, 0.095, 24)));
      const ball = M(new THREE.SphereGeometry(0.16, 32, 32));
      ball.position.set(0, -0.72, 1.12);
      grp.add(ball);
      grp.rotation.y = -0.5;
      grp.scale.setScalar(1.25);
      return grp;
    },

    /* marble shelf with brass gallery rail */
    piano() {
      const grp = new THREE.Group();
      const slab = M(new THREE.BoxGeometry(3.4, 0.15, 1.1), marble);
      slab.position.y = 0.15;
      grp.add(slab);
      for (const sx of [-1.35, 1.35]) {
        const v = M(new THREE.BoxGeometry(0.09, 0.55, 0.12));
        v.position.set(sx, -0.2, -0.42);
        const h = M(new THREE.BoxGeometry(0.09, 0.08, 0.85));
        h.position.set(sx, 0.03, -0.05);
        grp.add(v, h);
      }
      const rail = cyl(0.032, 3.15);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0, 0.62, 0.48);
      grp.add(rail);
      for (const sx of [-1.5, 1.5]) {
        const post = cyl(0.032, 0.34);
        post.position.set(sx, 0.45, 0.48);
        grp.add(post);
        const knob = M(new THREE.SphereGeometry(0.06, 24, 24));
        knob.position.set(sx, 0.64, 0.48);
        grp.add(knob);
      }
      grp.rotation.y = 0.3;
      return grp;
    },

    /* toilet-paper holder */
    rotolo() {
      const grp = new THREE.Group();
      grp.add(rosette(-0.95, 0.7, -0.5, 0.34));
      const armZ = cyl(0.06, 0.6);
      armZ.rotation.x = Math.PI / 2;
      armZ.position.set(-0.95, 0.7, -0.2);
      grp.add(armZ);
      const drop = cyl(0.06, 0.45);
      drop.position.set(-0.95, 0.5, 0.1);
      grp.add(drop);
      const barX = cyl(0.055, 1.9);
      barX.rotation.z = Math.PI / 2;
      barX.position.set(-0.05, 0.28, 0.1);
      grp.add(barX);
      const cap = M(new THREE.SphereGeometry(0.11, 32, 32));
      cap.position.set(0.9, 0.28, 0.1);
      grp.add(cap);
      const roll = cyl(0.6, 1.05, paper, 64);
      roll.rotation.z = Math.PI / 2;
      roll.position.set(0.05, 0.28, 0.1);
      grp.add(roll);
      const core = cyl(0.18, 1.07, cardboard, 32);
      core.rotation.z = Math.PI / 2;
      core.position.set(0.05, 0.28, 0.1);
      grp.add(core);
      const sheet = M(new THREE.BoxGeometry(1.02, 0.85, 0.025), paper);
      sheet.position.set(0.05, -0.12, 0.68);
      sheet.rotation.x = 0.06;
      grp.add(sheet);
      grp.position.y = 0.1;
      grp.rotation.y = 0.35;
      grp.scale.setScalar(1.15);
      return grp;
    },

    /* hair-dryer holder: tilted open cone cradle */
    aria() {
      const grp = new THREE.Group();
      const plate = M(new THREE.BoxGeometry(0.55, 1.15, 0.1));
      plate.position.set(0, 0.15, -0.62);
      grp.add(plate);
      const arm = cyl(0.07, 0.55);
      arm.rotation.x = Math.PI / 2;
      arm.position.set(0, 0.35, -0.32);
      grp.add(arm);
      const cradle = new THREE.Group();
      const cone = M(new THREE.CylinderGeometry(0.62, 0.42, 0.95, 64, 1, true));
      cone.material = metal;
      cone.material.side = THREE.DoubleSide;
      const rimT = M(new THREE.TorusGeometry(0.62, 0.045, 24, 96));
      rimT.rotation.x = Math.PI / 2;
      rimT.position.y = 0.475;
      const rimB = M(new THREE.TorusGeometry(0.42, 0.045, 24, 96));
      rimB.rotation.x = Math.PI / 2;
      rimB.position.y = -0.475;
      cradle.add(cone, rimT, rimB);
      cradle.rotation.x = 0.42;
      cradle.position.set(0, 0.12, 0.25);
      grp.add(cradle);
      const hookPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.42, -0.55),
        new THREE.Vector3(0, -0.85, -0.4),
        new THREE.Vector3(0, -0.95, -0.05),
        new THREE.Vector3(0, -0.8, 0.18),
      ]);
      grp.add(M(new THREE.TubeGeometry(hookPath, 48, 0.05, 16)));
      grp.rotation.y = -0.45;
      grp.scale.setScalar(1.3);
      grp.position.y = 0.1;
      return grp;
    },

    /* napkin holder: brass base, two arches, linen napkins */
    piega() {
      const grp = new THREE.Group();
      const base = M(new THREE.BoxGeometry(1.8, 0.12, 0.95));
      base.position.y = -0.75;
      grp.add(base);
      for (const sz of [-0.32, 0.32]) {
        const archGrp = new THREE.Group();
        const arch = M(new THREE.TorusGeometry(0.72, 0.05, 24, 96, Math.PI));
        archGrp.add(arch);
        archGrp.position.set(0, -0.69, sz);
        grp.add(archGrp);
      }
      for (let i = 0; i < 7; i++) {
        const nap = M(new THREE.BoxGeometry(0.035, 0.95, 0.62), paper);
        nap.position.set(-0.36 + i * 0.12, -0.2, 0);
        nap.rotation.z = (Math.random() - 0.5) * 0.07;
        grp.add(nap);
      }
      grp.rotation.y = 0.4;
      grp.scale.setScalar(1.25);
      grp.position.y = 0.35;
      return grp;
    },
  };

  const holder = new THREE.Group();
  scene.add(holder);
  let current = null;

  function setModel(key) {
    const build = builders[key];
    if (!build) return;
    const next = build();
    const spawn = () => {
      holder.clear();
      holder.add(next);
      next.scale.multiplyScalar(0.01);
      const target = next.scale.x * 100;
      if (window.gsap) {
        gsap.to(next.scale, { x: target, y: target, z: target, duration: 0.9, ease: 'elastic.out(1, 0.65)' });
      } else {
        next.scale.setScalar(target);
      }
      /* swing-in: the frame loop lerps rot.y toward rot.ty */
      rot.y = -1.5; rot.x = 0.15;
      rot.ty = 0; rot.tx = 0;
    };
    if (current && window.gsap) {
      const old = current;
      gsap.to(old.scale, {
        x: 0.01, y: 0.01, z: 0.01, duration: 0.3, ease: 'power2.in', onComplete: spawn,
      });
    } else {
      spawn();
    }
    current = next;
  }

  function setFinish(key) {
    const hex = FINISHES[key];
    if (hex === undefined) return;
    if (window.gsap) {
      const c = new THREE.Color(hex);
      gsap.to(metal.color, { r: c.r, g: c.g, b: c.b, duration: 0.6, ease: 'power2.out' });
    } else {
      metal.color.setHex(hex);
    }
  }

  /* drag rotation */
  const rot = { x: 0, y: 0, tx: 0, ty: 0, auto: true, idleAt: 0 };
  let dragging = false, px = 0, py = 0;
  atelierCanvas.addEventListener('pointerdown', (e) => {
    dragging = true; px = e.clientX; py = e.clientY;
    rot.auto = false;
    atelierCanvas.classList.add('is-dragging');
    atelierCanvas.setPointerCapture(e.pointerId);
  });
  atelierCanvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    rot.ty += (e.clientX - px) * 0.008;
    rot.tx += (e.clientY - py) * 0.005;
    rot.tx = Math.max(-0.7, Math.min(0.7, rot.tx));
    px = e.clientX; py = e.clientY;
  });
  const endDrag = () => {
    dragging = false;
    atelierCanvas.classList.remove('is-dragging');
    rot.idleAt = performance.now();
  };
  atelierCanvas.addEventListener('pointerup', endDrag);
  atelierCanvas.addEventListener('pointercancel', endDrag);

  setModel('lungo');

  /* warm-up: compile the few matcap programs once, while the preloader is up */
  const warm = new THREE.Group();
  for (const m of [metal, marble, paper, cardboard]) {
    warm.add(new THREE.Mesh(new THREE.BoxGeometry(0.001, 0.001, 0.001), m));
  }
  scene.add(warm);
  renderer.render(scene, camera);
  scene.remove(warm);

  atelier = {
    renderer, scene, camera, canvas: atelierCanvas, visible: false,
    update(t) {
      if (!dragging && !rot.auto && t - rot.idleAt > 2600) rot.auto = true;
      if (rot.auto) rot.ty += 0.004;
      rot.y += (rot.ty - rot.y) * 0.08;
      rot.x += (rot.tx - rot.x) * 0.08;
      holder.rotation.y = rot.y;
      holder.rotation.x = rot.x;
      holder.position.y = Math.sin(t * 0.0009) * 0.06;
    },
  };

  window.atelier3d = { setModel, setFinish };
}

/* ════════════════════════ LOOP + RESIZE ════════════════════════ */
const scenes = [hero, atelier].filter(Boolean);

function resize() {
  for (const s of scenes) {
    const w = s.canvas.clientWidth, h = s.canvas.clientHeight;
    if (!w || !h) continue;
    s.renderer.setSize(w, h, false);
    s.camera.aspect = w / h;
    s.camera.updateProjectionMatrix();
    if (s.onResize) s.onResize();
  }
}
window.addEventListener('resize', resize);
resize();

/* only render what is on screen */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const s = scenes.find((x) => x.canvas === e.target);
    if (s) s.visible = e.isIntersecting;
  }
}, { rootMargin: '80px' });
scenes.forEach((s) => io.observe(s.canvas));

function loop(t) {
  for (const s of scenes) {
    if (!s.visible) continue;
    s.update(t);
    s.renderer.render(s.scene, s.camera);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
