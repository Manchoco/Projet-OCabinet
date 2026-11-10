// O'Cabinet — « Le Cercle ».
// Scène en papier découpé : le logo tourne au centre, la caméra tourne autour par défaut,
// puis le défilement la conduit de station en station (deux têtes, tête-projecteur, poignée de main).
// Au chapitre 2, la lumière baisse et la lampe projette un texte sur un mur.
import * as THREE from '../vendor/three.module.min.js';

const WA = '2250142236993';
const CONFIG = {
  // Pour un envoi réellement anonyme (sans numéro WhatsApp), coller ici l'URL d'un service
  // de formulaire qui accepte un POST JSON (Formspree, Web3Forms, fonction serveur…).
  anonEndpoint: ''
};

const WORLDS = {
  psy: {
    volet: 'Accompagnement psychologique',
    labels: ['', 'Démêler', 'Éclairer', 'Ensemble', '', 'Rendez-vous'],
    projection: [['Y voir', 'clair'], ['Retrouver', 'tes repères']],
    rdv: "Bonjour O'Cabinet, je souhaite prendre rendez-vous pour un accompagnement psychologique.",
    themes: ['Gestion du stress et de l\'anxiété', 'Estime de soi', 'Deuil et séparation', 'Couple et famille', 'Autre thème'],
    meta: '#e4e8f2',
    scene: { bg: 0xe4e8f2, ground: 0xd8deeb, sky: 0xffffff, low: 0xaab5d0, hemi: 1.55, sun: 1.7 }
  },
  pro: {
    volet: 'Accompagnement professionnel',
    labels: ['', 'Démêler', 'Se projeter', 'Ensemble', '', 'Rendez-vous'],
    projection: [['Te', 'projeter'], ['Choisir', 'ta route']],
    rdv: "Bonjour O'Cabinet, je souhaite prendre rendez-vous pour un accompagnement professionnel.",
    themes: ['Orientation et choix de filière', 'Reconversion', 'Recherche d\'emploi', 'Prise de poste et leadership', 'Autre thème'],
    meta: '#edf0f6',
    scene: { bg: 0xedf0f6, ground: 0xe0e5ef, sky: 0xffffff, low: 0xbcc6dc, hemi: 1.75, sun: 1.9 }
  }
};
const NIGHT = { bg: 0x0b1226, ground: 0x111b37 };

const body = document.body;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const mobile = matchMedia('(max-width: 860px)');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

let world = 'psy';
const state = { mixT: 0 };

/* ---------------- Interface ---------------- */
function setWorld(w) {
  world = w;
  body.dataset.world = w;
  $$('[data-set]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.set === w)));
  $$('[data-wa="rdv"]').forEach((a) => { a.href = waLink(WORLDS[w].rdv); });
  $('meta[name="theme-color"]').content = WORLDS[w].meta;
  $('#pTheme').replaceChildren(...WORLDS[w].themes.map((t) => new Option(t, t)));
  state.mixT = w === 'pro' ? 1 : 0;
  ['#pReady', '#qReady'].forEach((id) => $(id).classList.remove('on'));
  lastShot = -1;
  requestAnimationFrame(measure);
}
$$('[data-set]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.set !== world) setWorld(b.dataset.set); }));

// Titres : découpe mot par mot pour l'apparition en cascade.
function split(el) {
  let i = 0;
  const walk = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((tok) => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { frag.append(' '); return; }
        const w = document.createElement('span'); w.className = 'w';
        const s = document.createElement('span'); s.style.setProperty('--i', i++); s.textContent = tok;
        w.append(s); frag.append(w);
      });
      n.replaceWith(frag);
    } else walk(n);
  });
  walk(el);
}
$$('[data-split]').forEach(split);
const revealables = $$('.rv, [data-split]');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  revealables.forEach((el) => io.observe(el));
} else revealables.forEach((el) => el.classList.add('in'));

/* ---------------- Formulaires ---------------- */
function ready(box, prev, link, msg) {
  prev.textContent = msg; link.href = waLink(msg);
  box.classList.add('on'); link.focus({ preventScroll: true });
  box.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
}
$('#fProg').addEventListener('submit', (e) => {
  e.preventDefault();
  const nom = $('#pNom').value.trim(), tel = $('#pTel').value.trim(), msg = $('#pMsg').value.trim();
  const err = $('#pErr'); err.textContent = '';
  if (!nom) { err.textContent = 'Indique ton prénom ou ton nom.'; $('#pNom').focus(); return; }
  if (tel.replace(/\D/g, '').length < 8) { err.textContent = 'Indique un numéro WhatsApp valide (au moins 8 chiffres).'; $('#pTel').focus(); return; }
  const lines = ["Bonjour O'Cabinet,", 'Je souhaite être prévenu(e) du lancement des programmes.', '',
    `Volet : ${WORLDS[world].volet}`, `Thème : ${$('#pTheme').value}`, `Nom : ${nom}`, `WhatsApp : ${tel}`];
  if (msg) lines.push('', msg);
  ready($('#pReady'), $('#pPrev'), $('#pSend'), lines.join('\n'));
});

const anonNote = $('#qAnonNote');
function syncMode() {
  const anon = $('#qAnon').checked;
  $('#qNomWrap').hidden = anon;
  anonNote.hidden = !anon;
  anonNote.textContent = CONFIG.anonEndpoint
    ? 'Ta question part sans ton nom ni ton numéro. Le cabinet ne peut pas te répondre en privé : la réponse sera donnée lors d\'une prochaine activité.'
    : 'Ton nom ne sera pas écrit dans le message. Attention : l\'envoi passe par WhatsApp, ton numéro reste donc visible par le cabinet.';
  $('#qBtn').textContent = anon && CONFIG.anonEndpoint ? 'Envoyer ma question' : 'Préparer ma question';
  $('#qReady').classList.remove('on');
}
$$('input[name="mode"]').forEach((r) => r.addEventListener('change', syncMode));
$('#fQ').addEventListener('submit', async (e) => {
  e.preventDefault();
  const anon = $('#qAnon').checked, nom = $('#qNom').value.trim(), q = $('#qTxt').value.trim();
  const err = $('#qErr'); err.textContent = '';
  if (q.length < 10) { err.textContent = 'Écris ta question en quelques mots (10 caractères au moins).'; $('#qTxt').focus(); return; }
  if (!anon && !nom) { err.textContent = 'Indique ton nom, ou choisis « Sans mon nom ».'; $('#qNom').focus(); return; }
  const box = $('#qReady'), link = $('#qSend');
  if (anon && CONFIG.anonEndpoint) {
    const btn = $('#qBtn'); btn.disabled = true;
    try {
      const r = await fetch(CONFIG.anonEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ volet: WORLDS[world].volet, question: q }) });
      if (!r.ok) throw new Error(String(r.status));
      e.target.reset(); syncMode();
      $('#qReadyT').textContent = 'Question envoyée.'; $('#qPrev').textContent = q;
      $('#qReadyS').textContent = 'Elle a été transmise au cabinet sans ton nom.';
      link.parentElement.hidden = true; box.classList.add('on');
    } catch (_) {
      err.textContent = 'L\'envoi n\'a pas abouti. Vérifie ta connexion et réessaie, ou écris au cabinet sur WhatsApp.';
    } finally { btn.disabled = false; }
    return;
  }
  link.parentElement.hidden = false;
  $('#qReadyT').textContent = 'Ta question est prête.';
  $('#qReadyS').textContent = 'Elle part quand tu appuies sur Envoyer dans WhatsApp.';
  const lines = ["Bonjour O'Cabinet, j'ai une question.", '', `Volet : ${WORLDS[world].volet}`,
    anon ? 'De la part de : anonyme' : `De la part de : ${nom}`, '', q];
  ready(box, $('#qPrev'), link, lines.join('\n'));
});

/* ---------------- Défilement → plans de caméra ---------------- */
let secs = [], vh = innerHeight, lastShot = -1;
function measure() {
  vh = innerHeight;
  secs = $$('[data-shot]').map((el, k, all) => {
    const r = el.getBoundingClientRect(), top = r.top + scrollY, h = r.height;
    let anchor = top + h / 2;
    if (k === 0) anchor = top + vh / 2;
    if (k === all.length - 1) anchor = top + h - vh / 2;
    return { el, shot: +el.dataset.shot, top, h, anchor };
  });
}
function progress() {
  const y = scrollY + vh / 2;
  let i = 0;
  while (i < secs.length - 2 && y >= secs[i + 1].anchor) i++;
  const a = secs[i], b = secs[i + 1] || a;
  const raw = b === a ? 0 : clamp((y - a.anchor) / (b.anchor - a.anchor));
  return { a: a.shot, b: b.shot, t: smooth(0.12, 0.88, raw), raw, y };
}
const local = (shot, y) => { const s = secs.find((x) => x.shot === shot); return s ? clamp((y - s.top) / s.h) : 0; };

const counter = $('#counter');
function hud(p) {
  const active = p.raw < 0.5 ? p.a : p.b;
  if (active !== lastShot) {
    lastShot = active;
    const lab = WORLDS[world].labels[active];
    counter.classList.toggle('off', !lab);
    if (lab) { $('#cNum').textContent = active === 5 ? '→' : `0${active}`; $('#cLab').textContent = lab; }
  }
  counter.style.setProperty('--p', local(active, p.y).toFixed(3));
}

let lastY = 0; const topBar = $('.top');
addEventListener('scroll', () => {
  const y = scrollY; topBar.classList.toggle('away', y > lastY && y > 240); lastY = y;
}, { passive: true });
setWorld('psy');
syncMode();
measure();
addEventListener('resize', measure);
if ('ResizeObserver' in window) new ResizeObserver(measure).observe($('main'));
document.fonts?.ready.then(measure);

/* ---------------- Scène 3D ---------------- */
async function startScene() {
  const canvas = $('#scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const small = mobile.matches;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const loader = new THREE.TextureLoader();
  const load = (url) => new Promise((res, rej) => loader.load(url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; res(t);
  }, undefined, rej));
  const [texLogo, texHeads, texLamp, texHands] = await Promise.all(
    ['logo', 'deux-tetes', 'tete-projecteur', 'poignee-de-main'].map((n) => load(`assets/img/${n}.webp`)));

  const scene = new THREE.Scene();
  const P = WORLDS.psy.scene, Q = WORLDS.pro.scene;
  const tmpC = new THREE.Color();
  const mixCol = (a, b, m) => new THREE.Color(a).lerp(tmpC.set(b), m);
  scene.fog = new THREE.Fog(P.bg, 16, 62);

  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  const hemi = new THREE.HemisphereLight(P.sky, P.low, P.hemi);
  const sun = new THREE.DirectionalLight(0xfff6ea, P.sun);
  sun.position.set(14, 22, -4); sun.target.position.set(0, 0, -20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 80 });
  sun.shadow.radius = 5; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
  scene.add(hemi, sun, sun.target);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(90, 72), new THREE.MeshStandardMaterial({ color: P.ground, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x1f4fb4, transparent: true, opacity: 0.12 });
  [4.2, 6.6, 9.4].forEach((r) => { const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.03, 128), ringMat); m.rotation.x = -Math.PI / 2; m.position.y = 0.01; scene.add(m); });

  // Découpe en papier épais : une face avant, une tranche en couches, une face arrière lisible.
  function cutout(tex, h, edge, layers = 8, depth = 0.08) {
    const w = h * tex.image.width / tex.image.height;
    const g = new THREE.Group(), geo = new THREE.PlaneGeometry(w, h);
    const back = tex.clone(); back.wrapS = THREE.RepeatWrapping; back.repeat.x = -1; back.offset.x = 1; back.needsUpdate = true;
    const base = { alphaTest: 0.5, roughness: 0.92, metalness: 0 };
    const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ ...base, map: tex }));
    front.position.z = depth / 2; front.castShadow = true;
    front.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    const rear = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ ...base, map: back }));
    rear.position.z = -depth / 2; rear.rotation.y = Math.PI;
    const edgeMat = new THREE.MeshStandardMaterial({ ...base, map: tex, color: edge, side: THREE.DoubleSide });
    for (let i = 1; i < layers; i++) { const m = new THREE.Mesh(geo, edgeMat); m.position.z = depth / 2 - (depth * i) / layers; g.add(m); }
    g.add(front, rear);
    g.userData = { w, h };
    return g;
  }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // Centre : le logo qui tourne
  const CEN = V(0, 2.5, 0);
  const logo = cutout(texLogo, 2.1, 0x2a3a72, 14, 0.07);
  logo.position.copy(CEN); scene.add(logo);

  // Station 1 : les deux têtes (de l'emmêlé au clair)
  const heads = cutout(texHeads, 3.9, 0x6b5f5a);
  heads.position.set(-5, 1.95, -13); heads.rotation.y = 0.22; scene.add(heads);

  // Station 2 : la tête-projecteur et son mur
  const lamp = cutout(texLamp, 4.4, 0x2b2b30);
  lamp.position.set(2.2, 2.2, -27); lamp.rotation.y = 0.1; scene.add(lamp);
  lamp.updateMatrixWorld(true);
  const lw = lamp.userData.w, lh = lamp.userData.h;
  const lampPt = lamp.localToWorld(V((0.5928 - 0.5) * lw, (0.6593 - 0.5) * lh, 0.1));
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 5.4), new THREE.MeshStandardMaterial({ color: 0xeef1f7, roughness: 1 }));
  wall.position.set(10, 2.75, -29.4); wall.rotation.y = -0.62; wall.receiveShadow = true; scene.add(wall);
  const wallBack = new THREE.Mesh(new THREE.BoxGeometry(8.8, 5.6, 0.12), new THREE.MeshStandardMaterial({ color: 0xc9d1e3, roughness: 1 }));
  wallBack.position.copy(wall.position); wallBack.rotation.y = wall.rotation.y; wallBack.translateZ(-0.08); wallBack.castShadow = true; scene.add(wallBack);
  const aim = wall.position.clone().add(V(0, 0.2, 0));
  const wallN = V(0, 0, 1).applyAxisAngle(V(0, 1, 0), wall.rotation.y);

  // Texte projeté : dessiné sur un canvas, envoyé dans le cône de la lampe.
  const PX = small ? 512 : 1024;
  const cv = document.createElement('canvas'); cv.width = cv.height = PX;
  const cx = cv.getContext('2d');
  const projTex = new THREE.CanvasTexture(cv); projTex.colorSpace = THREE.SRGBColorSpace;
  let projKey = '';
  function drawProjection(lines, blur) {
    const key = `${lines.join('|')}:${blur}`;
    if (key === projKey) return; projKey = key;
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.filter = 'none';
    cx.fillStyle = '#000'; cx.fillRect(0, 0, PX, PX);
    const pool = cx.createRadialGradient(PX / 2, PX / 2, PX * 0.05, PX / 2, PX / 2, PX * 0.5);
    pool.addColorStop(0, 'rgb(96,90,80)'); pool.addColorStop(0.75, 'rgb(60,56,50)'); pool.addColorStop(1, 'rgb(0,0,0)');
    cx.fillStyle = pool; cx.fillRect(0, 0, PX, PX);
    cx.filter = blur > 0 ? `blur(${(blur * PX) / 1024}px)` : 'none';
    cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    let size = PX * 0.2;
    cx.font = `400 ${size}px Anton, Impact, sans-serif`;
    const widest = Math.max(...lines.map((l) => cx.measureText(l.toUpperCase()).width));
    size *= Math.min(1, (PX * 0.66) / widest);
    cx.font = `400 ${size}px Anton, Impact, sans-serif`;
    lines.forEach((l, i) => cx.fillText(l.toUpperCase(), PX / 2, PX / 2 + (i - (lines.length - 1) / 2) * size * 1.02));
    projTex.needsUpdate = true;
  }
  const spot = new THREE.SpotLight(0xfff1d8, 0, 0, 0.3, 0.25, 0);
  spot.position.copy(lampPt); spot.target.position.copy(aim);
  spot.map = projTex; spot.castShadow = true;
  spot.shadow.mapSize.set(small ? 512 : 1024, small ? 512 : 1024); spot.shadow.bias = -0.0008;
  scene.add(spot, spot.target);

  // Faisceau visible + halo de la lampe
  const dir = aim.clone().sub(lampPt), L = dir.length(); dir.normalize();
  const gcv = document.createElement('canvas'); gcv.width = 4; gcv.height = 128;
  const gx = gcv.getContext('2d'); const grad = gx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#fff'); grad.addColorStop(0.15, '#bbb'); grad.addColorStop(1, '#222');
  gx.fillStyle = grad; gx.fillRect(0, 0, 4, 128);
  const beamGeo = new THREE.ConeGeometry(L * Math.tan(0.3), L, 64, 1, true); beamGeo.translate(0, -L / 2, 0);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xffe9bf, alphaMap: new THREE.CanvasTexture(gcv), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.copy(lampPt); beam.quaternion.setFromUnitVectors(V(0, -1, 0), dir); scene.add(beam);
  const hcv = document.createElement('canvas'); hcv.width = hcv.height = 64;
  const hx = hcv.getContext('2d'); const hg = hx.createRadialGradient(32, 32, 0, 32, 32, 32);
  hg.addColorStop(0, 'rgba(255,245,220,1)'); hg.addColorStop(1, 'rgba(255,245,220,0)'); hx.fillStyle = hg; hx.fillRect(0, 0, 64, 64);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(hcv), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, fog: false }));
  halo.position.copy(lampPt); halo.scale.setScalar(0.9); scene.add(halo);

  // Station 3 : la poignée de main, suspendue
  const hands = cutout(texHands, 2.7, 0x3d3d42);
  hands.position.set(-2, 3, -41); hands.rotation.y = 0.08; scene.add(hands);

  // Plans de caméra (p : position bureau, pM : position téléphone)
  const LOGO_SHOT = { t: CEN.clone(), p: V(2.6, 3.3, 9.6), pM: V(1.2, 3.9, 13.5), side: 1.05, upM: 0.27, fog: [10, 19] };
  const SHOTS = [
    { orbit: true, t: CEN.clone(), r: 9.5, rM: 11.8, y: 3.6, side: 1.05, upM: 0.27, fog: [10, 19] },
    { t: V(-5, 1.95, -13), p: V(-2.6, 3.0, -4.2), pM: V(-4.2, 3.6, -1.6), side: -1, upM: 0.24, fog: [12, 21] },
    { t: V(6.1, 2.5, -28.2), p: V(5.2, 3.1, -11.8), pM: aim.clone().addScaledVector(wallN, 10.5).add(V(0, 0.5, 0)), tM: aim.clone(),
      side: -0.12, upD: 0.13, upM: 0.2, fog: [14, 27] },
    { t: V(-2, 3, -41), p: V(-0.2, 3.7, -32.4), pM: V(-1.8, 3.7, -26.2), side: 1, upM: 0.14, fog: [12, 26] },
    LOGO_SHOT,
    LOGO_SHOT
  ];

  let W = 0, H = 0;
  function resize() {
    W = innerWidth; H = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile.matches ? 1.5 : 2));
    renderer.setSize(W, H, false);
    cam.fov = mobile.matches ? 52 : 34; cam.aspect = W / H; cam.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);

  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    addEventListener('pointermove', (e) => { pointer.x = e.clientX / W - 0.5; pointer.y = e.clientY / H - 0.5; }, { passive: true });
  }

  const pos = V(0, 4, 12), look = CEN.clone(), gP = V(), gT = V(), bP = V(), bT = V();
  let mix = 0, dark = 0, side = 1, up = 0, time = 0, prev = performance.now(), first = true;
  function pose(s, outP, outT) {
    const m = mobile.matches;
    outT.copy(m && s.tM ? s.tM : s.t);
    if (s.orbit) {
      const a = reduce ? -0.35 : -0.35 + Math.sin(time * 0.09) * 0.9;
      const r = m ? s.rM : s.r;
      outP.set(s.t.x + Math.sin(a) * r, s.y, s.t.z + Math.cos(a) * r);
    } else {
      outP.copy(m ? s.pM : s.p);
      if (!reduce) { outP.x += Math.sin(time * 0.3) * 0.22; outP.y += Math.sin(time * 0.23) * 0.1; }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { prev = now; return; }
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now; time += dt;
    const p = progress(); hud(p);
    const m = mobile.matches;
    const kSlow = 1 - Math.exp(-dt * 2.2), kCam = first ? 1 : 1 - Math.exp(-dt * 3.2);

    // Caméra
    const A = SHOTS[p.a], B = SHOTS[p.b];
    pose(A, gP, gT); pose(B, bP, bT);
    gP.lerp(bP, p.t); gT.lerp(bT, p.t);
    pos.lerp(gP, kCam); look.lerp(gT, kCam);
    const sT = m ? 0 : A.side + (B.side - A.side) * p.t;
    const uT = m ? A.upM + (B.upM - A.upM) * p.t : (A.upD || 0) + ((B.upD || 0) - (A.upD || 0)) * p.t;
    side += (sT - side) * kCam; up += (uT - up) * kCam; first = false;
    pointer.sx += (pointer.x - pointer.sx) * kSlow; pointer.sy += (pointer.y - pointer.sy) * kSlow;
    cam.position.copy(pos); cam.lookAt(look);
    cam.translateX(pointer.sx * -0.6); cam.translateY(pointer.sy * 0.35); cam.lookAt(look);
    cam.setViewOffset(W, H, -side * 0.2 * W, up * H, W, H);

    scene.fog.near = A.fog[0] + (B.fog[0] - A.fog[0]) * p.t;
    scene.fog.far = A.fog[1] + (B.fog[1] - A.fog[1]) * p.t;

    // Salle de projection : on baisse la lumière, la lampe s'allume, le texte se met au point
    const l2 = local(2, p.y);
    const dk = smooth(0.06, 0.26, l2) * (1 - smooth(0.84, 0.98, l2));
    const on = smooth(0.16, 0.36, l2) * (1 - smooth(0.86, 0.98, l2));
    dark += (dk - dark) * (1 - Math.exp(-dt * 4));
    mix += (state.mixT - mix) * kSlow;
    const room = dark > 0.5 ? 'dark' : 'light';
    if (body.dataset.room !== room) body.dataset.room = room;

    const phrases = WORLDS[world].projection;
    const second = l2 > 0.56;
    const blur = second ? 1 - smooth(0.58, 0.72, l2) : 1 - smooth(0.26, 0.44, l2);
    drawProjection(phrases[second ? 1 : 0], Math.round(blur * 6) * 4);
    spot.intensity = on * 2.6;
    spot.angle = 0.1 + 0.2 * smooth(0.16, 0.34, l2);
    const sc = Math.tan(spot.angle) / Math.tan(0.3);
    beam.scale.set(sc, 1, sc);
    beamMat.opacity = on * dark * 0.16;
    halo.material.opacity = on;

    const bg = mixCol(P.bg, Q.bg, mix).lerp(tmpC.set(NIGHT.bg), dark * 0.94);
    renderer.setClearColor(bg); scene.fog.color.copy(bg);
    ground.material.color.copy(mixCol(P.ground, Q.ground, mix).lerp(tmpC.set(NIGHT.ground), dark * 0.92));
    hemi.color.copy(mixCol(P.sky, Q.sky, mix)); hemi.groundColor.copy(mixCol(P.low, Q.low, mix));
    hemi.intensity = (P.hemi + (Q.hemi - P.hemi) * mix) * (1 - 0.86 * dark);
    sun.intensity = (P.sun + (Q.sun - P.sun) * mix) * (1 - 0.95 * dark);
    ringMat.opacity = 0.12 * (1 - dark);

    // Mouvements propres aux objets
    logo.rotation.y = reduce ? -0.3 : time * 0.32;
    logo.position.y = CEN.y + (reduce ? 0 : Math.sin(time * 0.8) * 0.08);
    const l3 = local(3, p.y);
    hands.position.y = 3 - 1.4 * (1 - smooth(0.05, 0.45, l3)) + (reduce ? 0 : Math.sin(time * 0.7) * 0.06);
    hands.rotation.y = 0.08 + 0.5 * (1 - smooth(0.05, 0.45, l3));
    heads.rotation.y = 0.22 + (reduce ? 0 : Math.sin(time * 0.4) * 0.05);

    if (!(p.a === 4 && p.b === 4)) renderer.render(scene, cam);
  }
  await document.fonts?.load('400 100px Anton').catch(() => {});
  requestAnimationFrame(frame);
}

startScene().catch((err) => {
  body.classList.add('no-gl');
  console.warn('Scène 3D indisponible sur cet appareil :', err);
  const tick = () => { hud(progress()); requestAnimationFrame(tick); };
  tick();
});
