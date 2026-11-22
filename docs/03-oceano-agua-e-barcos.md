# 03 — Oceano, água e barcos

## 1. Oceano 3D

Um oceano contínuo liga todas as ilhas de um mar. A superfície é uma malha em anéis
concêntricos centrada na câmera (mais densa perto, mais grossa longe), animada por shader.

| Recurso | Como é feito | Perfil mínimo |
|---|---|---|
| Ondas | Soma de 4–8 ondas de Gerstner no shader | Leve (4 ondas) |
| Ondas físicas | A mesma fórmula roda na CPU para consultar a altura em qualquer ponto | Leve |
| Espuma | Nas cristas, nas praias, em rochas e no rastro de barcos | Médio |
| Reflexo | Reflexo do céu (Médio) e planar das ilhas próximas (Alto) | Médio |
| Refração e profundidade | Cor muda com a profundidade do fundo; areia visível em água rasa | Alto |
| Correntes | Campo vetorial por região; empurra barcos e nadadores | Leve |
| Redemoinhos | Zonas que puxam para o centro e giram barcos | Leve |
| Tempestades | Ondas maiores, chuva, raios, céu escuro | Leve |
| Ondas quebrando | Faixa de espuma animada ao longo da linha de praia | Médio |
| Rastros, respingos e bolhas | Partículas emitidas por barcos, nadadores e impactos | Leve |

**Regra de consistência:** o que se vê é o que a física usa. Barcos, nadadores e objetos
flutuantes leem a mesma função de altura das ondas que o shader desenha.

## 2. Física da água

| Fenômeno | Regra |
|---|---|
| Empuxo | Força para cima proporcional ao volume submerso (amostrado em pontos do corpo/casco) |
| Flutuação | Personagens sem fruta boiam com a cabeça para fora; objetos de madeira boiam |
| Arrasto | Velocidade reduzida dentro d'água (fator 0,45 nadando, 0,3 mergulhando) |
| Correntes | Somam um vetor ao movimento de quem está na água |
| Resistência | Golpes corpo a corpo dentro d'água têm 70% da velocidade |
| Impactos | Quedas na água geram respingo proporcional à velocidade; não causam dano de queda |
| Habilidades | Fogo apaga ao tocar a água (vira vapor que tapa a visão); raio se espalha na água (atinge quem estiver nadando perto); gelo congela a superfície |

### 2.1 Natação e mergulho

| Estado | Entrada | Comportamento |
|---|---|---|
| Boiar | Parado na água funda | Cabeça fora, leve balanço |
| Nadar | Mover-se na superfície | Animação de crawl; Correr acelera e gasta fôlego |
| Mergulhar | Botão Agachar na água | Desce; fôlego de 30 s; tela escurece e sons abafados |
| Subir | Botão Pular embaixo d'água | Sobe para a superfície |
| Sair da água | Chegar à borda | Escala automaticamente bordas de até 1,2 m |

### 2.2 Fraqueza dos usuários de fruta

| Regra | Valor |
|---|---|
| Ao entrar em água funda | Não consegue boiar: afunda devagar |
| Mobilidade | 40% da velocidade de nado |
| Poderes | Bloqueados (fruta, despertar e transformações) |
| Energia | Drena 10 por segundo |
| Dano | 7% da vida máxima a cada 0,5 s depois de 2 s submerso |
| Resgate | Um aliado ou NPC de resgate pode puxar o jogador para fora; boias e barcos próximos também salvam |
| Água rasa (até a cintura) | Sem penalidade de vida; só perde a capacidade de usar poderes |

**Na Fase 1 já funciona:** quem comeu uma fruta (menos Maré e Geada) entra no estado
"Afundando" na água funda: não boia, anda a 40% do nado, o fôlego drena 10/s e, depois de
2 s com a cabeça embaixo d'água, perde 7% da vida máxima a cada 0,5 s. Ainda dá para
agarrar uma borda ou um barranco escalável ao alcance. O resgate por aliados vem com o
multijogador.

**Imunes:**

| Fruta | Como lida com a água |
|---|---|
| Maré | Anda sobre a água em cima de uma onda própria; pode surfar em alta velocidade |
| Geada | Congela a superfície por onde passa, criando plataformas de gelo que derretem após 5 s |
| Fênix (forma alada) | Voando não toca a água; ao cair nela, aplica a regra normal |

## 3. Barcos

| Barco | Tripulação | Canhões | Velocidade | Vida estrutural | Desbloqueio |
|---|---|---|---|---|---|
| Bote | 1–2 | 0 | Alta | 300 | Início |
| Veleiro | 1–4 | 2 | Alta | 900 | Nível 100 |
| Caravela | até 6 | 6 | Média | 2.500 | Nível 400 |
| Navio pirata | até 10 | 12 | Média | 5.000 | Nível 900 |
| Navio de guerra | até 16 | 20 | Baixa | 10.000 | Nível 1600 |
| Embarcações especiais | variável | variável | variável | variável | Eventos e chefes |

### 3.1 Partes de um barco

- **Casco** detalhado, dividido em seções (proa, meio, popa, bombordo, estibordo), cada uma
  com vida própria.
- **Velas** animadas que enchem com o vento; ângulo da vela afeta a velocidade.
- **Leme** (posto de pilotagem), **âncora** (para o barco e prende contra correntes).
- **Canhões** com pontos de interação.
- **Convés explorável** com colisão: dá para andar, lutar e cair no mar.
- **Física de flutuação**: 8–16 pontos de empuxo no casco; o barco inclina com ondas e curvas.
- **Danos**: seções danificadas fazem o barco adernar e entrar água; fogo se espalha.
- **Reparos**: martelo de reparo no convés (lento, em combate) ou estaleiro (completo, pago).
- **Personalização**: cor do casco, velas, bandeira, figura de proa, canhões.

### 3.2 Controles de navegação

| Ação | Celular | PC | Controle |
|---|---|---|---|
| Leme | Joystick esquerdo | A/D | Analógico esquerdo |
| Velas (mais/menos pano) | Botões + / − | W/S | Gatilhos |
| Âncora | Botão Âncora | X | Y |
| Assumir canhão | Botão contextual | E perto do canhão | A |
| Sair do leme | Botão Sair | F | B |

### 3.3 O bote no jogo (atualização 10)

O primeiro barco já navega de verdade entre a Ilha de Treino e o Porto das Origens, sem
teleporte. O resto desta seção (velas com vento, seções de casco, canhões, convés andável)
continua planejado.

| Item | Como está |
|---|---|
| Onde fica | Amarrado ao lado do cais da Ilha de Treino no começo; fica onde o jogador o deixou (salvo) |
| Embarcar | Chegar perto (em pé ou nadando) e tocar **Embarcar no bote** (E no PC) |
| Pilotar | O analógico (ou WASD) aponta o rumo em relação à câmera, igual a andar; o bote gira com raio de curva até lá e acelera aos poucos. **Correr** usa a velocidade rápida |
| Velocidade | 13 unidades/s (≈ 6 m/s); 19 com Correr. A travessia leva cerca de 10–15 s |
| Raso e estruturas | O bote para ao encostar na praia (precisa de 0,7 de água sob a proa) e nos pilares e tábuas do cais, com um pequeno recuo e tremor; dá para sair do raso virando para o mar |
| Ondas | Altura média das ondas sob o casco, arfagem e rolagem pelas ondas, inclinação nas curvas, esteira de espuma atrás |
| Descer | **Pular** (o botão mostra "Descer") ou E: desce no chão firme mais perto (cais ou praia); sem chão por perto desce na água ao lado. Usuário de fruta não desce em água funda (afundaria): o jogo avisa para encostar |
| No bote | Sem ataque, habilidades, esquiva e defesa; a câmera se afasta e segue o rumo |
| Barqueiros | Continuam com a **viagem rápida** e agora também **trazem o bote** até o cais deles |
| Primeira travessia | Descer na outra ilha pela primeira vez depois de navegar dá 60 de experiência (uma vez por ilha) |
| Mapa | O bote aparece como ponto marrom no minimapa e no mapa ("Seu bote") |

Código: `src/ships/boatRules.js` (regras puras, testadas em `tests/boat.test.js`) e
`src/ships/boat.js` (modelo, balanço, esteira, onde descer).

## 4. Combate naval

| Elemento | Regra |
|---|---|
| Canhões | Bala com balística real (gravidade, velocidade inicial); mira com arco previsto |
| Colisões | Abalroar causa dano proporcional à massa e velocidade |
| Explosões | Dano em área no casco e na tripulação no convés |
| Incêndios | Seções em chamas perdem vida até serem apagadas (balde ou chuva) |
| Destruição parcial | Mastros podem cair (perde velocidade); seções podem abrir rombos |
| Navios inimigos | IA navega em formação, mantém distância de tiro e tenta abalroar quando vence |
| Abordagem | Lançar ganchos a menos de 12 m; inimigos pulam para o seu convés e vice-versa |
| Combate no convés | Sistema normal de combate (doc 05) sobre a superfície que balança |
| Naufrágio | Abaixo de 0% de vida o navio afunda em 20 s; tripulação vai para a água |

### 4.1 No jogo (atualização 16)

| Item | Como está |
|---|---|
| Canhão do bote | Um canhão giratório na proa. **Atacar** (tocar na tela, clique, J) atira para onde a câmera aponta; mira sozinho no navio inimigo mais perto do centro (cone de 25°, até 86) prevendo o movimento dele. Recarga 1,6 s. O arco previsto aparece tracejado sobre a água, com um anel onde a bala cai (vermelho com alvo, dourado sem alvo) |
| Bala | Balística real: saída 46/s, gravidade 24; explode ao tocar navio, água ou chão (raio 3,4: dano cheio no centro, metade na borda) |
| Casco do bote | 300 + 6 por nível de aventureiro; barra "Casco" no topo enquanto navega; aviso abaixo de 30% |
| Conserto | Com qualquer Barqueiro: 0,6 moeda por ponto que falta |
| Bote afundado | Casco a zero: o jogador cai na água e um Barqueiro leva outro bote, com metade do casco, ao cais da Ilha de Treino |
| Navios corsários | 10 navios (escala 1,5, dois canhões de cada lado): a Chalupa Ferrugem (Nv. 12) entre a Ilha de Treino e o Porto, e um por ilha do Primeiro Mar no primeiro terço da faixa de nível; patrulham um anel de 6 pontos em mar aberto |
| IA | Vê o bote a 75; vai para um ponto ao lado dele a ~36 (mostra o costado) e atira entre 18 e 64, com erro maior de longe e contra bote rápido (dá para desviar navegando); a mais de 150 da patrulha volta |
| Casco e dano dos inimigos | Casco 300 + 9 por nível; canhão 18 + 0,55 por nível. Do mesmo nível, afundar um navio leva 8 a 15 tiros |
| Abalroar | Encostar rápido (diferença de velocidade acima de 6) fere os dois cascos |
| Afundar um navio | Afunda em 6 s e volta à patrulha depois de 150 s. Saque: moedas (30 + 3 por nível), experiência (1/6 do nível), 2–4 Tábuas de Navio, Pólvora (60%), Pérola (20%) e item de equipamento (25%) |
| Fora do bote | Balas inimigas que caem perto ferem o jogador nadando ou na praia (metade do dano) |
| Mapa | Navios inimigos aparecem como pontos vermelhos no minimapa (até 180) e o mais perto em combate usa a barra do topo |

Código: `src/ships/naval.js` (regras puras, `tests/naval.test.js`) e `src/ships/fleet.js` (navios,
balas, mira, naufrágio). Ainda não: velas com vento, seções de casco, incêndio, mastro que
cai, abordagem com ganchos e combate no convés.

## 5. Bestas marinhas

| Categoria | Exemplo | Nível | Comportamento |
|---|---|---|---|
| Serpente marinha | Serpente de Coral | 300 | Circula o barco, emerge para morder, mergulha |
| Tubarão gigante | Mandíbula Cinzenta | 600 | Persegue nadadores e botes, ataca o casco |
| Monstro abissal | Lanterna das Profundezas | 1200 | Luz atrai o jogador; surge de baixo |
| Besta territorial | Caranguejo-Rochedo | 900 | Defende uma ilhota; luta em terra e na água |
| Criatura mítica | Tartaruga-Ilha | 1800 | Ilha viva que mergulha quando atacada |
| Chefe oceânico | Leviatã Ósseo | 2100 | Chefe de 3 fases no Mar dos Ossos |

Toda besta tem: modelo e animações próprios (doc 04, seção 6), emergir, mergulhar,
perseguir navios, atacar jogadores, criar ondas que empurram barcos, reações a dano.

**Encontro marítimo** (modelo):

1. Aviso: água borbulha e o radar do barco mostra uma silhueta.
2. Fase 1: a besta circula e testa o casco.
3. Fase 2 (abaixo de 60%): ataques de onda e investidas.
4. Fase 3 (abaixo de 25%): fúria; ataques mais rápidos, pontos fracos expostos.
5. Recompensa: material raro, moedas, chance de fragmentos e itens de barco.
