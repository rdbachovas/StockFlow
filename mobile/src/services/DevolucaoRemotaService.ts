import { DadosIniciais } from "../data/AppData";
import { DevolucaoEstoque } from "../models/DevolucaoEstoque";
import { ApiService } from "./ApiService";
import { EstadoSincronizacao } from "./InicializacaoService";
import { PersistenceService } from "./PersistenceService";
import { SnapshotMapper } from "./SnapshotMapper";

export class DevolucaoRemotaService {
    private static emAndamento = false;

    static async registrar(
        devolucao: DevolucaoEstoque,
        estadoSincronizacao: EstadoSincronizacao
    ): Promise<DadosIniciais> {
        if (estadoSincronizacao !== "ONLINE") {
            throw new Error("Devolução indisponível enquanto o aplicativo está offline.");
        }

        if (this.emAndamento) {
            throw new Error("Já existe uma devolução sendo enviada.");
        }

        this.emAndamento = true;

        try {
            await ApiService.registrarDevolucao({
                responsavelId: devolucao.responsavelId,
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
            });

            const snapshot = await ApiService.obterSnapshot();
            const dados = SnapshotMapper.paraDadosIniciais(snapshot);
            await PersistenceService.salvar(dados);
            return dados;
        } finally {
            this.emAndamento = false;
        }
    }
}
