import React, {
    useMemo,
    useState
} from "react";

import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import {
    DestinoReservaId
} from "../models/DestinoReserva";

import {
    Reserva,
    StatusReserva,
    TipoEventoReserva
} from "../models/Reserva";

import {
    UsuarioId
} from "../models/Usuario";

import {
    ReservaService
} from "../services/ReservaService";

import {
    nomeProduto
} from "../utils/ProdutoUtils";

interface Props {
    reservas: Reserva[];
}

interface EventoHistorico {
    id: string;

    reserva: Reserva;

    tipo: TipoEventoReserva;

    quantidade: number;

    data: Date;

    observacao?: string;
}

function nomeResponsavel(
    id: string
): string {

    return id ===
        UsuarioId.RODRIGO
        ? "Rodrigo"
        : id ===
            UsuarioId.CESAR
            ? "Cesar"
            : id;
}

function nomeDestino(
    destino: DestinoReservaId
): string {

    switch (destino) {

        case DestinoReservaId.BOULEVARD:
            return "Boulevard";

        case DestinoReservaId.AEROPORTO:
            return "Aeroporto";

        case DestinoReservaId.MERCADOS:
            return "Mercados";

        case DestinoReservaId.SUPERMAGO_BOA_VISTA:
            return "SuperMago Boa Vista";

        default:
            return String(destino);
    }
}

function nomeEvento(
    tipo: TipoEventoReserva
): string {

    switch (tipo) {

        case TipoEventoReserva.CRIACAO:
            return "Reserva criada";

        case TipoEventoReserva.UTILIZACAO:
            return "Utilizada em abastecimento";

        case TipoEventoReserva.LIBERACAO:
            return "Quantidade liberada";

        case TipoEventoReserva.CANCELAMENTO:
            return "Reserva cancelada";

        case TipoEventoReserva.CONCLUSAO:
            return "Reserva concluída";
    }
}

function textoStatus(
    status: StatusReserva
): string {

    switch (status) {

        case StatusReserva.ATIVA:
            return "Ativa";

        case StatusReserva.CANCELADA:
            return "Cancelada";

        case StatusReserva.CONCLUIDA:
            return "Concluída";
    }
}

export function HistoricoReservasScreen({
    reservas
}: Props) {

    const [
        responsavel,
        setResponsavel
    ] = useState<
        UsuarioId | "TODOS"
    >("TODOS");

    const eventos =
        useMemo(
            () => {

                const lista:
                    EventoHistorico[] = [];

                for (
                    const reserva
                    of reservas
                ) {

                    for (
                        const evento
                        of reserva.historico ??
                        []
                    ) {

                        lista.push({

                            id:
                                `${reserva.id}_${evento.id}`,

                            reserva,

                            tipo:
                                evento.tipo,

                            quantidade:
                                evento.quantidade,

                            data:
                                evento.data,

                            observacao:
                                evento.observacao
                        });
                    }
                }

                return lista.sort(
                    (a, b) =>
                        new Date(
                            b.data
                        ).getTime() -
                        new Date(
                            a.data
                        ).getTime()
                );
            },
            [reservas]
        );

    const filtrados =
        useMemo(
            () => {

                if (
                    responsavel ===
                    "TODOS"
                ) {
                    return eventos;
                }

                return eventos.filter(
                    (evento) =>
                        evento.reserva.responsavelId ===
                        responsavel
                );
            },
            [
                eventos,
                responsavel
            ]
        );

    function quantidadeEvento(
        evento: EventoHistorico
    ): string {

        switch (evento.tipo) {

            case TipoEventoReserva.CRIACAO:

                return `+${evento.quantidade}`;

            case TipoEventoReserva.UTILIZACAO:
            case TipoEventoReserva.LIBERACAO:
            case TipoEventoReserva.CANCELAMENTO:

                return `-${evento.quantidade}`;

            case TipoEventoReserva.CONCLUSAO:

                return "✓";
        }
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={
                styles.conteudo
            }
        >

            <Text
                style={styles.titulo}
            >
                Histórico de Reservas
            </Text>

            <Text
                style={styles.subtitulo}
            >
                Veja como cada reserva foi criada, utilizada, liberada ou encerrada
            </Text>

            <View
                style={styles.filtros}
            >

                {
                    [
                        ["TODOS", "Todos"],
                        [
                            UsuarioId.RODRIGO,
                            "Rodrigo"
                        ],
                        [
                            UsuarioId.CESAR,
                            "Cesar"
                        ]
                    ].map(
                        ([valor, nome]) => (

                            <TouchableOpacity
                                key={
                                    valor
                                }

                                style={[
                                    styles.filtro,

                                    responsavel ===
                                        valor &&
                                    styles.filtroAtivo
                                ]}

                                onPress={
                                    () =>
                                        setResponsavel(
                                            valor as
                                                UsuarioId |
                                                "TODOS"
                                        )
                                }
                            >

                                <Text
                                    style={[
                                        styles.filtroTexto,

                                        responsavel ===
                                            valor &&
                                        styles.filtroTextoAtivo
                                    ]}
                                >
                                    {nome}
                                </Text>

                            </TouchableOpacity>
                        )
                    )
                }

            </View>

            {
                filtrados.length ===
                0
                    ? (
                        <View
                            style={styles.vazio}
                        >
                            <Text
                                style={styles.vazioTitulo}
                            >
                                Nenhum evento de reserva
                            </Text>

                            <Text
                                style={styles.vazioTexto}
                            >
                                As próximas reservas aparecerão aqui.
                            </Text>
                        </View>
                    )
                    : filtrados.map(
                        (evento) => {

                            const reserva =
                                evento.reserva;

                            const restante =
                                ReservaService
                                    .quantidadeRestante(
                                        reserva
                                    );

                            return (
                                <View
                                    key={
                                        evento.id
                                    }
                                    style={
                                        styles.card
                                    }
                                >

                                    <View
                                        style={
                                            styles.topo
                                        }
                                    >

                                        <View
                                            style={
                                                styles.topoInfo
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.evento
                                                }
                                            >
                                                {
                                                    nomeEvento(
                                                        evento.tipo
                                                    )
                                                }
                                            </Text>

                                            <Text
                                                style={
                                                    styles.produto
                                                }
                                            >
                                                {
                                                    nomeProduto(
                                                        reserva.produtoId
                                                    )
                                                }
                                            </Text>

                                        </View>

                                        <Text
                                            style={
                                                styles.quantidade
                                            }
                                        >
                                            {
                                                quantidadeEvento(
                                                    evento
                                                )
                                            }
                                        </Text>

                                    </View>

                                    <View
                                        style={
                                            styles.destinoBox
                                        }
                                    >

                                        <View
                                            style={
                                                styles.linha
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.label
                                                }
                                            >
                                                Responsável
                                            </Text>

                                            <Text
                                                style={
                                                    styles.valor
                                                }
                                            >
                                                {
                                                    nomeResponsavel(
                                                        reserva.responsavelId
                                                    )
                                                }
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.linha
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.label
                                                }
                                            >
                                                Destino
                                            </Text>

                                            <Text
                                                style={
                                                    styles.valor
                                                }
                                            >
                                                {
                                                    nomeDestino(
                                                        reserva.destinoId
                                                    )
                                                }
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.linha
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.label
                                                }
                                            >
                                                Status atual
                                            </Text>

                                            <Text
                                                style={
                                                    styles.valor
                                                }
                                            >
                                                {
                                                    textoStatus(
                                                        reserva.status
                                                    )
                                                }
                                            </Text>
                                        </View>

                                    </View>

                                    <View
                                        style={
                                            styles.resumo
                                        }
                                    >

                                        <View
                                            style={
                                                styles.resumoColuna
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.resumoLabel
                                                }
                                            >
                                                Original
                                            </Text>

                                            <Text
                                                style={
                                                    styles.resumoValor
                                                }
                                            >
                                                {
                                                    reserva.quantidade
                                                }
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.resumoColuna
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.resumoLabel
                                                }
                                            >
                                                Utilizado
                                            </Text>

                                            <Text
                                                style={
                                                    styles.resumoValor
                                                }
                                            >
                                                {
                                                    reserva.quantidadeUtilizada
                                                }
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.resumoColuna
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.resumoLabel
                                                }
                                            >
                                                Liberado
                                            </Text>

                                            <Text
                                                style={
                                                    styles.resumoValor
                                                }
                                            >
                                                {
                                                    reserva.quantidadeLiberada ??
                                                    0
                                                }
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.resumoColuna
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.resumoLabel
                                                }
                                            >
                                                Restante
                                            </Text>

                                            <Text
                                                style={
                                                    styles.resumoValor
                                                }
                                            >
                                                {
                                                    restante
                                                }
                                            </Text>
                                        </View>

                                    </View>

                                    <Text
                                        style={
                                            styles.data
                                        }
                                    >
                                        {
                                            new Date(
                                                evento.data
                                            ).toLocaleString(
                                                "pt-BR"
                                            )
                                        }
                                    </Text>

                                    {
                                        evento.observacao
                                            ? (
                                                <Text
                                                    style={
                                                        styles.observacao
                                                    }
                                                >
                                                    {
                                                        evento.observacao
                                                    }
                                                </Text>
                                            )
                                            : null
                                    }

                                </View>
                            );
                        }
                    )
            }

        </ScrollView>
    );
}

const styles =
    StyleSheet.create({

        container: {
            flex: 1,
            backgroundColor: "#F5F5F5"
        },

        conteudo: {
            padding: 20,
            paddingBottom: 60
        },

        titulo: {
            fontSize: 28,
            fontWeight: "800"
        },

        subtitulo: {
            color: "#666666",
            marginTop: 4,
            marginBottom: 20
        },

        filtros: {
            flexDirection: "row",
            gap: 8,
            marginBottom: 22
        },

        filtro: {
            flex: 1,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#DDDDDD",
            borderRadius: 10,
            padding: 10,
            alignItems: "center"
        },

        filtroAtivo: {
            backgroundColor: "#111111",
            borderColor: "#111111"
        },

        filtroTexto: {
            fontWeight: "700"
        },

        filtroTextoAtivo: {
            color: "#FFFFFF"
        },

        card: {
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 16,
            marginBottom: 12
        },

        topo: {
            flexDirection: "row",
            justifyContent: "space-between"
        },

        topoInfo: {
            flex: 1
        },

        evento: {
            color: "#666666",
            fontSize: 12,
            fontWeight: "800"
        },

        produto: {
            fontSize: 19,
            fontWeight: "800",
            marginTop: 3
        },

        quantidade: {
            fontSize: 24,
            fontWeight: "800"
        },

        destinoBox: {
            borderTopWidth: 1,
            borderTopColor: "#EEEEEE",
            marginTop: 12,
            paddingTop: 10
        },

        linha: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 5
        },

        label: {
            color: "#777777"
        },

        valor: {
            fontWeight: "600"
        },

        resumo: {
            backgroundColor: "#F7F7F7",
            borderRadius: 10,
            padding: 10,
            marginTop: 10,
            flexDirection: "row"
        },

        resumoColuna: {
            flex: 1
        },

        resumoLabel: {
            color: "#777777",
            fontSize: 10
        },

        resumoValor: {
            fontWeight: "800",
            fontSize: 17,
            marginTop: 2
        },

        data: {
            color: "#777777",
            fontSize: 12,
            marginTop: 10
        },

        observacao: {
            fontSize: 12,
            marginTop: 4
        },

        vazio: {
            backgroundColor: "#FFFFFF",
            padding: 20,
            borderRadius: 14
        },

        vazioTitulo: {
            fontWeight: "700",
            textAlign: "center"
        },

        vazioTexto: {
            color: "#666666",
            textAlign: "center",
            marginTop: 4
        }
    });
