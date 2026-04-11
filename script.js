let produtosGlobal = [];
let carrinho = [];
let categoriaAtual = "todos";
let ordenacaoAtual = "relevancia";
const CHAVE_CARRINHO = "smart-funkos-carrinho";
const IMAGEM_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='300' height='300' fill='%23f3f4f6'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='20'>Imagem indisponivel</text></svg>";
let toastTimeout;

mostrarSkeleton();
carregarCarrinho();
atualizarCarrinho();
configurarEventosIniciais();

fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRTfb_G6PJPgYb9cyyZL3lwtVKOqwyqXmfO3JjJIqC65J4LLyXREzVYgIL4q3-_ukqN0fWpFY1nVQJk/pub?output=csv')
  .then(res => res.text())
  .then(data => {
    const linhas = data.split("\n").slice(1);

    produtosGlobal = linhas.map(linha => {
      const [nome, preco, imagem, status, categoria, special] = linha.split(",");
      return {
        nome: nome?.trim(),
        preco: normalizarPreco(preco),
        imagem: imagem?.trim() || IMAGEM_PLACEHOLDER,
        status: status?.trim(),
        categoria: categoria?.trim(),
        special: special?.trim()
      };
    }).filter(produto => produto.nome);

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

  const categorias = [...new Set(produtos.map(p => p.categoria))];

  const btnTodos = document.createElement("button");
  btnTodos.innerText = "Todos";
  btnTodos.classList.add("ativo");

  btnTodos.onclick = () => {
    categoriaAtual = "todos";
    ativarBotao(btnTodos);
    aplicarFiltros();
  };

  container.appendChild(btnTodos);

  categorias.forEach(cat => {
    if (!cat) return;

    const btn = document.createElement("button");
    btn.innerText = cat;

    btn.onclick = () => {
      categoriaAtual = cat;
      ativarBotao(btn);
      aplicarFiltros();
    };

    container.appendChild(btn);
  });
}

function ativarBotao(botao) {
  document.querySelectorAll(".categorias button")
    .forEach(b => b.classList.remove("ativo"));

  botao.classList.add("ativo");
}

/* ================= FILTROS ================= */

function produtoIndisponivel(produto) {
  return produto?.status?.trim().toLowerCase() === "indisponivel";
}

function normalizarPreco(preco) {
  return (preco || "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
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

  catalogo.style.opacity = 0;

  setTimeout(() => {
    catalogo.innerHTML = "";

    if (produtos.length === 0) {
      catalogo.innerHTML = `
        <div class="catalogo-vazio">
          <h3>Nenhum Funko encontrado</h3>
          <p>Tente buscar por outro nome ou categoria.</p>
        </div>
      `;
      catalogo.style.opacity = 1;
      return;
    }

    produtos.forEach((p, index) => {
      const indisponivel = produtoIndisponivel(p);
      const div = document.createElement("div");
      div.classList.add("produto");

      if (indisponivel) {
        div.classList.add("indisponivel");
      }

      div.style.animationDelay = `${index * 0.05}s`;

      let botao = "";

      if (indisponivel) {
        botao = `<button disabled class="botao-indisponivel">Indisponível</button>`;
      } else {
        botao = `<button class="botao-adicionar" data-nome="${encodeURIComponent(p.nome)}" data-preco="${p.preco}">Adicionar</button>`;
      }

      div.innerHTML = `
        <div class="produto-imagem-box">
          <img src="${p.imagem}" loading="lazy" alt="${p.nome}" onerror="this.onerror=null;this.src='${IMAGEM_PLACEHOLDER}'">
        </div>
        <div class="produto-conteudo">
          ${p.special ? `<span class="produto-special">${p.special}</span>` : ""}
          <span class="produto-linha">${p.categoria || "Funko Pop"}</span>
          <h2>${p.nome}</h2>
          <p class="produto-preco">${formatarPreco(p.preco)}</p>
          ${botao}
        </div>
      `;

      catalogo.appendChild(div);
    });

    document.querySelectorAll(".botao-adicionar").forEach(botao => {
      botao.addEventListener("click", () => {
        adicionarCarrinho(
          decodeURIComponent(botao.dataset.nome),
          botao.dataset.preco
        );
      });
    });

    document.querySelectorAll("img").forEach(img => {
      img.onload = () => img.classList.add("loaded");
    });

    catalogo.style.opacity = 1;
  }, 150);
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

  ordenacaoSelect?.addEventListener("change", (e) => {
    ordenacaoAtual = e.target.value;
    aplicarFiltros();
  });

  checkoutForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    enviarWhatsApp();
  });
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
    aplicarFiltros();
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
