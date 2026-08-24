import AsyncStorage from "@react-native-async-storage/async-storage";

import { ComandoPendente } from "../models/ComandoPendente";

export const CHAVE_FILA_COMANDOS = "@stockflow/fila-comandos";
export const VERSAO_FILA_COMANDOS = 4;

interface EnvelopeFila {
    versao: number;
    comandos: ComandoPendente[];
}

export class FilaComandosPersistenceService {
    private static filaSalvamento: Promise<void> = Promise.resolve();

    static async carregar(): Promise<ComandoPendente[]> {
        const conteudo = await AsyncStorage.getItem(CHAVE_FILA_COMANDOS);
        if (conteudo === null) {
            return [];
        }

        try {
            const envelope = JSON.parse(conteudo) as Partial<EnvelopeFila>;
            if (
                ![1, 2, 3, VERSAO_FILA_COMANDOS].includes(envelope.versao ?? 0) ||
                !Array.isArray(envelope.comandos)
            ) {
                return [];
            }

            const comandos = envelope.comandos
                .filter((comando) => this.valido(comando))
                .map((comando) => this.migrar(comando as ComandoPendente))
                .map((comando) => ({
                    ...comando,
                    status: comando.status === "ENVIANDO"
                        ? "PENDENTE"
                        : comando.status
                })) as ComandoPendente[];
            const continhaIdentidadeNoPayload = envelope.comandos.some(
                (comando) => this.possuiResponsavelIdNoPayload(comando)
            );
            if (
                envelope.versao !== VERSAO_FILA_COMANDOS ||
                continhaIdentidadeNoPayload
            ) {
                await this.salvar(comandos);
            }
            return comandos;
        } catch {
            return [];
        }
    }

    static async salvar(comandos: ComandoPendente[]): Promise<void> {
        const envelope: EnvelopeFila = {
            versao: VERSAO_FILA_COMANDOS,
            comandos
        };
        const salvamento = this.filaSalvamento.then(() =>
            AsyncStorage.setItem(CHAVE_FILA_COMANDOS, JSON.stringify(envelope))
        );
        this.filaSalvamento = salvamento.catch(() => undefined);
        await salvamento;
    }

    private static valido(valor: unknown): valor is ComandoPendente {
        if (typeof valor !== "object" || valor === null) {
            return false;
        }
        const comando = valor as Record<string, unknown>;
        return (
            typeof comando.commandId === "string" &&
            typeof comando.tipo === "string" &&
            typeof comando.payload === "object" &&
            comando.payload !== null &&
            typeof comando.dataCriacao === "string" &&
            typeof comando.tentativas === "number" &&
            ["PENDENTE", "ENVIANDO", "CONFIRMADO", "ERRO", "CONFLITO", "REQUER_ATENCAO"].includes(
                comando.status as string
            )
        );
    }

    private static migrar(comando: ComandoPendente): ComandoPendente {
        const payload = comando.payload as unknown as Record<string, unknown>;
        const corpo = payload.corpo as Record<string, unknown> | undefined;
        const usuarioIdCriador = comando.usuarioIdCriador ??
            payload.responsavelId ?? corpo?.responsavelId;
        const payloadMigrado = this.removerResponsavelId(payload);
        if (usuarioIdCriador === "RODRIGO" || usuarioIdCriador === "CESAR") {
            return {
                ...comando,
                usuarioIdCriador,
                payload: payloadMigrado
            } as unknown as ComandoPendente;
        }
        return {
            ...comando,
            payload: payloadMigrado,
            status: "REQUER_ATENCAO",
            motivo: "Não foi possível identificar com segurança quem criou este comando antigo."
        } as unknown as ComandoPendente;
    }

    private static removerResponsavelId(
        payload: Record<string, unknown>
    ): Record<string, unknown> {
        const { responsavelId: _responsavelId, ...semResponsavel } = payload;
        if (typeof corpoDo(semResponsavel) !== "object") {
            return semResponsavel;
        }
        const {
            responsavelId: _responsavelIdCorpo,
            ...corpoSemResponsavel
        } = corpoDo(semResponsavel) as Record<string, unknown>;
        return { ...semResponsavel, corpo: corpoSemResponsavel };
    }

    private static possuiResponsavelIdNoPayload(valor: unknown): boolean {
        if (typeof valor !== "object" || valor === null) {
            return false;
        }
        const payload = (valor as Record<string, unknown>).payload;
        if (typeof payload !== "object" || payload === null) {
            return false;
        }
        const payloadTipado = payload as Record<string, unknown>;
        return "responsavelId" in payloadTipado ||
            (corpoDo(payloadTipado) !== undefined &&
                "responsavelId" in corpoDo(payloadTipado)!);
    }
}

function corpoDo(payload: Record<string, unknown>): Record<string, unknown> | undefined {
    const corpo = payload.corpo;
    return typeof corpo === "object" && corpo !== null
        ? corpo as Record<string, unknown>
        : undefined;
}
