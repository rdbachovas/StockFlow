import { DevolucaoEstoque } from "../models/DevolucaoEstoque";
import { ApiService } from "./ApiService";
import { EstadoSincronizacao } from "./InicializacaoService";
import { OperacaoRemotaCoordinator, ResultadoOperacaoConfirmada } from "./OperacaoRemotaCoordinator";

export class DevolucaoRemotaService {
    static async registrar(
        devolucao: DevolucaoEstoque,
        estadoSincronizacao: EstadoSincronizacao,
        atualizarEstado?: (estado: EstadoSincronizacao) => void
    ): Promise<ResultadoOperacaoConfirmada> {
        return await OperacaoRemotaCoordinator.executarParaServico(
            "devolução",
            (commandId) => ApiService.registrarDevolucao({
                commandId,
                itens: devolucao.itens.map((item) => ({
                    produtoId: item.produtoId,
                    quantidadeLivre: item.quantidadeLivre,
                    reservas: item.reservas.map((reserva) => ({
                        destino: reserva.destinoId,
                        quantidade: reserva.quantidade
                    }))
                })),
                data: devolucao.data.toISOString(),
                observacao: devolucao.observacao
            }),
            estadoSincronizacao,
            atualizarEstado
        );
    }
}
