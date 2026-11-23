import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { toast } from './components.js';
import { initKinetic } from './kinetic.js';
import { initScroll } from './scroll.js';
import { initStory } from './story.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
if (import.meta.env.DEV) window.__ST = ScrollTrigger; // só em desenvolvimento: facilita depurar gatilhos

// SplitText em <span> (inline-block via CSS). aria:'none' porque os elementos pais já têm aria-label.
const splitOpts = { tag: 'span', wordsClass: 'sw', charsClass: 'ch', aria: 'none' };

export function initMotion() {
  // O DOM é preparado sempre (texto dividido); animações só rodam sem "reduced motion".
  const heroChars = [];
  document.querySelectorAll('.hero__title .line__in').forEach((el) => {
    heroChars.push(...SplitText.create(el, { ...splitOpts, type: 'words,chars' }).chars);
  });
  const words = SplitText.create('#wordscrub', { tag: 'span', wordsClass: 'w', type: 'words', aria: 'none' }).words;
  const chars = SplitText.create('#chars', { ...splitOpts, type: 'words,chars' }).chars;

  initScroll(gsap, ScrollTrigger);
  initStory(gsap, ScrollTrigger); // criado antes dos demais gatilhos: o pin altera o espaçamento da página
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  // a página ficou mais longa (introdução e estudo de caso): recalcula as posições quando tudo carregou
  if (document.readyState === 'complete') ScrollTrigger.refresh();
  else addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

  // Destaque do menu conforme a seção visível (não é animação: roda sempre).
  // A narrativa é "pinada" e cuida do próprio destaque em story.js (quando há movimento).
  document.querySelectorAll('main > section[id]').forEach((sec) => {
    if (sec.id === 'story' && sec.classList.contains('is-pinned')) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 50%', end: 'bottom 50%',
      onToggle: (self) => {
        if (!self.isActive) return;
        const key = sec.dataset.nav || sec.id; // seções do Laboratório compartilham um item do menu
        document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + key));
      },
    });
  });

  // Marquee: pausa quando fora da tela (poupa CPU/GPU)
  const track = document.querySelector('.marquee__track');
  new IntersectionObserver(([e]) => { track.style.animationPlayState = e.isIntersecting ? 'running' : 'paused'; }).observe(track);


  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const hero = document.getElementById('hero');
    let stopKinetic = () => {};

    // --- HERO: entrada em timeline; ao terminar, liga a tipografia cinética ---
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => { stopKinetic = initKinetic(heroChars, hero); } });
    tl.from(heroChars, { yPercent: 115, rotate: 6, duration: 1.2, stagger: 0.035 })
      .from('[data-hero="fade"]', { y: 24, opacity: 0, duration: 0.9, stagger: 0.1 }, '-=0.8')
      .from('.art__layer, .art__badge', { scale: 0.6, opacity: 0, duration: 1.2, stagger: 0.12, ease: 'back.out(1.5)' }, 0.1);

    // --- HERO: ao rolar, o texto recua suavemente ---
    gsap.to('.hero__copy', { yPercent: -6, opacity: 0.3, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 25%', scrub: true } });

    // --- HERO: parallax por cursor (camadas com data-depth) ---
    const layers = [...document.querySelectorAll('.hero__art [data-depth]')].map((el) => ({
      d: +el.dataset.depth,
      x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' }),
    }));
    // grade iluminada que acompanha o cursor (elemento fixo movido por transform: barato)
    const lit = hero.querySelector('.hero__lit');
    const lx = gsap.quickTo(lit, 'x', { duration: 0.5, ease: 'power3.out' });
    const ly = gsap.quickTo(lit, 'y', { duration: 0.5, ease: 'power3.out' });
    const onMove = (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      layers.forEach((l) => { l.x(nx * l.d); l.y(ny * l.d); });
      const r = hero.getBoundingClientRect();
      lx(e.clientX - r.left); ly(e.clientY - r.top);
    };
    hero.addEventListener('pointermove', onMove);

    // --- Scroll reveal ---
    gsap.utils.toArray('[data-reveal]').forEach((el) => {
      gsap.from(el, { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    gsap.from('.stagger li', { x: -40, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.stagger', start: 'top 85%', once: true } });
    gsap.from('.pairs > div', { y: 24, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.pairs', start: 'top 85%', once: true } });

    // --- Parallax em camadas (scrub) ---
    gsap.utils.toArray('.para__l').forEach((l) => {
      const s = +l.dataset.speed;
      gsap.fromTo(l, { y: -s }, { y: s, ease: 'none', scrollTrigger: { trigger: '.para', start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // --- Texto: palavras acendem com o scroll ---
    gsap.to(words, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '#wordscrub', start: 'top 85%', end: 'bottom 50%', scrub: true } });

    // --- Texto: letra por letra (reutilizável pelo botão) ---
    const charsIn = () => gsap.fromTo(chars, { yPercent: 100, opacity: 0, rotate: 8 }, { yPercent: 0, opacity: 1, rotate: 0, duration: 0.8, stagger: 0.04, ease: 'back.out(2)', overwrite: true });
    ScrollTrigger.create({ trigger: '#chars', start: 'top 88%', once: true, onEnter: charsIn });
    const replay = document.getElementById('replay');
    replay.addEventListener('click', charsIn);

    // --- Hover magnético ---
    const mag = document.getElementById('magnet');
    const span = mag.firstElementChild;
    const mx = gsap.quickTo(span, 'x', { duration: 0.4, ease: 'power3.out' });
    const my = gsap.quickTo(span, 'y', { duration: 0.4, ease: 'power3.out' });
    const onMag = (e) => {
      const r = mag.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.4);
      my((e.clientY - r.top - r.height / 2) * 0.4);
    };
    const offMag = () => { mx(0); my(0); };
    mag.addEventListener('pointermove', onMag);
    mag.addEventListener('pointerleave', offMag);

    return () => { // limpeza se a preferência mudar em tempo real
      stopKinetic();
      hero.removeEventListener('pointermove', onMove);
      replay.removeEventListener('click', charsIn);
      mag.removeEventListener('pointermove', onMag);
      mag.removeEventListener('pointerleave', offMag);
    };
  });

  mm.add('(prefers-reduced-motion: reduce)', () => {
    const replay = document.getElementById('replay');
    const msg = () => toast('Animação desativada: você prefere movimento reduzido.');
    replay.addEventListener('click', msg);
    return () => replay.removeEventListener('click', msg);
  });
}
