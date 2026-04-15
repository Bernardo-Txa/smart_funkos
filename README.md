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
├── public/
│   ├── CNAME
│   └── produtos.json
├── scripts/
│   └── gerar_produtos_json.py
├── src/
│   ├── data/
│   ├── scripts/
│   └── styles/
├── .github/
│   └── workflows/
│       ├── atualizar-produtos.yml
│       └── deploy-pages.yml
├── index.html
├── package.json
├── produtos.json
├── script.js
├── style.css
├── vite.config.js
└── README.md
```

## Como Rodar

Instale as dependencias e rode o servidor Vite:

```bash
npm install
npm run dev
```

Para gerar a versao estatica de producao:

```bash
npm run build
```

O build final fica na pasta `dist/`.

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
public/produtos.json
```

O site consome `produtos.json` como JSON estatico, evitando processar CSV grande no navegador.

## Atualizacao Automatica

O workflow `.github/workflows/atualizar-produtos.yml` permite atualizar o `produtos.json` pelo GitHub Actions.

Ele pode ser executado:

- Manualmente em `Actions > Atualizar produtos > Run workflow`.
- Automaticamente uma vez por dia pelo agendamento configurado.

## Tecnologias

- HTML
- CSS modular
- JavaScript modular
- Vite
- Google Sheets publicado como CSV
- JSON pre-processado
- GitHub Actions
- GitHub Pages
- WhatsApp checkout

## Publicacao

Este projeto pode ser publicado no GitHub Pages por ser um site estatico.

O workflow `.github/workflows/deploy-pages.yml` gera o build com Vite e publica a pasta `dist/`.
