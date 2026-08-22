import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
    DadosIniciais
} from "../data/AppData";

import { Abastecimento } from "../models/Abastecimento";

import {
    ConsumoCarrinho,
    SolicitacaoConsumoCarrinho
} from "../models/ConsumoCarrinho";

import { DevolucaoEstoque } from "../models/DevolucaoEstoque";
import { Estoque } from "../models/Estoque";

import {
    MovimentoEstoquePrincipal,
    SolicitacaoMovimentoEstoquePrincipal
} from "../models/MovimentoEstoquePrincipal";

import { Reserva } from "../models/Reserva";
import { RetiradaEstoque } from "../models/RetiradaEstoque";

import { AbastecimentoRemotoService } from "../services/AbastecimentoRemotoService";
import { ConsumoCarrinhoRemotoService } from "../services/ConsumoCarrinhoRemotoService";
import { DevolucaoRemotaService } from "../services/DevolucaoRemotaService";
import { MovimentoEstoquePrincipalRemotoService } from "../services/MovimentoEstoquePrincipalRemotoService";
import {
    EstadoSincronizacao,
    InicializacaoService
} from "../services/InicializacaoService";
import { ReservaRemotaService } from "../services/ReservaRemotaService";
import { RetiradaRemotaService } from "../services/RetiradaRemotaService";
import { ComandoPendente } from "../models/ComandoPendente";
import { FilaComandosService } from "../services/FilaComandosService";
import { IdentidadeOperacionalService } from "../services/IdentidadeOperacionalService";
import {
    OperacaoRemotaCoordinator,
    ResultadoOperacao
} from "../services/OperacaoRemotaCoordinator";
import { useAuth } from "./AuthContext";

interface AppContextValue {

    estadoSincronizacao: EstadoSincronizacao;

    quantidadeComandosPendentes: number;

    comandosFila: ComandoPendente[];

    comandosComErro: ComandoPendente[];

    reenviarComando: (commandId: string) => Promise<void>;

    descartarComando: (commandId: string) => Promise<void>;

    estoquePrincipal: Estoque;

    estoqueRodrigo: Estoque;

    estoqueCesar: Estoque;

    reservas: Reserva[];

    abastecimentos: Abastecimento[];

    retiradas: RetiradaEstoque[];

    devolucoes: DevolucaoEstoque[];

    movimentosEstoquePrincipal:
        MovimentoEstoquePrincipal[];

    consumosCarrinho:
        ConsumoCarrinho[];

    registrarRetirada:
        (
            retirada: RetiradaEstoque
        ) => Promise<void>;

    registrarAbastecimento:
        (
            abastecimento: Abastecimento
        ) => Promise<void>;

    criarReserva:
        (
            reserva: Reserva
        ) => Promise<void>;

    cancelarReserva:
        (
            reservaId: string,
            responsavelId: string
        ) => Promise<void>;

    registrarDevolucao:
        (
            devolucao: DevolucaoEstoque
        ) => Promise<void>;

    registrarMovimentoEstoquePrincipal:
        (
            solicitacao:
                SolicitacaoMovimentoEstoquePrincipal
        ) => Promise<void>;

    registrarConsumoCarrinho:
        (
            solicitacao:
                SolicitacaoConsumoCarrinho
        ) => Promise<void>;

    sincronizarSnapshotPendente: () => Promise<void>;
}

const AppContext =
    createContext<
        AppContextValue | undefined
    >(undefined);

interface Props {
    children: ReactNode;
}

export function AppProvider({
    children
}: Props) {
    const { usuario, logout } = useAuth();

    if (!usuario) {
        throw new Error("AppProvider exige uma sessão autenticada.");
    }

    const [
        dados,
        setDados
    ] = useState<DadosIniciais | null>(
        null
    );

    const [
        hidratado,
        setHidratado
    ] = useState(false);

    const [
        estadoSincronizacao,
        setEstadoSincronizacao
    ] = useState<EstadoSincronizacao>("CARREGANDO");

    const [comandosFila, setComandosFila] = useState<ComandoPendente[]>([]);

    useEffect(
        () => {
            let ativo = true;

            const hidratar = async () => {
                const resultado =
                    await InicializacaoService
                        .carregar();

                if (!ativo) {
                    return;
                }

                OperacaoRemotaCoordinator.registrarRevisaoAplicada(
                    resultado.dados.revisaoServidor
                );
                setDados(resultado.dados);
                setEstadoSincronizacao(
                    resultado.estadoSincronizacao
                );
                setHidratado(true);

                if (resultado.estadoSincronizacao === "ONLINE") {
                    void FilaComandosService.processar(
                        "ONLINE",
                        usuario.id,
                        setEstadoSincronizacao,
                        aplicarResultado
                    );
                }
            };

            void hidratar();

            return () => {
                ativo = false;
            };
        },
        []
    );

    useEffect(() => FilaComandosService.observar(setComandosFila), []);

    useEffect(() => {
        if (!["OFFLINE", "DESATUALIZADO"].includes(estadoSincronizacao)) {
            return;
        }
        const intervalo = setInterval(() => {
            void InicializacaoService.carregar().then((resultado) => {
                if (resultado.estadoSincronizacao !== "ONLINE") {
                    return;
                }
                OperacaoRemotaCoordinator.registrarRevisaoAplicada(
                    resultado.dados.revisaoServidor
                );
                setDados(resultado.dados);
                setEstadoSincronizacao("ONLINE");
                void FilaComandosService.processar(
                    "ONLINE",
                    usuario.id,
                    setEstadoSincronizacao,
                    aplicarResultado
                );
            });
        }, 10000);
        return () => clearInterval(intervalo);
    }, [estadoSincronizacao, usuario.id]);

    const salvarOffline = async (
        tipo: Parameters<typeof FilaComandosService.adicionar>[0],
        payload: Record<string, unknown>
    ): Promise<void> => {
        await FilaComandosService.adicionar(tipo, payload, usuario.id);
        throw new Error(
            "Operação salva offline e mantida como pendente. O saldo ainda não foi atualizado."
        );
    };

    const aplicarResultado = (
        resultado: ResultadoOperacao
    ): void => {
        if (resultado.tipo === "REJEITADA") {
            throw resultado.erro;
        }

        if (resultado.tipo === "POST_AMBIGUO") {
            setEstadoSincronizacao("OFFLINE");
            throw resultado.erro;
        }

        if (resultado.tipo === "CONFIRMADA_PENDENTE_SNAPSHOT") {
            setEstadoSincronizacao("DESATUALIZADO");
            return;
        }

        OperacaoRemotaCoordinator.registrarRevisaoAplicada(
            resultado.dados.revisaoServidor
        );
        setDados((dadosAtuais) =>
            dadosAtuais === null ||
            resultado.dados.revisaoServidor >= dadosAtuais.revisaoServidor
                ? resultado.dados
                : dadosAtuais
        );
        setEstadoSincronizacao("ONLINE");

        if (!resultado.cacheAtualizado) {
            console.error(
                "Snapshot aplicado, mas não foi possível atualizar o cache.",
                resultado.erroCache
            );
        }
    };

    const registrarRetirada = (
        retirada: RetiradaEstoque
    ): Promise<void> => {
        exigirIdentidade(retirada.responsavelId);
        if (estadoSincronizacao === "OFFLINE") {
            return salvarOffline("RETIRADA", {
                responsavelId: retirada.responsavelId,
                itens: retirada.itens.map(({ produtoId, quantidade }) => ({ produtoId, quantidade })),
                data: retirada.data.toISOString(),
                observacao: retirada.observacao
            });
        }
        return RetiradaRemotaService
            .registrar(
                retirada,
                estadoSincronizacao,
                setEstadoSincronizacao
            )
            .then(aplicarResultado);
    };

    const registrarAbastecimento = (
        abastecimento: Abastecimento
    ): Promise<void> => {
        exigirIdentidade(abastecimento.responsavelId);
        if (estadoSincronizacao === "OFFLINE") {
            return salvarOffline("ABASTECIMENTO", {
                responsavelId: abastecimento.responsavelId,
                local: abastecimento.localId,
                itens: abastecimento.itens.map((item) => ({ ...item })),
                data: abastecimento.data.toISOString(),
                observacao: abastecimento.observacao
            });
        }
        return AbastecimentoRemotoService
            .registrar(abastecimento, estadoSincronizacao, setEstadoSincronizacao)
            .then(aplicarResultado);
    };

    const criarReserva = (
        reserva: Reserva
    ): Promise<void> => {
        exigirIdentidade(reserva.responsavelId);
        if (estadoSincronizacao === "OFFLINE") {
            return salvarOffline("CRIAR_RESERVA", {
                responsavelId: reserva.responsavelId,
                destino: reserva.destinoId,
                produtoId: reserva.produtoId,
                quantidade: reserva.quantidade
            });
        }
        return ReservaRemotaService
            .criar(reserva, estadoSincronizacao, setEstadoSincronizacao)
            .then(aplicarResultado);
    };

    const cancelarReserva = (
        reservaId: string,
        responsavelId: string
    ): Promise<void> => {
        exigirIdentidade(responsavelId);
        if (estadoSincronizacao === "OFFLINE") {
            return salvarOffline("CANCELAR_RESERVA", {
                reservaId,
                corpo: { responsavelId }
            });
        }
        return ReservaRemotaService
            .cancelar(
                reservaId,
                responsavelId,
                estadoSincronizacao,
                setEstadoSincronizacao
            )
            .then(aplicarResultado);
    };

    const registrarDevolucao = (
        devolucao: DevolucaoEstoque
    ): Promise<void> => {
        exigirIdentidade(devolucao.responsavelId);
        if (estadoSincronizacao === "OFFLINE") {
            return salvarOffline("DEVOLUCAO", {
                responsavelId: devolucao.responsavelId,
                itens: devolucao.itens.map((item) => ({
                    produtoId: item.produtoId,
                    quantidadeLivre: item.quantidadeLivre,
                    reservas: item.reservas.map((reserva) => ({
                        destino: reserva.destinoId,
                        quantidade: reserva.quantidade
                    }))
                })),
                data: devolucao.data.toISOString(),
                observacao: devolucao.observacao
            });
        }
        return DevolucaoRemotaService
            .registrar(devolucao, estadoSincronizacao, setEstadoSincronizacao)
            .then(aplicarResultado);
    };

    const registrarMovimentoEstoquePrincipal = (
        solicitacao:
            SolicitacaoMovimentoEstoquePrincipal
    ): Promise<void> => {
        exigirIdentidade(solicitacao.responsavelId);
        if (estadoSincronizacao === "OFFLINE") {
            return salvarOffline("MOVIMENTO_PRINCIPAL", {
                tipo: solicitacao.tipo,
                itens: solicitacao.itens.map((item) => ({ ...item })),
                data: solicitacao.data.toISOString(),
                observacao: solicitacao.observacao
            });
        }
        return MovimentoEstoquePrincipalRemotoService
            .registrar(solicitacao, estadoSincronizacao, setEstadoSincronizacao)
            .then(aplicarResultado);
    };

    const registrarConsumoCarrinho = (
        solicitacao:
            SolicitacaoConsumoCarrinho
    ): Promise<void> => {
        exigirIdentidade(solicitacao.responsavelId);
        if (estadoSincronizacao === "OFFLINE") {
            return salvarOffline("CONSUMO_CARRINHO", {
                responsavelId: solicitacao.responsavelId,
                itens: solicitacao.itens.map((item) => ({ ...item })),
                data: solicitacao.data.toISOString(),
                observacao: solicitacao.observacao
            });
        }
        return ConsumoCarrinhoRemotoService
            .registrar(solicitacao, estadoSincronizacao, setEstadoSincronizacao)
            .then(aplicarResultado);
    };

    const sincronizarSnapshotPendente = (): Promise<void> => {
        return OperacaoRemotaCoordinator
            .sincronizarPendente(setEstadoSincronizacao)
            .then(aplicarResultado);
    };

    const reenviarComando = (commandId: string): Promise<void> =>
        FilaComandosService.reenviar(
            commandId,
            estadoSincronizacao,
            usuario.id,
            setEstadoSincronizacao,
            aplicarResultado
        );

    const descartarComando = async (commandId: string): Promise<void> => {
        await FilaComandosService.descartar(commandId);
        if (estadoSincronizacao === "ONLINE") {
            await FilaComandosService.processar(
                "ONLINE",
                usuario.id,
                setEstadoSincronizacao,
                aplicarResultado
            );
        }
    };

    const exigirIdentidade = (responsavelId: string): void => {
        IdentidadeOperacionalService.exigirUsuarioAutenticado(usuario.id, responsavelId);
    };

    if (
        !hidratado ||
        !dados
    ) {
        return null;
    }

    return (
        <AppContext.Provider
            value={{

                estadoSincronizacao,

                quantidadeComandosPendentes: comandosFila.filter(
                    (comando) => comando.usuarioIdCriador === usuario.id &&
                        !["ERRO", "CONFLITO", "REQUER_ATENCAO"].includes(comando.status)
                ).length,

                comandosFila,

                comandosComErro: comandosFila.filter(
                    (comando) => comando.usuarioIdCriador === usuario.id &&
                        ["ERRO", "CONFLITO", "REQUER_ATENCAO"].includes(comando.status)
                ),

                reenviarComando,

                descartarComando,

                estoquePrincipal:
                    dados.estoquePrincipal,

                estoqueRodrigo:
                    dados.estoqueRodrigo,

                estoqueCesar:
                    dados.estoqueCesar,

                reservas:
                    dados.reservas,

                abastecimentos:
                    dados.abastecimentos,

                retiradas:
                    dados.retiradas,

                devolucoes:
                    dados.devolucoes,

                movimentosEstoquePrincipal:
                    dados.movimentosEstoquePrincipal,

                consumosCarrinho:
                    dados.consumosCarrinho,

                registrarRetirada,

                registrarAbastecimento,

                criarReserva,

                cancelarReserva,

                registrarDevolucao,

                registrarMovimentoEstoquePrincipal,

                registrarConsumoCarrinho,

                sincronizarSnapshotPendente
            }}
        >
            <View style={styles.conta}>
                <Text style={styles.textoConta}>Conta: {usuario.nome}</Text>
                <Pressable onPress={() => { void logout(); }}>
                    <Text style={styles.sair}>Sair</Text>
                </Pressable>
            </View>
            {comandosFila.some((item) => item.usuarioIdCriador === usuario.id) && (
                <View style={styles.fila}>
                    <Text style={styles.textoFila}>
                        {comandosFila.filter((item) => item.usuarioIdCriador === usuario.id && !["ERRO", "CONFLITO", "REQUER_ATENCAO"].includes(item.status)).length} operação(ões) pendente(s). O saldo exibido ainda é o último confirmado.
                        {comandosFila.some((item) => item.usuarioIdCriador === usuario.id && ["ERRO", "CONFLITO", "REQUER_ATENCAO"].includes(item.status))
                            ? ` ${comandosFila.filter((item) => item.usuarioIdCriador === usuario.id && ["ERRO", "CONFLITO", "REQUER_ATENCAO"].includes(item.status)).length} requer(em) atenção.`
                            : ""}
                    </Text>
                </View>
            )}
            {children}
        </AppContext.Provider>
    );
}

const styles = StyleSheet.create({
    conta: {
        alignItems: "center",
        backgroundColor: "#EAF2FF",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 6
    },
    textoConta: { color: "#173A63", fontSize: 12, fontWeight: "600" },
    sair: { color: "#173A63", fontSize: 12, fontWeight: "700" },
    fila: {
        backgroundColor: "#FFF3CD",
        paddingHorizontal: 12,
        paddingVertical: 6
    },
    textoFila: {
        color: "#664D03",
        fontSize: 12,
        textAlign: "center"
    }
});

export function useApp():
    AppContextValue {

    const contexto =
        useContext(
            AppContext
        );

    if (!contexto) {

        throw new Error(
            "useApp deve ser utilizado dentro de AppProvider."
        );
    }

    return contexto;
}
