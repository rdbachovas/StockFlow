import { DadosIniciais } from "../data/AppData";
import { RetiradaEstoque } from "../models/RetiradaEstoque";
import { EstadoSincronizacao } from "./InicializacaoService";
import { ApiService } from "./ApiService";
import { PersistenceService } from "./PersistenceService";
import { SnapshotMapper } from "./SnapshotMapper";

export class RetiradaRemotaService {
    private static emAndamento = false;

    static async registrar(
        retirada: RetiradaEstoque,
        estadoSincronizacao: EstadoSincronizacao
    ): Promise<DadosIniciais> {
        if (estadoSincronizacao !== "ONLINE") {
            throw new Error("Retirada indisponível enquanto o aplicativo está offline.");
        }

        if (this.emAndamento) {
            throw new Error("Já existe uma retirada sendo enviada.");
        }

        this.emAndamento = true;

        try {
            await ApiService.registrarRetirada({
                responsavelId: retirada.responsavelId,
                itens: retirada.itens.map((item) => ({
                    produtoId: item.produtoId,
                    quantidade: item.quantidade
                })),
                data: retirada.data.toISOString(),
                observacao: retirada.observacao
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
