import { MaquinaId } from "./Maquina";
import { ProdutoId } from "./Produto";

export interface ItemAbastecimento {
    maquinaId: MaquinaId;
    produtoId: ProdutoId;
    quantidade: number;
}
