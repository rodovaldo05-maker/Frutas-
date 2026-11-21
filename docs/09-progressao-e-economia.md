# 09 — Progressão e economia

## 1. Nível do personagem

| Item | Regra |
|---|---|
| Nível máximo | 2400 |
| Experiência por nível | `100 + 30 × nível^1,4` |
| Pontos por nível | 3 pontos de status |
| Fontes de experiência | Inimigos, chefes, missões, exploração (tesouros, segredos), combate naval |

### 1.1 Atributos treinados pela prática (documento mestre 4.0)

O nível de aventureiro (missões e exploração) não dá mais pontos para distribuir. Os
atributos evoluem pelo que o personagem pratica, de 1 a 100, com a curva
`arredondar(100 + 18·L + 1,5·L²)` — ver doc 12. Regras principais:

| Atributo | Como treina | Bônus (com teto) |
|---|---|---|
| Fôlego | Andar (+2 XP a cada 100 m), correr (+4), subidas até +30% | +3% de fôlego máximo e +2% de recuperação a cada 10 níveis (até +30% / +20%) |
| Força | Escalar, subir bordas, desafios físicos; em combate, acertar golpes | **+1 de fôlego máximo por nível** |
| Agilidade | Transpor obstáculos, salto e corrida na parede, deslize, rolamento, aterrissagens | +2% de aceleração e controle no ar a cada 10 níveis (até +20%) |
| Natação | Nadar (+3 XP a cada 50 m), mergulho rende mais | +2% de velocidade na água e de ar a cada 10 níveis (até +20%) |
| Resistência Física, Reflexos, Defesa, Resistência Elemental | Em combate (próxima fase) | Mitigação, esquiva e bloqueio com tetos |
| Voo | Só com voo de raça, fruta, forma ou item | Controle aéreo |

Fôlego máximo = (100 + nível de Força − 1) × (1 + bônus de Fôlego). Vida máxima: 100 (raças e
equipamentos entram depois).

Na Ilha de Treino a experiência de aventureiro vem de cada objetivo da missão de treino
(60), da recompensa da missão (500 e 1.000 moedas) e de cada área descoberta (25). Os
objetivos também contam como desafios físicos (+15 no atributo ligado a cada um).

## 2. Moedas e itens

| Recurso | Como se ganha | Para que serve |
|---|---|---|
| Moedas | Inimigos, missões, baús, venda de materiais | Roleta, estilos, barcos, reparos, roupas |
| Fragmentos | Trocando frutas no Trocador | Criar chaves |
| Chaves | 10 fragmentos; recompensa rara de chefes | Pagar um giro da roleta |
| Materiais | Inimigos, bestas marinhas, exploração | Melhorias de barco e de estilo |
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

## 7. Reputação (proposta)

Facções originais com reputação de 0 a 1000: **Liga dos Portos** (comércio),
**Guarda Maré-Alta** (ordem) e **Irmandade das Velas Negras** (piratas). Reputação libera
lojas, barcos e missões exclusivas. Ações contra uma facção baixam a reputação com ela.

## 8. Morte e penalidade

- Ao ser derrotado: volta ao último porto visitado.
- Perde 5% das moedas carregadas (nunca fragmentos, chaves ou frutas).
- Barcos naufragados voltam ao estaleiro com reparo pago.
