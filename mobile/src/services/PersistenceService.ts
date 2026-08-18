import AsyncStorage from "@react-native-async-storage/async-storage";

import { DadosIniciais } from "../data/AppData";

export const CHAVE_ESTADO_APP =
    "@stockflow/estado";

export const VERSAO_ESTADO_APP = 2;

interface EnvelopePersistencia {
    versao: number;
    dados: DadosIniciais;
}

export type ResultadoCarregamento =
    | {
        tipo: "AUSENTE";
    }
    | {
        tipo: "VALIDO";
        dados: DadosIniciais;
    }
    | {
        tipo: "INVALIDO";
        motivo: string;
    };

function objeto(
    valor: unknown
): valor is Record<string, unknown> {
    return (
        typeof valor === "object" &&
        valor !== null &&
        !Array.isArray(valor)
    );
}

function texto(
    valor: unknown
): valor is string {
    return (
        typeof valor === "string" &&
        valor.length > 0
    );
}

function numeroNaoNegativo(
    valor: unknown
): valor is number {
    return (
        typeof valor === "number" &&
        Number.isFinite(valor) &&
        valor >= 0
    );
}

function numeroPositivo(
    valor: unknown
): valor is number {
    return (
        numeroNaoNegativo(valor) &&
        valor > 0
    );
}

function dataValida(
    valor: unknown,
    opcional = false
): boolean {
    if (
        opcional &&
        valor === undefined
    ) {
        return true;
    }

    return (
        typeof valor === "string" &&
        !Number.isNaN(
            Date.parse(valor)
        )
    );
}

function estoqueValido(
    valor: unknown
): boolean {
    if (
        !objeto(valor) ||
        !texto(valor.id) ||
        !texto(valor.nome) ||
        !Array.isArray(valor.itens)
    ) {
        return false;
    }

    if (
        valor.responsavelId !== undefined &&
        !texto(valor.responsavelId)
    ) {
        return false;
    }

    return valor.itens.every(
        (item) =>
            objeto(item) &&
            texto(item.produtoId) &&
            numeroNaoNegativo(
                item.quantidade
            )
    );
}

function registroComDataValido(
    valor: unknown
): boolean {
    return (
        objeto(valor) &&
        texto(valor.id) &&
        dataValida(valor.data)
    );
}

function abastecimentoValido(
    valor: unknown
): boolean {
    return (
        registroComDataValido(valor) &&
        objeto(valor) &&
        texto(valor.localId) &&
        texto(valor.responsavelId) &&
        Array.isArray(valor.itens) &&
        valor.itens.every(
            (item) =>
                objeto(item) &&
                texto(item.maquinaId) &&
                texto(item.produtoId) &&
                numeroPositivo(
                    item.quantidade
                )
        )
    );
}

function retiradaValida(
    valor: unknown
): boolean {
    return (
        registroComDataValido(valor) &&
        objeto(valor) &&
        texto(valor.estoqueOrigemId) &&
        texto(valor.estoqueDestinoId) &&
        texto(valor.responsavelId) &&
        Array.isArray(valor.itens) &&
        valor.itens.every(
            (item) =>
                objeto(item) &&
                texto(item.produtoId) &&
                numeroPositivo(
                    item.quantidade
                )
        )
    );
}

function devolucaoValida(
    valor: unknown
): boolean {
    return (
        registroComDataValido(valor) &&
        objeto(valor) &&
        texto(valor.estoqueOrigemId) &&
        texto(valor.estoqueDestinoId) &&
        texto(valor.responsavelId) &&
        Array.isArray(valor.itens) &&
        valor.itens.every(
            (item) =>
                objeto(item) &&
                texto(item.produtoId) &&
                numeroNaoNegativo(
                    item.quantidadeLivre
                ) &&
                Array.isArray(item.reservas) &&
                item.reservas.every(
                    (parcela) =>
                        objeto(parcela) &&
                        texto(
                            parcela.destinoId
                        ) &&
                        numeroPositivo(
                            parcela.quantidade
                        )
                )
        )
    );
}

function itemComSaldosValido(
    valor: unknown
): boolean {
    return (
        objeto(valor) &&
        texto(valor.produtoId) &&
        numeroPositivo(valor.quantidade) &&
        numeroNaoNegativo(
            valor.saldoAnterior
        ) &&
        numeroNaoNegativo(
            valor.saldoPosterior
        )
    );
}

function movimentoValido(
    valor: unknown
): boolean {
    return (
        registroComDataValido(valor) &&
        objeto(valor) &&
        texto(valor.tipo) &&
        texto(valor.responsavelId) &&
        Array.isArray(valor.itens) &&
        valor.itens.every(
            itemComSaldosValido
        )
    );
}

function consumoValido(
    valor: unknown
): boolean {
    return (
        registroComDataValido(valor) &&
        objeto(valor) &&
        texto(valor.responsavelId) &&
        Array.isArray(valor.itens) &&
        valor.itens.every(
            itemComSaldosValido
        )
    );
}

function reservaValida(
    valor: unknown
): boolean {
    if (
        !objeto(valor) ||
        !texto(valor.id) ||
        !texto(valor.responsavelId) ||
        !texto(valor.destinoId) ||
        !texto(valor.produtoId) ||
        !numeroNaoNegativo(valor.quantidade) ||
        !numeroNaoNegativo(
            valor.quantidadeUtilizada
        ) ||
        !texto(valor.status) ||
        !dataValida(
            valor.dataCriacao,
            true
        )
    ) {
        return false;
    }

    if (
        valor.quantidadeLiberada !== undefined &&
        !numeroNaoNegativo(
            valor.quantidadeLiberada
        )
    ) {
        return false;
    }

    if (
        valor.historico === undefined
    ) {
        return true;
    }

    return (
        Array.isArray(valor.historico) &&
        valor.historico.every(
            (evento) =>
                registroComDataValido(
                    evento
                ) &&
                objeto(evento) &&
                texto(evento.tipo) &&
                numeroNaoNegativo(
                    evento.quantidade
                )
        )
    );
}

function dadosValidos(
    valor: unknown
): valor is DadosIniciais {
    if (!objeto(valor) || !numeroNaoNegativo(valor.revisaoServidor)) {
        return false;
    }

    if (
        !estoqueValido(
            valor.estoquePrincipal
        ) ||
        !estoqueValido(
            valor.estoqueRodrigo
        ) ||
        !estoqueValido(
            valor.estoqueCesar
        ) ||
        !Array.isArray(valor.reservas) ||
        !Array.isArray(valor.abastecimentos) ||
        !Array.isArray(valor.retiradas) ||
        !Array.isArray(valor.devolucoes) ||
        !Array.isArray(
            valor.movimentosEstoquePrincipal
        ) ||
        !Array.isArray(valor.consumosCarrinho)
    ) {
        return false;
    }

    return (
        valor.reservas.every(reservaValida) &&
        valor.abastecimentos.every(
            abastecimentoValido
        ) &&
        valor.retiradas.every(retiradaValida) &&
        valor.devolucoes.every(devolucaoValida) &&
        valor.movimentosEstoquePrincipal.every(
            movimentoValido
        ) &&
        valor.consumosCarrinho.every(
            consumoValido
        )
    );
}

function restaurarDatas(
    dados: DadosIniciais
): DadosIniciais {
    return {
        ...dados,

        reservas:
            dados.reservas.map(
                (reserva) => ({
                    ...reserva,

                    dataCriacao:
                        reserva.dataCriacao
                            ? new Date(
                                reserva.dataCriacao
                            )
                            : undefined,

                    historico:
                        reserva.historico?.map(
                            (evento) => ({
                                ...evento,
                                data:
                                    new Date(
                                        evento.data
                                    )
                            })
                        )
                })
            ),

        abastecimentos:
            dados.abastecimentos.map(
                (item) => ({
                    ...item,
                    data: new Date(item.data)
                })
            ),

        retiradas:
            dados.retiradas.map(
                (item) => ({
                    ...item,
                    data: new Date(item.data)
                })
            ),

        devolucoes:
            dados.devolucoes.map(
                (item) => ({
                    ...item,
                    data: new Date(item.data)
                })
            ),

        movimentosEstoquePrincipal:
            dados.movimentosEstoquePrincipal.map(
                (item) => ({
                    ...item,
                    data: new Date(item.data)
                })
            ),

        consumosCarrinho:
            dados.consumosCarrinho.map(
                (item) => ({
                    ...item,
                    data: new Date(item.data)
                })
            )
    };
}

export class PersistenceService {

    private static filaSalvamento:
        Promise<void> =
            Promise.resolve();

    static async carregar():
        Promise<ResultadoCarregamento> {
        let conteudo: string | null;

        try {
            conteudo =
                await AsyncStorage.getItem(
                    CHAVE_ESTADO_APP
                );
        } catch {
            return {
                tipo: "INVALIDO",
                motivo:
                    "Não foi possível ler o estado salvo."
            };
        }

        if (conteudo === null) {
            return {
                tipo: "AUSENTE"
            };
        }

        let envelope: unknown;

        try {
            envelope = JSON.parse(conteudo);
        } catch {
            return {
                tipo: "INVALIDO",
                motivo:
                    "O estado salvo não contém JSON válido."
            };
        }

        if (!objeto(envelope) || ![1, VERSAO_ESTADO_APP].includes(envelope.versao as number)) {
            return {
                tipo: "INVALIDO",
                motivo:
                    "A versão do estado salvo não é suportada."
            };
        }

        const dadosCompatíveis = envelope.versao === 1 && objeto(envelope.dados)
            ? { ...envelope.dados, revisaoServidor: 0 }
            : envelope.dados;

        if (!dadosValidos(dadosCompatíveis)) {
            return {
                tipo: "INVALIDO",
                motivo:
                    "O estado salvo possui dados inválidos."
            };
        }

        return {
            tipo: "VALIDO",
            dados:
                restaurarDatas(
                    dadosCompatíveis
                )
        };
    }

    static async salvar(
        dados: DadosIniciais
    ): Promise<void> {
        const envelope: EnvelopePersistencia = {
            versao:
                VERSAO_ESTADO_APP,
            dados
        };

        const salvamento =
            this.filaSalvamento.then(
                () =>
                    AsyncStorage.setItem(
                        CHAVE_ESTADO_APP,
                        JSON.stringify(
                            envelope
                        )
                    )
            );

        this.filaSalvamento =
            salvamento.catch(
                () => undefined
            );

        await salvamento;
    }
}
