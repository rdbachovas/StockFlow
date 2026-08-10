import { ProdutoId } from "./Produto";

export interface ItemRetiradaEstoque {
    produtoId: ProdutoId;
    quantidade: number;
}
