import csv
import json
import re
import urllib.request
from pathlib import Path


CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTfb_G6PJPgYb9cyyZL3lwtVKOqwyqXmfO3JjJIqC65J4LLyXREzVYgIL4q3-_ukqN0fWpFY1nVQJk/pub?output=csv"
ROOT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT_DIR / "produtos.json"


def normalizar_preco(preco):
    valor = re.sub(r"[^\d,.]", "", (preco or "").strip())

    if not valor:
        return ""

    if "," in valor:
        return valor.replace(".", "").replace(",", ".")

    return valor


def limpar_texto(valor):
    return (valor or "").strip()


def baixar_csv():
    with urllib.request.urlopen(CSV_URL) as response:
        return response.read().decode("utf-8-sig")


def converter_produto(linha):
    return {
        "nome": limpar_texto(linha.get("nome")),
        "preco": normalizar_preco(linha.get("preco")),
        "imagem": limpar_texto(linha.get("imagem")),
        "status": limpar_texto(linha.get("status")) or "disponivel",
        "categoria": limpar_texto(linha.get("categoria")),
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

    OUTPUT_PATH.write_text(
        json.dumps(produtos, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    print(f"{len(produtos)} produtos gerados em {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
