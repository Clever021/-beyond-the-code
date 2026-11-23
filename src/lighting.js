// Sistema de iluminação: superfícies marcadas com [data-light] recebem um foco de luz
// suave e um "rim light" na borda que seguem o cursor. Só variáveis CSS mudam por frame.
// Ativo apenas em dispositivos com hover real (mouse/trackpad).
const SURFACES = '.camp__stage, .pick, .comp, .lab__cell, .panel-ctl, .micro';

export function initLighting() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll(SURFACES).forEach((el) => el.setAttribute('data-light', ''));

  let cur = null;
  let x = 0;
  let y = 0;
  let raf = 0;
  const paint = () => {
    raf = 0;
    if (!cur) return;
    const r = cur.getBoundingClientRect();
    cur.style.setProperty('--mx', `${x - r.left}px`);
    cur.style.setProperty('--my', `${y - r.top}px`);
  };
  const setCur = (next) => {
    if (next === cur) return;
    cur?.style.setProperty('--lo', '0');
    cur = next;
    cur?.style.setProperty('--lo', '1');
  };
  document.addEventListener('pointermove', (e) => {
    setCur(e.target.closest?.('[data-light]') ?? null);
    if (!cur) return;
    x = e.clientX; y = e.clientY;
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => setCur(null));
}
