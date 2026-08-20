import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState
} from "react";

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
import {
    OperacaoRemotaCoordinator,
    ResultadoOperacao
} from "../services/OperacaoRemotaCoordinator";

interface AppContextValue {

    estadoSincronizacao: EstadoSincronizacao;

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
            };

            void hidratar();

            return () => {
                ativo = false;
            };
        },
        []
    );

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
        return AbastecimentoRemotoService
            .registrar(abastecimento, estadoSincronizacao, setEstadoSincronizacao)
            .then(aplicarResultado);
    };

    const criarReserva = (
        reserva: Reserva
    ): Promise<void> => {
        return ReservaRemotaService
            .criar(reserva, estadoSincronizacao, setEstadoSincronizacao)
            .then(aplicarResultado);
    };

    const cancelarReserva = (
        reservaId: string,
        responsavelId: string
    ): Promise<void> => {
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
        return DevolucaoRemotaService
            .registrar(devolucao, estadoSincronizacao, setEstadoSincronizacao)
            .then(aplicarResultado);
    };

    const registrarMovimentoEstoquePrincipal = (
        solicitacao:
            SolicitacaoMovimentoEstoquePrincipal
    ): Promise<void> => {
        return MovimentoEstoquePrincipalRemotoService
            .registrar(solicitacao, estadoSincronizacao, setEstadoSincronizacao)
            .then(aplicarResultado);
    };

    const registrarConsumoCarrinho = (
        solicitacao:
            SolicitacaoConsumoCarrinho
    ): Promise<void> => {
        return ConsumoCarrinhoRemotoService
            .registrar(solicitacao, estadoSincronizacao, setEstadoSincronizacao)
            .then(aplicarResultado);
    };

    const sincronizarSnapshotPendente = (): Promise<void> => {
        return OperacaoRemotaCoordinator
            .sincronizarPendente(setEstadoSincronizacao)
            .then(aplicarResultado);
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
            {children}
        </AppContext.Provider>
    );
}

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
