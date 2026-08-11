import { criarDadosIniciais, DadosIniciais } from "../data/AppData";
import { ApiService } from "./ApiService";
import { PersistenceService } from "./PersistenceService";
import { SnapshotMapper } from "./SnapshotMapper";

export type EstadoSincronizacao = "CARREGANDO" | "ONLINE" | "OFFLINE";

export interface ResultadoInicializacao {
    dados: DadosIniciais;
    estadoSincronizacao: Exclude<EstadoSincronizacao, "CARREGANDO">;
}

export class InicializacaoService {
    static async carregar(): Promise<ResultadoInicializacao> {
        const cache = await PersistenceService.carregar();
        const dadosCache = cache.tipo === "VALIDO" ? cache.dados : undefined;

        try {
            const resposta = await ApiService.obterSnapshot();
            const dados = SnapshotMapper.paraDadosIniciais(resposta);
            await PersistenceService.salvar(dados);

            return {
                dados,
                estadoSincronizacao: "ONLINE"
            };
        } catch {
            return {
                dados: dadosCache ?? criarDadosIniciais(),
                estadoSincronizacao: "OFFLINE"
            };
        }
    }
}
