import { gsap } from 'gsap';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);

/* ---------- Toast ---------- */
let toastTimer;
export function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- Modal (<dialog> nativo: foco preso, Esc e retorno de foco grátis) ---------- */
let openModalFn = () => {};
export const openModal = (k, t, x) => openModalFn(k, t, x);
function initModal() {
  const dlg = $('#modal');
  const open = (kicker, title, text) => {
    $('#modal-kicker').textContent = kicker;
    $('#modal-title').textContent = title;
    $('#modal-text').textContent = text;
    dlg.showModal();
  };
  openModalFn = open;
  $('#open-modal').addEventListener('click', () =>
    open('Exemplo · Modal', 'Modal de demonstração', 'Este modal abre e fecha por botão, tecla Esc ou clique fora. O foco volta ao elemento que o abriu.'));
  document.querySelectorAll('[data-ad]').forEach((b) =>
    b.addEventListener('click', () => open('Exemplo · Anúncio', b.dataset.ad, b.dataset.adText)));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

/* ---------- Carrossel ---------- */
function initCarousel() {
  const root = $('#carousel');
  const track = $('.carousel__track', root);
  const slides = [...track.children];
  const dots = $('#dots');
  let i = 0;
  slides.forEach((_, n) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Ir para o slide ${n + 1}`);
    b.addEventListener('click', () => go(n));
    dots.appendChild(b);
  });
  function go(n) {
    i = (n + slides.length) % slides.length;
    track.style.transform = `translateX(${-i * 100}%)`;
    slides.forEach((s, k) => { s.inert = k !== i; });
    [...dots.children].forEach((d, k) => (k === i ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
  }
  $('#prev').addEventListener('click', () => go(i - 1));
  $('#next').addEventListener('click', () => go(i + 1));
  root.addEventListener('keydown', (e) => {
    if (e.target !== root) return;
    if (e.key === 'ArrowLeft') go(i - 1);
    if (e.key === 'ArrowRight') go(i + 1);
  });
  // arrastar / deslizar
  const vp = $('.carousel__viewport', root);
  let x0 = null;
  vp.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  vp.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
  });
  vp.addEventListener('pointercancel', () => { x0 = null; });
  go(0);
}

/* ---------- Cartão 3D ---------- */
function initTilt() {
  const card = $('#tilt');
  const stage = card.parentElement;
  const range = $('#tilt-range');
  const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
  const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  const aim = (nx, ny) => { // nx, ny em -1..1
    if (reduced()) return;
    const max = +range.value;
    ry(nx * max);
    rx(-ny * max);
    card.style.setProperty('--gx', `${(nx + 1) * 50}%`);
    card.style.setProperty('--gy', `${(ny + 1) * 50}%`);
    card.style.setProperty('--go', '1');
  };
  stage.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    aim(clamp(((e.clientX - r.left) / r.width) * 2 - 1), clamp(((e.clientY - r.top) / r.height) * 2 - 1));
  });
  const reset = () => { rx(0); ry(0); card.style.setProperty('--go', '0'); };
  stage.addEventListener('pointerleave', reset);
  card.addEventListener('blur', reset);
  card.addEventListener('keydown', (e) => { // teclado: setas inclinam o cartão
    const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (m) { e.preventDefault(); aim(m[0], m[1]); }
  });
  range.addEventListener('input', () => { $('#tilt-out').textContent = range.value; });
  const sw = $('#glare-switch');
  sw.addEventListener('click', () => {
    const on = sw.getAttribute('aria-checked') !== 'true';
    sw.setAttribute('aria-checked', String(on));
    card.classList.toggle('glare-off', !on);
  });
}

/* ---------- Abas (padrão WAI-ARIA) ---------- */
function initTabs() {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const select = (t) => {
    tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
    t.focus();
  };
  tabs.forEach((t, k) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') select(tabs[(k + 1) % tabs.length]);
      if (e.key === 'ArrowLeft') select(tabs[(k - 1 + tabs.length) % tabs.length]);
    });
  });
  $('#toast-btn').addEventListener('click', () => toast('Aviso de exemplo: componente de feedback funcionando.'));
}

/* ---------- Menu mobile ---------- */
function initMenu() {
  const burger = $('#burger');
  const menu = $('#menu');
  const set = (open) => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  burger.addEventListener('click', () => set(!menu.classList.contains('open')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
}

export function initComponents() {
  initModal();
  initCarousel();
  initTilt();
  initTabs();
  initMenu();
  initStudio();
}

/* ---------- Estúdio de composição: luz, tipografia, layout e microinterações ---------- */
function initStudio() {
  const spec = $('#spec');
  const base = $('.spec__base', spec);
  const lit = base.cloneNode(true); // camada "iluminada": mesma estrutura, revelada por máscara
  lit.classList.replace('spec__base', 'spec__lit');
  lit.setAttribute('aria-hidden', 'true');
  spec.appendChild(lit);

  // luz: segue o cursor; em repouso deriva suavemente (parado se movimento reduzido)
  const p = { x: 0.5, y: 0.5 };
  const paint = () => {
    const r = spec.getBoundingClientRect();
    spec.style.setProperty('--mx', `${p.x * r.width}px`);
    spec.style.setProperty('--my', `${p.y * r.height}px`);
  };
  paint();
  addEventListener('resize', paint);
  const px = gsap.quickTo(p, 'x', { duration: 0.5, ease: 'power3.out', onUpdate: paint });
  const py = gsap.quickTo(p, 'y', { duration: 0.5, ease: 'power3.out', onUpdate: paint });
  const t = { v: 0 };
  const drift = gsap.to(t, {
    v: Math.PI * 2, duration: 16, repeat: -1, ease: 'none',
    onUpdate: () => { p.x = 0.5 + 0.28 * Math.cos(t.v); p.y = 0.5 + 0.22 * Math.sin(t.v * 2); paint(); },
  });
  if (reduced()) drift.pause();
  spec.addEventListener('pointerenter', () => drift.pause());
  spec.addEventListener('pointermove', (e) => {
    const r = spec.getBoundingClientRect();
    px((e.clientX - r.left) / r.width);
    py((e.clientY - r.top) / r.height);
  });
  spec.addEventListener('pointerleave', () => { t.v = 0; if (!reduced()) drift.restart(); });

  // controles
  const set = (k, v) => spec.style.setProperty(k, v);
  const bind = (id, out, fn) => {
    const el = $(id);
    const run = () => { $(out).textContent = el.value; fn(+el.value); };
    el.addEventListener('input', run);
  };
  bind('#r-wght', '#o-wght', (v) => set('--wght', v));
  bind('#r-track', '#o-track', (v) => set('--track', `${v / 100}em`));
  bind('#r-light', '#o-light', (v) => set('--lr', `${Math.round(v * 4.4)}px`));
  const seg = [...document.querySelectorAll('.seg [data-layout]')];
  seg.forEach((b) => b.addEventListener('click', () => {
    seg.forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    spec.dataset.layout = b.dataset.layout;
  }));

  // microinteração 1: ondulação no ponto do clique
  const rip = $('#ripple');
  rip.addEventListener('click', (e) => {
    const r = rip.getBoundingClientRect();
    const i = document.createElement('i');
    i.style.left = `${e.clientX ? e.clientX - r.left : r.width / 2}px`;
    i.style.top = `${e.clientY ? e.clientY - r.top : r.height / 2}px`;
    rip.appendChild(i);
    i.addEventListener('animationend', () => i.remove());
    setTimeout(() => i.remove(), 900);
  });

  // microinteração 2: segurar para confirmar (mouse, toque e teclado)
  const hold = $('#hold');
  const txt = $('.hold__txt', hold);
  const prog = { v: 0 };
  let tween;
  const setP = () => {
    hold.style.setProperty('--p', prog.v);
    hold.classList.toggle('is-near', prog.v > 0.5);
  };
  const start = () => {
    tween?.kill();
    tween = gsap.to(prog, {
      v: 1, duration: 1, ease: 'none', onUpdate: setP,
      onComplete: () => { txt.textContent = 'Confirmado ✓ (exemplo)'; toast('Ação de exemplo confirmada.'); setTimeout(() => { txt.textContent = 'Segure para confirmar'; cancel(); }, 1400); },
    });
  };
  const cancel = () => {
    if (prog.v >= 1 && txt.textContent.startsWith('Confirmado')) return;
    tween?.kill();
    tween = gsap.to(prog, { v: 0, duration: 0.35, ease: 'power2.out', onUpdate: setP });
  };
  hold.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => hold.addEventListener(ev, cancel));
  hold.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } });
  hold.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') cancel(); });
  hold.addEventListener('blur', cancel);

  // microinteração 3: luz que acompanha o cursor dentro do botão
  const lb = $('#lightbtn');
  lb.addEventListener('pointermove', (e) => {
    const r = lb.getBoundingClientRect();
    lb.style.setProperty('--bx', `${e.clientX - r.left}px`);
    lb.style.setProperty('--by', `${e.clientY - r.top}px`);
  });
  lb.addEventListener('click', () => toast('Brilho reage à posição do cursor.'));
}
