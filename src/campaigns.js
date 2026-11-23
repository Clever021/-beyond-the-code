// Campanhas conceito: ao selecionar uma campanha, a composição REALMENTE se transforma.
// 1) texto sai (SplitText)  2) o CSS troca o layout/tipografia (data-campaign)
// 3) GSAP Flip anima cada forma da posição/tamanho/raio antigos para os novos  4) texto novo entra.
// Nomes e textos são fictícios: conceitos de demonstração, não marcas reais.
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { SplitText } from 'gsap/SplitText';
import { openModal } from './components.js';

gsap.registerPlugin(Flip, SplitText);

const DATA = {
  tech: {
    name: 'Pulse Stack', kick: 'Campanha A · Tecnologia', title: 'Código que pensa à frente.',
    sub: 'Uma plataforma imaginária de observabilidade para equipes de software. Composição técnica: grade, linhas finas e uma única cor de energia.',
    format: 'Banner 16:9', tone: 'Técnico, preciso', motion: 'Sinal pulsante',
    modal: 'Conceito de tecnologia. A composição usa grade, contornos finos e um único verde de energia; o título é maiúsculo e pesado. Ao trocar de campanha, as mesmas seis formas mudam de posição, tamanho e raio com GSAP Flip.',
  },
  fashion: {
    name: 'Atelier 2090', kick: 'Campanha B · Moda futurista', title: 'vestir o amanhã.',
    sub: 'Uma coleção fictícia onde o tecido encontra a luz. Composição editorial: arco, diagonal e tipografia leve sobre fundo claro.',
    format: 'Editorial vertical', tone: 'Etéreo, elegante', motion: 'Gradiente em deriva',
    modal: 'Conceito de moda futurista. Fundo claro, tipografia em peso leve e minúsculas, um arco como "peça" e uma diagonal que corta a composição. A paleta do palco inverte para mostrar flexibilidade sem sair da identidade.',
  },
  product: {
    name: 'Obsidiana One', kick: 'Campanha C · Produto premium', title: 'Precisão que se sente.',
    sub: 'Um dispositivo conceitual sob um único foco de luz. Simetria, espaço negativo e contraste mínimo.',
    format: 'Hero de produto', tone: 'Sóbrio, exclusivo', motion: 'Brilho que percorre',
    modal: 'Conceito de produto premium. Composição simétrica, muito espaço negativo, texto espaçado e um brilho que percorre a peça. O objeto é feito só de formas CSS, sem imagem externa.',
  },
};

export function initCampaigns() {
  const $ = (s) => document.querySelector(s);
  const root = $('#camp');
  const [kick, title, sub, cta, meta, status] = ['#c-kick', '#c-title', '#c-sub', '#c-cta', '#c-meta', '#c-status'].map($);
  const picks = [...root.querySelectorAll('.pick')];
  const shapes = [...root.querySelectorAll('.s')];
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 'tech';
  let busy = false;
  let queued = null;
  let split = null;

  const fill = (key) => {
    const d = DATA[key];
    kick.textContent = d.kick;
    title.textContent = d.title;
    sub.textContent = d.sub;
    $('#m-format').textContent = d.format;
    $('#m-tone').textContent = d.tone;
    $('#m-motion').textContent = d.motion;
  };
  const mark = (key) => picks.forEach((p) => {
    const on = p.dataset.pick === key;
    p.setAttribute('aria-checked', String(on));
    p.tabIndex = on ? 0 : -1;
  });
  const splitTitle = () => SplitText.create(title, { type: 'words,chars', tag: 'span', wordsClass: 'sw', charsClass: 'ch', aria: 'auto' });

  function select(key, { focus = false } = {}) {
    if (key === current) return;
    if (busy) { queued = key; return; }
    mark(key);
    if (focus) picks.find((p) => p.dataset.pick === key)?.focus();
    status.textContent = `Campanha selecionada: ${DATA[key].name}, ${DATA[key].kick.split('· ')[1]}.`;

    if (reduced()) { // sem animação: a troca continua real, só que imediata
      current = key; root.dataset.campaign = key; fill(key); return;
    }

    busy = true;
    current = key;
    root.classList.add('is-flipping');
    const parts = [kick, sub, cta, meta];
    split = splitTitle();

    // 1) saída do texto
    gsap.timeline({ onComplete: swap })
      .to(split.chars, { yPercent: -110, opacity: 0, duration: 0.35, stagger: 0.012, ease: 'power2.in' }, 0)
      .to(parts, { opacity: 0, y: -12, duration: 0.3, stagger: 0.04, ease: 'power2.in' }, 0);

    function swap() {
      // 2) captura o estado das formas, troca o layout via CSS e 3) anima a diferença
      const state = Flip.getState(shapes, { props: 'backgroundColor,borderRadius,opacity,borderColor,borderWidth' });
      split.revert();
      root.dataset.campaign = key;
      fill(key);
      gsap.set(parts, { opacity: 0, y: 14 });
      Flip.from(state, {
        duration: 1.15, ease: 'expo.inOut', scale: false, stagger: 0.035,
        onComplete: () => root.classList.remove('is-flipping'),
      });
      // 4) entrada do texto novo
      split = splitTitle();
      gsap.from(split.chars, { yPercent: 110, opacity: 0, duration: 0.8, stagger: 0.02, ease: 'expo.out', delay: 0.4 });
      gsap.to(parts, {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.08, delay: 0.55, ease: 'power3.out',
        onComplete: () => {
          busy = false;
          if (queued && queued !== current) { const q = queued; queued = null; select(q); } else queued = null;
        },
      });
    }
  }

  picks.forEach((p) => p.addEventListener('click', () => select(p.dataset.pick)));
  root.querySelector('.camp__picker').addEventListener('keydown', (e) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const order = picks.map((p) => p.dataset.pick);
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    select(order[(order.indexOf(current) + step + order.length) % order.length], { focus: true });
  });
  cta.addEventListener('click', () => openModal(`Exemplo · ${DATA[current].kick}`, DATA[current].name, DATA[current].modal));

  // animações ociosas só enquanto o palco está visível
  new IntersectionObserver(([e]) => root.classList.toggle('is-live', e.isIntersecting)).observe(root);

  fill(current);
  mark(current);
}
