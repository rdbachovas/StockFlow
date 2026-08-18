import { Abastecimento } from "../models/Abastecimento";
import { ApiService } from "./ApiService";
import { EstadoSincronizacao } from "./InicializacaoService";
import { OperacaoRemotaCoordinator, ResultadoOperacaoConfirmada } from "./OperacaoRemotaCoordinator";

export class AbastecimentoRemotoService {
    static async registrar(
        abastecimento: Abastecimento,
        estadoSincronizacao: EstadoSincronizacao,
        atualizarEstado?: (estado: EstadoSincronizacao) => void
    ): Promise<ResultadoOperacaoConfirmada> {
        return await OperacaoRemotaCoordinator.executarParaServico(
            "abastecimento",
            () => ApiService.registrarAbastecimento({
                responsavelId: abastecimento.responsavelId,
                local: abastecimento.localId,
                itens: abastecimento.itens.map((item) => ({ ...item })),
                data: abastecimento.data.toISOString(),
                observacao: abastecimento.observacao
            }),
            estadoSincronizacao,
            atualizarEstado
        );
    }
}
