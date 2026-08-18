import { SolicitacaoMovimentoEstoquePrincipal } from "../models/MovimentoEstoquePrincipal";
import { ApiService } from "./ApiService";
import { EstadoSincronizacao } from "./InicializacaoService";
import { OperacaoRemotaCoordinator, ResultadoOperacaoConfirmada } from "./OperacaoRemotaCoordinator";

export class MovimentoEstoquePrincipalRemotoService {
    static async registrar(
        solicitacao: SolicitacaoMovimentoEstoquePrincipal,
        estadoSincronizacao: EstadoSincronizacao,
        atualizarEstado?: (estado: EstadoSincronizacao) => void
    ): Promise<ResultadoOperacaoConfirmada> {
        return await OperacaoRemotaCoordinator.executarParaServico(
            "movimento do Estoque Principal",
            () => ApiService.registrarMovimentoEstoquePrincipal({
                tipo: solicitacao.tipo,
                itens: solicitacao.itens.map((item) => ({
                    produtoId: item.produtoId,
                    quantidade: item.quantidade
                })),
                data: solicitacao.data.toISOString(),
                observacao: solicitacao.observacao
            }),
            estadoSincronizacao,
            atualizarEstado
        );
    }
}
