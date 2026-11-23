// Scroll suave com Lenis integrado ao GSAP/ScrollTrigger.
// Só ativo com movimento permitido. Âncoras, modal e teclado têm tratamento próprio.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export function initScroll(gsap, ScrollTrigger) {
  // Seções com pin: o destino correto é o início do pin (a posição do elemento muda enquanto está fixo)
  const anchorTarget = (el) => ScrollTrigger.getAll().find((t) => t.pin && t.trigger === el)?.start ?? el;
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Âncoras: rolagem suave + foco movido para a seção (teclado/leitor de tela)
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="#"]');
      const id = a?.getAttribute('href');
      if (!a || !id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(anchorTarget(target), { duration: 1.2 }); // o deslocamento do menu vem do scroll-padding-top do CSS
      history.replaceState(null, '', id);
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    document.addEventListener('click', onClick);

    // Modal aberto: trava a rolagem do fundo
    const dlg = document.getElementById('modal');
    const mo = new MutationObserver(() => (dlg.open ? lenis.stop() : lenis.start()));
    mo.observe(dlg, { attributes: true, attributeFilter: ['open'] });

    return () => {
      document.removeEventListener('click', onClick);
      mo.disconnect();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  });
}
