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
