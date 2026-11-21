# 09 — Progressão e economia

## 1. Nível do personagem

| Item | Regra |
|---|---|
| Nível máximo | 2400 |
| Experiência por nível | `100 + 30 × nível^1,4` |
| Pontos por nível | 3 pontos de status |
| Fontes de experiência | Inimigos, chefes, missões, exploração (tesouros, segredos), combate naval |

### 1.1 Status

| Status | Efeito por ponto |
|---|---|
| Força | +3% de dano corpo a corpo e de estilos; +1 de fôlego máximo |
| Defesa | +6 de vida máxima e +0,5 de defesa |
| Fruta | +3% de dano das habilidades de fruta |
| Espada | +3% de dano com armas (sistema de armas é futuro) |
| Vitalidade | +4 de energia e fôlego máximos |

Fôlego máximo = 100 + 1 × Força + 4 × Vitalidade (ex.: 300 pontos em Força → 400 de fôlego).
Vida máxima = 100 + 6 × Defesa.

Na Ilha de Treino (Fase 1) a experiência vem de: cada objetivo da missão de treino (60),
recompensa da missão (500 e 1.000 moedas) e cada área descoberta ao chegar perto da placa
(25). Tudo somado leva o jogador ao nível 6 com 15 pontos de status. A tela de Status tem
+1, +10 e Máx; Redistribuir é grátis uma vez.

Redistribuir pontos: custa moedas no Mestre de Missões (grátis uma vez a cada mar).

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
