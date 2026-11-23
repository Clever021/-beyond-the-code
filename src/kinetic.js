// Tipografia cinética do Hero: o peso (eixo wght da fonte variável) de cada letra
// responde à proximidade do cursor; em repouso há uma onda lenta e sutil.
// Para evitar "tremor" de layout, cada letra tem LARGURA FIXA medida no peso máximo.
const BASE = 800; // peso de repouso = peso do CSS (.hero__title)
const MIN = 340; // peso mais leve, junto ao cursor
const IDLE_DEPTH = 120; // amplitude da onda em repouso
const FRAME_MS = 1000 / 40; // limita a ~40 fps para poupar máquinas modestas

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);

export function initKinetic(chars, hero) {
  const items = chars.map((el) => ({ el, w: BASE }));
  let px = null;
  let py = null;
  let raf = 0;
  let last = 0;
  let inView = true;

  function lock() { // mede cada letra no peso máximo e fixa a largura
    items.forEach((i) => { i.el.style.width = ''; i.el.style.fontWeight = ''; });
    const widths = items.map((i) => i.el.getBoundingClientRect().width);
    items.forEach((i, k) => {
      i.el.style.width = `${widths[k]}px`;
      i.el.style.textAlign = 'center';
      i.el.style.fontWeight = Math.round(i.w);
    });
  }

  function frame(time) {
    raf = requestAnimationFrame(frame);
    if (time - last < FRAME_MS) return;
    last = time;
    const radius = Math.max(150, innerWidth * 0.17);
    const rects = px === null ? null : items.map((i) => i.el.getBoundingClientRect()); // leituras antes das escritas
    items.forEach((it, k) => {
      let target;
      if (rects) {
        const r = rects[k];
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        target = BASE - (BASE - MIN) * (1 - smooth(clamp(d / radius)));
      } else {
        target = BASE - IDLE_DEPTH * (0.5 + 0.5 * Math.sin(time / 1100 - k * 0.6));
      }
      it.w += (target - it.w) * 0.22;
      it.el.style.fontWeight = Math.round(it.w);
    });
  }
  const run = () => { if (!raf && inView && !document.hidden) raf = requestAnimationFrame(frame); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  const onMove = (e) => { if (e.pointerType === 'touch') return; px = e.clientX; py = e.clientY; };
  const onLeave = () => { px = null; };
  const onVis = () => (document.hidden ? stop() : run());
  hero.addEventListener('pointermove', onMove);
  hero.addEventListener('pointerleave', onLeave);
  document.addEventListener('visibilitychange', onVis);

  const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; inView ? run() : stop(); });
  io.observe(hero);

  let t;
  const onResize = () => { clearTimeout(t); t = setTimeout(lock, 150); };
  addEventListener('resize', onResize);

  const start = () => { lock(); run(); };
  (document.fonts?.ready ?? Promise.resolve()).then(start);

  return () => { // limpeza (ex.: usuário ativa "reduzir movimento")
    stop(); io.disconnect(); clearTimeout(t);
    hero.removeEventListener('pointermove', onMove);
    hero.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVis);
    removeEventListener('resize', onResize);
    items.forEach((i) => { i.el.style.width = ''; i.el.style.fontWeight = ''; i.el.style.textAlign = ''; });
  };
}
