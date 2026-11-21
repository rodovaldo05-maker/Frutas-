# FRUTO LEGACY AAA — Visão geral do design

> Documento de design. **Nenhum sistema foi implementado ainda.** Estes textos descrevem como
> cada sistema deve funcionar e como cada interface deve ficar, para guiar o desenvolvimento.

## Índice

| Nº | Documento | Conteúdo |
|---|---|---|
| 00 | Visão geral (este) | Missão, pilares, escopo, fases, glossário |
| 01 | [Arquitetura técnica](01-arquitetura-tecnica.md) | HTML/Three.js, módulos, dados, Android, desempenho |
| 02 | [Mundo e ilhas](02-mundo-e-ilhas.md) | Três mares, ilhas, terrenos, cidades, exploração |
| 03 | [Oceano, água e barcos](03-oceano-agua-e-barcos.md) | Oceano, física da água, natação, barcos, combate naval, bestas marinhas |
| 04 | [Movimento e animação](04-movimento-e-animacao.md) | Controlador do personagem, estados, animações, criaturas |
| 05 | [Combate](05-combate.md) | Ataques, dados por quadro, impactos, reações, defesa |
| 06 | [Estilos de luta](06-estilos-de-luta.md) | Nove estilos, maestria, despertares |
| 07 | [Vontade (Haki)](07-vontade.md) | Armadura, Percepção e Soberana |
| 08 | [Frutas](08-frutas.md) | Regras das frutas e as 16 frutas da Edição 18 |
| 09 | [Progressão e economia](09-progressao-e-economia.md) | Níveis, status, roleta, mochila, fragmentos, missões |
| 10 | [Interfaces e controles](10-interfaces-e-controles.md) | Todas as telas, HUD, celular, PC e controle |

## 1. Missão

Transformar o **FRUTO Laboratório Voxel (Edição 18)** em um RPG 3D completo de exploração
marítima, combate e frutas de poder, jogável no navegador (PC) e como aplicativo Android.

Nome provisório: **FRUTO LEGACY AAA**.

A meta de qualidade "AAA" é perseguida dentro dos limites de HTML, JavaScript e Three.js,
priorizando nesta ordem:

1. Ilhas detalhadas e mundo aberto.
2. Personagens bem modelados e animados.
3. Movimentação e mobilidade.
4. Combate responsivo e cinematográfico.
5. Efeitos visuais tridimensionais.
6. Frutas, habilidades e transformações míticas.
7. Navegação marítima.
8. Física e interação com o ambiente.
9. Interface e experiência de uso.

Regra central: **nada de sistemas de fachada**. Um sistema só conta como pronto quando
funciona de verdade, foi testado e respeita o orçamento de desempenho no celular.

## 2. Pilares de design

| Pilar | O que significa na prática |
|---|---|
| **Uma mordida, outro mundo** | A fruta muda o jeito de lutar, de se mover e de interagir com o mundo (água, superfícies, voo). |
| **Mar como protagonista** | O oceano liga tudo: navegar, nadar, combater em navios e enfrentar bestas marinhas é tão importante quanto lutar em terra. |
| **Corpo que responde** | Entrada de comando com resposta imediata, animações que não deslizam e impactos que se sentem (hitstop, tremor, reação). |
| **Explorar compensa** | Cada ilha tem segredos, desafios de mobilidade e tesouros, não só missões de derrotar inimigos. |
| **Leve no celular** | Cada decisão visual tem custo medido; existe sempre um modo leve que mantém o jogo fluido. |

## 3. Identidade e originalidade

O jogo é **inspirado no gênero** de RPGs piratas com frutas de poder (exploração por mares,
progressão por níveis, estilos de luta, frutas e chefes), mas usa **conteúdo próprio**:

- Ilhas, cidades, personagens, chefes e histórias são originais do mundo FRUTO.
- Não se copiam nomes, ilhas, personagens, logotipos ou textos de outros jogos ou do anime.
- Onde o pedido original usa termos de outras obras, este design usa equivalentes originais
  com a **mesma função**:

| Termo do pedido original | Nome neste design | Observação |
|---|---|---|
| Haki | **Vontade** | Armadura, Percepção e Soberana (doc 07) |
| Black Leg | **Perna Rubra** | Estilo de chutes (doc 06) |
| Electro | **Corpo Voltaico** | Estilo elétrico |
| Fishman Karate | **Caratê das Marés** | Estilo de água |
| Dragon Claw | **Garra Dracônica** | Estilo de garras |
| Dragon Talon | **Talão Dracônico** | Estilo de garras com chamas |
| Cyborg Combat | **Combate Mecânico** | Estilo tecnológico |
| Godhuman | **Punho Celestial** | Estilo de maestria final |
| Ilhas do jogo de referência | Ilhas originais por mar (doc 02) | Mesma progressão de níveis e variedade de biomas |

O visual segue a estética do FRUTO: voxel quadriculado, cores fortes e chapadas, frutas
com cascas cúbicas e olhos grandes, corpo base de 17 peças rígidas.

## 4. Escopo realista e fases

O pedido completo é do tamanho de um jogo comercial grande. Para que cada parte fique boa
de verdade, o desenvolvimento acontece em fases. Cada fase termina jogável e testada.

| Fase | Entrega | Critério de pronto |
|---|---|---|
| **F0 — Fundação** | Estrutura de pastas, carregamento, renderizador, entrada (toque/teclado/controle), salvamento, empacotamento Android | Abre no PC e no APK, salva e carrega, mantém 60 qps em cena vazia no celular de referência |
| **F1 — Corpo e movimento** | Controlador do personagem completo (doc 04), câmera, animações básicas | Pés sem deslizar, coyote time, buffer de salto, escalada e natação funcionando |
| **F2 — Combate base** | Sistema de combate (doc 05), Combate Básico, inimigos simples, reações | Golpes com hitstop, defesa perfeita e reações direcionais |
| **F3 — Fatia vertical** | Uma ilha completa (Ilha da Âncora), 4 frutas, roleta, mochila, missões, HUD final | Uma sessão de 30 min com exploração, combate, progressão e salvamento |
| **F4 — Primeiro Mar** | Todas as ilhas do Primeiro Mar, oceano, barcos pequenos, natação | Navegar entre todas as ilhas, chefes do mar derrotáveis |
| **F5 — Frutas e estilos** | As 16 frutas, 9 estilos, Vontade, despertares, maestria | Todas as habilidades com efeitos, sons e testes |
| **F6 — Segundo e Terceiro Mar** | Ilhas restantes, navios grandes, combate naval, bestas marinhas, chefes mundiais | Progressão completa até o nível máximo |
| **F7 — Polimento e Android** | Otimização, qualidade automática, acessibilidade, AAB para loja | Metas de desempenho atingidas nos três perfis de aparelho |
| **F8 — Multijogador (opcional)** | Servidor, salas, PvP | Só depois do jogo solo estar completo |

## 5. Glossário

| Termo | Definição |
|---|---|
| Fruta | Item que, ao ser comido, concede um conjunto de poderes. Um jogador tem uma fruta comida por vez. |
| Nível da fruta | Raridade sorteada na roleta: Comum, Épico ou Lendário. Aumenta dano e reduz recarga. |
| Maestria | Experiência acumulada usando uma fruta, estilo ou Vontade; desbloqueia habilidades e passivas. |
| Despertar | Estado temporário de poder ampliado da fruta ou do estilo, sustentado por energia. |
| Forma | Corpo alternativo das frutas Animais e Míticas: humana, híbrida e completa. |
| Estilo de luta | Conjunto de golpes corpo a corpo independente da fruta. |
| Vontade | Poderes espirituais complementares (equivalente original ao Haki). |
| Mar | Grande região do mundo (Primeiro, Segundo, Terceiro) com faixa de níveis própria. |
| Fragmento | Moeda obtida ao trocar frutas; 10 fragmentos criam uma chave. |
| Chave | Item que paga um giro da roleta de frutas. |
| Qps | Quadros por segundo. |
