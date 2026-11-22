# FRUTO Legacy

RPG 3D de ilhas e frutas de poder, feito em HTML/JavaScript com Three.js e Rapier,
empacotado para Android com Capacitor. A ideia completa está em [IDEIA.md](IDEIA.md) e o
projeto detalhado em [docs/](docs/00-visao-geral.md).

## Estado atual: Fase 1 — base e movimento

Uma ilha de teste (Ilha de Treino) com o corpo base do FRUTO Laboratório (Edição 18), rosto,
controles de celular, teclado e controle, câmera, HUD, menu de pausa e salvamento.
Movimentos: andar, correr, agachar, deslizar, pular (com tolerância de borda e buffer),
salto duplo, esquiva (no chão e no ar), escalar paredes de pedra e troncos, agarrar e
subir bordas, salto na parede, corrida na parede, planar, rolamento contra dano de queda,
nadar, mergulhar (com ar limitado) e escorregar em rampas íngremes.
Cada área da ilha tem uma placa com a dica do movimento, e a missão "Treino de
movimento" (11 objetivos, 1.000 moedas e 500 de experiência) acompanha o aprendizado.
Duas camadas de evolução que somam: cada nível de aventureiro dá 3 pontos de status que
você distribui (Força, Defesa, Fruta, Espada, Vitalidade; cada ponto de Força soma 1 de
fôlego), e o treino pela prática (documento mestre 4.0) sobe Fôlego, Força, Agilidade e
Natação sozinho com o que o personagem realmente faz, com antifarm e marcos, sem poder ser
distribuído. O Correr dobra a velocidade de andar.

Combate base (atualização 2): Atacar com o combo Jab → Direto → Gancho do laboratório,
Defender (segurar) com defesa perfeita e Postura, esquiva que cancela o golpe, hitstop e
números de dano. Na Arena de combate há bonecos de treino e Recrutas que avisam antes de
bater, defendem às vezes e dão experiência e moedas. Lutar treina Força, Resistência
Física, Reflexos e Defesa.

Poderes das frutas (atualização 3): com uma fruta comida aparece a barra de Energia e três
habilidades (teclas 1 · 2 · 3 ou slots da barra) com o gesto do laboratório e efeito real:
projéteis, investidas, áreas, pontos marcados, faixas, cones, muralha, teleporte e raio em
cadeia, que congelam, queimam, puxam, empurram ou lançam. A fruta troca o combo pelos golpes
dela e tem domínio próprio (1 a 100) que libera a segunda e a terceira habilidade.

HUD de jogo: status embaixo no centro (moedas, nível, fragmentos, vida, fôlego, energia e
experiência, com botões de voltar ao início e de missões), barra de equipar (1 Fruta, 2
Arma, 3 Estilo, 4 livre e Mochila) e, à direita, a lista de habilidades do item equipado com
Usar, tecla (Z X C V) e cadeado com o domínio necessário. O que falta e a ordem das próximas
atualizações estão em [docs/13-atualizacoes.md](docs/13-atualizacoes.md).

Frutas com tipo (Essência, Elemento, Fera) e raridade própria em 6 ranks (Comum 45%,
Incomum 28%, Rara 16%, Épica 7%, Lendária 3%, Mítica 1%), ficha completa de cada fruta em
`data/frutas.json`, catálogo com filtros e ficha 3D. Roleta com o Mercador de Frutas (×1 e
×10, moedas ou chaves, chances reais exibidas, garantia de Lendária ou melhor em 50 giros,
revelação silhueta → rank → fruta com Pular), Mochila de 60 frutas, Trocador de Fragmentos
(valor da ficha; 10 fragmentos = 1 chave), fruta viva na mão, comer com a animação do laboratório e a fraqueza à água
(usuário de fruta afunda, menos Maré e Geada). Chão suave com textura, sem linhas de
grade, e asa-delta nova com botão para ligar e desligar.

Interfaces no estilo dourado do jogo (doc 10): menu inicial com logo e o personagem ao
vivo, HUD com retrato, vida, fôlego, moedas, fragmentos, minimapa com bússola e
rastreador de missão, botões de ação com ícones, janelas de Pausa, Missões, Mapa da
Ilha (pergaminho, com zoom) e Créditos. A ilha tem árvores em blocos, pinheiros,
coqueiros, arbustos, capim, flores, pedras com musgo (colisão no formato real) e
construções com desenho de pedra, tijolo e tábua.

## Rodar

```bash
npm install
npm run dev        # abre em http://localhost:5173 (também na rede local, para testar no celular)
npm test           # regras, salvamento, relevo e simulação do movimento na ilha
npm run build      # gera dist/
```

## Gerar o APK

Precisa do Android SDK (plataforma 35) e Java 21.

```bash
export ANDROID_HOME=/caminho/do/android-sdk
npm run apk        # build + sync + gradle assembleDebug
# APK em android/app/build/outputs/apk/debug/app-debug.apk
```

## Controles

| Ação | Celular | PC | Controle |
|---|---|---|---|
| Mover | Joystick (lado esquerdo) | WASD | Analógico esquerdo |
| Câmera | Arrastar a tela | Arrastar o mouse | Analógico direito |
| Correr (alterna) | Correr | R | Apertar analógico esquerdo |
| Pular · salto duplo · planar | Pular (segurar caindo plana) | Espaço | A / ✕ |
| Esquiva | Esquiva | Shift | B / ◯ |
| Atacar (combo) | Tocar na tela | Clique ou J | X / ▢ ou RT |
| Defender (segurar) | Escudo | Botão direito ou K | RB / R1 ou LT |
| Equipar Fruta · Arma · Estilo | Barra de baixo | 1 · 2 · 3 · 4 | LB / L1 (próximo) |
| Habilidades do item equipado | Botões Usar (direita) | Z · X · C · V | Direcional ← ↑ → ↓ |
| Agachar · deslizar · mergulhar | Agachar | Ctrl | Apertar analógico direito |
| Status · Mochila · Missões · Mapa | Ícones no alto | P · B · L · M | — |
| Falar (Mercador, Trocador) | Botão Falar | E | Y / △ |
| Asa-delta (liga/desliga) | Botão da asa | U | — |
| Pausa | Engrenagem | Esc | Start |

## Estrutura

```
src/core        laço com passo fixo, eventos, matemática
src/renderer    renderizador, céu, luz, câmera de terceira pessoa
src/physics     Rapier (colisores com etiquetas: escalável, material)
src/terrain     campo de alturas e malha do relevo em pedaços
src/ocean       mar com ondas Gerstner (a mesma onda na GPU e na física)
src/islands     Ilha de Treino
src/characters  corpo do laboratório, rosto, planador
src/animation   animação do laboratório + poses novas (escalar, pendurar, planar...)
src/movement    controlador do personagem, regras e números
src/controls    toque, teclado, mouse e controle
src/ui          menu inicial, HUD, minimapa, janelas, ícones, estilos
src/combat      regras do combate, combate do jogador, bonecos e Recrutas
src/quests      missão de treino
src/fruits      roleta, mochila, trocador e modelos das frutas
src/progression nível, pontos de status e treino pela prática
src/vfx         poeira dos passos e efeitos dos poderes
src/world       construções, placas e natureza (árvores, pedras)
src/saves       salvamento local (IndexedDB) com versão e migração
src/optimization qualidade automática
data/           catálogo do laboratório (segmentos do corpo, frutas)
tests/          testes (Vitest), incluindo simulação da ilha sem gráficos
android/        projeto Android (Capacitor)
```
