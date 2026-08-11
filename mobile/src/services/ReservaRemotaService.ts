import { DadosIniciais } from "../data/AppData";
import { Reserva } from "../models/Reserva";
import { ApiService } from "./ApiService";
import { EstadoSincronizacao } from "./InicializacaoService";
import { PersistenceService } from "./PersistenceService";
import { SnapshotMapper } from "./SnapshotMapper";

export class ReservaRemotaService {
    private static emAndamento = false;

    private static validarDisponibilidade(
        estadoSincronizacao: EstadoSincronizacao
    ): void {
        if (estadoSincronizacao !== "ONLINE") {
            throw new Error("Reservas indisponíveis enquanto o aplicativo está offline.");
        }

        if (this.emAndamento) {
            throw new Error("Já existe uma reserva sendo enviada.");
        }
    }

    private static async atualizarSnapshot(): Promise<DadosIniciais> {
        const snapshot = await ApiService.obterSnapshot();
        const dados = SnapshotMapper.paraDadosIniciais(snapshot);
        await PersistenceService.salvar(dados);
        return dados;
    }

    static async criar(
        reserva: Reserva,
        estadoSincronizacao: EstadoSincronizacao
    ): Promise<DadosIniciais> {
        this.validarDisponibilidade(estadoSincronizacao);
        this.emAndamento = true;

        try {
            await ApiService.criarReserva({
                responsavelId: reserva.responsavelId,
                destino: reserva.destinoId,
                produtoId: reserva.produtoId,
                quantidade: reserva.quantidade
            });

            return await this.atualizarSnapshot();
        } finally {
            this.emAndamento = false;
        }
    }

    static async cancelar(
        reservaId: string,
        responsavelId: string,
        estadoSincronizacao: EstadoSincronizacao
    ): Promise<DadosIniciais> {
        this.validarDisponibilidade(estadoSincronizacao);
        this.emAndamento = true;

        try {
            await ApiService.cancelarReserva(
                reservaId,
                { responsavelId }
            );

            return await this.atualizarSnapshot();
        } finally {
            this.emAndamento = false;
        }
    }
}
