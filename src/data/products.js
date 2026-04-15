export async function carregarProdutosJson() {
  const resposta = await fetch("/produtos.json");

  if (!resposta.ok) {
    throw new Error("Nao foi possivel carregar produtos.json");
  }

  return resposta.json();
}
