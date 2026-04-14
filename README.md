# Smart Funkos

Website simples para vitrine e venda de Funko Pops, com catalogo gerado a partir de uma planilha publicada em CSV e finalizacao de pedido pelo WhatsApp.

## Funcionalidades

- Catalogo de produtos carregado via `produtos.json`.
- Geracao de `produtos.json` a partir do CSV publico do Google Sheets.
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
├── scripts/
│   └── gerar_produtos_json.py
├── .github/
│   └── workflows/
│       └── atualizar-produtos.yml
├── index.html
├── produtos.json
├── script.js
├── style.css
└── README.md
```

## Como Rodar

Use um servidor local para evitar bloqueios de `fetch` ao carregar `produtos.json`.

Opcoes simples:

```bash
python3 -m http.server 5500
```

Depois acesse:

```txt
http://localhost:5500
```

Tambem funciona usar uma extensao como Live Server no VS Code.

## Dados de Produtos

A planilha publicada em CSV e usada como fonte deve ter, no minimo, estas colunas:

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

## Gerar produtos.json

Para atualizar o catalogo localmente:

```bash
python3 scripts/gerar_produtos_json.py
```

O script baixa o CSV do Google Sheets, normaliza os campos principais e gera:

```txt
produtos.json
```

O site consome esse arquivo diretamente, evitando processar CSV grande no navegador.

## Atualizacao Automatica

O workflow `.github/workflows/atualizar-produtos.yml` permite atualizar o `produtos.json` pelo GitHub Actions.

Ele pode ser executado:

- Manualmente em `Actions > Atualizar produtos > Run workflow`.
- Automaticamente uma vez por dia pelo agendamento configurado.

## Tecnologias

- HTML
- CSS
- JavaScript puro
- Google Sheets publicado como CSV
- JSON pre-processado
- GitHub Actions
- WhatsApp checkout

## Publicacao

Este projeto pode ser publicado no GitHub Pages por ser um site estatico.
