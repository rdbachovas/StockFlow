import { Movimentacao } from "../models/Movimentacao";

export class MovimentacaoService {

    static registrar(
        movimentacoes: Movimentacao[],
        movimentacao: Movimentacao
    ): void {

        if (movimentacao.quantidade <= 0) {
            throw new Error(
                "A quantidade deve ser maior que zero."
            );
        }

        if (!movimentacao.origemId) {
            throw new Error(
                "A movimentação precisa ter uma origem."
            );
        }

        if (!movimentacao.destinoId) {
            throw new Error(
                "A movimentação precisa ter um destino."
            );
        }

        if (!movimentacao.responsavelId) {
            throw new Error(
                "A movimentação precisa ter um responsável."
            );
        }

        movimentacoes.push(movimentacao);
    }
}
