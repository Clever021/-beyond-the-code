# Três desafios técnicos do Beyond the Code

Explicados de forma simples. Todos aconteceram de verdade durante o desenvolvimento e foram observados no navegador.

## 1. A rotação que sumia quando a campanha mudava

**O que eu queria:** ao escolher uma campanha, as formas da composição mudam de lugar, tamanho e cor com uma animação suave. Para isso usamos o **GSAP Flip**: ele "fotografa" o antes, o CSS troca o layout, e o Flip anima do antes para o depois.

**O problema:** a faixa diagonal da campanha de moda usava a propriedade CSS `rotate: -24deg`. Depois do Flip, a faixa ficava reta. O motivo: o GSAP escreve `rotate: none` direto no elemento (estilo *inline*), e o estilo inline **vence** o que está no arquivo CSS.

**Como resolvi:** a forma passou a ser uma caixa sem cor, e a cor e a rotação foram para um pseudo-elemento (`::after`), com a rotação vinda de uma variável CSS (`rotate: var(--rot)`). O GSAP mexe só na caixa; a rotação fica protegida no pseudo-elemento.

**Lição:** quando uma biblioteca de animação e o CSS disputam a mesma propriedade, separe os dois em elementos diferentes.

## 2. O menu que errava a seção durante a narrativa fixa

**O que eu queria:** uma seção que fica "presa" na tela (*pin*) enquanto a rolagem conta uma história em 4 capítulos, junto com scroll suave (Lenis) e um menu que destaca a seção atual.

**O problema:** ao clicar em "Narrativa" vindo de baixo, a página parava no **fim** da seção, não no começo. E o menu não destacava a seção certa durante a narrativa. Isso acontece porque, enquanto a seção está presa, a posição do elemento na página não é a posição em que o visitante "entra" nela.

**Como resolvi:**
- Criei o pin **antes** de qualquer outro gatilho de scroll e dei a ele prioridade (`refreshPriority`), porque o pin muda a altura total da página.
- O link âncora passou a rolar até o **início do pin**, e não até o elemento.
- O destaque do menu ganhou um gatilho próprio, calculado a partir do início e do fim do pin.
- Mais tarde, ao adicionar seções novas, um gatilho ficou com a posição desatualizada; a correção foi recalcular tudo quando a página termina de carregar (`ScrollTrigger.refresh()` no evento `load`).

**Lição:** tudo o que muda o tamanho da página (pin, fontes, imagens, seções novas) exige recalcular as posições dos gatilhos de scroll.

## 3. A tipografia cinética que tremia (e a fonte "variável" que não variava)

**O que eu queria:** o título "BEYOND THE CODE" com a espessura de cada letra mudando conforme o cursor se aproxima, usando uma **fonte variável** (um arquivo de fonte com todos os pesos, de fino a extra-negrito).

**Os problemas:**
1. A fonte só mostrava alguns pesos fixos. A causa estava no link do Google Fonts: pedia pesos separados (`400;700`) em vez de um intervalo contínuo (`200..800`).
2. Mesmo com a fonte certa, ao mudar o peso as letras ficavam mais largas ou estreitas e o título inteiro **tremia** e reorganizava a linha.
3. O texto em contorno (`-webkit-text-stroke`) mostrava linhas internas feias, porque fontes variáveis têm contornos sobrepostos.

**Como resolvi:**
1. Pedi o intervalo contínuo `wght@200..800`.
2. Medi a largura de cada letra no peso máximo e a fixei; assim o peso muda e o espaço ocupado não. Também limitei a ~40 quadros por segundo e pausei quando o título sai da tela, para poupar o computador.
3. Pintei o contorno antes do preenchimento (`paint-order: stroke fill`) e preenchi a letra com a cor do fundo, escondendo as linhas internas.

**Lição:** efeitos que mexem na tipografia precisam de largura estável, e vale conferir se o recurso (como o peso variável) realmente está chegando ao navegador.
