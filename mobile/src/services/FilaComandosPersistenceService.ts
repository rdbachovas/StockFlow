import AsyncStorage from "@react-native-async-storage/async-storage";

import { ComandoPendente } from "../models/ComandoPendente";

export const CHAVE_FILA_COMANDOS = "@stockflow/fila-comandos";
export const VERSAO_FILA_COMANDOS = 3;

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
                ![1, 2, VERSAO_FILA_COMANDOS].includes(envelope.versao ?? 0) ||
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
            if (envelope.versao !== VERSAO_FILA_COMANDOS) {
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
        if (comando.usuarioIdCriador) {
            return comando;
        }
        const payload = comando.payload as unknown as Record<string, unknown>;
        const corpo = payload.corpo as Record<string, unknown> | undefined;
        const responsavelId = payload.responsavelId ?? corpo?.responsavelId;
        if (responsavelId === "RODRIGO" || responsavelId === "CESAR") {
            return { ...comando, usuarioIdCriador: responsavelId };
        }
        return {
            ...comando,
            status: "REQUER_ATENCAO",
            motivo: "Não foi possível identificar com segurança quem criou este comando antigo."
        };
    }
}
