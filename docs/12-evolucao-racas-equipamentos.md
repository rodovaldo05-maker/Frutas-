# 12 — Evolução, raças e equipamentos

Resumo do "Documento mestre 4.0 — Evolução natural, tipos corporais, raças, transformações
e equipamentos", adaptado ao FRUTO Legacy, e o que já está no jogo. Os números são valores
iniciais de balanceamento, ajustáveis com testes.

## 1. Camadas de progressão

| Camada | Estado |
|---|---|
| A. Atributos treináveis (Fôlego, Resistência Física, Reflexos, Natação, Força, Agilidade, Defesa, Resistência Elemental, Voo) | **No jogo:** Fôlego, Força, Agilidade e Natação treinam; os demais aparecem como "em breve" (dependem de combate ou voo) |
| B. Maestria racial (Humano, Aquático, Ghoul, Homem do Céu) | Planejado (fase 3); todos começam Humano |
| C. Domínio da fruta (por id) | Planejado; o catálogo já mostra 0/600 por fruta |
| D. Proficiência de formas (híbrida, completa) | Planejado |
| E. Proficiência de estilos e armas | Planejado |
| F. Profissões (pesca, mineração, forja, navegação, culinária, coleta) | Planejado |
| G. Itens (qualidade Comum→Mítico independente da raridade de frutas, aprimoramento, durabilidade) | Planejado |

Uma camada não maximiza as outras: Ghoul com fruta dominada ainda treina Reflexos;
Aquático não começa com Natação 100.

## 2. Curva e regras de XP (no jogo)

- Nível 1 a 100. XP do nível L para L+1: `arredondar(100 + 18·L + 1,5·L²)`. Progresso em %.
- Cada ação válida dá XP ao atributo, nunca um aumento direto.
- Multiplicadores de design para depois: maestria racial ×1,25, domínio de fruta ×1,4,
  proficiência de forma ×0,9.
- Marcos com nome em níveis 10/25/50/75/100 (variam por atributo), avisados no HUD.

## 3. Ações válidas e antifarm (no jogo)

- **Deslocamento real:** a XP vem da posição real do personagem a cada passo da física.
  Correr contra a parede, teleportar ou reaparecer não conta.
- **Vaivém:** quem não sai de uma área pequena em 20 s rende menos (até 0).
- **Repetição:** a mesma ação no mesmo lugar em até 25 s rende 60% da anterior, depois 36%…
  (mínimo 5%). Variar volta ao normal.
- **Limite suave por minuto e por atributo:** acima do limite o ganho cai aos poucos, sem
  bloquear.
- O jogador é avisado quando o treino repetitivo rende menos, sem detalhes exploráveis.
- Usuário de fruta afundando não ganha Natação. Nunca há XP por afogamento.
- Online, o servidor será a autoridade de XP (fase de multijogador).

## 4. Atributos

| Atributo | Treino válido | Bônus a cada 10 níveis (teto) | Marcos |
|---|---|---|---|
| Fôlego | Andar 100 m +2, correr 100 m +4, subida até +30% | +3% fôlego (30%), +2% recuperação (20%) | Passo Constante, Corrida Sustentada, Segundo Fôlego, Ritmo de Explorador, Resistência de Jornada |
| Força | Escalada vertical, subir bordas, desafios físicos; acertos em combate | +1 de fôlego máximo por nível | Pegada Firme, Empurrão Forte, Arremesso, Quebra-obstáculos, Golpe Carregado |
| Agilidade | Transpor (+3), salto na parede (+2), corrida na parede (+3), deslize (+1), rolamento (+4), aterrissagem correta (+2), escalada | +2% aceleração e controle no ar (20%) | Passo Leve, Arranque, Corpo Ágil, Transições Limpas, Domínio do Corpo |
| Natação | Nadar 50 m +3; mergulho ×1,3 | +2% velocidade e ar na água (20%) | Braçada Estável, Mergulho Eficiente, Curva e Impulso, Controle em Correnteza, Mestre das Marés |
| Resistência Física | Golpes hostis válidos +1 a 3 | +1,5% mitigação física (15%) | Postura Firme … Corpo Temperado |
| Reflexos | Esquiva válida +3, perfeita +5 | +1% eficiência de esquiva | Leitura de Intenção … Instinto de Combate |
| Defesa / Resistência Elemental | Bloqueio, aparo; fontes elementais variadas | Bônus modestos com teto | — |
| Voo | Distância útil, curvas e pousos com voo de verdade | Controle aéreo | — |

Agilidade não dá salto extra (isso é da raça Homem do Céu, de itens ou habilidades).

## 5. Tipos corporais (fase 3)

| Raça | Passivas iniciais | Ativa | Limitação |
|---|---|---|---|
| Humano | +15% XP física (com teto), +10% recuperação de fôlego, manuseio de armas | Adaptação Tática | Sem respiração na água, drenagem ou saltos extras |
| Aquático | Remove só o debuff de dano aquático da fruta, +20% resistência física base, +35% nado, respira embaixo d'água | Impulso Abissal | Bônus dependem da água; imersão ainda pode bloquear poderes |
| Ghoul | +20% dano de habilidades de fruta (uma vez), +15% recuperação de energia de fruta, +10% resistência a efeitos | Sifão de Essência | Menos vantagem na água e no ar |
| Homem do Céu | Até 3 saltos extras (4 impulsos), +20% controle aéreo, +15% altura de salto, menos dano de queda | Passo Celeste | Fôlego limita saltos; sem voo infinito |

Maestria racial 1–100 com estágios em 20/40/60/80 e despertar no 100 por desafio próprio
(não automático). Especialização no nível 40 (duas trilhas por raça), aprimorada no 80.
Regras da água separadas em quatro conceitos: dano recebido na água, debuff de dano da
fruta, incapacitação por imersão e capacidade de respirar e nadar (seção 25 do mestre).
Zonas de profundidade: respingos, joelho, cintura, peito, submersão.

## 6. Combate, condições e itens (fases 5–7)

Ordem do dano: base → domínio → raça → equipamento → defesas do alvo → estado → tetos
PvP/PvE → mínimo. Mitigação multiplicativa com teto (PvP 50%, PvE 65%, iniciais).
Fadiga e ferimentos temporários nunca apagam maestria. Itens com qualidade própria,
durabilidade, peso, compatibilidade com asas, caudas e nadadeiras; forja com receitas,
prévia e custos crescentes; barcos e profissões com maestrias próprias.

## 7. Roteiro e situação

| Fase | Conteúdo | Situação |
|---|---|---|
| 1 | Eventos válidos, curva de XP, atributos, salvamento e HUD | **Feito** |
| 2 | Fôlego, resistência, reflexos, natação, força, defesa, agilidade, voo | **Parcial:** Fôlego, Força, Agilidade e Natação; o resto espera combate e voo |
| 3 | Quatro raças, passivas, ativas e maestria racial | Próxima |
| 4 | Especializações, despertares e efeitos | — |
| 5 | Integração com frutas, transformações e água | — |
| 6 | Proficiências de armas, estilos e equipamentos | — |
| 7 | Forja, profissões, barcos, inventário, lojas e trocas | — |
| 8 | Rigging refinado, IK, animações e sons por raça | — |
| 9 | Otimização, QA, telemetria, PvP e balanceamento | — |

O treino é uma camada a mais: os pontos de status do nível de aventureiro continuam e são
distribuídos pelo jogador (doc 09, seção 1.1). O treino não é distribuível e soma por cima.
A ordem das próximas entregas está no doc 13.

Código: `src/progression/training.js` (curva, atributos, bônus, antifarm, rastreador),
`src/progression/status.js` (pontos distribuídos e totais), `src/ui/statusScreen.js`
(Personagem › Status, Treinamento e Ganhos recentes), testes em `tests/status.test.js` e
`tests/movement.sim.test.js`.


## 8. Situação: quatro raças (atualização 5)

| Raça | Passivas no jogo | Ativa (recarga) | Maestria sobe com |
|---|---|---|---|
| Humano | +15% de XP nos atributos físicos (tetos valem); +10% de fôlego fora de combate; −10% de recarga nas habilidades de espada | Adaptação Tática (40 s): 10 s de troca de item instantânea e fôlego +50% | Acertar inimigos alternando fruta, espada e soco; defender; descobrir áreas |
| Aquático | Sem o dano da água do usuário de fruta (afundar continua); respira embaixo d'água; +35% nadando; +20% de resistência física (≈ −5% de dano físico, −8% no Nv. 20) | Impulso Abissal (6 s): arrancada na água; passo firme em terra | Experiência de Natação (só deslocamento real) |
| Ghoul | +20% de dano das habilidades de fruta (soco e espada não); +15% de energia; −10% de atordoamento | Sifão de Essência (12 s): golpe curto; em inimigo devolve 18 de energia | Habilidades de fruta que acertam inimigos (variar rende mais); Sifão que acerta |
| Homem do Céu | 3 saltos extras (4 impulsos), cada um gasta fôlego; 5 impulsos no Nv. 60; +20% de controle no ar; +15% de altura; menos dano de queda | Passo Celeste (5 s): deslocamento curto no ar | Saltos extras que levam mais alto (2,2) ou mais longe (8) |

- Escolha obrigatória no começo (salvos antigos também escolhem), com prévia 3D de cada raça,
  passivas, ativa e limitação lado a lado. A aparência não muda a cor da pele.
- Partes visuais presas ao corpo: nadadeiras e brânquias (Aquático), marcas que brilham
  (Ghoul), asas de penas que batem nos saltos extras (Homem do Céu).
- Maestria racial de 1 a 100 (curva × 1,25), marcos nos níveis 20, 40, 60, 80 e 100 (aba
  Raça em Personagem). Especializações (Nv. 40/80) e o despertar com prova racial ficam para
  a atualização 13.

Código: `src/races/races.js`, `src/races/raceSystem.js`, `src/races/raceParts.js`; testes em
`tests/races.test.js`.


## 9. Situação: itens e equipamentos (atualização 8)

- **Encaixes:** cabeça, torso, pernas, botas, anel e amuleto (Personagem › Equipamento).
- **Qualidades:** Comum, Incomum, Rara, Épica, Lendária e Mítica (independentes da fruta e da
  raça). Cada item tem nível recomendado, peso, durabilidade, preço, atributos e, às vezes,
  uma sinergia pequena de raça.
- **14 itens:** Bandana de Treino, Gibão de Couro, Calças Reforçadas, Botas Leves (Céu: −10% de
  queda), Elmo de Ferro, Couraça de Escamas (Aquático: +5% nadando), Grevas de Aço, Botas do
  Vento (Céu: −15% de queda), Manto de Brasa, Anel de Cobre, Colar de Conchas, Foco Arcano
  (Ghoul: +5% de energia), Bracelete Técnico (Humano: −10% de recarga da Adaptação) e Amuleto
  da Maré (Aquático: +5% nadando).
- **Atributos somados com teto:** defesa (até 30), vida (60), fôlego (40), energia (25) e
  resistência elemental (15%). Peso acima de 6 reduz 2% da recuperação de fôlego por unidade
  (até −20%).
- **Durabilidade:** cada golpe recebido gasta 1 de uma peça de armadura; quebrada não dá bônus
  até ser consertada no Mestre de Armas (25% do preço proporcional ao desgaste).
- **Onde conseguir:** abas Armaduras e Acessórios do Mestre de Armas; Recrutas derrubam itens
  (6%; elementais 15%) do nível deles.
- **Visual:** capacete ou bandana, peitoral com ombreiras, perneiras, botas, amuleto e anel
  aparecem no corpo com a cor do item.

Código: `src/items/items.js`, `src/items/gearParts.js`; testes em `tests/items.test.js`.


## 10. Situação: forja e profissões (atualização 12)

- **Materiais** (`src/crafting/materials.js`): minérios (Pedra, Cobre, Ferro, Cristal Marinho),
  pesca (Sardinha, Robalo, Atum, Peixe-Dourado, Concha, Pérola) e restos dos inimigos (Retalho de
  Tecido dos Recrutas, 45%; Núcleo de Brasa, Geada ou Tormenta dos elementais, 35%). Pilhas até
  999 em `save.materials`. A Mercadora (Joana) compra pelo valor de cada um.
- **Ferramentas:** Picareta (400, com a Rosa) e Vara de Pesca (300, com a Joana).
- **Mineração:** 11 veios (6 na Ilha de Treino, 5 em volta do Porto, cristal no alto do morro).
  Minerar leva 1,8 s (até −50% com a maestria), a picareta balança e solta faíscas; o veio dá o
  minério dele, extras com a maestria, e volta em 90 s. Mexer, pular ou esquivar cancela.
- **Pesca:** 4 pontos (pontas dos dois cais, praia sul do Porto e margem da lagoa). Lança a linha,
  espera a mordida (2,5–6 s, menos com a maestria) e puxa na janela (0,9 s + maestria) pelo botão
  "Puxar!". Tabelas do mar e da lagoa; os raros pesam mais com a maestria.
- **Maestrias próprias:** Mineração, Pesca e Forja, de 1 a 100 (mesma curva das proficiências),
  na aba Personagem › Profissões, com ferramentas e materiais guardados.
- **Forja da Rosa** (`src/crafting/forge.js`): 12 receitas (10 equipamentos e 2 espadas) com
  materiais, moedas e nível mínimo. A peça forjada sai com 0 a 3 estrelas (+6% cada) sorteadas
  pela maestria de Forja. **Melhorar** de +1 a +10 (+8% cada) com custo crescente (moedas × 1,55 por
  nível, ferro 2 + nível e cristal a partir do +5) e prévia antes/depois. Os tetos do equipamento
  continuam valendo. Nada é cobrado se faltar algo.
- **Missões de coleta** no Mestre de Missões: pescar 3 peixes ou minerar 5 minérios.

Código: `src/crafting/`, `src/ui/forgeUi.js`; testes em `tests/crafting.test.js`.
