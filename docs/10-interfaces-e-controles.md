# 10 — Interfaces e controles

## 1. Linguagem visual

Estilo definido pela folha de referência enviada na Fase 1: painéis escuros em
roxo-noite com moldura dourada dupla e pontos nos cantos, faixa de título em madeira
escura com o ícone num círculo dourado, botões dourados para a ação principal e
escuros com borda dourada para as demais, barras de vida verde e de fôlego azul, retrato
redondo com selo de nível, minimapa com bússola e rastreador de missão. Só o estilo vem da
referência: personagens, logos e nomes são do FRUTO Legacy.

| Token | Valor | Uso |
|---|---|---|
| Tinta (fundo) | `#0e0b1c` | Telas cheias, fundo das barras |
| Painel | gradiente `#2e214c` → `#15112a` (97%) | Janelas, cartões, rastreador |
| Ouro | `#d9a64a` (claro `#ffe7a3`, escuro `#8a5a1c`) | Molduras, ícones, títulos |
| Madeira | `#45301a` → `#20160b` | Faixas de título, botões secundários |
| Texto | `#f6ecd7` | Texto principal |
| Texto secundário | `#b8a888` | Rótulos, descrições |
| Botão principal | gradiente `#ffe38f` → `#b5761f`, texto `#2b1805` | Jogar, Continuar, Rastrear, aba ativa |
| Confirmar / Cancelar | verde `#9cf07f` → `#1f7f2e` / vermelho `#7a2a20` → `#3d120c` | Receber, Aceitar / fechar (X) |
| Vida | `#7be86a` → `#1f8f35` | Barra de vida |
| Fôlego (energia) | `#64b4ff` → `#2453cf` | Barra de fôlego |
| Ar | `#8be4f5` → `#2a93b3` (vermelho quando acaba) | Barra de ar embaixo d'água |
| Destaque | `#ff9b79` (coral do laboratório) | Seta do jogador, ícone de missão, fruta do emblema |
| Comum / Épico / Lendário | `#8fd16a` / `#b57bff` / `#ffc93c` | Selos de nível, bordas de cartões |

| Regra | Valor |
|---|---|
| Fontes | Cinzel (títulos, logo, menus) e Inter (textos, números); embutidas no app |
| Logo | "FRUTO LEGACY" em Cinzel 900 com gradiente dourado e contorno; emblema de timão com a fruta mascote |
| Raio dos cantos | 16 px em janelas, 10–12 px em botões e abas, 50% em botões de ação |
| Alvo mínimo de toque | 48 × 48 dp; ação 60 dp; Pular 86 dp (ajustável de 75% a 130%) |
| Áreas seguras | Toda a interface respeita os recortes de câmera e bordas |
| Rótulos | Sentenças curtas, verbos no imperativo, sem jargão técnico |
| Ícones | SVG de traço grosso em dourado (`src/ui/icons.js`); botões de ação só com ícone |
| Animações | 120–250 ms; desligadas com "Reduzir movimento" |

Componentes prontos em `src/ui/style.css`: `.frame` (moldura), `.frame-title` (faixa),
`.close` (X vermelho), `.btn` / `.btn.gold` / `.btn.green`, `.side-tabs` e `.top-tabs`,
`.bar` (barras), `.slot` (espaço de item), `.menu-btn` (menu inicial), `.icon-btn` (ícones
redondos do alto). As próximas telas (Mochila, Status, Fruta, Estilos, Loja, Troca) usam
os mesmos componentes.

### 1.1 Estados de um botão de habilidade

| Estado | Visual |
|---|---|
| Pronto | Borda na cor da fruta, ícone colorido, leve brilho a cada 4 s |
| Recarga | Varredura radial escura + segundos restantes no centro (1 casa decimal abaixo de 10 s) |
| Sem energia | Ícone cinza, número de energia faltante em vermelho |
| Bloqueado | Cadeado + "Maestria 150" |
| Ativo (forma/despertar) | Contorno branco pulsante |
| Pressionado | Escala 92% e vibração curta (opcional) |
| Mira (arrastando) | Botão se destaca e mostra a área no mundo; soltar fora do botão confirma, voltar ao botão cancela |

## 2. Mapa de telas

```
Abertura ─► Menu inicial ─► Saves ─► Criação de personagem ─┐
                 │                                           ▼
                 └──────────── Continuar ───────────────► JOGO (HUD)
                                                             │
     ┌──────────────┬──────────────┬─────────────┬───────────┼────────────┬─────────────┐
     ▼              ▼              ▼             ▼           ▼            ▼             ▼
  Pausa/Menu     Mochila      NPCs (Roleta,   Mapa       Diálogos     Barco (HUD    Morte /
  (abas)        (atalho B)   Trocador,        (atalho M)  e missões    naval)        Resgate
                             Provador, Lojas,
                             Mestres)
```

O jogo **pausa** em menus de tela cheia no modo solo. Em painéis laterais (Provador,
Roleta) o mundo continua desenhado ao fundo, mas a simulação para.

## 3. Telas fora do jogo

### 3.1 Carregamento

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    ▣ FRUTO LEGACY                                    │
│                    uma mordida. outro mundo.                         │
│                                                                      │
│        [ fruta voxel girando e piscando, cor da última comida ]      │
│                                                                      │
│        ███████████████░░░░░░░░░  62%   Carregando Ilha da Âncora     │
│        Dica: segure Defender pouco antes do golpe para uma defesa    │
│        perfeita.                                                     │
└──────────────────────────────────────────────────────────────────────┘
```

Barra real (por recursos carregados), dica aleatória, nome da região.

### 3.2 Menu inicial

```
┌──────────────────────────────────────────────────────────────────────┐
│ ▣ FRUTO LEGACY                                          ♪  ⚙  ⓘ     │
│                                                                      │
│  [cena 3D ao fundo: o personagem do último save na proa do barco,     │
│   oceano animado, ilha no horizonte]                                  │
│                                                                      │
│  ▶ Continuar         Nv 142 · Bosque Sussurrante · há 2 h            │
│    Novo jogo                                                         │
│    Carregar                                                          │
│    Configurações                                                     │
│    Créditos                                                          │
│                                                        Versão 0.1.0  │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 Saves

Três cartões lado a lado: miniatura do personagem, nível, ilha, fruta comida (ícone com
selo de nível), tempo de jogo, data. Ações: Jogar, Exportar, Apagar (confirmação dupla).
Cartão vazio: "Novo jogo".

### 3.4 Criação de personagem

Mesma tela do Provador (seção 6.5) com passo extra de **nome** e **estilo inicial** (só
Combate Básico disponível; os outros aparecem como silhuetas com o nível de desbloqueio).
Botão final: "Zarpar".

## 4. HUD em jogo

### 4.1 Celular (paisagem)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────┐        ⟨ Ilha da Âncora ⟩        Mochila 7  ☰    │
│ │ ◉ Nv 142  [🍊 Brasa·Épico] │       ┌─────────────────┐                        │
│ │ ███████████████░  842/1000│       │ ✦ Missão         │              ┌──────┐ │
│ │ ███████████░░░░    68 enr │       │ Saqueadores 5/8  │              │ mini │ │
│ │ ███░░░░░░░░░░░  exp 31%   │       └─────────────────┘              │ mapa │ │
│ └──────────────────────────┘                                          └──────┘ │
│                                                                               │
│                            [ mundo 3D ]                                       │
│                                                                               │
│  ┌Correr┐                                                 (Híbrida)(Completa) │
│                                                     (E)     (R)               │
│     ╭─────╮                                      (Q)            (T)  (Pular)  │
│     │  ●  │  joystick flutuante              (Fruta⇄Estilo)  (G)            │
│     ╰─────╯                                            (Esquiva) ( ATACAR )   │
│                                              (Defender)                       │
└───────────────────────────────────────────────────────────────────────────────┘
```

| Área | Conteúdo |
|---|---|
| Canto superior esquerdo | Retrato, nível, fruta comida com selo de nível, barras de vida, energia e experiência |
| Topo centro | Nome da região ao entrar; avisos de evento |
| Abaixo do topo | Rastreador de missão (até 3; toque para alternar) |
| Canto superior direito | Mochila (com contador), menu, minimapa (toque abre o mapa) |
| Esquerda inferior | Joystick flutuante (aparece onde o dedo toca), botão Correr |
| Direita inferior | Atacar (grande), Esquiva, Pular, Defender, 5 habilidades em arco, alternância Fruta/Estilo, botões de forma (só frutas Animais/Míticas) |
| Sobre o personagem | Arco de fôlego (só quando gastando), aviso de água |
| Resto da tela | Arrastar gira a câmera; toque duplo trava o alvo |

**Editor de layout:** em Configurações → Controles, o jogador arrasta, redimensiona (75–130%)
e ajusta a opacidade de cada botão. Três predefinições: Padrão, Compacto, Canhoto.

### 4.2 PC

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ◉ Nv 142  Brasa·Épico                     ⟨ Ilha da Âncora ⟩        [minimapa]│
│ ████████████████  vida                                                       │
│ ██████████░░░░░░  energia              ✦ Saqueadores 5/8                     │
│                                                                               │
│                              [ mundo 3D ]                                     │
│                                    +  (retícula só no modo Mira)              │
│                                                                               │
│                  ┌───┬───┬───┬───┬───┐  ┌────┐ ┌────┐                         │
│                  │ Q │ E │ R │ T │ G │  │ F  │ │1·2 │   exp ███████░░ 31%     │
│                  └───┴───┴───┴───┴───┘  └────┘ └────┘                         │
└───────────────────────────────────────────────────────────────────────────────┘
```

Barra de habilidades centralizada embaixo com a tecla em cada slot; F mostra o despertar;
"1·2" mostra o modo ativo (Fruta/Estilo).

### 4.3 Combate e chefes

- **Alvo travado:** marcador em losango sobre o alvo, barra de vida e Postura do alvo.
- **Avisos de perigo:** áreas no chão em vermelho translúcido que se enchem até o golpe.
- **Barra de chefe:** topo da tela, nome, nível, marcas de fase, Postura em barra fina dourada.
- **Números de dano:** opcionais; agrupam golpes rápidos ("×5 145").
- **Combo:** contador discreto à direita ("12 golpes") que some após 2 s sem acertar.

### 4.4 Água

| Situação | Indicação |
|---|---|
| Nadando sem fruta | Pílula azul "Nadando" + arco de fôlego ao mergulhar |
| Usuário de fruta na água | Bordas da tela azuladas, pílula vermelha pulsante "A fruta te enfraquece — saia da água", botões de habilidade cinza com ícone de onda |
| Maré / Geada | Pílula verde-água "Sobre a onda" / "Congelando a superfície" |
| Resgate disponível | Botão "Pedir resgate" quando há NPC ou aliado perto |

### 4.5 Voo

Botões de altitude ↑ ↓ substituem Pular/Defender; indicador vertical de altitude ao lado
direito; pílula "Voando · Pular 2× para pousar".

### 4.6 Barco e combate naval

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ⛵ Caravela "Gaivota"   Casco ████████░░ 78%   [proa][meio][popa] estado     │
│ Vento ↗ 14 nós   Velocidade 11 nós                               [minimapa]  │
│                                                                               │
│                          [ mar e barco 3D ]                                   │
│                       arco de mira dos canhões (bombordo)                      │
│                                                                               │
│     ╭─────╮                                              (Âncora) (Reparar)   │
│     │  ●  │ leme                       Pano: [−] ▮▮▮▯ [+]  (Canhões ◀) (▶)   │
│     ╰─────╯                                                (Disparar)  (Sair) │
└───────────────────────────────────────────────────────────────────────────────┘
```

Estado das seções do casco em silhueta (verde, amarelo, vermelho, em chamas). Radar de
bestas marinhas no minimapa (ondas concêntricas no ponto de surgimento).

### 4.7 Notificações

| Tipo | Estilo | Posição |
|---|---|---|
| Subiu de nível | Faixa dourada grande + som | Centro, 2,5 s |
| Missão aceita/concluída | Cartão com recompensas | Abaixo do topo, 3 s |
| Item obtido | Linha com ícone, empilha até 4 | Lado direito |
| Aviso | Pílula vermelha | Topo |
| Desbloqueio (habilidade, estilo) | Cartão com ícone e botão "Ver" | Centro, até fechar |

## 5. Menu de pausa (abas)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Personagem  Mochila  Frutas  Estilos  Vontade  Missões  Mapa  Barco  Ajustes ✕│
│ ─────────────────────────────────────────────────────────────────────────────│
│                     [conteúdo da aba selecionada]                             │
└───────────────────────────────────────────────────────────────────────────────┘
```

Abas roláveis horizontalmente no celular; LB/RB no controle; teclas de atalho no PC.

### 5.1 Personagem

Modelo 3D girável à esquerda; à direita: nível e experiência, pontos disponíveis, os 5
status com **+1 / +10 / +máx** e prévia do efeito ("Força 40 → 41: dano corpo a corpo
+120% → +123%"), botão Redistribuir. Abaixo: Vontade e estilo equipados.

### 5.2 Mochila

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Mochila de frutas · 37/60      ◆ 14 fragmentos   🔑 2 chaves     Ordenar ▾     │
│ Filtro: [Todas] [Lendário] [Épico] [Comum] [Favoritas]                         │
│ ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐                  │
│ │ fruta  ││ fruta  ││ fruta  ││ fruta  ││ fruta  ││ fruta  │  ← bordas na      │
│ │ Geada  ││ Eclipse││ Brasa  ││ Duna   ││ Falcão ││ Eco    │    cor do nível   │
│ │Lendário││ Épico  ││ Épico  ││ Comum  ││ Comum  ││ Comum  │                  │
│ └────────┘└────────┘└────────┘└────────┘└────────┘└────────┘                  │
│ Selecionada: Geada · Lendário    [Segurar na mão] [Comer] [Trocar] [★] [🗑]   │
└───────────────────────────────────────────────────────────────────────────────┘
```

Fruta na mão marcada "Na mão". Ícones são miniaturas renderizadas dos modelos 3D.
"Comer" mostra a confirmação: "Sua fruta atual (Brasa · Épico) será substituída".

### 5.3 Frutas (dossiê)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ◀ Lista   Fruta Brasa · Épico · Elemental                  Maestria 312/600    │
│ ┌────────────────┐  Concentre calor em chamas cúbicas...                       │
│ │ modelo 3D       │  Fraqueza: gasta muita energia para manter áreas.          │
│ │ girável         │  Passivas: Resistência térmica · Queimadura acumulativa    │
│ │ [Examinar 3D]   │                                                            │
│ └────────────────┘  J  Punhos de Fornalha     combo de 3 golpes               │
│                     ⇧  Rastro de Fagulhas     esquiva                          │
│                     Q  Projétil Incandescente 14 enr · 1,6 s · 41 dano        │
│                     E  Passo Flamejante       20 enr · 4,0 s · 16 dano        │
│                     R  Erupção Ascendente     🔒 maestria 75 → liberada        │
│                     T  Tempestade de Brasas   ...                              │
│                     G  Fornalha Infernal      🔒 maestria 250                  │
│                     F  Coração da Fornalha    🔒 maestria 350                  │
│                     [Melhorias ▸]  [Ver vídeo da habilidade]                   │
└───────────────────────────────────────────────────────────────────────────────┘
```

Valores já calculados com o nível da fruta e os status. "Ver vídeo" toca uma prévia em
loop da habilidade no modelo 3D. A lista mostra as 16 frutas; não descobertas aparecem
como silhueta com "?".

**Melhorias:** para cada habilidade, escolher 1 de 2 modificadores (ex.: Projétil
Incandescente: "+1 projétil" ou "explosão 40% maior").

### 5.4 Estilos

Lista vertical dos 9 estilos (bloqueados com requisito visível), detalhe à direita com
prévia 3D da postura, as 5 habilidades, despertar, maestria e botão **Equipar**.

### 5.5 Vontade

Três cartões (Armadura, Percepção, Soberana) com maestria, custo, efeitos por nível e
botão de atribuir ao botão rápido.

### 5.6 Missões

Lista com abas (Ativas, História, Diárias, Concluídas). Cada missão: objetivo com
progresso, recompensas com ícones, botão **Rastrear** (máx. 3) e **Marcar no mapa**.

### 5.7 Mapa

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ [Primeiro Mar] [Segundo Mar 🔒] [Terceiro Mar 🔒]        Legenda ▾   ✕         │
│                                                                               │
│      ○ Pico Gélido 300+            ◎ Porto das Lanternas 400+                  │
│                ~ ~ ~ corrente ~ ~ ~                                           │
│   ◉ Ilha da Âncora 1+   ── rota marcada ──►  ○ Praia dos Saqueadores 25+      │
│        ▲ você                                                                 │
│   ⚓ portos  ☠ chefe  ✦ missão  ✕ tesouro  ⚡ evento                          │
│                                                                               │
│ Selecionada: Praia dos Saqueadores · níveis 25–75 · chefe: Rainha das Conchas │
│ [Marcar rota]  [Viajar (porto descoberto)]                                    │
└───────────────────────────────────────────────────────────────────────────────┘
```

Zoom e arrasto; ao aproximar numa ilha, mostra o mapa da ilha (construções, NPCs,
segredos encontrados).

### 5.8 Barco

Barcos possuídos, estado do casco, reparo, personalização (cor, velas, bandeira, figura de
proa, canhões) com prévia 3D, e botão **Invocar** (só em porto ou perto da costa).

### 5.9 Ajustes

| Seção | Opções |
|---|---|
| Gráficos | Qualidade (Automática, Leve, Média, Alta), escala de resolução, distância de visão, sombras, água, partículas, limite de qps (30/60), medidor de qps |
| Controles | Editor de layout, sensibilidade da câmera, inverter eixos, mira assistida, vibração, mapeamento de teclas e do controle |
| Áudio | Geral, música, efeitos, vozes, ambiente |
| Acessibilidade | Tamanho do texto (90–140%), modo daltônico (3 filtros), reduzir movimento da câmera, atenuar clarões, legendas, números de dano |
| Jogo | Idioma, números de dano, dicas, confirmar trocas em massa |
| Conta e saves | Exportar/importar save, apagar save |

## 6. Telas de NPC

### 6.1 Diálogo

Caixa inferior com retrato voxel, nome, texto que aparece em ritmo ajustável (toque
completa a frase), até 4 opções de resposta. Câmera aproxima levemente do NPC.

### 6.2 Roleta de Frutas

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Roleta de Frutas · 5.000 moedas · 🔑 2                                       ✕ │
│ Sua fruta: [ícone] Brasa · Épico      ┌──────────┐┌──────────┐               │
│                                       │ Girar ×1 ││ Girar ×10│               │
│                                       │ 200      ││ 2.000    │               │
│                                       └──────────┘└──────────┘               │
│                                       ┌──────────┐┌──────────────┐           │
│                                       │🔑 Usar   ││🔑 ×10 chaves │ (≥10)     │
│                                       └──────────┘└──────────────┘           │
│ [Comum 70% · normal] [Épico 25% · +35% dano −20% rec.] [Lendário 5% · +75% −40%]│
│ Frutas que podem sair: grade das 16 (toque abre o dossiê)                     │
└───────────────────────────────────────────────────────────────────────────────┘
```

- **Giro ×1:** faixa horizontal de frutas desliza e desacelera até a seta; bordas na cor do
  nível; resultado em destaque com brilho (Lendário com brilho animado dourado e som próprio).
  Ações: Segurar na mão, Girar de novo, Ver mochila.
- **Giro ×10:** grade 5×2 de cartões que viram em sequência (0,16 s entre cada); resumo
  "8 Comum · 2 Épico · 0 Lendário"; Ver mochila, Girar ×10 de novo.
- Botões desativados mostram o motivo ao tocar ("Faltam 1.200 moedas", "Mochila cheia").

### 6.3 Trocador de Fragmentos

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Trocador de Fragmentos                                                       ✕ │
│ ┌────────┐┌────────┐  ██████████████░░░░░░  7/10 para a próxima chave         │
│ │ ◆ 27   ││ 🔑 2   │  [Criar chave (10)] [Criar 2 chaves]                      │
│ └────────┘└────────┘  Cada chave gira a roleta uma vez.                       │
│ [Comum vale 1] [Épico vale 3] [Lendário vale 5]                               │
│ [Trocar todas as Comuns (+12)] [Trocar todas as Épicas (+9)]                  │
│ Toque numa fruta para trocá-la: grade da mochila com "+1 / +3 / +5"           │
└───────────────────────────────────────────────────────────────────────────────┘
```

Épicas, Lendárias, favoritas e a fruta na mão pedem confirmação. Ao trocar, o cartão se
desfaz em fragmentos que voam até o contador.

### 6.4 Lojas e estaleiro

Grade de itens com preço, filtro por tipo, prévia 3D do item, comparação com o equipado
(setas verdes e vermelhas), botão Comprar com confirmação acima de 10.000 moedas.

### 6.5 Provador

Painel à direita (52% da largura), personagem de frente à esquerda girando com arrasto.
Abas: Pele e olhos, Cabelos, Blusas e camisas, Calças e shorts, Sapatos e chinelos,
Chapéus, Rosto, Colares e costas. Grade de peças + paleta de 20 cores por peça.
Ações: Aleatório, Desfazer, Pronto (salva). NPCs próximos somem para não tapar a vista.

### 6.6 Mestre de estilo / Mestre da Vontade

Diálogo + cartão do estilo com requisitos (nível, moedas, itens, maestria em outros
estilos) marcados com ✔/✖ e botão Aprender (só ativo com todos ✔).

## 7. Morte e resgate

- Usuário de fruta afundando: tela azul que escurece, contador de 5 s com botão
  "Pedir resgate" quando possível.
- Derrotado: tela dessatura, cartão "Você foi derrotado" com a causa ("Afogado",
  "Capitão Ferrugem"), perda de moedas, botão "Voltar ao porto".

## 8. Controles

### 8.1 Mapeamento completo

| Ação | Celular | PC | Controle (Xbox / PlayStation) |
|---|---|---|---|
| Mover | Joystick flutuante | WASD | Analógico esquerdo |
| Câmera | Arrastar a tela | Mouse | Analógico direito |
| Correr (alternar) | Botão Correr | Ctrl | Pressionar analógico esquerdo |
| Pular / Voar (2×) | Pular | Espaço | A / ✕ |
| Esquiva / Dash | Esquiva | Shift | B / ◯ |
| Agachar / Deslizar / Mergulhar | Segurar Esquiva parado (na Fase 1, botão Agachar próprio) | C | Pressionar analógico direito |
| Atacar (leve / segurar pesado) | Atacar | Botão esquerdo do mouse / J | X / ▢ |
| Defender | Defender | Botão direito do mouse / K | RB / R1 |
| Habilidades 1–5 | Q E R T G na tela | Q E R T G | Segurar RT + A/B/X/Y/RB |
| Alternar Fruta/Estilo | Botão de alternância | 1 / 2 | LB / L1 |
| Despertar | Toque longo no botão de alternância | F | LB + RB |
| Forma híbrida / completa | Botões Híbrida / Completa | H / N | Direcional ← / → |
| Altitude (voo) | ↑ ↓ na tela | Espaço / C | Direcional ↑ / ↓ |
| Travar alvo | Toque duplo na tela | Botão do meio / Tab | Pressionar analógico direito |
| Interagir / Falar | Botão contextual | E (perto de NPC ou objeto, fora de combate) | Y / △ |
| Vontade de Armadura / Percepção / Soberana | Roda rápida da Vontade | Z / X / V | Direcional ↓ + face |
| Mochila | Botão Mochila | B | View / Share |
| Mapa | Minimapa | M | Segurar View |
| Pausa | ☰ | Esc | Menu / Options |

Conflito de teclas no PC: E é habilidade em combate e Interagir fora de combate; o
contexto decide e o botão contextual mostra qual ação acontecerá.

### 8.2 Regras de entrada

- Todos os comandos têm buffer de 0,15–0,2 s.
- Multitoque: joystick, câmera e botões funcionam ao mesmo tempo.
- Controle Bluetooth conectado troca os ícones da interface para os botões do controle.
- Teclado e mouse conectados ao celular funcionam como no PC.
- Vibração (celular e controle): leve em acertos, forte em golpes recebidos pesados, desligável.
