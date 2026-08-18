import React, {
    useMemo,
    useState
} from "react";

import {
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

import { QuantityRow } from "../components/domain/QuantityRow";
import { BottomActionBar } from "../components/layout/BottomActionBar";
import { Screen } from "../components/layout/Screen";
import { Section } from "../components/layout/Section";
import { Card } from "../components/ui/Card";
import { Chip } from "../components/ui/Chip";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import {
    Palette,
    Radius,
    Spacing,
    Typography
} from "../constants/theme";
import { Estoque } from "../models/Estoque";
import {
    SolicitacaoMovimentoEstoquePrincipal,
    TipoMovimentoEstoquePrincipal
} from "../models/MovimentoEstoquePrincipal";
import { ProdutoId } from "../models/Produto";
import { UsuarioId } from "../models/Usuario";
import {
    nomeProduto,
    PRODUTOS_CARRINHO,
    PRODUTOS_PELUCIAS
} from "../utils/ProdutoUtils";

interface Props {
    estoquePrincipal: Estoque;
    registrarMovimento: (solicitacao: SolicitacaoMovimentoEstoquePrincipal) => void;
}

type Grupo = "PELUCIAS" | "CARRINHO";

export function MovimentoEstoquePrincipalScreen({ estoquePrincipal, registrarMovimento }: Props) {
    const [tipo, setTipo] = useState<TipoMovimentoEstoquePrincipal>(TipoMovimentoEstoquePrincipal.ENTRADA);
    const [grupo, setGrupo] = useState<Grupo>("PELUCIAS");
    const [responsavel, setResponsavel] = useState<UsuarioId>(UsuarioId.RODRIGO);
    const [quantidades, setQuantidades] = useState<Record<string, string>>({});
    const [observacao, setObservacao] = useState("");
    const [sucesso, setSucesso] = useState<string | null>(null);
    const [erro, setErro] = useState<string | null>(null);
    const todosProdutos = [...PRODUTOS_PELUCIAS, ...PRODUTOS_CARRINHO];
    const produtosVisiveis = grupo === "PELUCIAS" ? PRODUTOS_PELUCIAS : PRODUTOS_CARRINHO;

    const itens = useMemo(
        () => todosProdutos
            .map((produtoId) => ({ produtoId, quantidade: Number(quantidades[produtoId] || 0) }))
            .filter((item) => item.quantidade > 0),
        [quantidades]
    );
    const total = itens.reduce((soma, item) => soma + item.quantidade, 0);
    const saldoAtual = (produtoId: ProdutoId) =>
        estoquePrincipal.itens.find((item) => item.produtoId === produtoId)?.quantidade ?? 0;
    const saldoProjetado = (produtoId: ProdutoId) => {
        const atual = saldoAtual(produtoId);
        const valor = Number(quantidades[produtoId] || 0);
        return tipo === TipoMovimentoEstoquePrincipal.ENTRADA ? atual + valor : atual - valor;
    };

    const confirmar = () => {
        setErro(null);
        setSucesso(null);
        if (itens.length === 0) {
            setErro("Informe pelo menos uma quantidade.");
            return;
        }
        const solicitacao: SolicitacaoMovimentoEstoquePrincipal = {
            id: `MOV_PRINCIPAL_${Date.now()}`,
            tipo,
            responsavelId: responsavel,
            itens,
            data: new Date(),
            observacao: observacao.trim() || undefined
        };
        try {
            registrarMovimento(solicitacao);
            setQuantidades({});
            setObservacao("");
            setSucesso(tipo === TipoMovimentoEstoquePrincipal.ENTRADA
                ? `${total} itens adicionados ao Estoque Principal.`
                : `${total} itens removidos do Estoque Principal.`);
        } catch (caughtError) {
            setErro(caughtError instanceof Error ? caughtError.message : "Erro ao atualizar o estoque.");
        }
    };

    return (
        <View style={styles.container}>
            <Screen contentContainerStyle={styles.content}>
                <Text style={styles.subtitle}>Registre uma entrada física ou uma saída manual.</Text>

                <Section title="Movimento">
                    <View style={styles.chips}>
                        <Chip label="Entrada" selected={tipo === TipoMovimentoEstoquePrincipal.ENTRADA} onPress={() => setTipo(TipoMovimentoEstoquePrincipal.ENTRADA)} />
                        <Chip label="Saída" selected={tipo === TipoMovimentoEstoquePrincipal.SAIDA} onPress={() => setTipo(TipoMovimentoEstoquePrincipal.SAIDA)} />
                    </View>
                </Section>

                <Section title="Responsável">
                    <View style={styles.chips}>
                        <Chip label="Rodrigo" selected={responsavel === UsuarioId.RODRIGO} onPress={() => setResponsavel(UsuarioId.RODRIGO)} />
                        <Chip label="Cesar" selected={responsavel === UsuarioId.CESAR} onPress={() => setResponsavel(UsuarioId.CESAR)} />
                    </View>
                </Section>

                <Section title="Produtos">
                    <View style={styles.chipsWithBottom}>
                        <Chip label="Pelúcias" selected={grupo === "PELUCIAS"} onPress={() => setGrupo("PELUCIAS")} />
                        <Chip label="Carrinho" selected={grupo === "CARRINHO"} onPress={() => setGrupo("CARRINHO")} />
                    </View>
                    <Card style={styles.list}>
                        {produtosVisiveis.map((produtoId) => {
                            const digitado = Number(quantidades[produtoId] || 0);
                            const projetado = saldoProjetado(produtoId);
                            return (
                                <QuantityRow
                                    key={produtoId}
                                    name={nomeProduto(produtoId)}
                                    balance={`Saldo atual: ${saldoAtual(produtoId)}`}
                                    value={quantidades[produtoId] ?? ""}
                                    onChange={(valor) => {
                                        setQuantidades((anterior) => ({ ...anterior, [produtoId]: valor }));
                                        setErro(null);
                                        setSucesso(null);
                                    }}
                                    projection={digitado > 0 ? `Depois: ${projetado}` : undefined}
                                    projectionDanger={projetado < 0}
                                />
                            );
                        })}
                    </Card>
                </Section>

                <Section title="Observação" description="Opcional">
                    <TextInput style={styles.observation} value={observacao} onChangeText={setObservacao} placeholder="Motivo do movimento" placeholderTextColor={Palette.disabled} multiline />
                </Section>
                {erro ? <FeedbackBanner title="Não foi possível atualizar" message={erro} variant="danger" /> : null}
                {sucesso ? <FeedbackBanner title="Estoque atualizado" message={sucesso} /> : null}
            </Screen>
            <BottomActionBar summaryLabel="Total" summaryValue={`${total} itens`} actionLabel={tipo === TipoMovimentoEstoquePrincipal.ENTRADA ? "Confirmar entrada" : "Confirmar saída"} onPress={confirmar} destructive={tipo === TipoMovimentoEstoquePrincipal.SAIDA} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Palette.background },
    content: { paddingTop: Spacing.three, paddingBottom: Spacing.four },
    subtitle: { ...Typography.body, color: Palette.textSecondary },
    chips: { flexDirection: "row", gap: Spacing.two },
    chipsWithBottom: { flexDirection: "row", gap: Spacing.two, marginBottom: Spacing.compact },
    list: { paddingVertical: 0 },
    observation: { minHeight: 80, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.medium, backgroundColor: Palette.surface, padding: Spacing.compact, color: Palette.text, ...Typography.body, textAlignVertical: "top" }
});
