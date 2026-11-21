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
