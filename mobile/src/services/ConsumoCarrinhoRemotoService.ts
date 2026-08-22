import { SolicitacaoConsumoCarrinho } from "../models/ConsumoCarrinho";
import { ApiService } from "./ApiService";
import { EstadoSincronizacao } from "./InicializacaoService";
import { OperacaoRemotaCoordinator, ResultadoOperacaoConfirmada } from "./OperacaoRemotaCoordinator";

export class ConsumoCarrinhoRemotoService {
    static async registrar(
        solicitacao: SolicitacaoConsumoCarrinho,
        estadoSincronizacao: EstadoSincronizacao,
        atualizarEstado?: (estado: EstadoSincronizacao) => void
    ): Promise<ResultadoOperacaoConfirmada> {
        return await OperacaoRemotaCoordinator.executarParaServico(
            "consumo do carrinho",
            (commandId) => ApiService.registrarConsumoCarrinho({
                commandId,
                responsavelId: solicitacao.responsavelId,
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
