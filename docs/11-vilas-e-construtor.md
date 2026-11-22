# 11 — Vilas e construtor de mundo

Plano da Parte B da especificação "Sistemas de Frutas e Vilas" (World Builder e gerador
procedural de vilas 3D), adaptado ao motor do FRUTO Legacy. A Parte A (raridades, catálogo
e sorteio) já está no jogo (docs 08, 09 e 10). Da Parte B, o gerador (B2) e a primeira vila
estão no jogo desde a atualização 9 (seção 10); o editor visual (B1) e as fases B3–B6
continuam planejadas.

## 1. Encaixe no motor atual

| Peça existente | Uso nas vilas |
|---|---|
| `Heightfield` + `buildTerrain` | Leitura de declividade, água e costa; aplainar lotes e ruas |
| `StructureBuilder` (blocos com desenho de pedra, tijolo e tábua) | Base das peças modulares: fundação, paredes, telhado, portas, janelas |
| Rapier (colisores com etiquetas) | Colisão de casas, interiores, portas e móveis; etiquetas `porta`, `escada`, `ponte` |
| `buildNature` (instâncias) | Decoração da vila sem bloquear passagens |
| `buildMarket` (NPCs do laboratório com rosto) | Primeiros estabelecimentos; base da ficha de NPC |
| Salvamento IndexedDB com versão e migração | Projetos de vila e estados dinâmicos (separados) |

Escala: a especificação usa metros; o jogo usa as unidades do laboratório (1 m ≈ 2,2
unidades). O editor mostra metros e converte na hora de construir.

## 2. Dados (JSON, `versaoSchema` 1)

- **Vila:** `id`, `nome`, `seed`, `bioma`, `tamanho`, `centro`, `construcoes[]`, `ruas[]`,
  `lotes[]`, `npc[]`, `zonas[]`, `decoracoes[]`, `eventos[]`, `versaoSchema`.
- **Construção:** `id`, `tipo` (residencia_pequena, residencia_media, residencia_grande,
  estabelecimento, especial), `modelo`, `posicao`, `rotacaoY`, `escala`, `loteId`,
  `portaPrincipalId`, `interiorId`.
- **Rua:** `id`, `largura`, `material`, `pontos[]` (curva), `inclinacao`, `iluminacao`,
  `conexoes[]`.
- **NPC:** `id`, `nome`, `aparencia`, `profissao`, `faccao`, `residenciaId`, `trabalhoId`,
  `posicaoInicial`, `rotinaId`, `dialogo`, `lojaId`/`missaoId`, `comportamento`, `estado`.
- Definição da vila (editor) separada dos dados dinâmicos do jogador (estoque, missões,
  estado de NPCs). Y sempre recalculado no terreno final.

## 3. Gerador procedural (ordem obrigatória)

1. Semente, tamanho, bioma, densidade (20–100%), população e edifícios obrigatórios.
2. Análise do mapa de altura: declividade, água, áreas alagáveis, rochas.
3. Centro e reserva da praça.
4. Entrada, porto (trecho costeiro navegável) e pontos estratégicos.
5. Ruas principais (entrada ↔ praça ↔ mercado ↔ porto).
6. Quarteirões e lotes.
7. Serviços e edifícios especiais (prefeitura, mercado, taverna, ferreiro, vendedor de frutas).
8. Residências e estabelecimentos.
9. Ruas secundárias, escadas em declives, pontes e acessos.
10. Decoração sem bloquear passagens.
11. NPCs com moradia e trabalho.
12. Grafo de navegação e rotas (A* com desvio local).
13. Validação (seção 5).
14. Salvar e gerar relatório de problemas. Sem espaço: reduzir densidade ou lotes, nunca
    sobrepor em silêncio.

Mesma semente + mesmos parâmetros + mesma versão do algoritmo = mesma vila (o jogo já usa
o gerador determinístico `mulberry32`).

## 4. Editor (World Builder)

Modos: Terreno, Ruas, Lotes, Construções, Interiores, NPCs, Decoração, Zonas, Rotas e
Teste. Grade de 0,5 / 1 / 2 m com encaixe, gizmos de mover, girar e escalar, desfazer e
refazer, limites do lote, colisões e espaço livre de portas visíveis. Layout: biblioteca à
esquerda, vista 3D no centro, propriedades à direita, barra superior (novo, abrir, salvar,
exportar, desfazer, refazer, testar), camadas e minimapa. No celular: botões grandes,
toque para manipular e painéis recolhíveis, no mesmo estilo dourado do jogo.

## 5. Validações automáticas

Casas sem sobreposição e dentro dos lotes; portas com espaço livre e acesso à rua; praça,
porto, mercado e prefeitura conectados; pontes e escadas atravessáveis; NPCs com locais
válidos para nascer, trabalhar e dormir; rotas sem atravessar paredes, água funda ou zonas
proibidas; lojas e missões apontando para IDs existentes; modelos disponíveis; salvar e
reabrir preservando posições; orçamento de desempenho do perfil escolhido. Erros
destacados no editor, com correção manual.

## 6. NPCs, rotinas e vida

Agenda: 06–08 despertar e deslocamento; 08–12 trabalho; 12–14 intervalo; 14–19 trabalho;
19–22 praça, taverna ou casa; 22–06 descanso (guardas em serviço). Eventos, clima, perigo e
missões interrompem a rotina; depois o NPC volta à agenda. NPCs distantes são simulados por
agenda abstrata, sem animação completa fora da visão. Eventos da vila (feira, chegada de
mercador, ataque, festival, escassez) com gatilho, duração, consequência e fim.

## 7. Frutas nas vilas

Lojas de frutas com estoque por região usando as tabelas de `data/tabelas-frutas.json`
(o vendedor mostra nome, tipo, rank, preço e disponibilidade). Baús, recompensas e eventos
usam tabelas próprias. A vila nunca altera a raridade de uma fruta.

## 8. Desempenho (Android e PC)

Carregamento por setores, LOD, instâncias para peças repetidas, materiais compartilhados,
sombras seletivas, interiores descarregados quando não usados, NPCs distantes em baixa
frequência e perfis Leve, Médio e Alto, como no resto do jogo.

## 9. Fases

| Fase | Entrega | Pronto quando |
|---|---|---|
| B1 (spec Fase 2) | Editor básico: terreno, objetos, coordenadas, JSON, desfazer/refazer | Mover uma casa, salvar, reabrir e manter a posição |
| B2 (spec Fase 3) | Gerador de ruas, lotes e construções com validação | Duas sementes geram vilas diferentes; a mesma semente repete |
| B3 (spec Fase 4) | Interiores, portas e navegação | Entrar e sair das casas sem teleporte; rotas sem atravessar paredes |
| B4 (spec Fase 5) | NPCs, rotinas, comércio e missões | NPCs vão ao trabalho e voltam para casa |
| B5 (spec Fase 6) | Frutas, eventos e recompensas nas vilas | Lojas e baús usando as tabelas de raridade |
| B6 (spec Fase 7) | Otimização, testes em Android, APK | Controles responsivos no celular e no PC |

Primeira vila planejada: "Porto das Origens" (costeira tropical, tamanho médio), numa
nova ilha ligada à Ilha de Treino.

## 10. O que já está no jogo (atualização 9)

**Ilhas no mundo.** Cada ilha tem o seu campo de alturas em coordenadas locais.
`OffsetHeightfield` (`src/terrain/offsetField.js`) desloca o campo no mundo: relevo, colisão e
quem amostra o chão funcionam sem saber do deslocamento. `WorldField` junta as ilhas: a altura
vem da ilha que contém o ponto e, fora de todas, é o fundo do mar. O Porto das Origens fica em
(340, 0), meia largura 130, com a Ilha de Treino a oeste e mar fundo entre as duas.

**Gerador** (`src/world/village.js`, versão 1). Mesma semente + mesmos parâmetros + mesma
versão = mesma vila. Ordem: praça (raio 10) → 4 avenidas de largura 5 (a primeira aponta
para o cais e vai até a praia) → anel de 16 trechos (largura 3,6) → lotes dos dois lados das
avenidas e do anel, embaralhados pela semente e ordenados pela distância da praça → serviços
nos lotes mais centrais (Prefeitura, Mercado, Taverna, Ferreiro, Loja de Frutas) →
residências pequenas, médias e grandes → postes nas avenidas → validação. Lote sem espaço é
descartado e entra no relatório (nunca sobrepõe em silêncio).

**Validações** (`validateVillage`): casas sem sobreposição, porta a até 4 unidades de uma
rua, nenhuma casa em cima de rua, serviços obrigatórios (Prefeitura, Mercado, Taverna) e toda
avenida ligada à praça. Os testes rodam várias sementes e exigem zero problemas.

**Construção** (`src/islands/villageIsland.js`). Praça plana (altura 3,2), praia e um morro a
nordeste. Ruas e praça em lajes de pedra, chafariz no centro, casas com piso de tábuas,
paredes de tijolo, reboco ou madeira, porta de 3,2 de largura virada para a rua, janelas e
telhado em degraus (vermelho ou azul); placas nos serviços. Cais de tábuas nas duas ilhas com
Barqueiros: falar com eles faz a travessia (tela de transição) até o outro cais. Ao chegar, o
nome da ilha aparece no alto da tela; o mapa (M) e o minimapa mostram a ilha onde o jogador
está, com ruas, praça e casas desenhadas por cima do relevo.

**Ainda não:** editor visual (B1), eventos e baús da vila (B5) e o desempenho medido no
Android (B6).

## 11. Vila viva (atualização 11)

**Relógio do jogo** (`src/world/clock.js`): 1 minuto de jogo por segundo real (um dia dura 24
minutos), salvo em `save.clock`; o relógio aparece pequeno ao lado do minimapa. A luz muda com a
hora: amanhece das 5h às 7h, anoitece das 18h às 20h com tom alaranjado, e a noite é azulada (dá
para jogar). Céu, sol, neblina e reflexo do mar acompanham; os lampiões da vila e a brasa da forja
acendem à noite.

**Por dentro** (B3): cada construção tem móveis com colisão. Serviços: balcão com tampo,
prateleira no fundo e quem atende atrás do balcão (passagem pela direita); Taverna com mesa e
barris; Ferreiro com bigorna e forja; Mercado com caixotes; Prefeitura com quadro de missões e
banco; Loja de Frutas com frutas no balcão. Residências: cama com cobertor e travesseiro, mesa e
estante. As portas (uma malha instanciada) giram para fora quando o jogador ou um morador chega a
3,4 da porta. Entrar e sair é andando, sem teleporte.

**Moradores e rotina** (B4, `src/world/villageLife.js` e `villagers.js`): 10 moradores com nome e
ofício — 5 que atendem os serviços (Inês, Mestre de Missões; Joana, Mercadora; Bento,
Taverneiro; Rosa, Ferreira; Caio, Fruteiro) e 5 com trabalho ao ar livre (Pescador e Marinheiro
no cais, Florista e Costureira na praça, Carpinteiro em frente ao Mercado). Cada um mora numa
residência. Rotina: casa → trabalho (6h30–17h30) → lazer na Taverna ou na praça (até 21h) → casa;
cada morador sai com até 30 minutos de diferença. Dormindo (22h–6h) o corpo some. As rotas
seguem o grafo das ruas (avenidas, anel e arcos em volta do chafariz): sai pela porta, anda pela
rua e entra pela outra porta; os testes conferem em várias sementes que nenhum trecho atravessa
casas. Longe do jogador só a posição é calculada.

**Lojas pelas tabelas** (B5, `src/economy/fruitStore.js`): a Loja de Frutas vende 4 frutas por
dia sorteadas da tabela `loja` (Comum 50, Incomum 28, Rara 14, Épica 6, Lendária 2, Mítica 0),
sem repetir, pela semente da vila e pelo dia; renova às 6h. Preço = `precoBase` da ficha; cada
vaga vende uma vez por dia; sem moedas ou sem espaço na mochila nada é cobrado. A janela mostra
as chances da tabela.

**Conversas e serviços**: falar com um morador mostra uma fala pela hora e pela atividade e as
ações do ofício — Missões (Inês), Trocar fragmentos (Joana), Refeição de 40 moedas que enche
vida e fôlego (Bento), Armaduras e espadas (Rosa), Frutas do dia (Caio). Quem atende também
atende fora do horário.

**Missões da vila** (`src/quests/village.js`): o Mestre de Missões oferece 3 pedidos por dia (renovam
às 6h), até 5 ativos. Tipos: entrega (pegar com a Mercadora ou a Ferreira e levar a um morador),
caça (5 Recrutas ou 3 Recrutas elementais), conversa (4 moradores diferentes) e recado (falar com o
Barqueiro da Ilha de Treino). Ativas aparecem em Missões › Secundárias (rastrear ou abandonar) e
no rastreador; a recompensa sai ao concluir. Ele também cobra a redistribuição de pontos depois da
primeira (grátis): 500 + 100 × nível moedas.
