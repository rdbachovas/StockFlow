import React, { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    View
} from "react-native";

import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Screen } from "../components/layout/Screen";
import { Palette, Spacing, Typography } from "../constants/theme";
import { useApp } from "../context/AppContext";
import { ComandoPendente } from "../models/ComandoPendente";

const NOMES: Record<ComandoPendente["tipo"], string> = {
    RETIRADA: "Retirada",
    CRIAR_RESERVA: "Criar reserva",
    CANCELAR_RESERVA: "Cancelar reserva",
    ABASTECIMENTO: "Abastecimento",
    DEVOLUCAO: "Devolução",
    MOVIMENTO_PRINCIPAL: "Movimento do Principal",
    CONSUMO_CARRINHO: "Consumo do carrinho"
};

export function SincronizacaoScreen() {
    const {
        comandosFila,
        estadoSincronizacao,
        quantidadeComandosPendentes,
        reenviarComando,
        descartarComando
    } = useApp();
    const [executando, setExecutando] = useState<string>();

    const reenviar = async (commandId: string) => {
        setExecutando(commandId);
        try {
            await reenviarComando(commandId);
        } catch (erro) {
            Alert.alert(
                "Não foi possível reenviar",
                erro instanceof Error ? erro.message : "Tente novamente mais tarde."
            );
        } finally {
            setExecutando(undefined);
        }
    };

    const confirmarDescarte = (comando: ComandoPendente) => {
        Alert.alert(
            "Descartar intenção?",
            "Esta ação remove apenas a intenção local. Nenhum saldo será alterado.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Descartar",
                    style: "destructive",
                    onPress: () => void descartarComando(comando.commandId)
                }
            ]
        );
    };

    return (
        <Screen>
            <Text style={styles.titulo}>Sincronização</Text>
            <Text style={styles.resumo}>Conexão: {estadoSincronizacao}</Text>
            <Text style={styles.aviso}>
                {quantidadeComandosPendentes} operação(ões) pendente(s). Enquanto a fila não terminar, os saldos exibidos são os últimos confirmados pelo servidor.
            </Text>

            <View style={styles.lista}>
                {comandosFila.length === 0 ? (
                    <Card><Text style={styles.texto}>A fila está vazia.</Text></Card>
                ) : comandosFila.map((comando) => {
                    const requerAtencao = ["ERRO", "CONFLITO"].includes(comando.status);
                    return (
                        <Card key={comando.commandId} style={requerAtencao ? styles.atencao : undefined}>
                            <Text style={styles.tipo}>{NOMES[comando.tipo]}</Text>
                            <Text style={styles.texto}>Status: {comando.status}</Text>
                            <Text style={styles.texto}>
                                Criado em: {new Date(comando.dataCriacao).toLocaleString("pt-BR")}
                            </Text>
                            {comando.motivo && <Text style={styles.motivo}>{comando.motivo}</Text>}
                            {comando.erro && <Text style={styles.erro}>Servidor: {comando.erro}</Text>}
                            {comando.revisaoConhecida !== undefined && (
                                <Text style={styles.texto}>Revisão conhecida: {comando.revisaoConhecida}</Text>
                            )}
                            {requerAtencao && (
                                <View style={styles.acoes}>
                                    <Button
                                        label="Reenviar"
                                        variant="secondary"
                                        loading={executando === comando.commandId}
                                        disabled={estadoSincronizacao !== "ONLINE"}
                                        onPress={() => void reenviar(comando.commandId)}
                                        style={styles.botao}
                                    />
                                    <Button
                                        label="Descartar"
                                        variant="dangerGhost"
                                        onPress={() => confirmarDescarte(comando)}
                                        style={styles.botao}
                                    />
                                </View>
                            )}
                        </Card>
                    );
                })}
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    titulo: { ...Typography.screenTitle, color: Palette.text },
    resumo: { ...Typography.body, color: Palette.text, marginTop: Spacing.two },
    aviso: { ...Typography.body, color: Palette.warning, marginTop: Spacing.two },
    lista: { gap: Spacing.two, marginTop: Spacing.four },
    atencao: { borderColor: Palette.warning },
    tipo: { ...Typography.cardTitle, color: Palette.text },
    texto: { ...Typography.body, color: Palette.textSecondary, marginTop: Spacing.one },
    motivo: { ...Typography.body, color: Palette.warning, marginTop: Spacing.two },
    erro: { ...Typography.body, color: Palette.danger, marginTop: Spacing.one },
    acoes: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.three },
    botao: { flex: 1 }
});
