# 01 — Arquitetura técnica

## 1. Plataforma obrigatória

O jogo é escrito em **HTML5, CSS3 e JavaScript (ES Modules)** e roda no navegador. A versão
Android é o mesmo código empacotado com **Capacitor** (APK para testes, AAB para a loja).
Não se troca a base por Unity, Unreal ou outra engine nativa.

| Camada | Tecnologia | Função |
|---|---|---|
| Renderização | Three.js com WebGL2 | Cena 3D, materiais, sombras, pós-processamento |
| Renderização futura | WebGPU (opcional) | Ativado só quando o aparelho suportar; WebGL2 continua sendo o padrão |
| Física | Rapier (WASM) | Corpos rígidos, personagens, colisões, barcos |
| Áudio | Web Audio API | Som 3D posicional, mixagem por canais |
| Dados salvos | IndexedDB | Saves, configurações, cache de recursos |
| Trabalho pesado | Web Workers | Geração de terreno, navegação de IA, descompressão |
| Modelos | GLB/glTF | Personagens, frutas, construções, barcos |
| Conteúdo | JSON | Ilhas, frutas, habilidades, estilos, missões, inimigos |
| Android | Capacitor | WebView, tela cheia, orientação, ciclo de vida |

Tudo funciona **offline**: nenhum recurso essencial vem de servidor externo.

## 2. Estrutura do projeto

```
FRUTO_LEGACY_AAA/
├── index.html              entrada: tela de carregamento e montagem do jogo
├── package.json
├── capacitor.config.ts
├── src/
│   ├── core/               laço principal, relógio, eventos, serviços, máquina de estados do jogo
│   ├── renderer/           cena, câmera, luzes, pós-processo, perfis de qualidade
│   ├── physics/            integração com Rapier, camadas de colisão, consultas
│   ├── world/              streaming de regiões, coordenadas globais, gerenciador de mares
│   ├── islands/            montagem de cada ilha a partir de dados
│   ├── terrain/            chunks, heightmaps, ruído, malhas, LOD
│   ├── ocean/              superfície do mar, ondas, empuxo, correntes
│   ├── weather/            ciclo dia/noite, chuva, neve, tempestade, vento
│   ├── characters/         corpo base, roupas, rostos, NPCs
│   ├── animation/          máquinas de estado, blending, IK, eventos de animação
│   ├── movement/           controlador do personagem e mobilidade
│   ├── combat/             golpes, hitbox/hurtbox, dano, reações
│   ├── fighting-styles/    estilos de luta e maestria
│   ├── haki/               sistema de Vontade (pasta mantém o nome técnico pedido)
│   ├── fruits/             frutas, habilidades, despertares
│   ├── transformations/    formas híbridas e completas
│   ├── vfx/                efeitos de habilidades e impactos
│   ├── audio/              mixagem, bancos de som, música adaptativa
│   ├── ships/              barcos, velas, canhões, danos
│   ├── enemies/            IA de inimigos comuns
│   ├── bosses/             chefes com fases
│   ├── quests/             missões, diálogos, objetivos
│   ├── inventory/          mochila, equipamentos, itens
│   ├── trading/            troca de frutas por fragmentos e entre jogadores (futuro)
│   ├── economy/            moedas, preços, recompensas
│   ├── multiplayer/        reservado para a fase F8
│   ├── ui/                 telas, HUD, componentes
│   ├── controls/           toque, teclado, mouse, controle (gamepad)
│   ├── saves/              versões de save, migração, nuvem futura
│   └── optimization/       orçamento, qualidade automática, pools
├── assets/
│   ├── models/  animations/  textures/  shaders/  effects/  sounds/  music/
├── data/
│   ├── islands.json  fruits.json  skills.json  fighting-styles.json  quests.json  enemies.json
├── tests/
└── android/
```

O `index.html` só monta o jogo. Cada sistema vive no seu módulo e conversa com os outros
por eventos e serviços, nunca por variáveis globais.

## 3. Laço principal e ordem de atualização

Passo fixo de simulação de **60 Hz** (física e combate) com renderização interpolada na
taxa do aparelho.

1. Ler entradas (toque, teclado, controle) e gerar comandos.
2. Atualizar máquina de estados do jogo (menu, jogo, pausa, cutscene).
3. Simulação a 60 Hz: movimento, física, combate, IA, barcos, água.
4. Animação: avaliar máquinas de estado, blending e IK.
5. Efeitos visuais e áudio.
6. Streaming de mundo (carregar/descarregar regiões).
7. Renderizar e atualizar a interface.

Se um quadro demorar demais, a simulação executa no máximo 3 passos para não travar
(evita a "espiral da morte").

## 4. Dados do jogo

Todo conteúdo é dado, não código. Exemplos de esquema:

**fruits.json** (uma entrada)

```json
{
  "id": "brasa",
  "nome": "Brasa",
  "categoria": "Elemental",
  "cor": "#ffb05b",
  "modelo": "assets/models/frutas/brasa.glb",
  "combo": "punhos_de_fornalha",
  "esquiva": "rastro_de_fagulhas",
  "habilidades": ["projetil_incandescente", "passo_flamejante", "erupcao_ascendente", "tempestade_de_brasas", "fornalha_infernal"],
  "passivas": ["resistencia_termica", "queimadura_acumulativa"],
  "despertar": "coracao_da_fornalha",
  "fraquezas": ["agua_do_mar"],
  "imunidadeAgua": false
}
```

**skills.json** (uma habilidade)

```json
{
  "id": "projetil_incandescente",
  "custoEnergia": 14,
  "recarga": 2.0,
  "dano": 30,
  "quadros": { "preparo": 10, "ativo": 4, "recuperacao": 16 },
  "alcance": 22,
  "forma": "projetil",
  "efeitosStatus": ["queimadura"],
  "maestriaMinima": 0,
  "vfx": "brasa.projetil",
  "som": "brasa.liberar"
}
```

Todos os arquivos de dados passam por validação de esquema ao carregar. Um dado inválido
gera erro claro na tela de desenvolvimento, nunca uma falha silenciosa.

## 5. Salvamento

- **IndexedDB**, com 3 espaços de save mais um automático.
- Salvamento automático: ao entrar em porto, ao concluir missão, a cada 2 minutos e ao
  minimizar o app.
- Cada save tem **número de versão**; migrações convertem saves antigos.
- Escrita segura: grava em um registro temporário e só depois troca, para nunca corromper
  o save se o app fechar no meio.
- Exportar e importar save como arquivo (backup manual).

## 6. Android (Capacitor)

| Requisito | Solução |
|---|---|
| Tela horizontal e cheia | Orientação travada em paisagem; barras do sistema escondidas (retornam ao deslizar) |
| Câmera frontal e bordas | Interface respeita `safe-area-inset-*` |
| Pausa e retomada | Ao ir para segundo plano: pausa o jogo, silencia o áudio, salva |
| Memória | Limite de texturas por perfil, descarte de regiões distantes, pools de objetos |
| Resolução | Escala de resolução dinâmica (0,5× a 1,0× da tela) |
| Controles | Toque multitoque, teclado Bluetooth, controles Bluetooth pela Gamepad API |
| Recursos locais | Todos os assets dentro do APK |
| Saídas | APK (testes) e AAB assinado (loja): `./gradlew bundleRelease` em `android/` lê a chave de `android/keystore.properties` (fora do git; guardar uma cópia segura) |

## 7. Desempenho

### Perfis de aparelho

| Perfil | Exemplo | Meta | Distância de visão | Sombras | Água |
|---|---|---|---|---|---|
| Leve | Android de entrada | 30 qps estáveis | 120 m | Só do jogador | Shader simples, sem reflexo |
| Médio | Android intermediário | 60 qps | 250 m | Cascata única 1024 | Reflexo do céu, espuma |
| Alto | PC e Android topo de linha | 60 qps | 500 m | 2 cascatas 2048 | Reflexo, refração, espuma dinâmica |

### Orçamento por quadro (perfil Médio)

| Item | Limite |
|---|---|
| Chamadas de desenho | 150 |
| Triângulos visíveis | 400 mil |
| Partículas ativas | 1.500 |
| Personagens animados próximos | 20 |
| Memória de texturas | 256 MB |
| Tempo de CPU de simulação | 6 ms |

### Situação medida (atualização 15)

Perfil Médio, celular emulado (Pixel 7 na horizontal), meio-dia, chamadas de desenho por quadro:

| Área | Antes | Depois | Meta |
|---|---|---|---|
| Início da Ilha de Treino (mercado, placas, bonecos) | 406 | 148 | 150 |
| Praça do Porto das Origens (moradores) | 293 | 112 | 150 |
| Cais da Ilha de Treino (bote) | 215 | 115 | 150 |
| Ilhas do Primeiro Mar | 51–178 | — | 150 |

O que fez a diferença:

- **Corpo numa malha só** (`src/characters/mergeBody.js`): os 17 segmentos, o cabelo e enfeites
  rígidos de NPCs, moradores e inimigos viram uma SkinnedMesh com cor por vértice, e cada
  vértice segue a junta da sua peça (peso 1), então a animação é a mesma. Detalhes do rosto
  ficam separados (somem a mais de 24). O jogador também, menos os braços (brilho da Vontade
  de Armadura). ~36 chamadas → ~1 de longe e ~12 de perto, e 1 no mapa de sombras.
- **Placas** (`StructureBuilder.sign`): moldura e poste nas malhas juntadas e todos os textos
  de um construtor num atlas: 6 chamadas por placa → 1 para todas.
- **Peças paradas** (`src/optimization/bake.js`): bancas do mercado, bonecos de treino e o bote
  juntam as peças por tipo de material.
- **Limite de qps**: 30 ou 60 (o passo da simulação continua 60 Hz); a qualidade automática
  usa o alvo escolhido e respeita a resolução fixa do jogador.

Ainda faltam (técnicas abaixo): streaming de regiões em Web Worker, pools de projéteis e o
roteiro manual nos três perfis de aparelho real.

### Técnicas obrigatórias

- Instanciamento para vegetação, pedras e blocos repetidos.
- LOD em terreno, construções e personagens (3 níveis).
- Culling por frustum e por distância; oclusão simples em cidades.
- Pools para projéteis, partículas e efeitos (sem criar objetos durante o combate).
- Streaming de regiões em Web Worker.
- **Qualidade automática**: mede o tempo de quadro por 5 s e sobe ou desce o perfil.

## 8. Testes

| Tipo | O que cobre |
|---|---|
| Unitários | Fórmulas de dano, sorteio da roleta, progressão, migração de saves |
| Dados | Todo JSON validado contra o esquema |
| Simulação | Combate determinístico: mesmas entradas geram o mesmo resultado |
| Desempenho | Cenas de referência com limite de tempo de quadro |
| Visual | Capturas de tela comparadas em cenas fixas |
| Aparelho | Roteiro manual nos três perfis antes de cada versão |
