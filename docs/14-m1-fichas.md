# 14 — Fichas dos 64 golpes M1

Gerado de `src/combat/m1Catalog.js` (atualização 20; Prompt Mestre, seções 2 a 5). Quadros a 60 por segundo.
Cada ficha no código guarda, para cada quadro-chave (guarda, preparo, contato, seguimento, recuperação, guarda), os
ângulos de quadril, tronco, cabeça, ombros, braços (elevação, abertura, rotação), cotovelos e punhos, a base e o avanço
das pernas e, nos chutes, o alvo do tornozelo da perna que chuta. `sheet(id)` devolve a ficha completa.

Regras: um golpe por clique; próximo clique aceito só nos últimos 8 quadros do golpe e guardado por 0.35 s;
janela de continuação de 0.65 s depois da recuperação; depois do M1-4 volta ao M1-1; troca de fruta, transformação,
atordoamento e desmaio zeram a sequência. Efeito e som saem do evento de impacto da animação, uma vez por golpe.

Legenda: Q = quadros totais; I = quadro de impacto; A = quadros ativos (colisão); H = hitstop em quadros; D = fator de dano.

## Impacto — Punho Cinético

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `impacto_m1_1` | Jab de Pressão | jab | E | 19 | 7 | 3 | 3 | 0.85 | 0–3 · 4–6 · 7–9 · 10–14 · 15–19 | 1,5 m | onda | leve | humana | Implementado |
| `impacto_m1_2` | Cruzado Cinético | cross | D | 21 | 9 | 3 | 4 | 0.95 | 0–4 · 5–8 · 9–11 · 12–16 · 17–21 | 1,5 m | pulso | leve | humana | Implementado |
| `impacto_m1_3` | Gancho Ascendente | uppercut | E | 25 | 13 | 3 | 5 | 1.05 | 0–6 · 7–12 · 13–15 · 16–20 · 21–25 | 1,5 m | choque | media + levanta | humana | Implementado |
| `impacto_m1_4` | Martelo Cinético | hammer | D | 32 | 17 | 3 | 7 | 1.25 | 0–8 · 9–16 · 17–19 · 20–25 · 26–32 | 1,5 m, solo | anel | pesada | humana | Implementado |

## Brasa — Chama Marcial

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `brasa_m1_1` | Punho de Ignição | jab | E | 19 | 7 | 3 | 3 | 0.85 | 0–3 · 4–6 · 7–9 · 10–14 · 15–19 | 1,5 m | chama | leve | humana | Implementado |
| `brasa_m1_2` | Cotovelada Flamejante | elbow | D | 21 | 9 | 3 | 4 | 0.95 | 0–4 · 5–8 · 9–11 · 12–16 · 17–21 | 1,25 m | explosao | leve | humana | Implementado |
| `brasa_m1_3` | Chute Solar | roundKick (perna D) | D | 25 | 13 | 3 | 5 | 1.05 | 0–6 · 7–12 · 13–15 · 16–20 · 21–25 | 1,75 m | arco_fogo | media | humana | Implementado |
| `brasa_m1_4` | Explosão de Brasa | thrust | E | 32 | 17 | 3 | 7 | 1.25 | 0–8 · 9–16 · 17–19 · 20–25 · 26–32 | 1,6 m | clarao | pesada | humana | Implementado |

## Geada — Punho do Inverno

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `geada_m1_1` | Palma Congelante | palm | E | 19 | 7 | 3 | 3 | 0.85 | 0–3 · 4–6 · 7–9 · 10–14 · 15–19 | 1,5 m | cristais | leve | humana | Implementado |
| `geada_m1_2` | Cotovelo de Gelo | elbow | D | 21 | 9 | 3 | 4 | 0.95 | 0–4 · 5–8 · 9–11 · 12–16 · 17–21 | 1,25 m | gelo | leve | humana | Implementado |
| `geada_m1_3` | Varredura Glacial | sweep (perna E) | E | 25 | 13 | 3 | 5 | 1.05 | 0–6 · 7–12 · 13–15 · 16–20 · 21–25 | 1,7 m, baixo | geada | media | humana | Implementado |
| `geada_m1_4` | Martelo Glacial | hammer | D | 32 | 17 | 3 | 7 | 1.25 | 0–8 · 9–16 · 17–19 · 20–25 · 26–32 | 1,5 m, solo | estilhacos | pesada | humana | Implementado |

## Tormenta — Passo do Relâmpago

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `tormenta_m1_1` | Estalo Elétrico | jab | E | 17 | 7 | 3 | 3 | 0.85 | 0–3 · 4–6 · 7–9 · 10–13 · 14–17 | 1,5 m | faiscas | leve | humana | Implementado |
| `tormenta_m1_2` | Passo Relâmpago | step | D | 19 | 9 | 3 | 4 | 0.95 | 0–4 · 5–8 · 9–11 · 12–15 · 16–19 | 1,7 m | rastro | leve | humana | Implementado |
| `tormenta_m1_3` | Chute de Descarga | roundKick (perna E) | E | 23 | 11 | 3 | 5 | 1.05 | 0–5 · 6–10 · 11–13 · 14–18 · 19–23 | 1,75 m | descarga | media | humana | Implementado |
| `tormenta_m1_4` | Investida Fulminante | rush | D | 29 | 15 | 3 | 7 | 1.25 | 0–7 · 8–14 · 15–17 · 18–23 · 24–29 | 1,8 m | arco | pesada | humana | Implementado |

## Lobo — Predador Lunar

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `lobo_m1_1` | Garra Rasteira | lowClaw | E | 19 | 7 | 3 | 3 | 0.85 | 0–3 · 4–6 · 7–9 · 10–14 · 15–19 | 1,5 m, baixo | garras | leve | humana, hibrida (garras) | Implementado |
| `lobo_m1_2` | Garra Cruzada | claw | D | 21 | 9 | 3 | 4 | 0.95 | 0–4 · 5–8 · 9–11 · 12–16 · 17–21 | 1,5 m | garras | leve | humana, hibrida (garras) | Implementado |
| `lobo_m1_3` | Mordida Predatória | bite | E | 25 | 13 | 3 | 5 | 1.05 | 0–6 · 7–12 · 13–15 · 16–20 · 21–25 | 1,35 m | mordida | media | humana, hibrida (mandibula) | Implementado |
| `lobo_m1_4` | Salto do Caçador | leap | E | 32 | 17 | 3 | 7 | 1.25 | 0–8 · 9–16 · 17–19 · 20–25 · 26–32 | 1,5 m | garras_duplas | pesada | humana, hibrida | Implementado |

## Eclipse — Dança do Vazio

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `eclipse_m1_1` | Corte Espacial | slashSmall | E | 18 | 7 | 3 | 3 | 0.85 | 0–3 · 4–6 · 7–9 · 10–14 · 15–18 | 1,5 m | distorcao | leve | humana | Implementado |
| `eclipse_m1_2` | Passo Dimensional | step | D | 20 | 9 | 3 | 4 | 0.95 | 0–4 · 5–8 · 9–11 · 12–16 · 17–20 | 1,7 m | sombra | leve | humana | Implementado |
| `eclipse_m1_3` | Golpe Reverso | reverse | E | 24 | 12 | 3 | 5 | 1.05 | 0–5 · 6–11 · 12–14 · 15–19 · 20–24 | 1,5 m | sombra | media | humana | Implementado |
| `eclipse_m1_4` | Ruptura do Eclipse | converge | E | 30 | 16 | 3 | 7 | 1.25 | 0–7 · 8–15 · 16–18 · 19–24 · 25–30 | 1,6 m | ruptura | pesada | humana | Implementado |

## Maré — Fluxo Oceânico

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `mare_m1_1` | Palma da Corrente | palm | E | 19 | 7 | 3 | 3 | 0.85 | 0–3 · 4–6 · 7–9 · 10–14 · 15–19 | 1,5 m | fita | leve | humana | Implementado |
| `mare_m1_2` | Cotovelo da Onda | elbow | D | 21 | 9 | 3 | 4 | 0.95 | 0–4 · 5–8 · 9–11 · 12–16 · 17–21 | 1,25 m | crista | leve | humana | Implementado |
| `mare_m1_3` | Varredura Aquática | sweep (perna D) | D | 25 | 13 | 3 | 5 | 1.05 | 0–6 · 7–12 · 13–15 · 16–20 · 21–25 | 1,7 m, baixo | agua | media | humana | Implementado |
| `mare_m1_4` | Maré Ascendente | rising | E | 32 | 17 | 3 | 7 | 1.25 | 0–8 · 9–16 · 17–19 · 20–25 · 26–32 | 1,5 m | onda_mare | pesada + levanta | humana | Implementado |

## Cristal — Guardião Prismático

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `cristal_m1_1` | Punho Prismático | jab | E | 21 | 8 | 3 | 3 | 0.85 | 0–4 · 5–7 · 8–10 · 11–16 · 17–21 | 1,5 m | prisma | leve | humana | Implementado |
| `cristal_m1_2` | Cotovelo Cristalino | elbow | D | 23 | 10 | 3 | 5 | 0.95 | 0–5 · 6–9 · 10–12 · 13–18 · 19–23 | 1,25 m | cristais_rosa | leve | humana | Implementado |
| `cristal_m1_3` | Escudo de Impacto | shield | E | 28 | 14 | 3 | 6 | 1.05 | 0–6 · 7–13 · 14–16 · 17–22 · 23–28 | 1,5 m | escudo | media | humana | Implementado |
| `cristal_m1_4` | Coluna Cristalina | ground | D | 35 | 18 | 3 | 8 | 1.25 | 0–8 · 9–17 · 18–20 · 21–27 · 28–35 | 1,5 m, solo | coluna | pesada | humana | Implementado |

## Eco — Ritmo Ressonante

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `eco_m1_1` | Palma Sonora | palm | E | 17 | 7 | 3 | 3 | 0.85 | 0–3 · 4–6 · 7–9 · 10–13 · 14–17 | 1,5 m | som | leve | humana | Implementado |
| `eco_m1_2` | Cotovelo Rítmico | elbow | D | 19 | 9 | 3 | 4 | 0.95 | 0–4 · 5–8 · 9–11 · 12–15 · 16–19 | 1,25 m | som | leve | humana | Implementado |
| `eco_m1_3` | Chute de Frequência | roundKick (perna D) | D | 23 | 11 | 3 | 5 | 1.05 | 0–5 · 6–10 · 11–13 · 14–18 · 19–23 | 1,75 m | vibracao | media | humana | Implementado |
| `eco_m1_4` | Pulso Harmônico | thrust | E | 29 | 15 | 3 | 7 | 1.25 | 0–7 · 8–14 · 15–17 · 18–23 · 24–29 | 1,6 m | aneis | pesada | humana | Implementado |

## Falcão — Garras do Céu

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `falcao_m1_1` | Garra Descendente | claw | E | 18 | 7 | 3 | 3 | 0.85 | 0–3 · 4–6 · 7–9 · 10–14 · 15–18 | 1,5 m | vento | leve | humana, hibrida (garras) | Implementado |
| `falcao_m1_2` | Corte de Asa | wing | D | 20 | 9 | 3 | 4 | 0.95 | 0–4 · 5–8 · 9–11 · 12–16 · 17–20 | 1,5 m | vento | leve | humana, hibrida (asas) | Implementado |
| `falcao_m1_3` | Chute Aéreo | airKick (perna E) | E | 24 | 12 | 3 | 5 | 1.05 | 0–5 · 6–11 · 12–14 · 15–19 · 20–24 | 1,75 m | vento | media | humana, hibrida | Implementado |
| `falcao_m1_4` | Mergulho Predatório | dive | E | 30 | 16 | 3 | 7 | 1.25 | 0–7 · 8–15 · 16–18 · 19–24 · 25–30 | 1,5 m | garras_ar | pesada | humana, hibrida (asas) | Implementado |

## Duna — Dança das Areias

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `duna_m1_1` | Palma Arenosa | palm | E | 19 | 7 | 3 | 3 | 0.85 | 0–3 · 4–6 · 7–9 · 10–14 · 15–19 | 1,5 m | areia | leve | humana | Implementado |
| `duna_m1_2` | Varredura de Duna | sweep (perna D) | D | 21 | 9 | 3 | 4 | 0.95 | 0–4 · 5–8 · 9–11 · 12–16 · 17–21 | 1,7 m, baixo | faixa_areia | leve | humana | Implementado |
| `duna_m1_3` | Passo Subterrâneo | step | E | 25 | 13 | 3 | 5 | 1.05 | 0–6 · 7–12 · 13–15 · 16–20 · 21–25 | 1,7 m | areia | media | humana | Implementado |
| `duna_m1_4` | Redemoinho Cortante | spin | E | 32 | 17 | 3 | 7 | 1.25 | 0–8 · 9–16 · 17–19 · 20–25 · 26–32 | 1,6 m, 360° | anel_areia | pesada | humana | Implementado |

## Ímã — Polaridade Marcial

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ima_m1_1` | Repulsão Magnética | palm | E | 19 | 7 | 3 | 3 | 0.85 | 0–3 · 4–6 · 7–9 · 10–14 · 15–19 | 1,5 m | repulsao | leve | humana | Implementado |
| `ima_m1_2` | Atração Forçada | pull | E | 21 | 9 | 3 | 4 | 0.95 | 0–4 · 5–8 · 9–11 · 12–16 · 17–21 | 1,5 m | atracao | leve + puxa | humana | Implementado |
| `ima_m1_3` | Cotovelo Metálico | elbow | E | 25 | 13 | 3 | 5 | 1.05 | 0–6 · 7–12 · 13–15 · 16–20 · 21–25 | 1,25 m | placas | media | humana | Implementado |
| `ima_m1_4` | Martelo de Sucata | hammer | D | 32 | 17 | 3 | 7 | 1.25 | 0–8 · 9–16 · 17–19 · 20–25 · 26–32 | 1,5 m, solo | sucata | pesada | humana | Implementado |

## Besta — Fúria Primordial

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `besta_m1_1` | Garra Brutal | claw | D | 22 | 8 | 4 | 3 | 0.85 | 0–4 · 5–7 · 8–11 · 12–17 · 18–22 | 1,5 m | poeira | leve | humana, hibrida (garras) | Implementado |
| `besta_m1_2` | Golpe de Cauda | tail | E | 24 | 11 | 4 | 5 | 0.95 | 0–5 · 6–10 · 11–14 · 15–19 · 20–24 | 1,7 m | cauda | leve | humana, hibrida (cauda) | Implementado |
| `besta_m1_3` | Chifrada Ascendente | horn | E | 29 | 14 | 4 | 6 | 1.05 | 0–6 · 7–13 · 14–17 · 18–23 · 24–29 | 1,5 m | chifres | media + levanta | humana, hibrida (chifres) | Implementado |
| `besta_m1_4` | Investida da Besta | charge | D | 36 | 19 | 4 | 8 | 1.25 | 0–9 · 10–18 · 19–22 · 23–29 · 30–36 | 1,7 m | massa | pesada | humana, hibrida | Implementado |

## Fênix — Dança do Renascimento

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `fenix_m1_1` | Corte de Asa | wing | E | 19 | 7 | 3 | 3 | 0.85 | 0–3 · 4–6 · 7–9 · 10–14 · 15–19 | 1,5 m | penas | leve | humana, hibrida (asas) | Implementado |
| `fenix_m1_2` | Chute Flamejante | frontKick (perna D) | D | 21 | 9 | 3 | 4 | 0.95 | 0–4 · 5–8 · 9–11 · 12–16 · 17–21 | 1,8 m | fogo_azul | leve | humana, hibrida | Implementado |
| `fenix_m1_3` | Giro de Penas | spin | E | 25 | 13 | 3 | 5 | 1.05 | 0–6 · 7–12 · 13–15 · 16–20 · 21–25 | 1,6 m, 360° | penas_giro | media | humana, hibrida (asas) | Implementado |
| `fenix_m1_4` | Ascensão Flamejante | rising | E | 32 | 17 | 3 | 7 | 1.25 | 0–8 · 9–16 · 17–19 · 20–25 · 26–32 | 1,5 m | explosao_azul | pesada + levanta | humana, hibrida | Implementado |

## Dragão Oriental — Serpente Celestial

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `oriental_m1_1` | Garra Celestial | claw | E | 20 | 8 | 3 | 3 | 0.85 | 0–4 · 5–7 · 8–10 · 11–15 · 16–20 | 1,5 m | nuvem | leve | humana, hibrida (garras) | Implementado |
| `oriental_m1_2` | Chicote de Cauda | tail | D | 22 | 10 | 3 | 4 | 0.95 | 0–5 · 6–9 · 10–12 · 13–17 · 18–22 | 1,7 m | cauda_raio | leve | humana, hibrida (cauda) | Implementado |
| `oriental_m1_3` | Investida das Nuvens | rush | E | 26 | 13 | 3 | 5 | 1.05 | 0–6 · 7–12 · 13–15 · 16–21 · 22–26 | 1,8 m | nuvem | media | humana, hibrida | Implementado |
| `oriental_m1_4` | Rugido da Tempestade | roar | E | 33 | 18 | 3 | 7 | 1.25 | 0–8 · 9–17 · 18–20 · 21–26 · 27–33 | 1,65 m | rugido | pesada | humana, hibrida | Implementado |

## Dragão Ocidental — Colosso Dracônico

| ID | Golpe | Tipo | Lado | Q | I | A | H | D | Fases (prep · acel · colisão · seguim. · recup.) | Hitbox | Efeito | Reação | Formas | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `ocidental_m1_1` | Garra do Colosso | claw | D | 23 | 9 | 4 | 3 | 0.85 | 0–4 · 5–8 · 9–12 · 13–18 · 19–23 | 1,5 m | poeira | leve | humana, hibrida (garras) | Implementado |
| `ocidental_m1_2` | Mordida Dracônica | bite | E | 25 | 11 | 4 | 5 | 0.95 | 0–5 · 6–10 · 11–14 · 15–20 · 21–25 | 1,35 m | mordida_fogo | leve | humana, hibrida (mandibula) | Implementado |
| `ocidental_m1_3` | Chicote de Cauda | tail | E | 30 | 15 | 4 | 6 | 1.05 | 0–7 · 8–14 · 15–18 · 19–24 · 25–30 | 1,7 m | cauda | media | humana, hibrida (cauda) | Implementado |
| `ocidental_m1_4` | Esmagamento Dracônico | slam | E | 38 | 20 | 4 | 8 | 1.25 | 0–9 · 10–19 · 20–23 · 24–30 · 31–38 | 1,5 m, solo | esmagamento | pesada | humana, hibrida | Implementado |

Formas completas (quadrúpedes, aves e dragões inteiros) ainda não existem no jogo; as variantes delas ficam pendentes.
