import { DadosIniciais } from "../data/AppData";
import { Abastecimento } from "../models/Abastecimento";
import { ApiService } from "./ApiService";
import { EstadoSincronizacao } from "./InicializacaoService";
import { PersistenceService } from "./PersistenceService";
import { SnapshotMapper } from "./SnapshotMapper";

export class AbastecimentoRemotoService {
    private static emAndamento = false;

    static async registrar(
        abastecimento: Abastecimento,
        estadoSincronizacao: EstadoSincronizacao
    ): Promise<DadosIniciais> {
        if (estadoSincronizacao !== "ONLINE") {
            throw new Error("Abastecimento indisponível enquanto o aplicativo está offline.");
        }

        if (this.emAndamento) {
            throw new Error("Já existe um abastecimento sendo enviado.");
        }

        this.emAndamento = true;

        try {
            await ApiService.registrarAbastecimento({
                responsavelId: abastecimento.responsavelId,
                local: abastecimento.localId,
                itens: abastecimento.itens.map((item) => ({ ...item })),
                data: abastecimento.data.toISOString(),
                observacao: abastecimento.observacao
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
