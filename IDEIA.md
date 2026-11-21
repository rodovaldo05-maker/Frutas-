# Frutas — ideia do jogo

> Apenas a ideia. Nada foi implementado ainda.
>
> O design detalhado de todos os sistemas e interfaces do **FRUTO LEGACY AAA** está em
> [`docs/`](docs/00-visao-geral.md), começando pela visão geral.

## Conceito

RPG de ação em 3D, terceira pessoa, com visual voxel (blocos), para celular Android (APK),
no estilo de jogos de aventura pirata com frutas de poder. O jogador explora ilhas, derrota
inimigos, sobe de nível, consegue frutas que dão poderes e enfrenta chefes.

Os modelos 3D, animações e efeitos das habilidades viriam do pacote **FRUTO**
(Laboratório Voxel: corpo base animado, 12 frutas e formas de Lobo e Falcão).

## Mundo

- Ilhas de blocos ligadas por pontes, cercadas de mar.
- Ilha Inicial como zona segura, com NPCs: Mestre de Missões, Mercador (roleta de frutas),
  Estilista (provador) e Trocador de Fragmentos.
- Outras ilhas com inimigos de níveis crescentes e um chefe.

## Personagem e progressão

- Níveis com experiência e moedas; pontos de status (Força, Defesa, Fruta).
- Vida e energia; a energia é gasta pelos poderes.
- Rosto com olhos, sobrancelhas e boca, que pisca e muda de expressão.
- Provador para mudar cabelos, blusas, camisas, jaquetas, calças, shorts, sapatos,
  chinelos, enfeites, cor da pele, cor dos olhos e cor de cada peça.

## Frutas

- 12 frutas (Impacto, Brasa, Geada, Duna, Tormenta, Maré, Cristal, Eco, Ímã, Eclipse,
  Lobo, Falcão), cada uma com combo de 3 golpes, esquiva própria e 5 poderes.
- Lobo e Falcão com formas híbrida e completa; o Falcão pode voar (opcional: Pular duas vezes).
- Efeitos das habilidades usando os do pacote FRUTO, com tamanho e alcance ajustados ao jogo.

## Roleta, mochila e fragmentos

- A loja não vende frutas: uma roleta (200 moedas) sorteia uma fruta com nível
  **Comum**, **Épico** ou **Lendário**; níveis maiores dão mais dano e menos recarga.
- Opção de girar 10 frutas de uma vez.
- Cada fruta sorteada vai para a mochila; ao selecionar, ela fica na mão do personagem,
  se mexendo e piscando, e pode ser comida (ganha os poderes) ou guardada.
- Trocador de Fragmentos: Comum = 1, Épico = 3, Lendário = 5 fragmentos;
  10 fragmentos viram uma chave, que paga um giro da roleta.

## Movimento e água

- Andar e correr (botão para correr), pular e esquivar.
- Dá para nadar no mar; usuários de fruta perdem vida na água.
- Imunes: Maré (anda sobre a água em uma onda) e Geada (congela a superfície).

## Plataforma

- Jogo para celular em modo paisagem, controles de toque (joystick e botões),
  empacotado como APK Android.
