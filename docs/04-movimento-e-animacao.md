# 04 — Movimento e animação

## 1. Controlador do personagem

Cápsula física (raio 0,45 m, altura 1,8 m na escala do mundo) controlada por código
(cinemática), com consultas à física para chão, paredes e bordas.

### 1.1 Ações de movimento

| Ação | Entrada padrão | Requisito | Custo |
|---|---|---|---|
| Andar | Direção leve | — | — |
| Correr | Direção forte | — | — |
| Sprint | Botão Correr (alterna) | — | Fôlego |
| Agachar | Agachar | — | — |
| Deslizar | Agachar correndo | Velocidade > 6 m/s | — |
| Pular | Pular | No chão ou coyote time | — |
| Salto duplo | Pular no ar | Desbloqueio (nível 150) | Fôlego |
| Dash | Dash | — | Recarga 0,8 s |
| Dash aéreo | Dash no ar | Desbloqueio (nível 300) | 1 por salto |
| Esquiva | Dash + direção | — | Janela de invulnerabilidade 0,2 s |
| Rolamento | Agachar ao aterrissar de queda alta | — | Anula dano de queda |
| Agarrar bordas | Automático ao alcançar borda | — | — |
| Escalar paredes | Ir contra parede escalável | — | Fôlego |
| Pulo na parede | Pular durante escalada ou encostado | — | Fôlego |
| Corrida na parede | Correr ao lado de parede, pulando | Desbloqueio (nível 500) | Máx. 1,2 s |
| Natação e mergulho | Ver doc 03 | — | Fôlego no mergulho |
| Planagem | Segurar Pular caindo | Desbloqueio (planador) ou forma alada | — |
| Voo | Pular 2× rápido | Formas aladas (Falcão, Fênix, Dragões) | Energia em voo longo |
| Queda livre | Cair de grande altura | — | — |
| Aterrissagem | Automático | — | Dano acima de 12 m de queda |

### 1.2 Física do movimento

| Parâmetro | Valor inicial | Observação |
|---|---|---|
| Velocidade de andar | 2,5 m/s | |
| Velocidade de correr | 6 m/s | |
| Sprint | 9 m/s | |
| Aceleração no chão | 40 m/s² | |
| Desaceleração no chão | 55 m/s² | Atrito |
| Controle aéreo | 35% da aceleração | |
| Gravidade | 28 m/s² | Mais forte que a real para saltos responsivos |
| Gravidade na descida | 1,4× | Queda mais seca |
| Velocidade terminal | 40 m/s | |
| Altura do salto | 2,2 m | |
| Inclinação caminhável | até 40° | Acima: desliza |
| Degrau automático | 0,5 m | Compatível com os blocos do terreno |
| Coyote time | 0,12 s | Pula logo após sair da borda |
| Buffer de salto | 0,15 s | Pulo apertado pouco antes de tocar o chão vale |
| Buffer de ataque | 0,2 s | Próximo golpe enfileirado |

### 1.3 Detecção de chão e inclinação

- Raio para baixo + varredura da cápsula a cada passo.
- O vetor de movimento é projetado no plano do chão (sobe e desce rampas sem quicar).
- Em descidas, o personagem "gruda" no chão até 0,5 m de diferença.
- Superfícies têm material: gelo (atrito 20%), areia (velocidade 85%), lama (70%),
  água rasa (80%).

### 1.4 Fôlego

Barra de 100 pontos na base, mais 1 por ponto de Força e 4 por ponto de Vitalidade (doc 09).
Sprint, escalada, salto duplo e mergulho gastam; regenera 25/s após 1 s sem gastar. Fôlego
zerado: o personagem cai da parede e não corre até recuperar 30% do máximo.

## 2. Câmera

| Modo | Distância | Comportamento |
|---|---|---|
| Exploração | 6 m | Segue atrás com atraso suave; arrastar gira |
| Combate | 7 m | Centraliza entre jogador e alvo travado |
| Mira | 3 m sobre o ombro | Para habilidades de mira manual |
| Barco | 14 m | Atrás do barco, mais alta |
| Voo | 9 m | Acompanha a inclinação do voo |
| Provador/Dossiê | 3,5 m de frente | Gira com arrasto |

Colisão de câmera com paredes (aproxima em vez de atravessar). Opção de reduzir movimento.

## 3. Biblioteca de animações (corpo humano)

| Grupo | Animações |
|---|---|
| Parado | Idle, respiração, idle de combate (por estilo), olhar ao redor |
| Locomoção | Andar, correr, sprint, partida, frenagem, mudança de direção, giro de 90° e 180° |
| Ar | Salto (impulso, subida, topo), queda, queda livre, aterrissagem leve e pesada, rolamento |
| Mobilidade | Esquiva (4 direções), dash, deslize, escalada (subir, lados, topo), agarrar borda, pulo na parede, corrida na parede |
| Água | Boiar, nadar (crawl), sprint de nado, mergulhar, nadar submerso, afundar (usuário de fruta) |
| Voo | Decolar, voo parado, voo para frente, planar, mergulho, pousar |
| Combate | Golpes por estilo, ataques de fruta, defesa, defesa perfeita, contra-ataque |
| Reações | Dano leve (frente, costas, lados), dano pesado, atordoamento, derrubado, levantar, morte |
| Interação | Abrir baú, falar, pegar item, comer fruta, puxar alavanca, pilotar |

### 3.1 Técnicas obrigatórias

| Técnica | Uso |
|---|---|
| Máquina de estados | Camadas separadas: locomoção, corpo superior (ataques), rosto |
| Blending | Espaço de mistura 2D por velocidade e direção (andar ↔ correr ↔ sprint) |
| Sincronização de passos | Velocidade da animação ajustada à velocidade real, para os pés não deslizarem |
| IK de pés | Pés se ajustam a degraus e rampas; quadril abaixa no degrau menor |
| IK de mãos | Mãos em bordas, leme, alavancas e fruta segurada |
| Eventos de animação | Marcas de "golpe ativo", "passo", "solta efeito" usadas pelo combate e pelo áudio |
| Root motion seletivo | Só em ataques com deslocamento definido |

**Critério de aceitação:** sem pés deslizando, sem membros atravessando o corpo, sem
"estalo" visível entre animações (transição mínima de 0,08 s).

### 3.2 Corpo base

O corpo base do FRUTO tem **17 peças rígidas** com pivôs (cintura, tronco, cabeça, ombros,
braços, antebraços, mãos, coxas, canelas e pés). Roupas e acessórios são peças voxel presas
a cada parte e acompanham as animações. Rosto com olhos, sobrancelhas e boca, que piscam e
mudam de expressão (neutro, bravo, dor, feliz, esforço).

## 4. Transformações

| Forma | Animações próprias |
|---|---|
| Híbrida bípede (Lobo, Besta, Falcão, Fênix, Dragões) | Locomoção, ataques, voo quando alada |
| Completa quadrúpede (Lobo, Besta) | Trote, galope, salto, mordidas, uivo |
| Completa ave (Falcão, Fênix) | Pousado, decolar, voo batido, planar, mergulho |
| Dragão serpentino (Oriental) | Ondulação do corpo, voo em curvas, enrolar |
| Dragão alado (Ocidental) | Quadrúpede no chão, voo com asas, sopro |

A transição entre formas dura 0,4–0,8 s, com efeito de transformação e invulnerabilidade
durante a troca.

## 5. Controladores de criaturas

Nenhuma criatura reutiliza animações humanas inadequadas. Cada tipo tem controlador próprio:

| Tipo | Locomoção | Particularidades |
|---|---|---|
| Bípede | Como o humano, proporções próprias | IK de pés |
| Quadrúpede | Ciclo de passadas por pata, coluna flexível | Inclina no terreno pelo plano das 4 patas |
| Ave | Ciclo de asa, planagem, mergulho | Altitude e inclinação da curva |
| Dragão alado | Chão quadrúpede + voo | Asas com fases de batida |
| Dragão serpentino | Corpo em segmentos que seguem uma curva | Cabeça lidera, corpo segue o caminho |
| Gigante | Passos lentos com tremor | Pontos fracos e partes destrutíveis |
| Aquático | Nado ondulatório, emergir, mergulhar | Gera ondas e respingos |

## 6. Implementado na Fase 1 (unidades do jogo)

O jogo usa a escala do FRUTO Laboratório: o corpo base mede cerca de 4,1 unidades
(≈ 1,8 m), então 1 m ≈ 2,2 unidades. Os valores do código ficam em
`src/movement/config.js`; os principais:

| Parâmetro | Valor no jogo | Observação |
|---|---|---|
| Cápsula | raio 0,62, altura 4,0 (agachado 2,5) | |
| Gravidade | 19,6 (descida 1,35×) | A mesma do laboratório |
| Andar / direcional cheio / Correr | 2,3 / 3,8 / 7,6 | Correr dá +100% (antes +58%); corpo inclina mais, câmera abre e levanta poeira |
| Altura do salto | ≈ 1,9 (soltar cedo pula mais baixo) | Salto duplo 7,6 de impulso |
| Inclinação caminhável | até 46° (acima de 50° escorrega) | Rampas de teste: 15°, 30°, 45°, 55° |
| Degrau automático | 0,55 | |
| Coyote time / buffer de salto | 0,12 s / 0,15 s | |
| Agarrar borda | topo entre 3,0 e 4,7 acima dos pés | Obstáculos até 2,6 são subidos direto |
| Escalada | 2,2/s, gasta 9–13 de fôlego por segundo | Pedra escura, troncos e barrancos |
| Corrida na parede | 1,2 s, exige pulo com Correr ligado | |
| Planar (asa-delta) | 8,0 à frente, cai 2,6/s | Segurar Pular caindo, depois do salto duplo. A asa-delta (vela listrada, tubos e barra de controle) abre da mochila nas costas; o piloto voa deitado segurando a barra e inclina nas curvas. Botão da asa (celular), tecla U ou Configurações ligam e desligam |
| Queda | sem dano até 12; rolando, até 26 | Agachar logo antes de tocar o chão |
| Nado / mergulho | 2,45 (Correr 4,4) / 2,2 (Correr ×1,6), ar 30 s | Boia com os valores do laboratório (3,28 parado, 1,94 nadando) |

A animação reaproveita o FRUTOMotion (passada ligada à velocidade real) e o FRUTOBalance
(pés no chão) do laboratório; as poses novas usam a IK de dois ossos do próprio laboratório.
O comportamento é conferido por `tests/movement.sim.test.js`, que roda a Ilha de Treino com a
mesma física, sem gráficos.
