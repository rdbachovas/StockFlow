import { DadosIniciais } from "../data/AppData";
import { SolicitacaoMovimentoEstoquePrincipal } from "../models/MovimentoEstoquePrincipal";
import { ApiService } from "./ApiService";
import { EstadoSincronizacao } from "./InicializacaoService";
import { PersistenceService } from "./PersistenceService";
import { SnapshotMapper } from "./SnapshotMapper";

export class MovimentoEstoquePrincipalRemotoService {
    private static emAndamento = false;

    static async registrar(
        solicitacao: SolicitacaoMovimentoEstoquePrincipal,
        estadoSincronizacao: EstadoSincronizacao
    ): Promise<DadosIniciais> {
        if (estadoSincronizacao !== "ONLINE") {
            throw new Error("Movimento do Estoque Principal indisponível enquanto o aplicativo está offline.");
        }

        if (this.emAndamento) {
            throw new Error("Já existe um movimento do Estoque Principal sendo enviado.");
        }

        this.emAndamento = true;

        try {
            await ApiService.registrarMovimentoEstoquePrincipal({
                tipo: solicitacao.tipo,
                itens: solicitacao.itens.map((item) => ({
                    produtoId: item.produtoId,
                    quantidade: item.quantidade
                })),
                data: solicitacao.data.toISOString(),
                observacao: solicitacao.observacao
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
