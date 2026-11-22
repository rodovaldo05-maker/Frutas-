# 09 — Progressão e economia

## 1. Nível do personagem

| Item | Regra |
|---|---|
| Nível máximo | 2400 |
| Experiência por nível | `100 + 30 × nível^1,4` |
| Pontos por nível | 3 pontos de status |
| Fontes de experiência | Inimigos, chefes, missões, exploração (tesouros, segredos), combate naval |

### 1.1 Duas camadas que somam: pontos de nível e treino

As duas convivem; uma não substitui a outra.

| | Pontos de status (nível) | Treino pela prática (doc 12) |
|---|---|---|
| De onde vem | 3 pontos a cada nível de aventureiro | Ações válidas do personagem (andar, nadar, escalar...) |
| Distribuir | **Sim**: o jogador escolhe onde colocar (+1, +10, Máx) | **Não**: vai sozinho para o atributo praticado |
| Redistribuir | Grátis uma vez; depois no Mestre de Missões (Prefeitura do Porto): 500 + 100 × nível moedas | Não se apaga (nem trocando fruta ou equipamento) |
| Atributos | Força, Defesa, Fruta, Espada, Vitalidade | Fôlego, Força, Agilidade, Natação, Resistência Física, Reflexos, Defesa, Resistência Elemental, Voo |

Efeito de cada ponto distribuído:

| Status | Efeito por ponto |
|---|---|
| Força | +3% de dano corpo a corpo e **+1 de fôlego máximo** |
| Defesa | +6 de vida e +0,5 de defesa |
| Fruta | +3% de dano das habilidades das frutas |
| Espada | +3% de dano com armas |
| Vitalidade | +4 de energia (poderes das frutas) e +4 de fôlego |

Treino (nível 1 a 100, curva `arredondar(100 + 18·L + 1,5·L²)`):

| Atributo | Como treina | Bônus (com teto) |
|---|---|---|
| Fôlego | Andar (+2 XP a cada 100 m), correr (+4), subidas até +30% | +3% de fôlego máximo e +2% de recuperação a cada 10 níveis (até +30% / +20%) |
| Força | Escalar, subir bordas, desafios físicos; acertar golpes (inimigo +2, boneco +1, Gancho +1; teto de 12 por oponente) | **+1 de fôlego máximo por nível** |
| Agilidade | Transpor obstáculos, salto e corrida na parede, deslize, rolamento, aterrissagens | +2% de aceleração e controle no ar a cada 10 níveis (até +20%) |
| Natação | Nadar (+3 XP a cada 50 m), mergulho rende mais | +2% de velocidade na água e de ar a cada 10 níveis (até +20%) |
| Resistência Física | Apanhar de inimigos de verdade (teto de 10 XP por oponente) | −1,5% de dano físico a cada 10 níveis (até −15%) |
| Reflexos | Esquivar de golpe que ia acertar (+3); defesa perfeita (+1) | +1% de tempo de esquiva e +5 ms na janela da defesa perfeita a cada 10 níveis (até +10% / +50 ms) |
| Defesa | Defender golpe de inimigo (+2; perfeita +4) | +1% de bloqueio e −2% de postura gasta a cada 10 níveis (até +10% / −20%) |
| Resistência Elemental | Com inimigos elementais (atualização 6) | Bônus por elemento, com teto |
| Voo | Só com voo de raça, fruta, forma ou item | Controle aéreo |

Força e Defesa aparecem nas duas camadas: na tela de Status, cada uma mostra ao lado o nível
de treino do mesmo atributo, e os dois somam.

- Fôlego máximo = (100 + pontos de Força + 4 × pontos de Vitalidade + nível de treino de
  Força − 1) × (1 + bônus do treino de Fôlego).
- Vida máxima = 100 + 6 × pontos de Defesa (raças e equipamentos entram depois).
- Salvos antigos: quem estava na versão 4 (sem pontos) recebe os pontos do nível para
  distribuir; os pontos nunca ficam abaixo de 3 × (nível − 1).

Na Ilha de Treino a experiência de aventureiro vem de cada Recruta derrotado (45 e 12
moedas), de cada objetivo da missão de treino (60), da recompensa da missão (500 e 1.000 moedas) e de cada área descoberta (25). Os
objetivos também contam como desafios físicos (+15 no atributo ligado a cada um).

## 2. Moedas e itens

| Recurso | Como se ganha | Para que serve |
|---|---|---|
| Moedas | Inimigos, missões, baús, venda de materiais | Roleta, estilos, barcos, reparos, roupas |
| Fragmentos | Trocando frutas no Trocador | Criar chaves |
| Chaves | 10 fragmentos; recompensa rara de chefes | Pagar um giro da roleta |
| Materiais | Mineração, pesca, inimigos (atualização 12); depois bestas marinhas e exploração | Forja (receitas e melhorias); vendidos à Mercadora pelo valor |
| Mapas do tesouro | Baús, NPCs, pesca | Revelam baús escondidos |

## 3. Roleta de frutas (Mercador de Frutas)

| Regra | Valor |
|---|---|
| Giro ×1 | 200 moedas ou 1 chave |
| Giro ×10 | 2.000 moedas ou 10 chaves |
| Sorteio | Primeiro o rank (Comum 45 · Incomum 28 · Rara 16 · Épica 7 · Lendária 3 · Mítica 1), depois uma fruta elegível do rank pelo peso da ficha |
| Rank sem frutas | O peso é redistribuído de forma explícita entre os ranks com frutas (nunca sorteia fruta inexistente) |
| Chances | A roleta mostra as chances reais da tabela ativa, por rank e por fruta |
| Histórico | Cada obtenção fica registrada (últimas 200) |
| Destino | Toda fruta sorteada vai para a mochila |
| Segurança | Se a mochila não tiver espaço para o giro, ele é bloqueado sem cobrar |
| Garantia | Configurável por tabela e exibida: na roleta, Lendária ou melhor em até 50 giros |
| Jogador novo | Começa com 200 moedas (1 giro) |

**Na Fase 1:** o Mercador de Frutas fica na praia da Ilha de Treino, ao lado do Trocador de
Fragmentos. A roleta, a garantia de 50 giros, a mochila de 60, a troca por fragmentos, as
chaves e o comer já funcionam (regras em `src/fruits/roulette.js`, testadas). Os poderes
de cada fruta chegam com o combate.

## 4. Mochila

| Regra | Valor |
|---|---|
| Capacidade | 60 frutas (ampliável para 120 com melhorias) |
| Fruta na mão | Selecionar uma fruta a coloca viva na mão do personagem |
| Ações | Segurar, Comer, Trocar por fragmentos, Jogar fora, Favoritar (protege contra troca em massa) |
| Comer | Substitui a fruta atual (a anterior se perde, mas a maestria dela fica guardada) |
| Ordenação | Por nível (Lendário primeiro), por nome, por data |

## 5. Trocador de Fragmentos

O valor de troca vem da ficha de cada fruta (não depende só da raridade); os valores
padrão por rank são Comum 1, Incomum 1, Rara 2, Épica 3, Lendária 5, Mítica 10.

- 10 fragmentos = 1 chave.
- Atalhos: trocar todas as Comuns, Incomuns ou Raras (Incomuns e Raras pedem confirmação).
- Frutas favoritadas e a fruta na mão pedem confirmação individual.

## 6. Missões

| Tipo | Exemplo | Recompensa |
|---|---|---|
| Caça | Derrote 8 Saqueadores | Experiência e moedas |
| Chefe | Derrote o Capitão Ferrugem | Grande experiência, moedas, chance de chave |
| Exploração | Encontre os 3 mapas da gruta | Experiência, mapa do tesouro |
| Entrega | Leve suprimentos ao farol | Moedas, reputação |
| Navegação | Escolte o navio mercante | Moedas, material de barco |
| História | Arco principal de cada mar | Desbloqueios de mar, estilos, Vontade |
| Diária | 3 missões que mudam a cada dia | Fragmentos e moedas |

Missões aceitas aparecem no rastreador da tela (doc 10). Limite de 5 missões ativas.

**No jogo (atualização 11):** o Mestre de Missões do Porto das Origens oferece 3 missões por dia
(entrega, caça, conversa e recado; renovam às 6h do jogo), com moedas e experiência ao concluir.
A Loja de Frutas do Porto vende 4 frutas por dia pela tabela `loja` ao preço da ficha (doc 11,
seção 11).

## 7. Reputação (proposta)

Facções originais com reputação de 0 a 1000: **Liga dos Portos** (comércio),
**Guarda Maré-Alta** (ordem) e **Irmandade das Velas Negras** (piratas). Reputação libera
lojas, barcos e missões exclusivas. Ações contra uma facção baixam a reputação com ela.

## 8. Morte e penalidade

- Ao ser derrotado: volta ao último porto visitado.
- Perde 5% das moedas carregadas (nunca fragmentos, chaves ou frutas).
- Barcos naufragados voltam ao estaleiro com reparo pago.
