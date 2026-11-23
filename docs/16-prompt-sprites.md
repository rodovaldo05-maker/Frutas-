# 16 — Prompts de sprites para gerar no ChatGPT

O jogo é 3D em voxel: personagens, frutas, ilhas, navios e efeitos são montados em código e
**não precisam de sprites**. Faltam imagens só onde hoje há **emojis** ou **quadrados de cor**:

- **Materiais (17):** hoje são emojis, que mudam de desenho em cada celular Android (e alguns
  aparecem como quadradinho).
- **Equipamentos (14):** hoje são só um quadrado na cor do item.
- **Ícone do app:** hoje é o padrão.

Mande um lote por vez para o ChatGPT. Cada prompt já tem o estilo completo. Depois me envie as
imagens geradas: eu recorto a grade, otimizo e coloco no jogo.

---

## Lote 1 — Materiais (17 ícones)

```
Crie UMA folha de sprites (sprite sheet) PNG com FUNDO TRANSPARENTE, para um jogo mobile de RPG
pirata 3D em estilo voxel (blocos, parecido com cubos). Grade de 4 colunas × 5 linhas, cada
célula quadrada de 256×256 px (imagem final 1024×1280 px), um ícone centralizado por célula,
ocupando cerca de 80% da célula, com margem igual em volta. Sem texto, sem números, sem
moldura, sem sombra no chão, sem fundo colorido nas células.

Estilo de TODOS os ícones (igual para todos): objetos em voxel/low-poly com cantos de blocos
visíveis, contorno escuro de 3 px (#1a1222), luz vinda de cima à esquerda, cores saturadas e
limpas, sombreado simples em 3 tons por face (como um modelo voxel renderizado), vista em 3/4
de cima. Todos na mesma escala visual e com o mesmo peso de contorno.

Ordem (da esquerda para a direita, de cima para baixo):
1. Pedra — pedaço de rocha cinza (#8d9088) com arestas de blocos.
2. Minério de Cobre — pedra cinza com veios e pepitas laranja-cobre (#c87a3a).
3. Minério de Ferro — pedra escura com veios prateados metálicos (#9aa4b0).
4. Cristal Marinho — aglomerado de cristais facetados azul-piscina brilhantes (#4fd2e0) com reflexo branco.
5. Sardinha — peixe pequeno e fino prateado-azulado.
6. Robalo — peixe médio verde-acinzentado com listra lateral escura.
7. Atum — peixe grande e robusto azul-marinho com barriga prateada.
8. Peixe-Dourado — peixe raro dourado brilhante (#ffd040) com nadadeiras alaranjadas e brilhos.
9. Concha — concha em leque bege-rosada (#f2e6c8) com sulcos.
10. Pérola — pérola branca perolada com reflexo rosado, dentro de meia concha aberta.
11. Retalho de Tecido — pedaço de pano dobrado vermelho-escuro com costura aparente.
12. Núcleo de Brasa — esfera de cristal laranja com fogo dentro (#ff6a1a), pequenas chamas em volta.
13. Núcleo de Geada — esfera de cristal azul-gelo (#9fe0ff) com flocos de neve dentro e geada nas bordas.
14. Núcleo de Tormenta — esfera de cristal amarela (#ffe45a) com um raio dentro e faíscas.
15. Tábua de Navio — duas tábuas de madeira marrom (#8f5f37) presas com pregos.
16. Pólvora — barrilzinho de madeira com faixas de ferro, pó preto saindo da tampa.
17. Escama Abissal — escama grande em forma de gota, verde-azulada escura iridescente (#2f9c96) com brilho roxo.

As 3 células que sobram (linha 5, colunas 2 a 4) ficam vazias e transparentes.
```

---

## Lote 2 — Equipamentos (14 ícones)

```
Crie UMA folha de sprites PNG com FUNDO TRANSPARENTE, para um jogo mobile de RPG pirata 3D em
estilo voxel. Grade de 4 colunas × 4 linhas, células quadradas de 256×256 px (imagem final
1024×1024 px), um item centralizado por célula ocupando cerca de 80% dela, margem igual. Sem
texto, sem números, sem moldura, sem sombra no chão, sem fundo nas células.

Estilo de TODOS (igual para todos): equipamentos em voxel/low-poly com cantos de blocos
visíveis, contorno escuro de 3 px (#1a1222), luz de cima à esquerda, cores saturadas, sombreado
simples em 3 tons por face, vista em 3/4. Mesma escala e mesmo peso de contorno em todos. Itens
Épicos têm um leve brilho na cor do item; os Comuns não brilham.

Ordem (da esquerda para a direita, de cima para baixo):
1. Bandana de Treino — bandana de pano vermelha (#c0392b) amarrada, pontas soltas. (Comum)
2. Gibão de Couro — colete de couro marrom (#8a5a32) com costuras e fivelas. (Comum)
3. Calças Reforçadas — calça marrom-escura (#5a4a3a) com joelheiras de couro. (Comum)
4. Botas Leves — botas baixas de couro claro (#d8c49a) com amarração. (Incomum)
5. Elmo de Ferro — capacete de ferro cinza-azulado (#9aa4b0) com rebites e protetor de nariz. (Raro)
6. Couraça de Escamas — peitoral feito de escamas verde-azuladas (#2f9c96) sobrepostas. (Raro)
7. Grevas de Aço — par de caneleiras de aço (#7a8494) com placas articuladas. (Raro)
8. Botas do Vento — botas azul-claras (#bfe6ff) com pequenas asas brancas nos tornozelos e rastro de vento. (Épico, brilho azul-claro)
9. Manto de Brasa — manto vermelho-fogo (#c8401c) com barra em chamas e brasas. (Épico, brilho laranja)
10. Anel de Cobre — anel simples de cobre (#c87a3a). (Comum)
11. Colar de Conchas — colar de cordão com conchas bege (#f2e6c8). (Incomum)
12. Foco Arcano — pingente de cristal roxo (#b46bff) num cordão dourado. (Raro)
13. Bracelete Técnico — bracelete dourado (#e8c070) com engrenagens e placas. (Raro)
14. Amuleto da Maré — amuleto com uma gota de água azul-piscina (#4fd2e0) presa em prata, com ondinhas. (Épico, brilho azul)

As 2 células que sobram (linha 4, colunas 3 e 4) ficam vazias e transparentes.
```

---

## Lote 3 — Ícone do app (1 imagem)

```
Crie o ícone de um aplicativo de jogo mobile chamado FRUTO LEGACY (RPG pirata 3D em voxel com
frutas de poder elemental). Imagem quadrada 1024×1024 px. Centro: uma fruta mágica em voxel
(arredondada, feita de cubos, com folhas no topo) metade em chamas laranja e metade em gelo
azul, soltando um brilho dourado; atrás dela, uma vela de navio pirata em voxel e uma onda
estilizada. Fundo em degradê roxo-escuro (#1a1222) para azul-marinho, com leve vinheta. Contorno
escuro de 3 px nos objetos, luz de cima à esquerda, cores saturadas, estilo cartoon voxel.
Todo o conteúdo importante dentro do círculo central de 66% da imagem (o Android corta as
bordas). SEM texto, SEM letras, SEM logotipos de marcas.
```

E, para a camada separada que o Android usa (ícone adaptável):

```
Mesma arte do ícone anterior, mas SÓ a fruta, a vela e a onda, com FUNDO TRANSPARENTE,
1024×1024 px, tudo dentro do círculo central de 66%. Sem texto.
```

---

## Dicas para o ChatGPT acertar

- Se ele devolver com fundo xadrez desenhado (falso transparente) ou fundo branco, peça:
  *"refaça com fundo realmente transparente (canal alfa), sem desenhar o xadrez"*.
- Se a grade vier torta ou com ícones de tamanhos diferentes, peça: *"mantenha a grade exata
  de 4 colunas, cada ícone centralizado na sua célula de 256 px, todos do mesmo tamanho"*.
- Se um ícone sair errado, peça só ele de novo: *"refaça apenas o ícone nº 8 no mesmo estilo,
  256×256, fundo transparente"* — eu encaixo na folha.
- Não precisa gerar fundos de tela, personagens, frutas ou efeitos: tudo isso é 3D no jogo.
