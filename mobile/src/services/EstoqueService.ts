import { Estoque } from "../models/Estoque";
import { ProdutoId } from "../models/Produto";

export class EstoqueService {
  static consultarQuantidade(
    estoque: Estoque,
    produtoId: ProdutoId
  ): number {
    const item = estoque.itens.find(
      (item) => item.produtoId === produtoId
    );

    return item?.quantidade ?? 0;
  }

  static adicionar(
    estoque: Estoque,
    produtoId: ProdutoId,
    quantidade: number
  ): void {
    if (quantidade <= 0) {
      throw new Error("A quantidade deve ser maior que zero.");
    }

    const item = estoque.itens.find(
      (item) => item.produtoId === produtoId
    );

    if (item) {
      item.quantidade += quantidade;
      return;
    }

    estoque.itens.push({
      produtoId,
      quantidade,
    });
  }

  static remover(
    estoque: Estoque,
    produtoId: ProdutoId,
    quantidade: number
  ): void {
    if (quantidade <= 0) {
      throw new Error("A quantidade deve ser maior que zero.");
    }

    const item = estoque.itens.find(
      (item) => item.produtoId === produtoId
    );

    if (!item) {
      throw new Error("Produto não encontrado no estoque.");
    }

    if (item.quantidade < quantidade) {
      throw new Error("Estoque insuficiente.");
    }

    item.quantidade -= quantidade;
  }
}