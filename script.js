let produtosGlobal = [];
let carrinho = [];
let categoriaAtual = "todos";
let ordenacaoAtual = "relevancia";
let produtosFiltradosAtual = [];
let produtosRenderizados = 0;
let buscaTimeout;
const CHAVE_CARRINHO = "smart-funkos-carrinho";
const PRODUTOS_POR_LOTE = 48;
const CATEGORIAS_DESTAQUE = [
  "Marvel",
  "Disney",
  "Star Wars",
  "Harry Potter",
  "One Piece",
  "Pokémon",
  "Dragon Ball",
  "DC"
];
const IMAGEM_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="300" height="300" fill="#f3f4f6"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="20">Imagem indisponivel</text>
  </svg>
`)}`;
let toastTimeout;

mostrarSkeleton();
carregarCarrinho();
atualizarCarrinho();
configurarEventosIniciais();

fetch("produtos.json")
  .then(res => res.json())
  .then(produtos => {
    produtosGlobal = produtos.map(produto => ({
      ...produto,
      nome: produto.nome?.trim(),
      preco: normalizarPreco(produto.preco),
      imagem: produto.imagem?.trim() || IMAGEM_PLACEHOLDER,
      status: produto.status?.trim() || "disponivel",
      categoria: produto.categoria?.trim(),
      special: produto.special?.trim()
    })).filter(produto => produto.nome);

    criarCategorias(produtosGlobal);
    aplicarFiltros();
  })
  .catch(() => {
    atualizarResultadoInfo(0);
    renderizar([]);
  });

/* ================= SKELETON ================= */

function mostrarSkeleton() {
  const catalogo = document.getElementById("catalogo");
  catalogo.innerHTML = "";

  for (let i = 0; i < 8; i++) {
    const div = document.createElement("div");
    div.classList.add("skeleton");

    div.innerHTML = `
      <div class="skeleton-img"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-text short"></div>
    `;

    catalogo.appendChild(div);
  }
}

/* ================= CATEGORIAS ================= */

function criarCategorias(produtos) {
  const container = document.getElementById("categorias");
  const select = document.getElementById("categoriaSelect");

  container.innerHTML = "";

  if (select) {
    select.innerHTML = `<option value="todos">Mais categorias</option>`;
  }

  const categorias = [...new Set(produtos.map(p => p.categoria).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  const categoriasDestaque = CATEGORIAS_DESTAQUE
    .filter(cat => categorias.includes(cat));

  const btnTodos = document.createElement("button");
  btnTodos.innerText = "Todos";
  btnTodos.classList.add("ativo");

  btnTodos.onclick = () => {
    categoriaAtual = "todos";
    ativarBotao(btnTodos);
    sincronizarCategoriaSelect();
    aplicarFiltros();
  };

  container.appendChild(btnTodos);

  categoriasDestaque.forEach(cat => {
    const btn = document.createElement("button");
    btn.innerText = cat;

    btn.onclick = () => {
      categoriaAtual = cat;
      ativarBotao(btn);
      sincronizarCategoriaSelect(cat);
      aplicarFiltros();
    };

    container.appendChild(btn);
  });

  categorias
    .filter(cat => !categoriasDestaque.includes(cat))
    .forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.innerText = cat;
    select?.appendChild(option);
  });
}

function ativarBotao(botao) {
  document.querySelectorAll(".categorias button")
    .forEach(b => b.classList.remove("ativo"));

  botao?.classList.add("ativo");
}

function sincronizarCategoriaSelect(valor = "todos") {
  const select = document.getElementById("categoriaSelect");

  if (!select) return;

  select.value = valor;
}

/* ================= FILTROS ================= */

function produtoIndisponivel(produto) {
  return produto?.status?.trim().toLowerCase() === "indisponivel";
}

function normalizarPreco(preco) {
  const valor = String(preco || "")
    .trim()
    .replace(/[^\d,.]/g, "");

  if (!valor) return "";

  if (valor.includes(",")) {
    return valor.replace(/\./g, "").replace(",", ".");
  }

  return valor;
}

function converterPrecoNumero(preco) {
  return Number(normalizarPreco(String(preco))) || 0;
}

function formatarPreco(preco) {
  return converterPrecoNumero(preco).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function salvarCarrinho() {
  localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
}

function carregarCarrinho() {
  try {
    carrinho = JSON.parse(localStorage.getItem(CHAVE_CARRINHO)) || [];
  } catch {
    carrinho = [];
  }
}

function agruparCarrinho() {
  const itensAgrupados = new Map();

  carrinho.forEach(item => {
    const chave = `${item.nome}|||${item.preco}`;

    if (!itensAgrupados.has(chave)) {
      itensAgrupados.set(chave, {
        nome: item.nome,
        preco: item.preco,
        quantidade: 0
      });
    }

    itensAgrupados.get(chave).quantidade += 1;
  });

  return Array.from(itensAgrupados.values());
}

function atualizarStatusCheckout() {
  const botaoPedido = document.querySelector(".carrinho-footer button");

  if (!botaoPedido) return;

  botaoPedido.disabled = carrinho.length === 0;
}

function atualizarResultadoInfo(totalFiltrados) {
  const resultadoInfo = document.getElementById("resultadoInfo");

  if (!resultadoInfo) return;

  if (produtosGlobal.length === 0) {
    resultadoInfo.innerText = "Nenhum produto carregado";
    return;
  }

  const label = totalFiltrados === 1 ? "produto encontrado" : "produtos encontrados";
  resultadoInfo.innerText = `${totalFiltrados} ${label}`;
}

function ordenarProdutos(produtos) {
  const produtosOrdenados = [...produtos];

  produtosOrdenados.sort((a, b) => {
    const aIndisponivel = produtoIndisponivel(a);
    const bIndisponivel = produtoIndisponivel(b);

    if (aIndisponivel !== bIndisponivel) {
      return aIndisponivel ? 1 : -1;
    }

    switch (ordenacaoAtual) {
      case "preco-asc":
        return converterPrecoNumero(a.preco) - converterPrecoNumero(b.preco);
      case "preco-desc":
        return converterPrecoNumero(b.preco) - converterPrecoNumero(a.preco);
      case "nome-asc":
        return a.nome.localeCompare(b.nome, "pt-BR");
      default:
        return 0;
    }
  });

  return produtosOrdenados;
}

function aplicarFiltros() {
  const texto = document.getElementById("buscaInput").value.toLowerCase();

  let filtrados = produtosGlobal;

  if (categoriaAtual !== "todos") {
    filtrados = filtrados.filter(p => p.categoria === categoriaAtual);
  }

  filtrados = filtrados.filter(p =>
    p.nome.toLowerCase().includes(texto)
  );

  filtrados = ordenarProdutos(filtrados);
  atualizarResultadoInfo(filtrados.length);
  renderizar(filtrados);
}

/* ================= RENDER ================= */

function renderizar(produtos) {
  const catalogo = document.getElementById("catalogo");
  const botaoCarregarMais = document.getElementById("carregarMais");

  produtosFiltradosAtual = produtos;
  produtosRenderizados = 0;
  catalogo.innerHTML = "";

  if (botaoCarregarMais) {
    botaoCarregarMais.hidden = true;
  }

  if (produtos.length === 0) {
    catalogo.innerHTML = `
      <div class="catalogo-vazio">
        <h3>Nenhum Funko encontrado</h3>
        <p>Tente buscar por outro nome ou categoria.</p>
      </div>
    `;
    return;
  }

  renderizarProximoLote();
}

function renderizarProximoLote() {
  const catalogo = document.getElementById("catalogo");
  const botaoCarregarMais = document.getElementById("carregarMais");
  const inicio = produtosRenderizados;
  const fim = Math.min(inicio + PRODUTOS_POR_LOTE, produtosFiltradosAtual.length);
  const fragmento = document.createDocumentFragment();

  produtosFiltradosAtual.slice(inicio, fim).forEach((p, index) => {
    fragmento.appendChild(criarCardProduto(p, inicio + index));
  });

  catalogo.appendChild(fragmento);
  produtosRenderizados = fim;

  if (botaoCarregarMais) {
    botaoCarregarMais.hidden = produtosRenderizados >= produtosFiltradosAtual.length;
  }
}

function criarCardProduto(p, index) {
  const indisponivel = produtoIndisponivel(p);
  const div = document.createElement("div");
  div.classList.add("produto");
  div.style.animationDelay = `${Math.min(index, PRODUTOS_POR_LOTE) * 0.02}s`;

  if (indisponivel) {
    div.classList.add("indisponivel");
  }

  const botao = indisponivel
    ? `<button disabled class="botao-indisponivel">Indisponível</button>`
    : `<button class="botao-adicionar" data-nome="${encodeURIComponent(p.nome)}" data-preco="${p.preco}">Adicionar</button>`;

  div.innerHTML = `
    <div class="produto-imagem-box">
      <img src="${p.imagem}" loading="lazy" alt="${p.nome}">
    </div>
    <div class="produto-conteudo">
      ${p.special ? `<span class="produto-special">${p.special}</span>` : ""}
      <span class="produto-linha">${p.categoria || "Funko Pop"}</span>
      <h2>${p.nome}</h2>
      <p class="produto-preco">${formatarPreco(p.preco)}</p>
      ${botao}
    </div>
  `;

  const img = div.querySelector("img");

  img.onerror = () => {
    img.onerror = null;
    img.src = IMAGEM_PLACEHOLDER;
  };

  if (img.complete) {
    img.classList.add("loaded");
  }

  img.onload = () => img.classList.add("loaded");

  return div;
}

/* ================= CARRINHO ================= */

function adicionarCarrinho(nome, preco) {
  const produto = produtosGlobal.find(p => p.nome === nome && p.preco === preco);

  if (produtoIndisponivel(produto)) {
    return;
  }

  carrinho.push({ nome, preco });

  atualizarCarrinho();
  mostrarToast(`${nome} adicionado ao carrinho`);
}

function diminuirQuantidade(nome, preco) {
  const index = carrinho.findIndex(item => item.nome === nome && item.preco === preco);

  if (index === -1) return;

  carrinho.splice(index, 1);
  atualizarCarrinho();
}

function removerGrupo(nome, preco) {
  carrinho = carrinho.filter(item => !(item.nome === nome && item.preco === preco));
  atualizarCarrinho();
}

/* ABRIR / FECHAR */

document.getElementById("enviarPedido")?.addEventListener("click", abrirCarrinho);

function abrirCarrinho() {
  document.getElementById("carrinho").classList.add("ativo");
  document.getElementById("overlay").classList.add("ativo");
  atualizarCarrinho();
}

function fecharCarrinho() {
  document.getElementById("carrinho").classList.remove("ativo");
  document.getElementById("overlay").classList.remove("ativo");
}

function abrirCheckoutModal() {
  if (carrinho.length === 0) {
    return;
  }

  const modal = document.getElementById("checkoutModal");
  const nomeInput = document.getElementById("nomeClienteInput");
  const itensAgrupados = agruparCarrinho();
  const total = carrinho.reduce((acc, item) => acc + converterPrecoNumero(item.preco), 0);
  const resumoItens = document.getElementById("checkoutResumoItens");
  const resumoTotal = document.getElementById("checkoutResumoTotal");

  resumoItens.innerText = `${itensAgrupados.length} ${itensAgrupados.length === 1 ? "produto no pedido" : "produtos no pedido"}`;
  resumoTotal.innerText = `Total: ${formatarPreco(total)}`;

  modal.classList.add("ativo");
  modal.setAttribute("aria-hidden", "false");
  nomeInput.focus();
}

function fecharCheckoutModal() {
  const modal = document.getElementById("checkoutModal");

  modal.classList.remove("ativo");
  modal.setAttribute("aria-hidden", "true");
}

function mostrarToast(texto) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  clearTimeout(toastTimeout);
  toast.innerText = texto;
  toast.classList.add("ativo");

  toastTimeout = setTimeout(() => {
    toast.classList.remove("ativo");
  }, 2200);
}

function configurarEventosIniciais() {
  const ordenacaoSelect = document.getElementById("ordenacaoSelect");
  const checkoutForm = document.getElementById("checkoutForm");
  const catalogo = document.getElementById("catalogo");
  const botaoCarregarMais = document.getElementById("carregarMais");
  const categoriaSelect = document.getElementById("categoriaSelect");

  ordenacaoSelect?.addEventListener("change", (e) => {
    ordenacaoAtual = e.target.value;
    aplicarFiltros();
  });

  categoriaSelect?.addEventListener("change", (e) => {
    categoriaAtual = e.target.value;
    ativarBotao(
      [...document.querySelectorAll(".categorias button")]
        .find(botao => botao.innerText === categoriaAtual || (categoriaAtual === "todos" && botao.innerText === "Todos"))
    );
    aplicarFiltros();
  });

  checkoutForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    enviarWhatsApp();
  });

  catalogo?.addEventListener("click", (e) => {
    const botao = e.target.closest(".botao-adicionar");

    if (!botao) return;

    adicionarCarrinho(
      decodeURIComponent(botao.dataset.nome),
      botao.dataset.preco
    );
  });

  botaoCarregarMais?.addEventListener("click", renderizarProximoLote);
}

/* ATUALIZAR UI */

function atualizarCarrinho() {
  const lista = document.getElementById("listaCarrinho");
  const totalEl = document.getElementById("totalCarrinho");
  const contador = document.getElementById("contador");

  lista.innerHTML = "";

  let total = 0;
  const itensAgrupados = agruparCarrinho();

  if (itensAgrupados.length === 0) {
    lista.innerHTML = `
      <div class="carrinho-vazio">
        <p>Seu carrinho está vazio.</p>
        <span>Adicione seus Funkos favoritos para continuar.</span>
      </div>
    `;
  }

  itensAgrupados.forEach(item => {
    const subtotal = converterPrecoNumero(item.preco) * item.quantidade;
    total += subtotal;

    const div = document.createElement("div");
    div.classList.add("item-carrinho");

      div.innerHTML = `
        <div class="item-carrinho-info">
          <strong>${item.nome}</strong>
          <span>${formatarPreco(item.preco)} cada</span>
          <small>Subtotal: ${formatarPreco(subtotal)}</small>
        </div>
        <div class="item-carrinho-acoes">
          <div class="controle-quantidade">
            <button onclick="diminuirQuantidade(decodeURIComponent('${encodeURIComponent(item.nome)}'), '${item.preco}')">-</button>
            <span>${item.quantidade}</span>
            <button onclick="adicionarCarrinho(decodeURIComponent('${encodeURIComponent(item.nome)}'), '${item.preco}')">+</button>
          </div>
          <button class="remover-item" onclick="removerGrupo(decodeURIComponent('${encodeURIComponent(item.nome)}'), '${item.preco}')">Remover</button>
        </div>
      `;

    lista.appendChild(div);
  });

  totalEl.innerText = `Total: ${formatarPreco(total)}`;
  contador.innerText = carrinho.length;
  salvarCarrinho();
  atualizarStatusCheckout();
}

/* REMOVER ITEM */

function removerItem(index) {
  carrinho.splice(index, 1);
  atualizarCarrinho();
}

/* ================= WHATSAPP ================= */

function enviarWhatsApp() {
  if (carrinho.length === 0) {
    alert("Carrinho vazio!");
    return;
  }

  const nomeCliente = document.getElementById("nomeClienteInput")?.value.trim();

  if (!nomeCliente) {
    mostrarToast("Digite seu nome para finalizar");
    return;
  }

  const itensAgrupados = agruparCarrinho();

  let mensagem = `*Pedido Funko Store*\n`;
  mensagem += `Cliente: ${nomeCliente}\n\n`;

  itensAgrupados.forEach(item => {
    const subtotal = converterPrecoNumero(item.preco) * item.quantidade;
    mensagem += `- ${item.nome} | Qtd: ${item.quantidade} | ${formatarPreco(subtotal)}\n`;
  });

  const total = carrinho.reduce((acc, item) => acc + converterPrecoNumero(item.preco), 0);

  mensagem += `\n*Total: ${formatarPreco(total)}*`;

  const numero = "5527999503159";

  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
  fecharCheckoutModal();
  mostrarToast("Pedido enviado para o WhatsApp");
}
/* ================= BUSCA ================= */

document.addEventListener("input", (e) => {
  if (e.target.id === "buscaInput") {
    clearTimeout(buscaTimeout);
    buscaTimeout = setTimeout(aplicarFiltros, 250);
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    fecharCheckoutModal();
    fecharCarrinho();
  }
});

document.getElementById("checkoutModal")?.addEventListener("click", (e) => {
  if (e.target.id === "checkoutModal") {
    fecharCheckoutModal();
  }
});
