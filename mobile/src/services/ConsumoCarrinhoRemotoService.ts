import { DadosIniciais } from "../data/AppData";
import { SolicitacaoConsumoCarrinho } from "../models/ConsumoCarrinho";
import { ApiService } from "./ApiService";
import { EstadoSincronizacao } from "./InicializacaoService";
import { PersistenceService } from "./PersistenceService";
import { SnapshotMapper } from "./SnapshotMapper";

export class ConsumoCarrinhoRemotoService {
    private static emAndamento = false;

    static async registrar(
        solicitacao: SolicitacaoConsumoCarrinho,
        estadoSincronizacao: EstadoSincronizacao
    ): Promise<DadosIniciais> {
        if (estadoSincronizacao !== "ONLINE") {
            throw new Error("Consumo do carrinho indisponível enquanto o aplicativo está offline.");
        }

        if (this.emAndamento) {
            throw new Error("Já existe um consumo do carrinho sendo enviado.");
        }

        this.emAndamento = true;

        try {
            await ApiService.registrarConsumoCarrinho({
                responsavelId: solicitacao.responsavelId,
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
