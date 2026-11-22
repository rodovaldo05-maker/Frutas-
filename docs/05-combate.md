# 05 — Combate

## 1. Princípios

- Combate em 3D, rápido e legível. Toda ação tem início, momento ativo e recuperação.
- **Nenhum golpe atravessa um inimigo sem reação.** Todo acerto gera hitstop, som, efeito e
  reação no alvo (mesmo que pequena, como um "estremecer" em chefes).
- Mesmas regras para jogador e inimigos; inimigos usam os mesmos dados de golpe.
- Simulação em 60 Hz: os dados de golpe são medidos em quadros de 1/60 s.

## 2. Repertório

| Ação | Entrada | Descrição |
|---|---|---|
| Ataque leve | Atacar (toque) | Golpes rápidos do estilo; combo de 3–5 |
| Ataque pesado | Atacar (segurar 0,3 s) | Mais lento, quebra guarda parcialmente |
| Ataque carregado | Segurar pesado até 1,2 s | 3 níveis de carga |
| Ataque aéreo | Atacar no ar | Golpes que mantêm o alvo no ar |
| Golpe em corrida | Atacar durante sprint | Investida |
| Golpe após esquiva | Atacar até 0,3 s após esquivar | Contra rápido |
| Defesa | Defender (segurar) | Reduz 70% do dano frontal; gasta Postura |
| Defesa perfeita | Defender nos 0,15 s antes do golpe | Anula o dano, atordoa o atacante por 0,6 s |
| Contra-ataque | Atacar logo após defesa perfeita | Golpe garantido com dano extra |
| Quebra de guarda | Pesado carregado ou habilidades marcadas | Zera a Postura do alvo |
| Agarrão | Defender + Atacar | Não pode ser defendido; pode ser esquivado |
| Arremesso | Após agarrão + direção | Lança o alvo; dano ao bater em parede |
| Cancelamentos | Esquiva ou habilidade durante a recuperação | Só em janelas marcadas |
| Finalizador | Atacar em alvo atordoado com pouca vida | Animação especial |

## 3. Dados por golpe

Cada golpe (de estilo, fruta ou inimigo) é descrito por:

| Campo | Exemplo (soco 1 do Combate Básico) |
|---|---|
| Preparo (startup) | 6 quadros |
| Ativo | 3 quadros |
| Recuperação | 10 quadros |
| Janela de combo | quadros 12–24 |
| Janela de cancelamento | quadros 14–19 (esquiva) |
| Hitbox | Esfera de 0,5 m presa ao punho |
| Alcance | 1,4 m |
| Dano | 10 |
| Dano de Postura | 8 |
| Recuo (knockback) | 1,0 m |
| Reação | Leve |
| Custo | — |
| Efeitos | Rastro do punho, faísca de impacto |
| Som | `combate.soco.leve` |

**Hurtboxes:** cada personagem tem caixas por parte do corpo (cabeça, tronco, braços,
pernas). Acertos na cabeça causam +10% de dano; em chefes, partes podem ser pontos fracos.

## 4. Dano e status

### 4.1 Fórmula

```
dano = base
     × (1 + atributo × 0,03)            // Força, Fruta ou Espada, conforme a origem
     × nível da fruta                     // Comum 1,0 · Épico 1,35 · Lendário 1,75 (só fruta)
     × bônus de maestria                  // até +30%
     × modificadores (Vontade, despertar, forma, crítico)
     × (100 / (100 + defesa do alvo))
```

### 4.2 Barras do personagem

| Barra | Função |
|---|---|
| Vida | Chegou a 0: derrotado |
| Energia | Paga habilidades de fruta e despertar |
| Fôlego | Mobilidade (doc 04) |
| Postura | Defesa: zerou, fica atordoado (quebra de guarda) |
| Vontade | Paga habilidades de Vontade (doc 07) |

### 4.3 Efeitos de status

| Status | Efeito | Duração típica |
|---|---|---|
| Queimadura | Dano por segundo; acumula até 5 vezes | 4 s |
| Congelamento | Não se move nem ataca; quebra ao receber golpe forte | 0,5–3 s |
| Choque | Acumula carga; com 3 cargas, atordoa | 6 s |
| Lentidão | −20% a −80% de velocidade | 1–4 s |
| Atordoamento | Não age | 0,3–1,5 s |
| Puxão / Empurrão | Deslocamento forçado | Instantâneo |
| Lançamento | Alvo vai para o ar (permite juggle) | Até tocar o chão |
| Marca | Habilidades específicas reagem à marca (ex.: Eco) | 3,2 s |
| Afogamento | Regras da água (doc 03) | Enquanto submerso |

Chefes têm **resistência a controle**: cada controle recebido reduz a duração do próximo
em 30% (acumula até 3 vezes; zera após 8 s).

## 5. Reações

| Reação | Quando | O que acontece |
|---|---|---|
| Estremecer | Golpe fraco em alvo pesado | Pisca, pequeno recuo, não interrompe |
| Leve | Golpe comum | Interrompe ataque em preparo; animação direcional (frente, costas, lados) |
| Pesada | Golpe forte | Recuo grande; animação longa |
| Stagger | Postura baixa | Cambaleia, vulnerável |
| Knockdown | Golpe de derrubar | Cai no chão; 1,0 s para levantar (pode rolar) |
| Lançado | Golpe de lançar | Vai para o ar; pode receber juggle por até 2,5 s |
| Parede | Arremessado contra parede | Dano extra e atordoamento curto |

## 6. Impactos (sensação de golpe)

| Recurso | Regra |
|---|---|
| Hitstop | Golpe leve 3 quadros, pesado 6, finalizador 10 (atacante e alvo congelam) |
| Tremor de câmera | Proporcional ao dano; reduzível nas opções |
| Recuo | Do alvo e, em golpes pesados, do atacante |
| Efeitos | Faísca de impacto no ponto de contato, rastro do golpe (vindo do membro) |
| Som espacial | Som 3D no ponto do acerto, variação aleatória de tom |
| Partículas | Poeira, estilhaços conforme o material atingido |
| Marcas no terreno | Rachaduras, queimados, gelo; somem após 10 s |
| Números de dano | Opcionais; cor por tipo (físico, fogo, gelo, crítico) |
| Câmera lenta | Só no golpe final em chefes (0,4 s) |

## 7. Mira

| Modo | Uso |
|---|---|
| Alvo travado | Botão Travar seleciona o inimigo mais próximo do centro da tela |
| Mira assistida (padrão no celular) | Habilidades miram no inimigo mais próximo à frente |
| Mira manual | Arrastar a habilidade no celular mostra a área antes de soltar; no PC, mira com o mouse |

## 8. Inimigos

### 8.1 Arquétipos

| Arquétipo | Comportamento |
|---|---|
| Lutador | Aproxima, combo curto, defende às vezes |
| Atirador | Mantém distância, recua se perseguido |
| Tanque | Lento, muita Postura, golpes de área |
| Ágil | Esquiva, flanqueia, ataca pelas costas |
| Usuário de fruta | Usa uma habilidade de fruta com aviso no chão |
| Suporte | Cura ou fortalece aliados |

### 8.2 Inteligência

- Máquina de estados: patrulha → alerta → perseguição → combate → recuo → retorno.
- **Fichas de ataque:** no máximo 2 inimigos atacam o jogador ao mesmo tempo; os outros
  rondam, evitando que o jogador seja cercado sem chance.
- Todo ataque perigoso tem **aviso legível** (brilho, marca no chão, som).
- Navegação por malha de navegação gerada por ilha (em Web Worker).

### 8.3 Chefes

- 2 a 4 fases por chefe, com mudança de padrão, arena e música.
- Barra de vida no topo com marcas de fase.
- Pontos fracos expostos em janelas de oportunidade.
- Resistência a controle (seção 4.3).
- Recompensas: moedas, experiência, fragmentos, itens de estilo, chance de chave.

## 9. Equilíbrio PvE e PvP

| Regra | PvE | PvP |
|---|---|---|
| Dano de habilidades | 100% | 70% |
| Duração de controles | 100% | 50%, com imunidade de 2 s após um controle |
| Cura | 100% | 60% |
| Nível da fruta | Afeta dano e recarga | Afeta só a recarga (dano igual entre níveis) |

## 10. Situação no jogo (atualização 2 — combate base)

Já funciona na Arena de combate da Ilha de Treino (centro-oeste, placa "Arena de combate"):

| Parte | Como ficou |
|---|---|
| Atacar | Combo Jab → Direto → Gancho com os golpes do laboratório; o contato acontece no quadro do clipe (Jab 0,10 s, Direto 0,14 s, Gancho 0,21 s); apertar depois do contato emenda o próximo golpe; vira sozinho para o alvo mais perto à frente e avança um pouco |
| Dano | `base × (1 + 3% por ponto de Força) × 100/(100 + defesa) × (1 − mitigação)`; Jab 10, Direto 12, Gancho 16 |
| Defender | Segurar: −70% do dano de frente, gasta Postura (100; volta 22/s depois de 1,2 s); zerou: guarda quebrada (1,2 s atordoado); defendendo, vira de frente para o inimigo mais perto |
| Defesa perfeita | Começar a defender até 0,15 s antes do golpe: dano zero e o atacante fica atordoado 0,6 s |
| Esquiva | A esquiva cancela a recuperação do golpe; com a invulnerabilidade da esquiva, o golpe que ia acertar vira "Esquiva!" |
| Hitstop e reações | Pausa curta no contato (0,06–0,1 s), tremor de câmera, recuo, inclinação de dor e números de dano |
| Bonecos de treino | Três bonecos que balançam e contam os golpes; não revidam |
| Recrutas (Nv. 2) | Corpo e golpes do laboratório; percebem o jogador só no acampamento; um ataca por vez; preparo de 0,5 s antes de bater (aviso); defendem às vezes depois de apanhar seguido; derrotados dão 45 exp e 12 moedas e voltam em 18 s |
| Controles | Celular: botões Punho (atacar) e Escudo (segurar para defender). PC: clique ou J / botão direito ou K. Controle: X/▢ ou RT / RB ou LT |
| Treino | Acertar: Força (teto por oponente; no boneco o mesmo golpe rende cada vez menos). Apanhar de inimigo: Resistência Física. Defender: Defesa; defesa perfeita também dá Reflexos. Esquiva de golpe real: Reflexos |

Falta (próximas atualizações, doc 13): golpe pesado e carregado, ataque aéreo, agarrão,
finalizador, estados (queimadura, congelamento, choque), chefes, mira travada, golpes das
frutas e das armas, Vontade e estilos de luta.

Código: `src/combat/rules.js`, `src/combat/playerCombat.js`, `src/combat/enemies.js`,
`src/combat/floatText.js`; testes em `tests/combat.test.js`.


## 11. Situação: elementos e condições (atualização 6)

| Condição | Origem | Efeito | Contrajogo |
|---|---|---|---|
| Queimando | Fogo | 2/3/4 de dano a cada 0,5 s (1 a 3 acúmulos) | Entrar na água apaga; rolar encurta 1,5 s; molhado não pega fogo |
| Congelado | Prisão de Gelo | Não anda nem ataca por 1,2 s | Sair do círculo, esquivar ou defender |
| Lento | Gelo | −40% de velocidade | Passa sozinho |
| Choque | Raio | Cargas; com 3, atordoado 0,8 s (molhado ganha 1 carga extra) | Defender os golpes de raio; as cargas somem em 6 s |
| Molhado | Água | Apaga o fogo, deixa vulnerável a choque | — |

- Acampamento Elemental (nordeste da ilha, placa própria): Recrutas de Brasa, Geada e Tormenta
  (Nv. 4, 140 de vida, 80 exp e 25 moedas), punhos que brilham, golpes com elemento e um ataque
  marcado: círculo no chão onde o jogador está, resolve em 0,9 s; sair dele conta como esquiva
  real (Reflexos).
- Golpes elementais usam a Resistência Elemental no lugar da mitigação física; defender ou
  esquivar evita a condição.
- Resistência Elemental: sobe aguentando golpes elementais de inimigos (variar o elemento rende
  mais, teto por oponente); −1,5% de dano elemental e −2% de duração das condições a cada 10
  níveis (até −15% / −20%). Ghoul: −10% de duração.
- Voo: sobe planando com a asa-delta (item de voo) com deslocamento real; +2% de velocidade e
  −1,5% de queda planando a cada 10 níveis.
- HUD: as condições aparecem acima do status com o tempo restante; o corpo fica azul
  (congelado), laranja piscando (queimando) ou amarelo (choque).

Código: `src/combat/conditions.js`, `src/combat/enemies.js`; testes em `tests/elemental.test.js`.

## 12. Situação: M1 de quatro golpes por fruta (atualização 20 — Prompt Mestre, fases A e C)

- **Auditoria (fase A).** Antes: `AttackRunner` com 3 golpes por estilo, clique guardado por
  0,32 s a qualquer momento e encadeamento logo depois do contato (o golpe seguinte cortava a
  recuperação do anterior); as frutas usavam os golpes assinados do laboratório `fruta_j1..j3`
  e as míticas repetiam os do Lobo; segurar J repetia golpes pela repetição do teclado.
- **Catálogo (fase C).** `src/combat/m1Catalog.js` monta 64 fichas (`fruta_m1_1..4`) com os
  nomes da seção 4 do Prompt Mestre. Cada uma tem quadros totais (18/20/24/30 × peso da fruta),
  quadro de impacto (7/9/12/16 × peso), quadros ativos, fases (preparo, aceleração, colisão,
  seguimento, recuperação), seis quadros-chave com os ângulos de quadril, tronco, cabeça,
  ombros, braços, cotovelos, punhos e pernas, alvo do tornozelo nos chutes, hitbox, efeito,
  som, reação, hitstop (3/4/5/7) e janela do próximo clique. A tabela está em
  [14-m1-fichas.md](14-m1-fichas.md).
- **Animação.** 32 tipos de movimento autorais (jab, cruzado, gancho, martelo, palma, palma potente,
  cotovelada, chute circular, chute frontal, rasteira, chute aéreo, garra, garra rasteira,
  mordida, salto com garras, corte espacial, passo com golpe, golpe reverso, palmas
  convergentes, golpe ascendente, escudo, soco no chão, atração, corte de asa, mergulho, giro,
  cauda, chifrada, investida de ombro, investida com soco, rugido, esmagamento) viram clipes
  do FRUTOMotion (`FRUTOMotion.define`), com o lado ativo espelhado. A pose de contato cai
  exatamente no quadro de impacto. Chutes guiam o tornozelo (`kick`) pela mesma IK das pernas.
- **Máquina do M1.** Um clique = um golpe; com golpe em curso, só os cliques dos últimos 8
  quadros contam (um só fica guardado, 0,35 s); golpes não se sobrepõem; 0,65 s de janela depois
  da recuperação; M1-4 volta ao M1-1; troca de fruta, transformação, atordoamento e desmaio
  zeram a sequência. Vale também para estilos de luta e espada (com 3 golpes).
- **Impacto.** O golpe só procura alvos no quadro de impacto e solta o evento `impact` uma vez:
  dele saem o efeito da fruta (`LabFx.m1`, contato do laboratório + detalhe do golpe: onda
  cinética, chama, gelo, raio, garras, sombra, água, prisma, anéis sonoros, penas, areia,
  linhas magnéticas, poeira, fogo azul, nuvens, rachaduras), o som e a trepidação. Gancho,
  chifrada e golpes ascendentes levantam um pouco o alvo; a Atração Forçada puxa.
- **Formas.** Lobo, Falcão, Besta, Fênix e os Dragões têm a variante híbrida `_h` (base mais
  baixa, garras abertas, mesmo tempo de impacto); a cauda chicoteia da base para a ponta e as
  asas varrem à frente nos golpes de cauda e de asa. Formas completas ainda não existem no jogo.
- **Interface.** Indicador discreto 1/4 a 4/4 ao lado do personagem, na cor da fruta. Sem botão
  novo: toque rápido na tela (Android) ou clique esquerdo / J (PC).

Testes de aceitação em `tests/m1.test.js` (testes 1 a 5 e 7 da seção 18).
