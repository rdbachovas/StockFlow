import { criarDadosIniciais, DadosIniciais } from "../data/AppData";
import {
    ApiService,
    ErroApi
} from "./ApiService";
import { PersistenceService } from "./PersistenceService";
import { SnapshotMapper } from "./SnapshotMapper";

export type EstadoSincronizacao =
    | "CARREGANDO"
    | "ONLINE"
    | "SINCRONIZANDO"
    | "DESATUALIZADO"
    | "OFFLINE"
    | "ERRO";

export interface ResultadoInicializacao {
    dados: DadosIniciais;
    estadoSincronizacao: Exclude<EstadoSincronizacao, "CARREGANDO">;
}

export class InicializacaoService {
    static async carregar(): Promise<ResultadoInicializacao> {
        const cache = await PersistenceService.carregar();
        const dadosCache = cache.tipo === "VALIDO" ? cache.dados : undefined;
        let resposta: unknown;

        try {
            resposta = await ApiService.obterSnapshot();
        } catch (erro) {
            return {
                dados: dadosCache ?? criarDadosIniciais(),
                estadoSincronizacao:
                    erro instanceof ErroApi &&
                    erro.status !== undefined
                        ? "ERRO"
                        : "OFFLINE"
            };
        }

        let dados: DadosIniciais;

        try {
            dados = SnapshotMapper.paraDadosIniciais(resposta);
        } catch {
            return {
                dados: dadosCache ?? criarDadosIniciais(),
                estadoSincronizacao: "ERRO"
            };
        }

        if (
            dadosCache !== undefined &&
            dados.revisaoServidor < dadosCache.revisaoServidor
        ) {
            return {
                dados: dadosCache,
                estadoSincronizacao: "DESATUALIZADO"
            };
        }

        try {
            await PersistenceService.salvar(dados);
        } catch {
            return {
                dados,
                estadoSincronizacao: "ERRO"
            };
        }

        return {
            dados,
            estadoSincronizacao: "ONLINE"
        };
    }
}
