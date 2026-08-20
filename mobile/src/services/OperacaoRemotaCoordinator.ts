import { DadosIniciais } from "../data/AppData";
import { ApiService, ErroApi } from "./ApiService";
import type { EstadoSincronizacao } from "./InicializacaoService";
import { PersistenceService } from "./PersistenceService";
import { SnapshotMapper } from "./SnapshotMapper";
import { gerarCommandId } from "../utils/CommandId";

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
    }
    | {
        tipo: "POST_AMBIGUO";
        commandId: string;
        erro: Error;
    };

export type ResultadoOperacaoConfirmada = Exclude<
    ResultadoOperacao,
    { tipo: "REJEITADA" | "POST_AMBIGUO" }
>;

type AtualizarEstado = (estado: EstadoSincronizacao) => void;

export class OperacaoRemotaCoordinator {
    private static fila: Promise<void> = Promise.resolve();
    private static revisaoMinimaPendente: number | undefined;
    private static maiorRevisaoAplicada = 0;
    private static operacoesEmEspera = new Set<string>();
    private static intencoesAmbiguas = new Map<string, {
        commandId: string;
        post: (commandId: string) => Promise<unknown>;
    }>();

    static registrarRevisaoAplicada(revisao: number): void {
        if (Number.isInteger(revisao) && revisao >= 0) {
            this.maiorRevisaoAplicada = Math.max(
                this.maiorRevisaoAplicada,
                revisao
            );
        }
    }

    private static enfileirar<T>(tarefa: () => Promise<T>): Promise<T> {
        const resultado = this.fila.then(tarefa, tarefa);
        this.fila = resultado.then(() => undefined, () => undefined);
        return resultado;
    }

    static executar(
        post: (commandId: string) => Promise<unknown>,
        estadoSincronizacao: EstadoSincronizacao,
        atualizarEstado?: AtualizarEstado,
        commandId = gerarCommandId()
    ): Promise<ResultadoOperacao> {
        return this.enfileirar(async () => {
            if (this.revisaoMinimaPendente !== undefined) {
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

            let respostaPost: unknown;

            try {
                respostaPost = await post(commandId);
            } catch (erro) {
                if (erro instanceof ErroApi && erro.status === undefined) {
                    atualizarEstado?.("OFFLINE");
                    return {
                        tipo: "POST_AMBIGUO",
                        commandId,
                        erro
                    };
                }
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

            let revisaoPost: number;

            try {
                revisaoPost = this.obterRevisao(respostaPost);
            } catch (erro) {
                this.revisaoMinimaPendente = this.maiorRevisaoAplicada;
                atualizarEstado?.("DESATUALIZADO");
                return {
                    tipo: "CONFIRMADA_PENDENTE_SNAPSHOT",
                    erro: erro instanceof Error ? erro : new Error("Resposta confirmada sem revisão válida.")
                };
            }

            this.revisaoMinimaPendente = Math.max(
                revisaoPost,
                this.maiorRevisaoAplicada
            );
            return await this.sincronizarAposConfirmacao(atualizarEstado);
        });
    }

    static async executarParaServico(
        chaveOperacao: string,
        post: (commandId: string) => Promise<unknown>,
        estadoSincronizacao: EstadoSincronizacao,
        atualizarEstado?: AtualizarEstado
    ): Promise<ResultadoOperacaoConfirmada> {
        if (
            this.operacoesEmEspera.has(chaveOperacao) ||
            this.intencoesAmbiguas.has(chaveOperacao)
        ) {
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

        if (resultado.tipo === "POST_AMBIGUO") {
            this.intencoesAmbiguas.set(chaveOperacao, {
                commandId: resultado.commandId,
                post
            });
            throw resultado.erro;
        }

        if (resultado.tipo === "REJEITADA") {
            throw resultado.erro;
        }

        return resultado;
    }

    static async reenviarIntencaoAmbigua(
        chaveOperacao: string,
        estadoSincronizacao: EstadoSincronizacao,
        atualizarEstado?: AtualizarEstado
    ): Promise<ResultadoOperacao> {
        const intencao = this.intencoesAmbiguas.get(chaveOperacao);
        if (intencao === undefined) {
            return {
                tipo: "REJEITADA",
                erro: new Error("Não existe intenção ambígua para reenviar.")
            };
        }

        const resultado = await this.executar(
            intencao.post,
            estadoSincronizacao,
            atualizarEstado,
            intencao.commandId
        );

        if (resultado.tipo !== "POST_AMBIGUO") {
            this.intencoesAmbiguas.delete(chaveOperacao);
        }
        return resultado;
    }

    static descartarIntencaoAmbigua(chaveOperacao: string): void {
        this.intencoesAmbiguas.delete(chaveOperacao);
    }

    static sincronizarPendente(
        atualizarEstado?: AtualizarEstado
    ): Promise<ResultadoOperacao> {
        return this.enfileirar(async () => {
            if (this.revisaoMinimaPendente === undefined) {
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
            const revisaoMinima = Math.max(
                this.revisaoMinimaPendente ?? 0,
                this.maiorRevisaoAplicada
            );

            if (snapshot.revisao < revisaoMinima) {
                throw new Error(
                    `Snapshot desatualizado: revisão ${snapshot.revisao}; esperada ao menos ${revisaoMinima}.`
                );
            }
            dados = SnapshotMapper.paraDadosIniciais(snapshot);
        } catch (erro) {
            atualizarEstado?.("DESATUALIZADO");
            return {
                tipo: "CONFIRMADA_PENDENTE_SNAPSHOT",
                erro: erro instanceof Error ? erro : new Error("Não foi possível sincronizar o estado oficial.")
            };
        }

        this.revisaoMinimaPendente = undefined;
        this.maiorRevisaoAplicada = Math.max(
            this.maiorRevisaoAplicada,
            dados.revisaoServidor
        );

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

    private static obterRevisao(resposta: unknown): number {
        if (
            typeof resposta !== "object" ||
            resposta === null ||
            !("revisao" in resposta) ||
            typeof resposta.revisao !== "number" ||
            !Number.isInteger(resposta.revisao) ||
            resposta.revisao < 0
        ) {
            throw new Error("O servidor confirmou a operação sem uma revisão válida.");
        }

        return resposta.revisao;
    }
}
