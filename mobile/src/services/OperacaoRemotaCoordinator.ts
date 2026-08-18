import { DadosIniciais } from "../data/AppData";
import { ApiService, ErroApi } from "./ApiService";
import { EstadoSincronizacao } from "./InicializacaoService";
import { PersistenceService } from "./PersistenceService";
import { SnapshotMapper } from "./SnapshotMapper";

export type ResultadoOperacao =
    | {
        tipo: "REJEITADA";
        erro: Error;
    }
    | {
        tipo: "CONFIRMADA";
        dados: DadosIniciais;
        cacheAtualizado: boolean;
        erroCache?: Error;
    }
    | {
        tipo: "CONFIRMADA_PENDENTE_SNAPSHOT";
        erro: Error;
    };

export type ResultadoOperacaoConfirmada = Exclude<
    ResultadoOperacao,
    { tipo: "REJEITADA" }
>;

type AtualizarEstado = (estado: EstadoSincronizacao) => void;

export class OperacaoRemotaCoordinator {
    private static fila: Promise<void> = Promise.resolve();
    private static snapshotPendente = false;
    private static operacoesEmEspera = new Set<string>();

    private static enfileirar<T>(tarefa: () => Promise<T>): Promise<T> {
        const resultado = this.fila.then(tarefa, tarefa);
        this.fila = resultado.then(() => undefined, () => undefined);
        return resultado;
    }

    static executar(
        post: () => Promise<unknown>,
        estadoSincronizacao: EstadoSincronizacao,
        atualizarEstado?: AtualizarEstado
    ): Promise<ResultadoOperacao> {
        return this.enfileirar(async () => {
            if (this.snapshotPendente) {
                atualizarEstado?.("DESATUALIZADO");
                return {
                    tipo: "REJEITADA",
                    erro: new Error("Sincronize a operação confirmada antes de iniciar outra operação.")
                };
            }

            if (estadoSincronizacao !== "ONLINE") {
                return {
                    tipo: "REJEITADA",
                    erro: new Error("Operação indisponível enquanto o aplicativo está offline.")
                };
            }

            atualizarEstado?.("SINCRONIZANDO");

            try {
                await post();
            } catch (erro) {
                atualizarEstado?.(
                    erro instanceof ErroApi && erro.status === undefined
                        ? "OFFLINE"
                        : estadoSincronizacao
                );
                return {
                    tipo: "REJEITADA",
                    erro: erro instanceof Error ? erro : new Error("Operação rejeitada pelo servidor.")
                };
            }

            return await this.sincronizarAposConfirmacao(atualizarEstado);
        });
    }

    static async executarParaServico(
        chaveOperacao: string,
        post: () => Promise<unknown>,
        estadoSincronizacao: EstadoSincronizacao,
        atualizarEstado?: AtualizarEstado
    ): Promise<ResultadoOperacaoConfirmada> {
        if (this.operacoesEmEspera.has(chaveOperacao)) {
            throw new Error(`Já existe uma operação de ${chaveOperacao} sendo enviada.`);
        }

        this.operacoesEmEspera.add(chaveOperacao);
        let resultado: ResultadoOperacao;

        try {
            resultado = await this.executar(
                post,
                estadoSincronizacao,
                atualizarEstado
            );
        } finally {
            this.operacoesEmEspera.delete(chaveOperacao);
        }

        if (resultado.tipo === "REJEITADA") {
            throw resultado.erro;
        }

        return resultado;
    }

    static sincronizarPendente(
        atualizarEstado?: AtualizarEstado
    ): Promise<ResultadoOperacao> {
        return this.enfileirar(async () => {
            if (!this.snapshotPendente) {
                return {
                    tipo: "REJEITADA",
                    erro: new Error("Não existe sincronização pendente.")
                };
            }

            atualizarEstado?.("SINCRONIZANDO");
            return await this.sincronizarAposConfirmacao(atualizarEstado);
        });
    }

    private static async sincronizarAposConfirmacao(
        atualizarEstado?: AtualizarEstado
    ): Promise<ResultadoOperacao> {
        let dados: DadosIniciais;

        try {
            const snapshot = await ApiService.obterSnapshot();
            dados = SnapshotMapper.paraDadosIniciais(snapshot);
        } catch (erro) {
            this.snapshotPendente = true;
            atualizarEstado?.("DESATUALIZADO");
            return {
                tipo: "CONFIRMADA_PENDENTE_SNAPSHOT",
                erro: erro instanceof Error ? erro : new Error("Não foi possível sincronizar o estado oficial.")
            };
        }

        this.snapshotPendente = false;

        try {
            await PersistenceService.salvar(dados);
            atualizarEstado?.("ONLINE");
            return {
                tipo: "CONFIRMADA",
                dados,
                cacheAtualizado: true
            };
        } catch (erro) {
            atualizarEstado?.("ONLINE");
            return {
                tipo: "CONFIRMADA",
                dados,
                cacheAtualizado: false,
                erroCache: erro instanceof Error ? erro : new Error("Não foi possível atualizar o cache.")
            };
        }
    }
}
