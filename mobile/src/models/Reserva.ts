import { ProdutoId } from "./Produto";
import { LocalId } from "./Local";

export interface Reserva {
    id: string;
    responsavelId: string;
    localDestinoId: LocalId;
    produtoId: ProdutoId;
    quantidade: number;
}
