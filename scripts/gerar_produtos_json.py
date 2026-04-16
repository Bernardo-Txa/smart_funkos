import csv
import json
import re
import urllib.request
from pathlib import Path


CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSa-5NXt5-3THkuylRtosmaTWxf13kAOz_e_CQpBdSXMaOLH733bKlSSDIakYTu9sf73WqIj1IK9Dhb/pub?output=csv"
ROOT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT_DIR / "produtos.json"
PUBLIC_OUTPUT_PATH = ROOT_DIR / "public" / "produtos.json"


def normalizar_preco(preco):
    valor = re.sub(r"[^\d,.]", "", (preco or "").strip())

    if not valor:
        return ""

    if "," in valor:
        return valor.replace(".", "").replace(",", ".")

    return valor


def limpar_texto(valor):
    return (valor or "").strip()


def obter_campo(linha, *nomes):
    for nome in nomes:
        valor = linha.get(nome)

        if valor not in (None, ""):
            return valor

    return ""


def baixar_csv():
    with urllib.request.urlopen(CSV_URL) as response:
        return response.read().decode("utf-8-sig")


def converter_produto(linha):
    categoria_principal = limpar_texto(obter_campo(linha, "categoria_principal", "categoria"))
    subcategoria = limpar_texto(linha.get("subcategoria"))

    return {
        "nome": limpar_texto(linha.get("nome")),
        "preco": normalizar_preco(obter_campo(linha, "preco", "precos")),
        "imagem": limpar_texto(linha.get("imagem")),
        "status": limpar_texto(linha.get("status")) or "disponivel",
        "categoria": categoria_principal,
        "categoria_principal": categoria_principal,
        "subcategoria": subcategoria,
        "special": limpar_texto(linha.get("special")),
    }


def main():
    conteudo_csv = baixar_csv()
    leitor = csv.DictReader(conteudo_csv.splitlines())

    produtos = [
        produto
        for produto in (converter_produto(linha) for linha in leitor)
        if produto["nome"]
    ]

    conteudo_json = json.dumps(produtos, ensure_ascii=False, separators=(",", ":"))

    OUTPUT_PATH.write_text(conteudo_json, encoding="utf-8")
    PUBLIC_OUTPUT_PATH.parent.mkdir(exist_ok=True)
    PUBLIC_OUTPUT_PATH.write_text(conteudo_json, encoding="utf-8")

    print(f"{len(produtos)} produtos gerados em {OUTPUT_PATH} e {PUBLIC_OUTPUT_PATH}")


if __name__ == "__main__":
    main()
