import {
    ComandoPendente,
    TipoComandoPendente
} from "../models/ComandoPendente";
import { gerarCommandId } from "../utils/CommandId";
import { ApiService } from "./ApiService";
import type { EstadoSincronizacao } from "./InicializacaoService";
import {
    OperacaoRemotaCoordinator,
    ResultadoOperacao
} from "./OperacaoRemotaCoordinator";
import { FilaComandosPersistenceService } from "./FilaComandosPersistenceService";

type OuvinteFila = (comandos: ComandoPendente[]) => void;

export class FilaComandosService {
    private static comandos: ComandoPendente[] = [];
    private static carregada = false;
    private static processando?: Promise<void>;
    private static aguardandoSnapshot = new Set<string>();
    private static ouvintes = new Set<OuvinteFila>();

    static async carregar(): Promise<ComandoPendente[]> {
        if (!this.carregada) {
            this.comandos = await FilaComandosPersistenceService.carregar();
            this.carregada = true;
            this.notificar();
        }
        return this.listar();
    }

    static listar(): ComandoPendente[] {
        return this.comandos.map((comando) => ({ ...comando }));
    }

    static observar(ouvinte: OuvinteFila): () => void {
        this.ouvintes.add(ouvinte);
        ouvinte(this.listar());
        return () => this.ouvintes.delete(ouvinte);
    }

    static reiniciarEstadoEmMemoria(): void {
        this.comandos = [];
        this.carregada = false;
        this.processando = undefined;
        this.aguardandoSnapshot.clear();
    }

    static async adicionar(
        tipo: TipoComandoPendente,
        payloadSemCommandId: Record<string, unknown>
    ): Promise<ComandoPendente> {
        await this.carregar();
        const commandId = gerarCommandId();
        const payload = { ...payloadSemCommandId, commandId };
        const comando = {
            commandId,
            tipo,
            payload,
            dataCriacao: new Date().toISOString(),
            status: "PENDENTE",
            tentativas: 0
        } as ComandoPendente;
        this.comandos.push(comando);
        await this.persistir();
        return comando;
    }

    static processar(
        estado: EstadoSincronizacao,
        atualizarEstado?: (estado: EstadoSincronizacao) => void,
        aplicarResultado?: (resultado: ResultadoOperacao) => void
    ): Promise<void> {
        if (this.processando !== undefined) {
            return this.processando;
        }

        this.processando = this.processarInternamente(
            estado,
            atualizarEstado,
            aplicarResultado
        ).finally(() => {
            this.processando = undefined;
        });
        return this.processando;
    }

    private static async processarInternamente(
        estado: EstadoSincronizacao,
        atualizarEstado?: (estado: EstadoSincronizacao) => void,
        aplicarResultado?: (resultado: ResultadoOperacao) => void
    ): Promise<void> {
        await this.carregar();
        if (estado !== "ONLINE") {
            return;
        }

        for (const comando of [...this.comandos]) {
            if (comando.status === "ERRO") {
                continue;
            }

            let resultado: ResultadoOperacao;
            if (this.aguardandoSnapshot.has(comando.commandId)) {
                resultado = await OperacaoRemotaCoordinator.sincronizarPendente(
                    atualizarEstado
                );
            } else {
                await this.atualizar(comando.commandId, {
                    status: "ENVIANDO",
                    tentativas: comando.tentativas + 1,
                    erro: undefined
                });
                resultado = await OperacaoRemotaCoordinator.executar(
                    () => this.enviar(comando),
                    "ONLINE",
                    atualizarEstado,
                    comando.commandId
                );
            }

            if (resultado.tipo === "CONFIRMADA") {
                this.aguardandoSnapshot.delete(comando.commandId);
                aplicarResultado?.(resultado);
                await this.remover(comando.commandId);
                continue;
            }

            if (resultado.tipo === "CONFIRMADA_PENDENTE_SNAPSHOT") {
                this.aguardandoSnapshot.add(comando.commandId);
                await this.atualizar(comando.commandId, { status: "ENVIANDO" });
                aplicarResultado?.(resultado);
                return;
            }

            if (resultado.tipo === "POST_AMBIGUO") {
                await this.atualizar(comando.commandId, { status: "PENDENTE" });
                return;
            }

            await this.atualizar(comando.commandId, {
                status: "ERRO",
                erro: resultado.erro.message
            });
        }
    }

    private static enviar(comando: ComandoPendente): Promise<unknown> {
        switch (comando.tipo) {
            case "RETIRADA":
                return ApiService.registrarRetirada(comando.payload);
            case "CRIAR_RESERVA":
                return ApiService.criarReserva(comando.payload);
            case "CANCELAR_RESERVA":
                return ApiService.cancelarReserva(
                    comando.payload.reservaId,
                    comando.payload.corpo
                );
            case "ABASTECIMENTO":
                return ApiService.registrarAbastecimento(comando.payload);
            case "DEVOLUCAO":
                return ApiService.registrarDevolucao(comando.payload);
            case "MOVIMENTO_PRINCIPAL":
                return ApiService.registrarMovimentoEstoquePrincipal(comando.payload);
            case "CONSUMO_CARRINHO":
                return ApiService.registrarConsumoCarrinho(comando.payload);
        }
    }

    private static async atualizar(
        commandId: string,
        alteracoes: Partial<ComandoPendente>
    ): Promise<void> {
        this.comandos = this.comandos.map((comando) =>
            comando.commandId === commandId
                ? { ...comando, ...alteracoes } as ComandoPendente
                : comando
        );
        await this.persistir();
    }

    private static async remover(commandId: string): Promise<void> {
        this.comandos = this.comandos.filter(
            (comando) => comando.commandId !== commandId
        );
        await this.persistir();
    }

    private static async persistir(): Promise<void> {
        await FilaComandosPersistenceService.salvar(this.comandos);
        this.notificar();
    }

    private static notificar(): void {
        const comandos = this.listar();
        this.ouvintes.forEach((ouvinte) => ouvinte(comandos));
    }
}
