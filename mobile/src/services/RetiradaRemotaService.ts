import { RetiradaEstoque } from "../models/RetiradaEstoque";
import { EstadoSincronizacao } from "./InicializacaoService";
import { ApiService } from "./ApiService";
import { OperacaoRemotaCoordinator, ResultadoOperacaoConfirmada } from "./OperacaoRemotaCoordinator";

export class RetiradaRemotaService {
    static async registrar(
        retirada: RetiradaEstoque,
        estadoSincronizacao: EstadoSincronizacao,
        atualizarEstado?: (estado: EstadoSincronizacao) => void
    ): Promise<ResultadoOperacaoConfirmada> {
        return await OperacaoRemotaCoordinator.executarParaServico(
            "retirada",
            (commandId) => ApiService.registrarRetirada({
                commandId,
                itens: retirada.itens.map((item) => ({
                    produtoId: item.produtoId,
                    quantidade: item.quantidade
                })),
                data: retirada.data.toISOString(),
                observacao: retirada.observacao
            }),
            estadoSincronizacao,
            atualizarEstado
        );
    }
}
