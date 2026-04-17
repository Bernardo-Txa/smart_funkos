export async function carregarProdutosJson() {
  const baseUrl = import.meta.env?.BASE_URL || "./";
  const resposta = await fetch(`${baseUrl}produtos.json`);

  if (!resposta.ok) {
    throw new Error("Nao foi possivel carregar produtos.json");
  }

  return resposta.json();
}
