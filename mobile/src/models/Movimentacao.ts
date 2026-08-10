import { ProdutoId } from "./Produto";
import { LocalId } from "./Local";
import { MaquinaId } from "./Maquina";

export enum TipoMovimentacao {
    RETIRADA_ESTOQUE_PRINCIPAL = "RETIRADA_ESTOQUE_PRINCIPAL",
    TRANSFERENCIA_ENTRE_ESTOQUES = "TRANSFERENCIA_ENTRE_ESTOQUES",
    ABASTECIMENTO_MAQUINA = "ABASTECIMENTO_MAQUINA",
    DEVOLUCAO_ESTOQUE = "DEVOLUCAO_ESTOQUE",
    AJUSTE_ESTOQUE = "AJUSTE_ESTOQUE",
}

export interface Movimentacao {
    id: string;

    tipo: TipoMovimentacao;

    produtoId: ProdutoId;
    quantidade: number;

    origemId: string;
    destinoId: string;

    responsavelId: string;

    localDestinoId?: LocalId;
    maquinaDestinoId?: MaquinaId;

    reservaId?: string;

    observacao?: string;

    data: Date;
}
