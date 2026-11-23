# 17 — Prompts de sprites, parte 2: botões de habilidade e da tela

Hoje os botões de habilidade e de ação usam símbolos simples desenhados no código (linhas
brancas). Estes lotes trocam todos por ícones ilustrados no mesmo estilo dos materiais e
equipamentos que você já gerou (`docs/16-prompt-sprites.md`).

Como na parte 1: mande **um lote por vez** para o ChatGPT e depois me envie as imagens. Eu
recorto, otimizo e coloco nos botões. As molduras redondas dos botões já existem no jogo, então
os ícones vêm **sem moldura**, só o desenho.

**Estilo comum a todos os lotes** (já está dentro de cada prompt): voxel/low-poly com cantos de
blocos visíveis, contorno escuro de 3 px (#1a1222), luz de cima à esquerda, cores saturadas,
fundo transparente, sem texto, legível mesmo pequeno (o botão tem uns 56 px no celular).

---

## Lote 4 — Habilidades das frutas, parte 1 (24 ícones)

```
Crie UMA folha de sprites PNG com FUNDO TRANSPARENTE (canal alfa de verdade, sem xadrez
desenhado), para os BOTÕES DE HABILIDADE de um jogo mobile de RPG pirata 3D em estilo voxel.
Grade de 6 colunas × 4 linhas, células quadradas de 256×256 px (imagem final 1536×1024 px), um
ícone centralizado por célula ocupando cerca de 82% dela. Sem texto, sem números, sem moldura,
sem círculo de fundo, sem sombra no chão.

Estilo de TODOS (igual para todos): símbolo de ação dinâmico em voxel/low-poly com cantos de
blocos visíveis, contorno escuro de 3 px (#1a1222), luz de cima à esquerda, cores saturadas e um
brilho suave na cor da fruta, vista em 3/4, composição simples e forte que se entenda em 56 px.
Mesma escala e mesmo peso de contorno em todos. Mostre o EFEITO da habilidade (não personagens).

Cada linha tem duas frutas, três habilidades por fruta, na ordem (da esquerda para a direita):

Linha 1 — IMPACTO (azul #5B87F5, força cinética) e BRASA (laranja #ffb05b, fogo):
1. Punho de Recuo — punho de energia azul disparando um pistão curto com anéis de pressão.
2. Ombro de Aríete — ombro blindado avançando com linhas de velocidade e onda de choque azul.
3. Ruptura de Pistão — punho cravado no chão abrindo uma faixa reta de rachaduras azuis.
4. Brasa Comprimida — esfera de fogo compacta com núcleo amarelo, prestes a explodir.
5. Rastro Ardente — pegada/rastro de chamas em linha com fagulhas.
6. Forno Ascendente — três pilares de fogo subindo do chão rachado.

Linha 2 — GEADA (azul-gelo #8fdded) e TORMENTA (amarelo #f4dc87, raio):
7. Estacas de Gelo — fileira de estacas de gelo pontudas saindo do chão em linha.
8. Muralha Fria — parede de blocos de gelo translúcidos.
9. Inverno Repentino — explosão circular de cristais de gelo e flocos.
10. Arco em Cadeia — raio que salta entre três pontos em zigue-zague.
11. Passo Relâmpago — pé envolto em eletricidade com rastro de raio.
12. Céu Partido — nuvem escura soltando três raios no chão marcado.

Linha 3 — LOBO (prata-azulado #b7cce2) e ECLIPSE (lilás #bba2ed, espaço/sombra):
13. Rasgo da Presa — três marcas de garra prateadas cortando o ar.
14. Uivo de Caça — cabeça de lobo uivando com ondas em cone saindo da boca.
15. Caçada Lunar — lua crescente com duas pegadas de lobo saltando.
16. Núcleo Sombrio — orbe escuro roxo com espiral que suga partículas.
17. Passagem Oculta — portal lilás com uma silhueta entrando e saindo.
18. Horizonte Vazio — vórtice escuro no chão com anéis lilás girando.

Linha 4 — MARÉ (turquesa #6eddd6) e CRISTAL (rosa #efa8cd):
19. Onda de Arrebentação — onda grande quebrando com espuma.
20. Ressaca — onda voltando em curva, puxando gotas para trás.
21. Olho da Maré — redemoinho visto de cima com olho no centro.
22. Lança de Quartzo — cristal rosa facetado em forma de lança voando.
23. Coroa de Espinhos — anel de cristais rosa brotando do chão.
24. Geodo de Ruptura — geodo partido ao meio, cheio de cristais brilhando.
```

---

## Lote 5 — Habilidades das frutas, parte 2 (24 ícones)

```
Crie UMA folha de sprites PNG com FUNDO TRANSPARENTE (canal alfa de verdade, sem xadrez
desenhado), para os BOTÕES DE HABILIDADE de um jogo mobile de RPG pirata 3D em estilo voxel.
Grade de 6 colunas × 4 linhas, células quadradas de 256×256 px (imagem final 1536×1024 px), um
ícone centralizado por célula ocupando cerca de 82% dela. Sem texto, sem números, sem moldura,
sem círculo de fundo, sem sombra no chão.

Estilo de TODOS (igual para todos): símbolo de ação dinâmico em voxel/low-poly com cantos de
blocos visíveis, contorno escuro de 3 px (#1a1222), luz de cima à esquerda, cores saturadas e um
brilho suave na cor da fruta, vista em 3/4, composição simples e forte que se entenda em 56 px.
Mesma escala e mesmo peso de contorno em todos. Mostre o EFEITO da habilidade (não personagens).

Cada linha tem duas frutas, três habilidades por fruta, na ordem (da esquerda para a direita):

Linha 1 — ECO (verde-limão #A9EF6F, som) e FALCÃO (dourado #f0bf79, vento e penas):
1. Nota de Chamada — onda sonora em cone saindo de uma nota musical.
2. Contratempo — três batidas (ondas curtas) seguindo em linha.
3. Câmara Harmônica — duas mãos batendo palmas com anéis de som em volta.
4. Rajada de Penas — pena dourada rígida voando com rastro de vento.
5. Foice de Vento — corte de ar em meia-lua com penas.
6. Corrente Ascendente — redemoinho de vento subindo com penas.

Linha 2 — DUNA (areia #e7bd75) e ÍMÃ (azul-aço #8bc2e7, magnetismo):
7. Agulha de Areia — projétil de areia compactada pontudo.
8. Passo de Duna — pé deslizando sobre uma onda de areia.
9. Tempestade de Areia — furacão de areia em espiral.
10. Tração Polar — ímã em ferradura (vermelho e azul) puxando linhas de campo.
11. Pulso Repulsor — anel de força azul empurrando para fora.
12. Órbita de Ferro — três pedaços de ferro girando em órbita.

Linha 3 — BESTA (carmesim #ff5967 e marfim) e FÊNIX (azul-ciano #53d9ff, fogo azul e penas):
13. Presa de Marfim — dois chifres de marfim rasgando para cima com rastro carmesim.
14. Rugido Carmesim — boca de fera rugindo com ondas carmesim em cone.
15. Pisão da Besta — casco/pata batendo no chão com rachaduras e espinhos de terra.
16. Pluma de Aurora — pluma incandescente azul e rosa.
17. Leque Solar — asas abertas em leque de luz.
18. Pulso de Renascimento — coração de fogo azul com anel de luz (cura).

Linha 4 — DRAGÃO ORIENTAL (vermelho #e54c58 e dourado) e DRAGÃO OCIDENTAL (âmbar #edb34c):
19. Raio Imperial — raio dourado reto perfurando.
20. Espiral Imperial — espiral de nuvem dourada girando.
21. Trovão do Poente — relâmpago caindo num círculo marcado no chão.
22. Sopro de Fornalha — cone de fogo laranja saindo de uma boca de dragão.
23. Batida de Asas — duas asas membranosas batendo com rajada de ar.
24. Meteoro de Obsidiana — meteoro negro com núcleo dourado caindo.
```

---

## Lote 6 — Transformações e despertar (16 ícones)

```
Crie UMA folha de sprites PNG com FUNDO TRANSPARENTE (canal alfa de verdade), para botões de
um jogo mobile de RPG pirata 3D em estilo voxel. Grade de 4 colunas × 4 linhas, células de
256×256 px (imagem final 1024×1024 px), um ícone centralizado por célula ocupando cerca de 82%
dela. Sem texto, sem moldura, sem círculo de fundo.

Estilo de TODOS: voxel/low-poly com cantos de blocos visíveis, contorno escuro de 3 px
(#1a1222), luz de cima à esquerda, cores saturadas, brilho suave na cor da criatura, vista em
3/4, legível em 56 px. Mesma escala em todos.

Ordem (da esquerda para a direita, de cima para baixo). "Híbrida" = cabeça/busto da criatura em
pé, meio humana; "Completa" = a criatura inteira em pose de ataque:
1. Lobo híbrido — busto de lobisomem prateado com orelhas e garras.
2. Lobo completo — lobo prateado-azulado inteiro uivando.
3. Falcão híbrido — busto com asas douradas nos braços e bico.
4. Falcão completo — falcão dourado de asas abertas.
5. Besta híbrida — busto de fera de juba branca com dois chifres carmesim.
6. Besta completa — fera quadrúpede branca e carmesim de chifres, rugindo.
7. Fênix híbrida — busto com asas de fogo azul e rosa.
8. Fênix completa — fênix azul e rosa de asas abertas em chamas.
9. Dragão Oriental híbrido — busto com chifres dourados e bigodes de dragão.
10. Dragão Oriental completo — dragão serpente vermelho e dourado enrolado no ar.
11. Dragão Ocidental híbrido — busto com chifres e asas membranosas âmbar.
12. Dragão Ocidental completo — dragão de quatro patas âmbar e negro de asas abertas.
13. Despertar — fruta mágica rachando com luz dourada saindo das rachaduras.
14. Voltar à forma humana — silhueta humana simples com seta circular.
15. (vazio, transparente)
16. (vazio, transparente)
```

---

## Lote 7 — Armas e estilos de luta (21 ícones)

```
Crie UMA folha de sprites PNG com FUNDO TRANSPARENTE (canal alfa de verdade), para os botões
de técnica de um jogo mobile de RPG pirata 3D em estilo voxel. Grade de 4 colunas × 6 linhas,
células de 256×256 px (imagem final 1024×1536 px), um ícone por célula ocupando cerca de 82%
dela. Sem texto, sem moldura, sem círculo de fundo.

Estilo de TODOS: voxel/low-poly com cantos de blocos visíveis, contorno escuro de 3 px
(#1a1222), luz de cima à esquerda, cores saturadas, vista em 3/4, legível em 56 px. Mostre o
golpe (lâmina, punho, rastro), não personagens inteiros.

Ordem (da esquerda para a direita, de cima para baixo):
Armas (a lâmina e o rastro do golpe):
1. Corte Cruzado — duas linhas de corte em X com uma espada de treino de madeira e ferro.
2. Giro da Lâmina — espada girando em círculo com rastro branco.
3. Lua Cortante — corte em meia-lua grande branco-azulado.
4. Rasgo Rubro — sabre vermelho com corte diagonal vermelho.
5. Lua Rubra — meia-lua vermelha com o sabre.
6. Tempestade de Cortes — vários cortes vermelhos cruzados.
7. Corte da Corrente — lâmina azul-turquesa com rastro de água.
8. Redemoinho de Aço — lâmina girando dentro de um redemoinho de água.
9. Maré Cortante — onda em forma de corte saindo da lâmina.
Combate Básico (punhos, cor bege e branco):
10. Sequência de Punhos — três punhos em sequência com linhas de velocidade.
11. Chute Ascendente — pé subindo com rastro curvo para cima.
12. Investida Corporal — ombro avançando com onda de choque.
13. Impacto Concentrado — punho batendo no chão com onda circular.
Corpo Voltaico (eletricidade amarela #ffe45a):
14. Punho Elétrico — punho com raios em volta.
15. Passo Voltaico — pé com rastro de raio.
16. Garra Elétrica — três marcas de garra elétricas.
17. Descarga Circular — anel de eletricidade em volta de um ponto.
Caratê das Marés (água turquesa):
18. Punho de Pressão — punho soltando um anel de ar comprimido.
19. Palma Aquática — palma aberta com leque de água.
20. Corrente Circular — redemoinho de água girando.
21. Onda Devastadora — onda grande frontal.
As 3 células que sobram (linha 6, colunas 2 a 4) ficam vazias e transparentes.
```

---

## Lote 8 — Botões de ação, Haki, raças e menus (24 ícones)

```
Crie UMA folha de sprites PNG com FUNDO TRANSPARENTE (canal alfa de verdade), para os botões da
tela de um jogo mobile de RPG pirata 3D em estilo voxel. Grade de 6 colunas × 4 linhas, células
de 256×256 px (imagem final 1536×1024 px), um ícone por célula ocupando cerca de 82% dela. Sem
texto, sem moldura, sem círculo de fundo.

Estilo de TODOS: voxel/low-poly com cantos de blocos visíveis, contorno escuro de 3 px
(#1a1222), luz de cima à esquerda, cores saturadas, vista em 3/4, MUITO legível em 48 px (formas
grandes e simples, poucos detalhes). Mesma escala em todos.

Ordem (da esquerda para a direita, de cima para baixo):
Linha 1 — ações:
1. Pular — seta grossa para cima saindo de uma bota.
2. Esquiva — silhueta em movimento com rastro curvo de velocidade.
3. Defender — escudo de madeira com borda de ferro.
4. Agachar — seta para baixo sobre uma linha de chão.
5. Asa-delta — asa-delta de tecido colorido.
6. Interagir/Falar — balão de fala com reticências.
Linha 2 — Haki e Vontade:
7. Haki do Armamento — braço/punho revestido de preto brilhante com reflexo roxo.
8. Haki da Observação — olho estilizado com ondas de percepção em volta.
9. Haki do Rei — coroa dourada soltando ondas e pequenos raios roxos.
10. Meditação — flor de lótus de energia dourada.
11. Treino com pesos — haltere voxel de ferro.
12. Respiração — pulmões/ar em espiral azul-claro.
Linha 3 — habilidade ativa de cada raça:
13. Humano: Adaptação Tática — engrenagem dourada com seta circular.
14. Aquático: Impulso Abissal — onda com seta de impulso para a frente, bolhas.
15. Ghoul: Sifão de Essência — mão com garras puxando energia roxa em espiral.
16. Homem do Céu: Passo Celeste — asas pequenas brancas com rastro de nuvem.
17. Forma (transformar) — pegada de fera com brilho mágico.
18. Despertar — fruta rachada com luz dourada.
Linha 4 — menus:
19. Mapa — mapa de pergaminho dobrado com um X vermelho.
20. Mochila — mochila de couro de aventureiro.
21. Missões — pergaminho com selo de cera.
22. Personagem — busto de pirata com chapéu tricórnio.
23. Menu/Configurações — engrenagem de ferro.
24. Roleta de Frutas — roleta dourada com uma fruta no centro.
```

---

## Dicas

- Se o ChatGPT colocar texto, molduras ou círculos atrás dos ícones, peça: *"refaça sem nenhum
  texto, sem moldura e sem círculo de fundo, só o desenho com fundo transparente"*.
- Se a grade sair torta, peça: *"mantenha a grade exata de N colunas, cada ícone centralizado
  na sua célula de 256 px"*.
- Pode refazer só um ícone: *"refaça apenas o ícone nº 14 no mesmo estilo, 256×256, fundo
  transparente"*. Eu encaixo na folha.
- Os nomes dos arquivos podem ser qualquer um; o que importa é manter a **ordem** da lista.
