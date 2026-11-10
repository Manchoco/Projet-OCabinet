// O'Cabinet — « Le Cercle ». Un anneau (le O), deux versants : Dedans (psy) et Devant (pro).
// La caméra tourne autour de l'anneau par défaut, puis suit le défilement de chapitre en chapitre.
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
    giants: ["O'", 'ÉCOUTER', 'DÉMÊLER', 'ÉCLAIRER', '', "O'"],
    labels: ['', 'Écouter', 'Démêler', 'Éclairer', '', 'Rendez-vous'],
    rdv: "Bonjour O'Cabinet, je souhaite prendre rendez-vous pour un accompagnement psychologique.",
    themes: ['Gestion du stress et de l\'anxiété', 'Estime de soi', 'Deuil et séparation', 'Couple et famille', 'Autre thème'],
    theme: '#0c1a3d'
  },
  pro: {
    volet: 'Accompagnement professionnel',
    giants: ["O'", 'SITUER', 'CLARIFIER', 'GRAVIR', '', "O'"],
    labels: ['', 'Situer', 'Clarifier', 'Gravir', '', 'Rendez-vous'],
    rdv: "Bonjour O'Cabinet, je souhaite prendre rendez-vous pour un accompagnement professionnel.",
    themes: ['Orientation et choix de filière', 'Reconversion', 'Recherche d\'emploi', 'Prise de poste et leadership', 'Autre thème'],
    theme: '#e8effb'
  }
};

const body = document.body;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const mobile = matchMedia('(max-width: 860px)');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

let world = 'psy';
const state = { phiT: 0, mixT: 0 };

/* ---------------- Interface ---------------- */
function setWorld(w, announce = true) {
  world = w;
  body.dataset.world = w;
  $$('[data-set]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.set === w)));
  $$('[data-wa="rdv"]').forEach((a) => { a.href = waLink(WORLDS[w].rdv); });
  $('meta[name="theme-color"]').content = WORLDS[w].theme;
  const sel = $('#pTheme');
  sel.replaceChildren(...WORLDS[w].themes.map((t) => new Option(t, t)));
  state.phiT = w === 'pro' ? Math.PI : 0;
  state.mixT = w === 'pro' ? 1 : 0;
  ['#pReady', '#qReady'].forEach((id) => $(id).classList.remove('on'));
  lastShot = -1;
  if (announce) requestAnimationFrame(measure);
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
      $('#qReadyT').textContent = 'Question envoyée.'; $('#qPrev').textContent = q;
      $('#qReadyS').textContent = 'Elle a été transmise au cabinet sans ton nom.';
      link.parentElement.hidden = true; box.classList.add('on'); e.target.reset(); syncMode(); box.classList.add('on');
    } catch (_) {
      err.textContent = 'L\'envoi n\'a pas abouti. Vérifie ta connexion et réessaie, ou écris au cabinet sur WhatsApp.';
    } finally { btn.disabled = false; }
    return;
  }
  link.parentElement.hidden = false;
  $('#qReadyT').textContent = 'Ta question est prête.';
  $('#qReadyS').textContent = 'Elle part quand tu appuies sur Envoyer dans WhatsApp.';
  const lines = ["Bonjour O'Cabinet, j'ai une question.", '', `Volet : ${WORLDS[world].volet}`];
  lines.push(anon ? 'De la part de : anonyme' : `De la part de : ${nom}`, '', q);
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
  return { a: a.shot, b: b.shot, t: smooth(0.14, 0.86, raw), raw, y };
}
const local = (shot, y) => { const s = secs.find((x) => x.shot === shot); return s ? clamp((y - s.top) / s.h) : 0; };

const giant = $('#giant'), counter = $('#counter');
function hud(p) {
  const active = p.raw < 0.5 ? p.a : p.b;
  if (!reduce) giant.style.setProperty('--gx', `${((p.raw - 0.5) * -140).toFixed(1)}px`);
  if (active !== lastShot) {
    lastShot = active;
    const word = WORLDS[world].giants[active];
    giant.classList.add('swap');
    setTimeout(() => { giant.textContent = word; giant.classList.remove('swap'); }, 220);
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
measure();
setWorld('psy', false);
syncMode();
addEventListener('resize', measure);
if ('ResizeObserver' in window) new ResizeObserver(measure).observe($('main'));
document.fonts?.ready.then(measure);

/* ---------------- Scène 3D ---------------- */
function startScene() {
  const canvas = $('#scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = !mobile.matches;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const PAL = {
    psy: { bg: 0x0c1a3d, ground: 0x12265a, sky: 0xc5d4ff, low: 0x2a4488, hemi: 1.9, sun: 3.0, ripple: 0x7fa6ea },
    pro: { bg: 0xe8effb, ground: 0xdbe5f7, sky: 0xffffff, low: 0xb9c8e6, hemi: 1.35, sun: 1.9, ripple: 0x1f46c8 }
  };
  const col = (k, m) => new THREE.Color(PAL.psy[k]).lerp(new THREE.Color(PAL.pro[k]), m);
  scene.fog = new THREE.FogExp2(PAL.psy.bg, 0.034);

  const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  const hemi = new THREE.HemisphereLight(PAL.psy.sky, PAL.psy.low, PAL.psy.hemi);
  const sun = new THREE.DirectionalLight(0xffffff, PAL.psy.sun);
  sun.position.set(9, 18, -6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 60 });
  sun.shadow.radius = 6; sun.shadow.bias = -0.0004;
  scene.add(hemi, sun);

  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.02, ...o });
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  const C = { royal: 0x2850d8, sky: 0x7fa6ea, coral: 0xff5a3c, pale: 0xffd3c7, navy: 0x16285c, white: 0xf4f7ff };

  // Sol + ondes concentriques (le cercle qui se propage)
  const ground = new THREE.Mesh(new THREE.CircleGeometry(90, 72), std(PAL.psy.ground, { roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const rippleMat = new THREE.MeshBasicMaterial({ color: PAL.psy.ripple, transparent: true, opacity: 0.22 });
  [5.5, 9, 13.5, 19, 25.5].forEach((r) => { const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.035, 128), rippleMat); m.rotation.x = -Math.PI / 2; m.position.y = 0.012; scene.add(m); });

  // Le O et le logo qui tourne en son centre
  const CEN = new THREE.Vector3(0, 3.7, 0);
  const ring = mesh(new THREE.TorusGeometry(3.1, 0.4, 28, 120), std(C.royal, { roughness: 0.32, metalness: 0.08 }), CEN.x, CEN.y, CEN.z);
  const apos = mesh(new THREE.CapsuleGeometry(0.2, 0.62, 8, 16), std(C.coral, { roughness: 0.35 }), 3.75, 6.95, 0);
  apos.rotation.z = -0.38;
  scene.add(ring, apos);
  const card = new THREE.Group(); card.position.copy(CEN); scene.add(card);
  card.add(mesh(new THREE.BoxGeometry(4.15, 2.0, 0.07), std(0xffffff, { roughness: 0.6 })));
  new THREE.TextureLoader().load('assets/logo-ocabinet.jpg', (tx) => {
    tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const m = new THREE.MeshBasicMaterial({ map: tx, toneMapped: false, fog: false });
    const f = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 1.775), m); f.position.z = 0.04;
    const b = f.clone(); b.position.z = -0.04; b.rotation.y = Math.PI;
    card.add(f, b);
  });

  // Personnage stylisé (capsules et sphères), assis ou debout
  function person(color, seated) {
    const g = new THREE.Group(), m = std(color);
    if (seated) {
      g.add(mesh(new THREE.CapsuleGeometry(0.3, 0.62, 6, 16), m, 0, 1.3, 0), mesh(new THREE.SphereGeometry(0.27, 24, 18), m, 0.04, 2.14, 0));
      [-0.17, 0.17].forEach((z) => {
        const th = mesh(new THREE.CapsuleGeometry(0.13, 0.55, 4, 10), m, 0.36, 0.78, z); th.rotation.z = Math.PI / 2;
        g.add(th, mesh(new THREE.CapsuleGeometry(0.12, 0.5, 4, 10), m, 0.74, 0.4, z));
      });
      const arm = mesh(new THREE.CapsuleGeometry(0.09, 0.55, 4, 10), m, 0.42, 1.38, 0.3); arm.rotation.z = 1.15; g.add(arm);
    } else {
      g.add(mesh(new THREE.CapsuleGeometry(0.28, 0.6, 6, 16), m, 0, 1.25, 0), mesh(new THREE.SphereGeometry(0.25, 24, 18), m, 0, 2.02, 0));
      [-0.14, 0.14].forEach((x) => g.add(mesh(new THREE.CapsuleGeometry(0.11, 0.6, 4, 10), m, x, 0.42, 0)));
    }
    return g;
  }
  const arm = (color, x, y, z, rz) => { const a = mesh(new THREE.CapsuleGeometry(0.085, 0.62, 4, 10), std(color), x, y, z); a.rotation.z = rz; return a; };

  // Station « deux fauteuils »
  function chairs() {
    const g = new THREE.Group();
    const rug = new THREE.Mesh(new THREE.CircleGeometry(3.3, 64), new THREE.MeshBasicMaterial({ color: C.sky, transparent: true, opacity: 0.1 }));
    rug.rotation.x = -Math.PI / 2; rug.position.y = 0.02; g.add(rug);
    [[-1.55, C.royal, C.sky, 0], [1.55, C.pale, C.coral, Math.PI]].forEach(([x, cc, pc, ry]) => {
      const s = new THREE.Group(); s.position.x = x; s.rotation.y = ry;
      s.add(mesh(new THREE.CylinderGeometry(0.78, 0.6, 0.62, 40), std(cc), 0, 0.31, 0));
      const back = mesh(new THREE.SphereGeometry(1, 32, 24), std(cc), -0.62, 1.05, 0); back.scale.set(0.36, 1.05, 0.86); s.add(back);
      s.add(person(pc, true)); g.add(s);
    });
    return g;
  }

  // Station « le fil » : un nœud qui se déroule en trajectoire
  function thread() {
    const g = new THREE.Group(), N = 84;
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const tang = [], ord = []; const v = new THREE.Vector3(1, 0, 0);
    for (let i = 0; i < N; i++) {
      v.add(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(1.5)).normalize();
      tang.push(v.clone().multiplyScalar(0.85 + rnd() * 0.55).add(new THREE.Vector3(-0.9, -0.5, 0)));
      const s = i / (N - 1);
      ord.push(new THREE.Vector3(-1.9 + 3.9 * s, -1.1 + 2.5 * s + Math.sin(s * Math.PI * 2) * 0.2, Math.cos(s * Math.PI * 2) * 0.2));
    }
    const line = mesh(new THREE.BufferGeometry(), std(C.coral, { roughness: 0.4 }));
    const tip = mesh(new THREE.ConeGeometry(0.2, 0.5, 20), std(C.coral, { roughness: 0.4 }));
    g.add(line, tip);
    let last = -1;
    g.userData.update = (u) => {
      if (Math.abs(u - last) < 0.004) return; last = u;
      const pts = tang.map((p, i) => { const s = (1 - i / N) * 0.5; return p.clone().lerp(ord[i], smooth(s, s + 0.5, u)); });
      const curve = new THREE.CatmullRomCurve3(pts);
      line.geometry.dispose(); line.geometry = new THREE.TubeGeometry(curve, 380, 0.055, 8, false);
      const end = curve.getPoint(1), tan = curve.getTangent(1);
      tip.position.copy(end).addScaledVector(tan, 0.2);
      tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
      tip.scale.setScalar(0.001 + smooth(0.75, 1, u));
    };
    g.userData.update(0);
    return g;
  }

  // Station « la lampe » : un faisceau balaie les questions, qui deviennent des repères
  function beam() {
    const g = new THREE.Group();
    [[1.7, 0], [1.25, 0.3], [0.8, 0.6]].forEach(([r, y]) => g.add(mesh(new THREE.CylinderGeometry(r, r, 0.3, 48), std(C.royal), 0, y + 0.15, 0)));
    const p = person(C.sky, false); p.position.y = 0.9; g.add(p, arm(C.sky, 0.36, 2.2, 0.1, -1.1));
    const pivot = new THREE.Group(); pivot.position.set(0.72, 2.38, 0.1); g.add(pivot);
    pivot.add(mesh(new THREE.SphereGeometry(0.13, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1c4 })));
    const coneGeo = new THREE.ConeGeometry(1.5, 6.4, 40, 1, true); coneGeo.translate(0, -3.2, 0); coneGeo.rotateZ(Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0xffe7a3, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
    pivot.add(new THREE.Mesh(coneGeo, coneMat));
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.font = '800 112px Arial, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('?', 64, 70);
    const qTex = new THREE.CanvasTexture(cv);
    const marks = [[3.1, 3.2, 0.6], [4.2, 2.2, -0.9], [2.6, 1.5, 1.3], [4.6, 3.6, 0.9], [3.6, 4.3, -0.5]].map(([x, y, z], i) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: qTex, color: C.sky, transparent: true, depthWrite: false }));
      sp.position.set(x, y, z); sp.scale.setScalar(0.62);
      const dot = mesh(new THREE.SphereGeometry(0.15, 20, 14), std(C.coral), x, y, z);
      g.add(sp, dot); return { sp, dot, i, y };
    });
    g.userData.update = (u, t) => {
      pivot.rotation.y = reduce ? 0 : Math.sin(t * 0.6) * 0.3;
      pivot.rotation.z = 0.12 + (reduce ? 0 : Math.sin(t * 0.43) * 0.14);
      coneMat.opacity = 0.1 + 0.2 * smooth(0.1, 0.5, u);
      marks.forEach((m) => {
        const k = smooth(0.3 + m.i * 0.07, 0.55 + m.i * 0.07, u);
        m.sp.material.opacity = 1 - k; m.dot.scale.setScalar(0.4 + 0.6 * k); m.dot.visible = k > 0.02;
        m.sp.position.y = m.y + (reduce ? 0 : Math.sin(t * 0.9 + m.i) * 0.08);
      });
    };
    return g;
  }

  // Station « les marches » : des paliers qui montent, une main tendue
  function stairs() {
    const g = new THREE.Group();
    const H = [0.7, 1.4, 2.15, 2.95, 3.85], cols = [0x1f46c8, 0x3e68dd, 0x7fa6ea, 0xffb09f, 0xff5a3c];
    const geo = new THREE.BoxGeometry(1.05, 1, 1.5); geo.translate(0, 0.5, 0);
    const bars = H.map((h, i) => { const b = mesh(geo, std(cols[i]), (i - 2) * 1.14, 0, 0); g.add(b); return b; });
    const top = new THREE.Group(), low = new THREE.Group();
    top.add(person(C.navy, false), arm(C.navy, -0.42, 1.25, 0.12, -0.75)); top.position.x = 2 * 1.14;
    low.add(person(C.white, false), arm(C.white, 0.4, 1.72, 0.12, -2.3)); low.position.x = 0;
    g.add(top, low);
    g.userData.update = (u) => {
      bars.forEach((b, i) => { b.scale.y = H[i] * (0.3 + 0.7 * smooth(i * 0.07, 0.42 + i * 0.07, u)); });
      top.position.y = bars[4].scale.y; low.position.y = bars[2].scale.y;
    };
    g.userData.update(0);
    return g;
  }

  // Plans de caméra (versant psy). Le versant pro est le même plan tourné de 180° autour du O.
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const SHOTS = [
    { orbit: true, t: CEN.clone(), dist: 16.5, distM: 17.5, side: 1.1, up: 0, upM: 0.27 },
    { t: V(-9, 1.15, -9), n: V(0.66, 0.2, 0.72), dist: 9.4, distM: 10, side: 1 },
    { t: V(8.5, 2.7, -11), n: V(-0.6, 0.06, 0.8), dist: 8.6, distM: 10.5, side: -1 },
    { t: V(-1, 2.15, -20.5), n: V(0.6, 0.1, 0.79), dist: 11.5, distM: 12.5, side: 1 },
    { t: V(0, 2.5, -4), n: V(0, 0.62, -0.78), dist: 30, distM: 34, side: 0 },
    { t: CEN.clone(), n: V(0.12, 0.6, -0.79), dist: 15, distM: 18, side: 1.15, up: 0.1, upM: 0.24 }
  ];
  SHOTS.forEach((s) => s.n && s.n.normalize());
  const flip = (v) => V(-v.x, v.y, -v.z);
  const stage = new THREE.Group(); stage.position.y = -9; scene.add(stage);
  const place = (obj, pos, shot, pro) => {
    const p = pro ? flip(pos) : pos; obj.position.copy(p);
    const c = shot.t.clone().addScaledVector(shot.n, shot.dist); const cc = pro ? flip(c) : c;
    obj.lookAt(cc.x, p.y, cc.z); stage.add(obj); return obj;
  };
  place(chairs(), V(-9, 0, -9), SHOTS[1], false);
  place(chairs(), V(-9, 0, -9), SHOTS[1], true);
  const knot = place(thread(), V(8.5, 2.7, -11), SHOTS[2], false);
  const lampPsy = place(beam(), V(-2.6, 0, -20.5), SHOTS[3], false);
  const lampPro = place(beam(), V(7, 0, -11), SHOTS[2], true);
  const steps = place(stairs(), V(-1, 0, -20.5), SHOTS[3], true);

  let W = 0, H = 0;
  function resize() {
    W = innerWidth; H = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile.matches ? 1.5 : 2));
    renderer.setSize(W, H, false);
    cam.fov = mobile.matches ? 58 : 36; cam.aspect = W / H; cam.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);

  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    addEventListener('pointermove', (e) => { pointer.x = e.clientX / W - 0.5; pointer.y = e.clientY / H - 0.5; }, { passive: true });
  }

  const pos = V(0, 5, -16), look = CEN.clone(), goalP = V(), goalT = V(), tmpA = V(), tmpB = V();
  let rise = 0, phi = 0, mix = 0, side = 1, up = 0, time = 0.6, prev = performance.now(), first = true;
  const Y = V(0, 1, 0);
  function shotPose(s, outP, outT) {
    const d = mobile.matches ? s.distM : s.dist;
    outT.copy(s.t);
    if (s.orbit) { const a = reduce ? 0.45 : time * 0.13; outP.set(Math.sin(a) * d, s.t.y + 1.3, -Math.cos(a) * d); }
    else {
      outP.copy(s.t).addScaledVector(s.n, d);
      if (!reduce) { outP.x += Math.sin(time * 0.35) * 0.25; outP.y += Math.sin(time * 0.27) * 0.12; }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { prev = now; return; }
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now; time += dt;
    const p = progress(); hud(p);
    const kSlow = 1 - Math.exp(-dt * 2.4), kCam = first ? 1 : 1 - Math.exp(-dt * 3.4);
    phi += (state.phiT - phi) * kSlow; mix += (state.mixT - mix) * kSlow;

    const A = SHOTS[p.a], B = SHOTS[p.b];
    shotPose(A, goalP, goalT); shotPose(B, tmpA, tmpB);
    goalP.lerp(tmpA, p.t).applyAxisAngle(Y, phi); goalT.lerp(tmpB, p.t).applyAxisAngle(Y, phi);
    pos.lerp(goalP, kCam); look.lerp(goalT, kCam);
    const m = mobile.matches;
    const sT = m ? 0 : A.side + (B.side - A.side) * p.t;
    const ua = m ? (A.upM ?? 0.17) : (A.up || 0), ub = m ? (B.upM ?? 0.17) : (B.up || 0);
    const uT = ua + (ub - ua) * p.t;
    side += (sT - side) * kCam; up += (uT - up) * kCam; first = false;

    pointer.sx += (pointer.x - pointer.sx) * kSlow; pointer.sy += (pointer.y - pointer.sy) * kSlow;
    cam.position.copy(pos); cam.lookAt(look);
    cam.translateX(pointer.sx * -0.7); cam.translateY(pointer.sy * 0.4); cam.lookAt(look);
    cam.setViewOffset(W, H, -side * 0.2 * W, up * H, W, H);

    // Couleurs du versant
    scene.fog.color.copy(col('bg', mix)); scene.fog.density = 0.034 - 0.008 * mix;
    ground.material.color.copy(col('ground', mix)); rippleMat.color.copy(col('ripple', mix));
    hemi.color.copy(col('sky', mix)); hemi.groundColor.copy(col('low', mix));
    hemi.intensity = PAL.psy.hemi + (PAL.pro.hemi - PAL.psy.hemi) * mix;
    sun.intensity = PAL.psy.sun + (PAL.pro.sun - PAL.psy.sun) * mix;

    // Les stations sortent du sol quand on quitte l'accueil, et y retournent à la fin
    const show = (p.a === 0 && p.t < 0.06) || p.a === 5 || (p.b === 5 && p.t > 0.6) ? 0 : 1;
    rise += (show - rise) * (1 - Math.exp(-dt * 2.2));
    stage.position.y = -9 * (1 - rise) * (1 - rise); stage.visible = rise > 0.01;

    // Animations liées au défilement
    card.rotation.y = reduce ? 0.35 : time * 0.42;
    apos.position.y = 6.95 + (reduce ? 0 : Math.sin(time * 0.8) * 0.07);
    const l2 = local(2, p.y), l3 = local(3, p.y);
    knot.userData.update(smooth(0.22, 0.62, l2));
    lampPsy.userData.update(l3, time); lampPro.userData.update(l2, time);
    steps.userData.update(smooth(0.12, 0.62, l3));

    if (!(p.a === 4 && p.b === 4)) renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);
}

try { startScene(); }
catch (err) {
  body.classList.add('no-gl');
  console.warn('Scène 3D indisponible sur cet appareil :', err);
  const tick = () => { hud(progress()); requestAnimationFrame(tick); };
  tick();
}
