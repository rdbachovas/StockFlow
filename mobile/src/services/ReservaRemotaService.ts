import { Reserva } from "../models/Reserva";
import { ApiService } from "./ApiService";
import { EstadoSincronizacao } from "./InicializacaoService";
import { OperacaoRemotaCoordinator, ResultadoOperacaoConfirmada } from "./OperacaoRemotaCoordinator";

export class ReservaRemotaService {
    static async criar(
        reserva: Reserva,
        estadoSincronizacao: EstadoSincronizacao,
        atualizarEstado?: (estado: EstadoSincronizacao) => void
    ): Promise<ResultadoOperacaoConfirmada> {
        return await OperacaoRemotaCoordinator.executarParaServico(
            "reserva",
            (commandId) => ApiService.criarReserva({
                commandId,
                responsavelId: reserva.responsavelId,
                destino: reserva.destinoId,
                produtoId: reserva.produtoId,
                quantidade: reserva.quantidade
            }),
            estadoSincronizacao,
            atualizarEstado
        );
    }

    static async cancelar(
        reservaId: string,
        responsavelId: string,
        estadoSincronizacao: EstadoSincronizacao,
        atualizarEstado?: (estado: EstadoSincronizacao) => void
    ): Promise<ResultadoOperacaoConfirmada> {
        return await OperacaoRemotaCoordinator.executarParaServico(
            "reserva",
            (commandId) => ApiService.cancelarReserva(
                reservaId,
                { commandId, responsavelId }
            ),
            estadoSincronizacao,
            atualizarEstado
        );
    }
}
