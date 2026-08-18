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
    ControlSize,
    Palette,
    Radius,
    Spacing,
    Typography
} from "../constants/theme";
import { SolicitacaoConsumoCarrinho } from "../models/ConsumoCarrinho";
import { Estoque } from "../models/Estoque";
import { ProdutoId } from "../models/Produto";
import { UsuarioId } from "../models/Usuario";
import {
    nomeProduto,
    PRODUTOS_CARRINHO
} from "../utils/ProdutoUtils";

interface Props {
    estoqueRodrigo: Estoque;
    estoqueCesar: Estoque;
    registrarConsumo: (solicitacao: SolicitacaoConsumoCarrinho) => Promise<void>;
}

export function ConsumoCarrinhoScreen({
    estoqueRodrigo,
    estoqueCesar,
    registrarConsumo
}: Props) {
    const [responsavel, setResponsavel] = useState<UsuarioId>(UsuarioId.RODRIGO);
    const [quantidades, setQuantidades] = useState<Record<string, string>>({});
    const [observacao, setObservacao] = useState("");
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
    const estoque = responsavel === UsuarioId.RODRIGO ? estoqueRodrigo : estoqueCesar;

    const saldo = (produtoId: ProdutoId) =>
        estoque.itens.find((item) => item.produtoId === produtoId)?.quantidade ?? 0;

    const itens = useMemo(
        () => PRODUTOS_CARRINHO
            .map((produtoId) => ({ produtoId, quantidade: Number(quantidades[produtoId] || 0) }))
            .filter((item) => item.quantidade > 0),
        [quantidades]
    );
    const total = itens.reduce((soma, item) => soma + item.quantidade, 0);

    const trocarResponsavel = (novoResponsavel: UsuarioId) => {
        setResponsavel(novoResponsavel);
        setQuantidades({});
        setErro(null);
        setSucesso(null);
    };

    const confirmar = async () => {
        if (enviando) {
            return;
        }

        setErro(null);
        setSucesso(null);
        if (itens.length === 0) {
            setErro("Informe pelo menos um insumo consumido.");
            return;
        }

        const solicitacao: SolicitacaoConsumoCarrinho = {
            id: `CONS_CARRINHO_${Date.now()}`,
            responsavelId: responsavel,
            itens,
            data: new Date(),
            observacao: observacao.trim() || undefined
        };

        setEnviando(true);
        try {
            await registrarConsumo(solicitacao);
            setQuantidades({});
            setObservacao("");
            setSucesso(`${total} itens baixados do estoque pessoal.`);
        } catch (caughtError) {
            setErro(caughtError instanceof Error ? caughtError.message : "Erro ao registrar consumo.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <View style={styles.container}>
            <Screen contentContainerStyle={styles.content}>
                <Text style={styles.subtitle}>Registre somente os insumos utilizados.</Text>

                <Section title="Responsável">
                    <View style={styles.chips}>
                        <Chip label="Rodrigo" selected={responsavel === UsuarioId.RODRIGO} onPress={() => trocarResponsavel(UsuarioId.RODRIGO)} />
                        <Chip label="Cesar" selected={responsavel === UsuarioId.CESAR} onPress={() => trocarResponsavel(UsuarioId.CESAR)} />
                    </View>
                </Section>

                <Section title="Insumos">
                    <Card style={styles.list}>
                        {PRODUTOS_CARRINHO.map((produtoId) => {
                            const atual = saldo(produtoId);
                            const digitado = Number(quantidades[produtoId] || 0);
                            return (
                                <QuantityRow
                                    key={produtoId}
                                    name={nomeProduto(produtoId)}
                                    balance={`Disponível: ${atual}`}
                                    value={quantidades[produtoId] ?? ""}
                                    onChange={(valor) => {
                                        setQuantidades((anterior) => ({ ...anterior, [produtoId]: valor }));
                                        setErro(null);
                                        setSucesso(null);
                                    }}
                                    projection={digitado > 0 ? `Depois: ${atual - digitado}` : undefined}
                                    projectionDanger={atual - digitado < 0}
                                />
                            );
                        })}
                    </Card>
                </Section>

                <Section title="Observação" description="Opcional">
                    <TextInput
                        style={styles.observation}
                        value={observacao}
                        onChangeText={setObservacao}
                        placeholder="Ex.: consumo do evento de domingo"
                        placeholderTextColor={Palette.disabled}
                        multiline
                    />
                </Section>

                {erro ? <FeedbackBanner title="Não foi possível registrar" message={erro} variant="danger" /> : null}
                {sucesso ? <FeedbackBanner title="Consumo registrado" message={sucesso} /> : null}
            </Screen>
            <BottomActionBar
                summaryLabel="Total"
                summaryValue={`${total} itens`}
                actionLabel="Confirmar consumo"
                onPress={() => { void confirmar(); }}
                loading={enviando}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Palette.background },
    content: { paddingTop: Spacing.three, paddingBottom: Spacing.four },
    subtitle: { ...Typography.body, color: Palette.textSecondary },
    chips: { flexDirection: "row", gap: Spacing.two },
    list: { paddingVertical: 0 },
    observation: { minHeight: 88, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.medium, backgroundColor: Palette.surface, padding: Spacing.compact, color: Palette.text, ...Typography.body, textAlignVertical: "top" }
});
