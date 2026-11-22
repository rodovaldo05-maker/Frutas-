# 08 — Frutas

> Base: as **16 frutas** do FRUTO Laboratório Voxel, Edição 18 (versão de dados 3.1).
> Custos, recargas e danos de partida vêm do catálogo do laboratório e serão balanceados.
>
> **Atenção:** o pedido original foi cortado no meio da Fruta do Eclipse. As frutas 1 a 5 seguem
> o pedido. Do Eclipse em diante, o conteúdo vem do catálogo da Edição 18 e de propostas deste
> documento, marcadas como **(a confirmar)**.

## 1. Regras gerais

### 1.1 O que toda fruta tem

| Item | Descrição |
|---|---|
| Modelo 3D | Casca cúbica, olhos grandes, poder desenhado no contorno (estilo "Pomar de Bolso"); 4 estados de mordida |
| Coleta | Fruta encontrada no mundo brilha, pisca e salta; ao pegar, vai para a mochila |
| Comer | Animação "Comer a fruta" com três mordidas sincronizadas ao modelo |
| Fruta na mão | Selecionada na mochila, fica viva na mão: respira, balança, olha em volta, pisca |
| Combo | 3 golpes próprios da fruta (substitui o combo do estilo quando a fruta está "em foco") |
| Esquiva | Investida própria |
| 5 habilidades | Reais (ofensivas ou utilitárias), nas teclas Q, E, R, T, G |
| Passivas | 2 por fruta |
| Despertar | Tecla F; exige 45 de energia, custa 15 para iniciar e 4 por segundo |
| Maestria | 0–600 (ver 1.3) |
| Efeitos e sons | Próprios por habilidade |
| Interações ambientais | Com água, fogo, gelo, metal, areia, vento |
| Fraquezas | Escritas no dossiê e visíveis no jogo (avisos, alcance) |
| Melhorias | Escolhas de modificadores por maestria |

**Modo de combate:** o jogador alterna entre o modo **Fruta** e o modo **Estilo** (tecla 1/2 no
PC, botão de alternância no celular, LB no controle). As mesmas 5 teclas (Q, E, R, T, G) e o
combo servem ao modo ativo. Assim a tela do celular mostra só 5 botões de habilidade.

**Transformações (Animais e Míticas):** comandos **separados** das 5 habilidades: **H** para a
forma híbrida e **N** para a completa no PC, dois botões pequenos ("Híbrida" e "Completa") no
celular e ← / → no direcional do controle. Repetir o comando da forma atual volta à humana.
As 5 habilidades mudam de comportamento conforme a forma ativa. Transformar não gasta energia.

### 1.2 Tipo e raridade (especificação "Sistemas de Frutas e Vilas", Parte A)

Cada fruta tem **tipo** e **raridade** independentes. A raridade é da fruta (não de cada
cópia sorteada) e **não multiplica dano**: o equilíbrio vem de alcance, recarga, custo de
energia, controle, mobilidade e defesa. Substitui o antigo "nível da fruta" (Comum, Épico,
Lendário com bônus de dano).

| Rank | Cor | Peso no sorteio padrão | Valor de troca | Apresentação |
|---|---|---|---|---|
| Comum | `#A5ADB5` | 45% | 1 fragmento | Borda cinza simples |
| Incomum | `#41C978` | 28% | 1 | Borda verde, brilho discreto |
| Rara | `#3E9EFF` | 16% | 2 | Borda azul iluminada, partículas flutuantes |
| Épica | `#B56BFF` | 7% | 3 | Moldura roxa ornamentada, energia circulando |
| Lendária | `#FFB83D` | 3% | 5 | Moldura dourada, reflexo e revelação especial |
| Mítica | `#FF526B` | 1% | 10 | Carmesim com ornamento dourado e aura animada |

Tipos (nomes do FRUTO): **Essência** (o corpo ganha um poder), **Elemento** (o corpo vira e
controla um elemento) e **Fera** (formas animais; as Míticas têm formas lendárias).

| Fruta | Tipo · subtipo | Raridade |
|---|---|---|
| Impacto | Essência · Cinética | Comum |
| Eco | Essência · Sonora | Comum |
| Duna | Elemento · Areia | Comum |
| Brasa | Elemento · Fogo | Incomum |
| Cristal | Essência · Mineral | Incomum |
| Falcão | Fera · Ave | Incomum |
| Geada | Elemento · Gelo | Rara |
| Tormenta | Elemento · Raio | Rara |
| Ímã | Essência · Magnética | Rara |
| Lobo | Fera · Predador | Épica |
| Maré | Elemento · Água | Épica |
| Eclipse | Essência · Espacial | Lendária |
| Besta, Fênix, Dragão Oriental, Dragão Ocidental | Fera · Mítica | Mítica |

A ficha completa de cada fruta (id, tipo, subtipo, raridade, cor, descrição, ícone, modelo
3D, preço base, valor de troca, peso no sorteio, região, habilidades, efeitos, sons,
animações, formas, despertar, atributos por forma, energia, recargas, domínio, restrições,
versão) fica em `data/frutas.json`; os ranks em `data/raridades.json`; as tabelas de sorteio
(roleta, baús, NPCs, eventos, recompensas, mundo aberto) em `data/tabelas-frutas.json`.

### 1.3 Maestria da fruta

| Maestria | Desbloqueio |
|---|---|
| 0 | Combo, esquiva, habilidade Q |
| 25 | Habilidade E |
| 75 | Habilidade R |
| 150 | Habilidade T |
| 250 | Habilidade G |
| 350 | Despertar |
| 450 | Segunda passiva |
| 500 | Melhorias (1 modificador por habilidade, escolhendo 1 de 2) |
| 600 | Visual de mestre da fruta |

Ganho de maestria: dano causado com a fruta e uso de habilidades em combate real
(acertos contra alvos de treino não contam acima da maestria 100).

### 1.4 Fraqueza à água

Todas as frutas seguem a regra da água do doc 03, exceto **Maré** e **Geada**, que são imunes.

---

## 2. As 16 frutas

Formato de cada habilidade: **custo de energia / recarga (s) / dano base**.

### 2.1 Impacto — Cinética

**Identidade:** força, pressão, energia cinética e impactos.
**Modelo:** fruta robusta com placas geométricas e rachaduras que lembram ondas de choque.
**Combo:** Punhos de Pistão (11 / 13 / 18). **Esquiva:** Passo de Aríete.

| Tecla | Habilidade | Descrição | Custo / Rec. / Dano |
|---|---|---|---|
| Q | Punho de Recuo | Soco que libera onda de pressão e empurra o primeiro alvo | 12 / 1,8 / 24 |
| E | Investida de Aríete | Avanço com o ombro que rompe a defesa de cada alvo no caminho | 18 / 4 / 32 |
| R | Pistão Destruidor | Sequência de golpes com impulsos; o último rompe uma faixa de 4,6 m | 32 / 9 / 48 |
| T | Martelo Sísmico | Golpe no chão com fissuras que lançam os alvos para cima | 19 / 4,5 / 27 |
| G | Contrachoque Absoluto | Absorve o próximo ataque por 1,2 s e devolve em explosão | 22 / 7,8 / 34 |

**Despertar — Domínio Cinético:** golpes acumulam energia, criam ondas secundárias e aumentam o alcance dos impactos.
**Passivas:** resistência a recuo; armazena 10% do dano recebido para o próximo golpe.
**Fraqueza:** alcance curto; a faixa do Pistão aparece durante a preparação.
**Ambiente:** quebra rochas e paredes frágeis.

### 2.2 Brasa — Elemental

**Identidade:** criação e manipulação de fogo.
**Modelo:** fruta vermelha e alaranjada com placas de carvão incandescente.
**Combo:** Punhos de Fornalha (9 / 11 / 14). **Esquiva:** Rastro de Fagulhas.

| Tecla | Habilidade | Descrição | Custo / Rec. / Dano |
|---|---|---|---|
| Q | Projétil Incandescente | Esfera de fogo que explode no impacto | 14 / 2 / 30 |
| E | Passo Flamejante | Dash que deixa trilha de chamas | 20 / 5 / 12 (+queimadura) |
| R | Erupção Ascendente | Pilares de fogo sob os alvos próximos | 35 / 10 / 42 |
| T | Tempestade de Brasas | Chuva de projéteis incendiários sobre uma área | 18 / 4,2 / 21 |
| G | Fornalha Infernal | Marca o chão; erupção circular após 0,5 s | 30 / 7,9 / 38 |

**Despertar — Coração da Fornalha:** chamas mais intensas, área de combustão maior e explosões secundárias.
**Passivas:** resistência térmica (imune a lava rasa); queimadura acumulativa.
**Fraqueza:** gasta muita energia para manter áreas; chuva reduz alcance em 15%.
**Ambiente:** acende tochas, derrete gelo, queima vegetação seca; na água vira vapor.

### 2.3 Geada — Elemental

**Identidade:** criação de gelo e redução de temperatura.
**Modelo:** fruta azul-clara com facetas cristalinas e padrões de neve.
**Combo:** Punhos de Sincelo (9 / 11 / 13). **Esquiva:** Patinada Glacial.

| Tecla | Habilidade | Descrição | Custo / Rec. / Dano |
|---|---|---|---|
| Q | Lanças Glaciais | Projéteis de gelo perfurantes; congelam por 2 s | 12 / 2,4 / 25 |
| E | Muralha Congelante | Parede defensiva que bloqueia disparos por 4 s | 20 / 7 / 0 |
| R | Prisão Invernal | Congela progressivamente os inimigos próximos | 32 / 10 / 36 |
| T | Caminho de Cristais | Trilha de gelo: +30% de velocidade, atravessa água | 19 / 4,9 / 0 |
| G | Explosão do Zero Absoluto | Grande explosão congelante com estilhaços | 34 / 11 / 44 (a confirmar) |

**Despertar — Era Glacial:** congela superfícies, cria estruturas maiores, amplia o controle de área.
**Passivas:** resistência ao frio (imune a nevascas); inimigos atingidos ficam 15% mais lentos.
**Fraqueza:** menos dano imediato; congelamento não para golpes já disparados.
**Ambiente:** imune à água (congela a superfície); apaga fogo.

### 2.4 Tormenta — Elemental

**Identidade:** eletricidade e tempestades.
**Modelo:** fruta azul-violeta com sulcos luminosos em forma de raio.
**Combo:** Punhos de Arco (8 / 10 / 14). **Esquiva:** Passo Relâmpago.

| Tecla | Habilidade | Descrição | Custo / Rec. / Dano |
|---|---|---|---|
| Q | Arco Voltaico | Raio que salta entre até 3 inimigos | 14 / 2,2 / 28 |
| E | Passo Relâmpago | Deslocamento extremamente rápido com descarga no caminho | 17 / 4 / 27 |
| R | Lança de Trovão | Disparo elétrico concentrado em linha | 20 / 4,7 / 25 |
| T | Nuvem de Tempestade | Nuvem que descarrega raios na área por 4 s | 29 / 8,1 / 14 por raio |
| G | Julgamento Celeste | Vários raios atingem a área selecionada | 34 / 10 / 24 por raio |

**Despertar — Corpo da Tempestade:** velocidade maior, descargas secundárias, ataques elétricos ampliados.
**Passivas:** resistência elétrica; acúmulo de carga (Choque) nos inimigos.
**Fraqueza:** correntes precisam de alvos próximos; o passo não dá invulnerabilidade longa.
**Ambiente:** raio na água atinge todos que estiverem nadando perto; ativa mecanismos elétricos.

### 2.5 Lobo — Animal

**Identidade:** transformação lupina, perseguição e combate físico.
**Combo:** Garras da Alcateia (10 / 12 / 15). **Esquiva:** Passada Feral.

**Forma híbrida:** orelhas, focinho parcial, presas, garras, pelagem, cauda, pernas fortes, musculatura ampliada.
**Forma completa:** lobo quadrúpede grande com quatro patas articuladas, coluna flexível, pescoço robusto, mandíbula móvel e cauda dinâmica.

| Tecla | Habilidade | Humana | Híbrida | Completa | Custo / Rec. / Dano |
|---|---|---|---|---|---|
| Q | Garras Predatórias | 3 marcas de garra curtas | 5 cortes cruzados | Mordida tripla | 12 / 2,5 / 24 |
| E | Investida do Caçador | Corrida curta com impacto | Corrida média, derruba | Corrida longa, arrasta o alvo | 18 / 5 / 30 |
| R | Mordida Brutal | Agarrão com dano | Agarrão e arremesso | Agarra e sacode (alvo preso 1,5 s) | 22 / 7 / 38 |
| T | Uivo da Matilha | Fortalece o jogador | + enfraquece inimigos próximos | + medo (inimigos fogem 1,5 s) | 17 / 9 / 0 |
| G | Caçada Lunar | 2 botes | 3 botes | 4 botes rápidos | 25 / 7,2 / 17 por bote |

**Despertar — Predador Ancestral:** força, velocidade, percepção e regeneração aumentadas.
**Passivas:** faro (rastros de inimigos visíveis); +10% de velocidade em forma animal.
**Fraqueza:** exige aproximação; botes seguem linha reta.

### 2.6 Eclipse — Espacial

**Identidade:** sombras, gravidade localizada e distorções espaciais.
**Modelo:** fruta escura com núcleo violeta e padrões orbitais.
**Combo:** Punhos de Penumbra (9 / 10 / 14). **Esquiva:** Passagem Umbral.

| Tecla | Habilidade | Descrição | Custo / Rec. / Dano |
|---|---|---|---|
| Q | Núcleo Sombrio | Esfera que explode e atrai inimigos | 16 / 2,7 / 30 |
| E | Passagem Oculta | Teleporte curto para trás do alvo mais próximo | 20 / 5 / 22 |
| R | Horizonte Vazio | Campo que reduz a mobilidade e causa dano contínuo | 36 / 11 / 9 por pulso |
| T | Fenda Gêmea | Duas fendas laterais puxam os alvos para o centro (a confirmar) | 19 / 4,9 / 23 |
| G | Colapso Orbital | Núcleo atrai os alvos antes de explodir (a confirmar) | 30 / 8,6 / 36 |

**Despertar — Eclipse Total (a confirmar):** gravidade mais forte e teleportes encadeados.
**Passivas (a confirmar):** intangível por 0,3 s ao teleportar; dano extra pelas costas.
**Fraqueza:** áreas de alcance limitado; exposto ao fim do teleporte.

### 2.7 Maré — Elemental (a confirmar)

**Identidade:** ondas, ressaca e redemoinhos. **Imune à água**: anda sobre ondas.
**Combo:** Punhos de Ressaca (9 / 11 / 15). **Esquiva:** Curva de Espuma.

| Tecla | Habilidade | Descrição | Custo / Rec. / Dano |
|---|---|---|---|
| Q | Onda de Arrebentação | Onda de 6,4 m de largura que percorre 9,6 m, levanta e empurra | 13 / 2,3 / 26 |
| E | Ressaca | Puxa uma onda de volta, trazendo os alvos | 18 / 4,8 / 18 |
| R | Olho da Maré | Redemoinho de 4,2 m que arrasta para o centro | 33 / 9 / 9 por pulso |
| T | Chicote de Espuma | Varredura em arco que arrasta os alvos | 18 / 4,2 / 24 |
| G | Coluna de Maré | Água brota sob o alvo e o lança | 27 / 7 / 31 |

**Despertar — Senhor das Ondas:** onda permanente sob os pés; habilidades maiores no mar.
**Passivas:** surfar na água; +20% de dano estando sobre a água.
**Fraqueza:** correntes seguem faixas; quem sai pela lateral escapa.

### 2.8 Cristal — Mineral (a confirmar)

**Combo:** Manoplas de Quartzo (12 / 13 / 17). **Esquiva:** Passo Prismático.

| Tecla | Habilidade | Descrição | Custo / Rec. / Dano |
|---|---|---|---|
| Q | Lança de Quartzo | Cristal facetado disparado no alvo | 13 / 1,9 / 29 |
| E | Coroa de Espinhos | Anel de cristais nos pés que imobiliza | 21 / 5 / 25 |
| R | Geodo de Ruptura | Geodo plantado que se rompe após 0,8 s | 32 / 8 / 45 |
| T | Roseta de Quartzo | Três estilhaços divergentes | 20 / 4,7 / 13 cada |
| G | Cúpula de Facetas | Refrata até 3 disparos de volta por 1,8 s | 27 / 8,4 / 15 |

**Despertar — Catedral de Quartzo:** cristais permanecem como obstáculos e refletem luz/raios.
**Passivas:** armadura de cristal (+10% de defesa); estilhaços extras em acertos críticos.

### 2.9 Eco — Sonora (a confirmar)

**Combo:** Punhos de Refrão (8 / 9 / 12). **Esquiva:** Passo Sincopado.
**Mecânica:** **Nota de Chamada** marca alvos por 3,2 s; outras habilidades fazem os marcados "responderem" com dano extra.

| Tecla | Habilidade | Descrição | Custo / Rec. / Dano |
|---|---|---|---|
| Q | Nota de Chamada | Onda em cone que marca os alvos | 12 / 2,1 / 23 |
| E | Contratempo | Três batidas em frente; marcados respondem | 21 / 5,3 / 12 |
| R | Câmara Harmônica | Palmas em todas as direções; cada marcado responde | 31 / 8,4 / 38 |
| T | Diapasão | Duas linhas paralelas de som | 19 / 4,6 / 15 |
| G | Última Ressonância | Duas notas no alvo; a segunda o segue | 27 / 7,3 / 18 |

**Despertar — Orquestra:** marcas duram o dobro e respondem duas vezes.

### 2.10 Falcão — Animal (a confirmar)

**Combo:** Garras do Peregrino (9 / 11 / 14). **Esquiva:** Rasante de Asas.
**Formas:** híbrida alada (teto de voo 3,2 m no laboratório; no jogo, 30 m) e falcão completo.
**Voo:** Pular duas vezes decola e pousa; altitude com botões ↑ ↓.

| Tecla | Habilidade | Humana | Híbrida | Completa | Custo / Rec. / Dano |
|---|---|---|---|---|---|
| Q | Rajada de Penas | 1 pena | 3 penas em leque | Mergulho Real (do alto) | 12 / 2,3 / 23 |
| E | Talho das Asas | Corte com o braço | Corte com as asas, altura acompanha o voo | Rasante que atravessa a fila | 12 / 2,3 / 30 |
| R | Foice de Vento | Corte de ar em linha | Linha mais longa | Linha na direção do voo | 18 / 4,2 / 24 |
| T | Corrente Ascendente | Levanta alvos ao redor | + ergue o Falcão | + mantém alvos no ar 1 s | 26 / 7,3 / 29 |
| G | Olho do Peregrino | Marca um alvo: +25% de dano nele | + revela fraqueza | + mergulho guiado no alvo | 20 / 10 / 0 |

**Despertar — Céu do Peregrino:** voo mais rápido, penas perfurantes.

### 2.11 Duna — Elemental (a confirmar)

**Combo:** Punhos de Arenito (10 / 12 / 15). **Esquiva:** Mergulho na Areia.

| Tecla | Habilidade | Descrição | Custo / Rec. / Dano |
|---|---|---|---|
| Q | Agulha de Areia | Projétil compacto em linha reta | 12 / 1,8 / 22 |
| E | Passo de Duna | Desliza na areia atingindo o caminho | 19 / 4,2 / 28 |
| R | Tempestade de Areia | Furacão de 6,3 m: 5 rajadas em espiral, a última lança | 32 / 9 / 9 por rajada |
| T | Dunas Errantes | Duas erupções de areia em sequência | 19 / 4,7 / 16 |
| G | Areia Movediça | Prende e puxa durante 4 pulsações | 28 / 8,3 / 9 por pulso |

**Ambiente:** absorve água em pequena área (seca poças); em desertos, +20% de alcance.

### 2.12 Ímã — Magnética (a confirmar)

**Combo:** Punhos Bipolares (9 / 12 / 15). **Esquiva:** Arranque Polar.

| Tecla | Habilidade | Descrição | Custo / Rec. / Dano |
|---|---|---|---|
| Q | Tração Polar | Campo frontal que atrai | 13 / 2,4 / 20 |
| E | Pulso Repulsor | Repele os inimigos ao redor | 19 / 4,6 / 25 |
| R | Órbita de Ferro | Três pulsos crescentes giram ferro em um ponto | 33 / 8,5 / 14 por pulso |
| T | Trilho Magnético | Disparo que perfura alvos alinhados | 20 / 4,4 / 29 |
| G | Inversão de Polos | Atrai e inverte o campo para arremessar | 29 / 7,8 / 24 |

**Ambiente:** atrai objetos metálicos, ativa mecanismos de ferro; forte contra navios (canhões e âncoras).

### 2.13 Besta — Mítica, família quadrúpede (a confirmar)

Criatura de juba branca e dois chifres rubros. **Combo:** Garras de Marfim (11 / 13 / 17). **Esquiva:** Arrancada de Chifres.

| Tecla | Habilidade | Descrição | Custo / Rec. / Dano |
|---|---|---|---|
| Q | Presa de Marfim | Golpe com os chifres que levanta | 13 / 2,4 / 29 |
| E | Investida dos Chifres | Corrida que carrega o alvo até uma parede | 20 / 6 / 34 |
| R | Rugido Carmesim | Rugido em cone que empurra | 19 / 4,6 / 24 |
| T | Pisão da Besta | Solo se rompe ao redor e arremessa | 27 / 7,5 / 38 |
| G | Fúria Carmesim | 6 s de golpes sem recuo e +20% de dano | 30 / 14 / 0 |

### 2.14 Fênix — Mítica, família ave (a confirmar)

Penas azuis com pontas violeta e ouro. Voa (teto maior que o Falcão). **Combo:** Talões da Aurora (9 / 12 / 16). **Esquiva:** Rasante Solar.

| Tecla | Habilidade | Descrição | Custo / Rec. / Dano |
|---|---|---|---|
| Q | Pluma de Aurora | Pluma incandescente no primeiro alvo | 12 / 2,2 / 26 |
| E | Rasante Solar | Voo rasante que queima o caminho | 18 / 5 / 28 |
| R | Leque Solar | Asas abertas varrem um leque de luz | 18 / 4,2 / 25 |
| T | Pulso de Renascimento | Recupera 24 de vida e queima os próximos | 30 / 8,2 / 30 |
| G | Chama Eterna | Ao ser derrotado em até 10 s, renasce com 30% de vida (1 vez por combate) | 40 / 120 / 0 |

### 2.15 Dragão Oriental — Mítica, família serpente (a confirmar)

Corpo serpentino, juba carmesim, chifres dourados. Voa em curvas. **Combo:** Garras do Poente (10 / 12 / 16). **Esquiva:** Passo Serpentino.

| Tecla | Habilidade | Descrição | Custo / Rec. / Dano |
|---|---|---|---|
| Q | Raio Imperial | Raio dourado que perfura alvos alinhados | 14 / 2,5 / 28 |
| E | Passo Serpentino | Voo curto em curva atravessando inimigos | 18 / 5 / 26 |
| R | Espiral Imperial | Corrente que gira no ponto marcado e puxa | 20 / 5,2 / 25 |
| T | Trovão do Poente | Marca o solo; relâmpago cai após 0,5 s | 28 / 7,8 / 40 |
| G | Nuvem Imperial | Invoca nuvem que segue o jogador e lança raios por 6 s | 34 / 14 / 12 por raio |

### 2.16 Dragão Ocidental — Mítica, família alada (a confirmar)

Escamas de obsidiana e membranas douradas. No chão sopra fogo; no ar bombardeia.
**Combo:** Garras de Obsidiana (12 / 13 / 18). **Esquiva:** Arranque Alado.

| Tecla | Habilidade | Descrição | Custo / Rec. / Dano |
|---|---|---|---|
| Q | Sopro de Fornalha | Fogo em cone de alcance médio | 15 / 2,8 / 31 |
| E | Arranque Alado | Investida em voo baixo | 18 / 5 / 27 |
| R | Batida de Asas | Varre o ar e afasta os inimigos | 20 / 4,8 / 26 |
| T | Meteoro de Obsidiana | Núcleo dourado cai no ponto marcado e explode | 31 / 8,3 / 43 |
| G | Chuva Dourada | Voando, lança 8 brasas douradas no chão | 30 / 10 / 18 cada |

---

## 3. Transformações míticas

| Fruta | Forma híbrida | Forma completa | Voo |
|---|---|---|---|
| Lobo | Bípede lupino | Lobo quadrúpede | Não |
| Falcão | Híbrido alado | Falcão-peregrino | Sim (2× Pular) |
| Besta | Bípede com chifres | Quadrúpede gigante | Não |
| Fênix | Híbrido alado de fogo azul | Fênix completa | Sim, teto maior |
| Dragão Oriental | Bípede com juba | Dragão serpentino | Sim, em curvas |
| Dragão Ocidental | Bípede alado | Dragão quadrúpede alado | Sim |

Regras:

- Transformar: 0,4–0,8 s, invulnerável durante a troca, efeito próprio.
- Formas completas são maiores: a câmera se afasta e a hitbox cresce (mais fácil de acertar).
- Cada forma tem animações próprias (doc 04, seção 4); nada de animação humana reaproveitada.
- Água: formas não voadoras afundam como usuário de fruta comum.

## 4. Situação no jogo (atualização 3 — poderes das frutas)

| Parte | Como ficou |
|---|---|
| Energia | Barra roxa no HUD (aparece com fruta comida): 100 + 4 por ponto de Vitalidade; volta 7/s depois de 1 s sem gastar |
| Habilidades | Três por fruta, nas teclas 1 · 2 · 3, nos slots 1–3 da barra de baixo (toque) ou no direcional ← ↑ → do controle; nome, custo, recarga e dano vêm do laboratório |
| Gesto e tempo | Clipe de cada habilidade do laboratório; o efeito sai no quadro de contato do clipe |
| Formatos | Projétil (com explosão, puxão, queimadura), investida, área em volta, ponto marcado com aviso no chão (com pulsos), faixa, cone, muralha, teleporte, raio em cadeia e pilares |
| Efeitos nos inimigos | Congelar (fica parado e azul), queimar (dano por segundo, laranja), puxar, empurrar e lançar para o alto |
| Combo da fruta | Comer uma fruta troca o Jab → Direto → Gancho pelos três golpes assinados da fruta, com o dano dela |
| Dano | Dano da habilidade × (1 + 3% por ponto de Fruta) × bônus de domínio (até +30%) × defesa do alvo |
| Domínio | Por fruta, nível 1 a 100 (curva dos atributos × 1,4). Sobe acertando inimigos com as habilidades (+3, a terceira +4) e com o combo da fruta (+1), com teto por oponente; em bonecos rende pouco e cai com repetição. Habilidade 2 abre no domínio 5 e a 3 no 13 (0, 25 e 75 de 600 na ficha). Trocar de fruta não apaga o domínio |
| Transformações | Atualização 13: forma híbrida (domínio 20, tecla H ou botão Forma) para Lobo, Falcão, Besta, Fênix e os dois Dragões, com partes no corpo e números próprios (doc 12, seção 11); formas completas depois |
| Despertar | Atualização 13: slot 4, domínio 59 + Prova do Despertar (30 acertos de habilidade); +30% de dano e recargas 50% mais rápidas gastando energia, com aura (doc 12, seção 11) |

Os efeitos visuais são próprios do jogo (cubos, anéis, marcas, pilares, ondas e muralha na
cor da fruta). O conjunto completo de efeitos do laboratório pode ser trazido depois.

Código: `src/fruits/powers.js` (formato de cada habilidade), `src/combat/powers.js`
(energia, recargas e liberação), `src/vfx/powerFx.js` (efeitos), `src/progression/domain.js`
(domínio), `src/ui/skillBar.js` (slots e Energia); testes em `tests/powers.test.js`.


## Efeitos visuais das habilidades (atualização 18)

Os efeitos vêm do **Laboratório Voxel** (`FRUTO_Laboratorio_Voxel_Edicao_18.html`): o módulo
`createFruitFX` (com onda/olho da maré, furacão de areia e tempestade) e `FRUTOMythFX` foram
trazidos sem mudanças para `src/vfx/fruto-fx.js`. A ponte `src/vfx/labFx.js` escolhe, para cada
fruta e formato de golpe, o efeito que o laboratório usa; a lógica de acerto continua no
`powers.js`.

| Fruta | Golpe 1 | Golpe 2 | Golpe 3 |
|---|---|---|---|
| Impacto | Pistão cinético | Explosão cinética + rastro | Faixa de ruptura cinética |
| Brasa | Cometa de fogo | Chamas e fogueira no rastro | Rachaduras e pilares de fogo |
| Geada | Fila de espinhos de gelo | Muralha de gelo | Anel de espinhos, rachaduras e neve |
| Tormenta | Raios em cadeia | Investida com raio | Nuvem de tempestade com descargas |
| Lobo | Garras | Garras | Investida com garras |
| Eclipse | Orbe sombrio | Portais | Vórtice sombrio |
| Maré | Onda gigante | Redemoinho | Olho da maré |
| Cristal | Lasca de cristal | Anel de prismas | Geodo (prisma, rachaduras) |
| Eco | Ressonância | Ondas de ressonância | Ressonância em volta |
| Falcão | Pena | Penas em fila | Penas e pulso |
| Duna | Pedra de areia | Investida de areia | Furacão de areia |
| Ímã | Linhas magnéticas | Pulso e repulsão | Anéis e raios magnéticos |
| Besta, Fênix, Dragões | Marcas míticas com garras, fogo, raios e pulsos | | |

Também: carga na mão durante o gesto (`focus`), aviso no chão antes dos golpes marcados,
contato dos socos com a fruta equipada (`basicContact`), aura da fruta em volta do corpo com o
slot da fruta equipado (mais forte no despertar) e partículas no formato do laboratório.

Melhorias em cima do laboratório: o laboratório usa câmera de perto; no jogo os raios, o
pistão, as penas e as faixas ficavam finos, então ganham reforço de brilho (halo no
projétil, raio brilhante, clarões no impacto). O `FRUTOMythFX` buscava o THREE global e não
desenhava nada no jogo; agora usa o módulo `three`.
