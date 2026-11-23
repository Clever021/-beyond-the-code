// Scroll storytelling: uma cena 3D fixa (pin) conta "do código à experiência" em 4 capítulos.
// A rolagem controla escala, profundidade, posição e opacidade das camadas (scrub).
// Sem movimento (prefers-reduced-motion) a seção é estática: legendas em lista e cena explodida.
export function initStory(gsap, ScrollTrigger) {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const sec = document.getElementById('story');
    const stack = sec.querySelector('.stack');
    const layers = [...stack.querySelectorAll('.layer')];
    const caps = [...sec.querySelectorAll('.cap')];
    const prog = sec.querySelector('.story__progress i');
    const small = matchMedia('(max-width: 900px)').matches;
    const dz = small ? 46 : 74; // afastamento em profundidade
    const mid = (i) => i - (layers.length - 1) / 2;

    sec.classList.add('is-pinned');
    gsap.set(caps, { autoAlpha: 0, y: 24 });
    gsap.set(caps[0], { autoAlpha: 1, y: 0 });
    gsap.set(stack, { rotateX: 58, rotateZ: -32, scale: 0.84 });
    layers.forEach((l, i) => gsap.set(l, { z: i * 6, x: 0, y: 0, rotateZ: 0, opacity: 1, scale: 1 }));

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: sec, start: 'top top', end: '+=300%', pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1 },
    });
    tl.to(prog, { scaleX: 1, duration: 4 }, 0);
    // 01 Estrutura: pilha compacta, leve giro
    tl.to(stack, { rotateZ: -36, scale: 0.9, duration: 1 }, 0);
    // 02 Sistema: camadas se afastam em profundidade
    tl.to(layers, { z: (i) => i * dz, duration: 1 }, 1)
      .to(stack, { rotateX: 62, rotateZ: -40, duration: 1 }, 1);
    // 03 Movimento: camadas deslizam no plano; a câmera desce
    tl.to(layers, { x: (i) => mid(i) * 36, y: (i) => mid(i) * -22, rotateZ: (i) => mid(i) * 6, duration: 1 }, 2)
      .to(stack, { rotateX: 40, rotateZ: -14, scale: 1, duration: 1 }, 2);
    // 04 Experiência: tudo converge para a frente; a última camada domina
    tl.to(layers, { x: 0, y: 0, rotateZ: 0, z: (i) => i * 10, duration: 1 }, 3)
      .to(layers.slice(0, -1), { opacity: 0.2, scale: 0.94, duration: 1 }, 3)
      .to(stack, { rotateX: 8, rotateZ: 0, scale: 1.08, duration: 1 }, 3);
    // legendas
    caps.forEach((c, i) => {
      if (i > 0) tl.to(c, { autoAlpha: 1, y: 0, duration: 0.25 }, i + 0.05);
      if (i < caps.length - 1) tl.to(c, { autoAlpha: 0, y: -24, duration: 0.25 }, i + 0.85);
    });

    // destaque do menu durante a narrativa (o intervalo do pin muda com o espaçamento, por isso usa a posição do pin)
    const st = tl.scrollTrigger;
    ScrollTrigger.create({
      trigger: document.body,
      start: () => st.start - innerHeight * 0.5,
      end: () => st.end + innerHeight * 0.5,
      onToggle: (self) => {
        if (self.isActive) document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#story'));
      },
    });

    return () => sec.classList.remove('is-pinned');
  });
}
