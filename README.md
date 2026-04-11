# Smart Funkos

Website simples para vitrine e venda de Funko Pops, com catalogo carregado a partir de uma planilha publicada em CSV e finalizacao de pedido pelo WhatsApp.

## Funcionalidades

- Catalogo de produtos carregado via CSV do Google Sheets.
- Filtro por categoria.
- Busca por nome do produto.
- Ordenacao por relevancia, menor preco, maior preco e nome A-Z.
- Produtos indisponiveis aparecem no final da lista, com botao desativado.
- Carrinho lateral com quantidade, subtotal e total.
- Persistencia do carrinho no `localStorage`.
- Checkout por WhatsApp com resumo do pedido.
- Modal de finalizacao com nome do cliente.
- Toast de feedback ao adicionar produtos.
- Favicon e logo personalizados da Smart Funkos.

## Estrutura

```txt
.
├── images/
│   ├── SmartFunko.png
│   └── SmartFunkoIcone.png
├── index.html
├── script.js
├── style.css
└── README.md
```

## Como Rodar

Abra o arquivo `index.html` no navegador.

Se preferir rodar com um servidor local, use uma extensao como Live Server no VS Code ou qualquer servidor estatico simples.

## CSV de Produtos

O catalogo espera os dados nesta ordem:

```csv
nome,preco,imagem,status,categoria,special
```

Exemplo:

```csv
Pop! Spider-Man,129.90,https://exemplo.com/spiderman.png,disponivel,Marvel,Pop! Plus
Pop! Batman,99.90,https://exemplo.com/batman.png,indisponivel,DC Comics,
```

Campos:

- `nome`: nome do produto.
- `preco`: preco do produto.
- `imagem`: URL da imagem do produto.
- `status`: use `indisponivel` para bloquear compra do item.
- `categoria`: categoria exibida no card e usada nos filtros.
- `special`: texto opcional para linhas como `Pop! Plus` ou `Glows In The Dark`.

## Tecnologias

- HTML
- CSS
- JavaScript puro
- Google Sheets publicado como CSV
- WhatsApp checkout

## Publicacao

Este projeto pode ser publicado no GitHub Pages por ser um site estatico.
