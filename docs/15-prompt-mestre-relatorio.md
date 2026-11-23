# 15 — Relatório do Prompt Mestre (fases A a H)

Situação dos 17 testes de aceitação da seção 18, com a evidência de cada um. "Feito" = há
código no jogo e teste automático ou verificação no navegador; "parcial" = feito em parte, com o
que falta descrito.

| # | Teste | Situação | Evidência |
|---|---|---|---|
| 1 | Exatamente 16 frutas | Feito | `tests/m1.test.js` (teste 1) |
| 2 | 4 M1 por fruta, 64 IDs únicos | Feito | `tests/m1.test.js` (teste 2); fichas em `docs/14-m1-fichas.md` |
| 3 | Um golpe por clique, buffer sem duplicar, reset | Feito | `tests/m1.test.js` (teste 3); regressão em tempo real das 16 frutas |
| 4 | Cancelamentos, atordoamento, morte, troca de fruta | Feito | `tests/m1.test.js` (teste 4) |
| 5 | Impacto sincronizado a 30/60 FPS | Feito | `tests/m1.test.js` (teste 5) |
| 6 | Animações distintas humano/híbrido/completo, sem membros fantasma | Feito | `tests/awakening.test.js` (golpe `_h` e `_c`; 12 corpos animam sem valores inválidos); golpes da forma completa só com o corpo do animal (`src/transformations/formM1.js`); regressão das 12 formas no navegador |
| 7 | Habilidades especiais e controles preservados | Feito | `tests/m1.test.js` (teste 7) |
| 8 | Pesos 3D, 10 repetições por série, descanso | Feito | `tests/workout.test.js` (teste 8); sessão real no navegador (pesos visíveis, contador 3/10) |
| 9 | XP só por ação válida (sem AFK, paredes, dano próprio) | Feito | `tests/workout.test.js` (teste 9), antifarm do treino (`AntiFarm`), meditação anti-AFK (`tests/haki.test.js`) |
| 10 | Evolução independente: fruta, atributos, Observação, Armamento, Rei | Feito | `tests/mastery.test.js` e `tests/haki.test.js` (teste 10) |
| 11 | Multiplicadores de ambiente e teto de 4x | Feito | `tests/mastery.test.js` (teste 11) |
| 12 | Batismo do Trovão natural, um nível só | Feito | `tests/mastery.test.js` (teste 12) |
| 13 | Fraqueza à água e imunidades limitadas | Feito | `tests/mastery.test.js` (teste 13) |
| 14 | Salvar/carregar, migração, offline | Feito | `tests/persist.test.js`: ida e volta, salvo v5 → v6 com cópia intacta e restauração, salvo corrompido usa a cópia anterior; sem nenhuma dependência de rede |
| 15 | Interface Android, controles simultâneos, qualidade adaptativa | Feito (emulador) | Dois dedos ao mesmo tempo (joystick + toque de ataque + Pular) no navegador; botões sem sobreposição em 3 tamanhos de tela; qualidade Baixo/Médio/Alto/Automático e 30/60 qps; perda de contexto gráfico salva, pausa e restaura. Falta: teste num aparelho real (aquecimento e bateria) |
| 16 | Sem erros críticos no console, sem vazamento de partículas | Feito | Estresse de 2 rodadas (6 frutas, M1, habilidades, formas, pulso): 0 erros, efeitos ativos voltam a 0, objetos da cena estáveis (7424 → 7443), geometrias se estabilizam (cache) |
| 17 | Regressão de ilhas, NPCs, inimigos, missões, inventário, formas | Feito | Varredura das ilhas/vila/janelas/recarga sem valores inválidos; 141 chamadas de desenho no início (igual a antes); 329 testes automáticos |

## O que mudou na fase H (atualização 26)

- Salvo versão 6: migração própria do Prompt Mestre, cópia intacta antes de migrar
  (`slot1-backup-vN`, com `restoreBackup`), cópia da última carga boa (`slot1-anterior`) usada se
  o principal estiver corrompido. Corrigido: o Haki do Rei desperto não era salvo.
- Interface parcial: vida, fôlego, Vontade, relógio, estado e o botão do Rei só escrevem no HTML
  quando o valor muda (parado, o HTML quase não mexe).
- Toque rápido medido pelo horário real do toque (aparelho ocupado não perde ataques).
- Perda do contexto gráfico: salva, pausa e retoma.
- Qualidade com os nomes do Prompt Mestre: Baixo, Médio, Alto e Automático.
- Esferas do treino de Observação encerradas na hora (não ficam 99 s na lista de efeitos).
