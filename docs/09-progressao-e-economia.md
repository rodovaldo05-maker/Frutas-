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

## 3.9 Maestria das frutas 1–1000 (atualização 23; Prompt Mestre, seção 6)

- **Maestria geral.** O antigo domínio da fruta (1 a 100) passa a ir de 1 a 1000; salvos
  antigos migram sozinhos (nível × 10, sem perder progresso). Dez níveis novos custam o mesmo
  que um nível antigo. Estágios: 1–100 Iniciação, 101–250 Adaptação, 251–450 Especialização,
  451–650 Domínio, 651–850 Ascensão, 851–1000 Despertar. Bônus de dano das habilidades até
  +30% (não cresce para sempre). Limiares na escala nova: habilidade 2 em 41, habilidade 3 em
  121, forma híbrida em 191, forma completa em 491, Prova do Despertar em 581.
- **Trilhas (1 a 100).** Afinidade: sobe ao ganhar maestria num ambiente favorável; até −15%
  de energia nesse ambiente. Técnica: sequência de M1 completa (4/4) acertando um inimigo em
  todos os golpes e habilidades que acertam inimigos; até −10% de recarga. Sincronia (frutas
  de fera): acertos transformado (a completa vale mais); dá os 10 marcos de transformação —
  Controle inicial (transformação 30% mais rápida), Estabilidade, Mobilidade, Eficiência,
  Combate, Resistência, Domínio corporal (alcance), Sincronização, Ascensão (+1 batida no ar
  ou velocidade) e Domínio completo.
- **XP só por ação válida.** Inimigos de verdade (com limite por vida do inimigo); bonecos e
  repetições rendem cada vez menos; flexões, agachamentos e meditação não dão maestria.
- **Ambiente.** Neutro 1x, favorável 1,5x, ideal 2x, extremo 2,5x, evento raro até 4x; vale
  a maior condição (não somam) e o teto combinado é 4x. Exemplos: Brasa no deserto 1,5x, no
  vulcão 2x e na cratera 2,5x; Tormenta na chuva 1,5x, na tempestade 2x e na tempestade no
  mar 3x; Lobo à noite 2x; Maré no mar aberto 2x; Falcão em voo 1,5x e nas montanhas 2x. Ao
  entrar num ambiente favorável aparece um aviso com o multiplicador; a tela Personagem mostra
  o ambiente atual, o estágio, as trilhas e os marcos.
- **Batismo do Trovão.** Com a Tormenta, o primeiro raio natural (tempestade ou travessia) que
  atinge o jogador dá exatamente um nível de maestria; os seguintes dão 40 de XP, até 5 por dia
  do jogo. Raios do próprio jogador não contam.
- **Imunidade limitada.** No estágio Domínio (451+) a Tormenta absorve o raio natural comum
  (não ataques de chefes). A Maré continua fraca à água.
- **Despertar da maestria (851+).** Título por fruta (Núcleo Cinético, Coração Incandescente,
  Inverno Absoluto, Soberano das Tempestades, Lobo Alfa Ancestral, Domínio do Eclipse,
  Soberano das Marés, Coração Prismático, Ressonância Absoluta, Predador dos Céus, Deserto
  Infinito, Campo Magnético Absoluto, Predador Absoluto, Renascimento Celestial, Imperador dos
  Céus, Coração do Cataclismo), integrado ao Despertar que já existe (tecla V): gasta 25% menos
  energia e bate 10% mais. Nenhuma habilidade nova nem transformação nova é liberada.

Código: `src/progression/mastery.js`, `src/progression/domain.js`; testes em `tests/mastery.test.js`.

## 3.10 Treinamento físico com pesos (atualização 24; Prompt Mestre, seções 8 e 9)

- **Onde.** Slot 4 da barra de equipar (TREINAMENTO, tecla 4). Abas: Físico, Estatísticas e
  Meditação da fruta (antes Descanso), Respiração e os Haki.
- **Flexões e agachamentos.** Cada série tem exatamente 10 repetições; 1, 2, 3, 5, 10 ou
  outro número de séries (até 50). Cada repetição precisa de um toque em Repetir (ou ataque /
  Espaço) e da animação completa: na flexão o corpo vira prancha, as mãos ficam no chão sob os
  ombros e os cotovelos dobram até o peito descer; no agachamento os pés ficam fixos, quadril
  e joelhos dobram e os braços vão à frente. Toques durante a repetição são ignorados (sem
  repetição automática). Descanso de 8 s entre séries. Dá para pausar, reduzir a carga ou
  interromper; levar um golpe interrompe.
- **Cargas.** Iniciante 5 kg, Aprendiz 10, Intermediário 20, Avançado 40, Especialista 80,
  Mestre 160, Lendário 320, Sobre-humano 640, Titânico 1.280, Transcendente 2.560. Liberam
  pela média de Força e Constituição (1, 5, 10, 20, 30, 45, 60, 75, 90, 100); liberar não
  garante sustentar: acima de 1,5× a capacidade atual a carga não começa. Cargas menores
  sempre podem ser usadas. Regras de jogo, não biomecânica real.
- **Pesos 3D.** Pesos de pulso sempre; caneleiras a partir de 10 kg; colete a partir de 20 kg;
  mochila de placas a partir de 40 kg; ombreiras a partir de 160 kg; metal mais nobre (e com
  brilho a partir de 640 kg) conforme a carga. Presos às juntas, acompanham a animação.
- **Fadiga e XP.** Cada repetição cansa mais com carga pesada e deixa a próxima mais lenta;
  exausto, só depois de descansar. XP por repetição válida = carga relativa à capacidade ×
  fadiga, com limite suave por sessão e por minuto. Flexão: Constituição, Força, Resistência
  Física, Defesa e Fôlego. Agachamento: Constituição, Impulsão, Agilidade, Resistência e
  Fôlego. Série completa: Fôlego (condicionamento). Nunca mexe na maestria da fruta.
- **Meditação da fruta (substitui o Descanso; automática desde a 0.27.2).** Aba **Meditação**
  do TREINAMENTO. O personagem senta em **flor de lótus** (cada pé sobre a coxa do outro lado,
  mãos nos joelhos com as palmas para cima) e a **aura da fruta envolve o corpo**: casca de
  energia na cor da fruta, chamas de energia subindo, uma flor de lótus de energia no chão e a
  aura própria da fruta (forte, como no despertar).
  - **Automática:** a maestria da fruta sobe sozinha, sem tocar na tela — 1% do nível atual
    por segundo (~100 s por nível, com o multiplicador de ambiente da fruta) — até o nível
    máximo (1000) ou até o jogador cancelar (Interromper, mexer-se ou levar dano). Sem limite
    por sessão (escolha do jogador: aqui a regra "sem XP parado" do Prompt Mestre não vale).
    Também recupera vida, fôlego e energia (+2/s) e um pouco de Sincronia.
  - **Oportunidade de respiração:** a primeira em 8 s, depois a cada 18 a 30 s, por 12 s (três
    ciclos de 4 s). O círculo aparece e o botão **Respirar** acende; tocar quando o círculo fica
    dourado deixa o progresso **×2** por 6 s (renovando a cada respiração certa, dá para manter o
    dobro a oportunidade toda). Um toque por ciclo; tocar fora da hora não tira nada.
  - **Bônus que se multiplicam (0.27.4):** altura × condições da fruta × respiração (teto ×40).
    - **Altura:** ×1 no nível do mar, sobe 1/30 a cada metro acima de 5 m, até ×2,5 a 50 m
      (o topo do Pico Gélido, a 37 m, dá ×2,1). A altura também multiplica a energia ganha.
    - **Condições de cada fruta** (valem enquanto forem verdade; "ao começar" vale a sessão
      toda; o raio vale até o fim da meditação, e um raio natural não interrompe a meditação):

      | Fruta | Condições |
      |---|---|
      | Besta | ferida ao começar (menos da metade da vida) ×3 · atingida por um raio ×2 |
      | Lobo | noite ×2 · ferido ao começar ×2 |
      | Fênix | ferida ao começar ×3 · sol no céu ×1,5 |
      | Brasa | até 10 m da lava ×3 · terra vulcânica ×2 |
      | Ocidental | terra vulcânica ×2 · perto da lava ×2 |
      | Geada | gelo e neve ×2 · dentro da nevasca da Geleira ×3 |
      | Tormenta | tempestade ×3 · atingida por um raio ×2 |
      | Oriental | tempestade ×2 · atingido por um raio ×2 |
      | Maré | beira d’água ×2 · chuva ou tempestade ×2 |
      | Eclipse | noite ×3 · Bosque Noturno ×2 |
      | Cristal | granito, masmorra ou ruínas ×2 · noite ×1,5 |
      | Eco | entre muralhas (forte, cidadela, masmorra, arena, cidade) ×2 · noite ×1,5 |
      | Ímã | perto de metal (as mesmas muralhas) ×2 · tempestade ×1,5 |
      | Duna | areia (deserto ou praia) ×2 · tempestade de areia ×2 |
      | Falcão | picos de 40 m ou mais ×2 · tempestade ×1,5 |
      | Impacto | ferido ao começar ×2 · arena ou forte ×2 |

      Exemplo da Besta: ferida (×3) e atingida por um raio (×2) = ×6; acertando a respiração
      (×2) = ×12; e no alto de uma montanha a 35 m, ×24. A meditação usa esses bônus no lugar
      do multiplicador de ambiente das lutas. O painel mostra o total e cada bônus ativo.
  - **Ao subir um nível de maestria** o corpo levita 1,3 de altura abrindo os braços e, no alto,
    solta uma **explosão de energia na cor da aura** (clarão, estilhaços, anel e coluna no chão,
    tremor e vibração); depois desce de volta para a lótus e continua cultivando.
  - Sem fruta comida, só recupera o corpo. A antiga meditação da Vontade virou a aba
    **Respiração**.
- **Atributos novos por ação.** Constituição (treino com pesos; até +20% de vida),
  Velocidade (correr rápido de verdade, saindo do lugar; até +10% de corrida), Impulsão
  (agachamentos e saltos que levam a outro lugar; até +10% de salto), Precisão (acertar
  inimigos em movimento; até +5% de dano corpo a corpo) e Recuperação (descanso).
- **Correr é o padrão.** O botão Correr saiu da tela; correr gasta pouco fôlego (3/s) e, sem
  fôlego, o personagem anda. Inclinar pouco o analógico anda; R alterna caminhar/correr no PC.

Código: `src/progression/workout.js`, `src/ui/trainingUi.js`, `src/characters/weights.js`;
poses em `src/animation/playerAnimator.js`; testes em `tests/workout.test.js`.

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
