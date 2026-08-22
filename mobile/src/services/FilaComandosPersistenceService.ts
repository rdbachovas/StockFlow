import AsyncStorage from "@react-native-async-storage/async-storage";

import { ComandoPendente } from "../models/ComandoPendente";

export const CHAVE_FILA_COMANDOS = "@stockflow/fila-comandos";
export const VERSAO_FILA_COMANDOS = 2;

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
                ![1, VERSAO_FILA_COMANDOS].includes(envelope.versao ?? 0) ||
                !Array.isArray(envelope.comandos)
            ) {
                return [];
            }

            return envelope.comandos
                .filter((comando) => this.valido(comando))
                .map((comando) => ({
                    ...comando,
                    status: comando.status === "ENVIANDO"
                        ? "PENDENTE"
                        : comando.status
                })) as ComandoPendente[];
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
            ["PENDENTE", "ENVIANDO", "CONFIRMADO", "ERRO", "CONFLITO"].includes(
                comando.status as string
            )
        );
    }
}
