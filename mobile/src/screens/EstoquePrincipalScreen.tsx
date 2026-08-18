import React, {
    useMemo,
    useRef,
    useState
} from "react";

import {
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

import { useRouter } from "expo-router";

import { ProductStockRow } from "../components/domain/ProductStockRow";
import { Screen } from "../components/layout/Screen";
import { Section } from "../components/layout/Section";
import { Button } from "../components/ui/Button";
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
import { Estoque } from "../models/Estoque";
import { ProdutoId } from "../models/Produto";
import { RetiradaEstoque } from "../models/RetiradaEstoque";
import { UsuarioId } from "../models/Usuario";
import {
    nomeProduto,
    PRODUTOS_CARRINHO,
    PRODUTOS_PELUCIAS
} from "../utils/ProdutoUtils";

interface Props {
    estoquePrincipal: Estoque;
    estoqueRodrigo: Estoque;
    estoqueCesar: Estoque;
    registrarRetirada: (retirada: RetiradaEstoque) => Promise<void>;
}

type ProductGroup = "PELUCIAS" | "CARRINHO";

function stockQuantity(stock: Estoque, productId: ProdutoId): number {
    return stock.itens.find((item) => item.produtoId === productId)?.quantidade ?? 0;
}

export function EstoquePrincipalScreen({
    estoquePrincipal,
    estoqueRodrigo,
    estoqueCesar,
    registrarRetirada
}: Props) {
    const router = useRouter();
    const sendingRef = useRef(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [group, setGroup] = useState<ProductGroup>("PELUCIAS");
    const [responsible, setResponsible] = useState<UsuarioId>(UsuarioId.RODRIGO);
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    const plushTotal = PRODUTOS_PELUCIAS.reduce(
        (total, productId) => total + stockQuantity(estoquePrincipal, productId),
        0
    );
    const cartTotal = PRODUTOS_CARRINHO.reduce(
        (total, productId) => total + stockQuantity(estoquePrincipal, productId),
        0
    );
    const visibleProducts = group === "PELUCIAS" ? PRODUTOS_PELUCIAS : PRODUTOS_CARRINHO;
    const allProducts = [...PRODUTOS_PELUCIAS, ...PRODUTOS_CARRINHO];

    const withdrawalItems = useMemo(
        () => allProducts
            .map((productId) => ({
                produtoId: productId,
                quantidade: Number(quantities[productId] || 0)
            }))
            .filter((item) => item.quantidade > 0),
        [quantities]
    );

    const withdrawalTotal = withdrawalItems.reduce(
        (total, item) => total + item.quantidade,
        0
    );

    const changeQuantity = (productId: ProdutoId, value: string) => {
        setQuantities((current) => ({
            ...current,
            [productId]: value.replace(/[^0-9]/g, "")
        }));
        setError(null);
        setSuccess(null);
    };

    const confirm = async () => {
        if (sendingRef.current) {
            return;
        }

        setError(null);
        setSuccess(null);

        if (withdrawalItems.length === 0) {
            setError("Informe pelo menos uma quantidade.");
            return;
        }

        const destination = responsible === UsuarioId.RODRIGO
            ? estoqueRodrigo
            : estoqueCesar;

        const withdrawal: RetiradaEstoque = {
            id: `RET_${Date.now()}`,
            estoqueOrigemId: estoquePrincipal.id,
            estoqueDestinoId: destination.id,
            responsavelId: responsible,
            itens: withdrawalItems,
            data: new Date()
        };

        try {
            sendingRef.current = true;
            setSending(true);
            await registrarRetirada(withdrawal);
            setQuantities({});
            setSuccess(`${withdrawalTotal} itens enviados para ${responsible === UsuarioId.RODRIGO ? "Rodrigo" : "Cesar"}.`);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Erro ao registrar retirada.");
        } finally {
            sendingRef.current = false;
            setSending(false);
        }
    };

    if (withdrawing) {
        return (
            <Screen>
                <Button
                    label="Voltar para consulta"
                    variant="ghost"
                    onPress={() => setWithdrawing(false)}
                    style={styles.backButton}
                />
                <Text style={styles.formTitle}>Retirar produtos</Text>
                <Text style={styles.subtitle}>Transfira itens do Principal para um estoque pessoal.</Text>

                <Section title="Destino">
                    <View style={styles.chips}>
                        <Chip label="Rodrigo" selected={responsible === UsuarioId.RODRIGO} onPress={() => setResponsible(UsuarioId.RODRIGO)} />
                        <Chip label="Cesar" selected={responsible === UsuarioId.CESAR} onPress={() => setResponsible(UsuarioId.CESAR)} />
                    </View>
                </Section>

                <Section title="Produtos" description="Informe somente as quantidades que serão retiradas.">
                    {([
                        { title: "Pelúcias", products: PRODUTOS_PELUCIAS },
                        { title: "Carrinho", products: PRODUTOS_CARRINHO }
                    ] as const).map((section) => (
                        <Card key={section.title} style={styles.formGroup}>
                            <Text style={styles.groupTitle}>{section.title}</Text>
                            {section.products.map((productId) => {
                                const current = stockQuantity(estoquePrincipal, productId);
                                const requested = Number(quantities[productId] || 0);
                                return (
                                    <View key={productId} style={styles.inputRow}>
                                        <View style={styles.productInfo}>
                                            <Text style={styles.productName}>{nomeProduto(productId)}</Text>
                                            <Text style={styles.productBalance}>
                                                Saldo {current}{requested > 0 ? ` · Depois ${current - requested}` : ""}
                                            </Text>
                                        </View>
                                        <TextInput
                                            accessibilityLabel={`Quantidade de ${nomeProduto(productId)}`}
                                            style={styles.input}
                                            value={quantities[productId] ?? ""}
                                            onChangeText={(value) => changeQuantity(productId, value)}
                                            keyboardType="number-pad"
                                            placeholder="0"
                                            placeholderTextColor={Palette.disabled}
                                        />
                                    </View>
                                );
                            })}
                        </Card>
                    ))}
                </Section>

                <Card style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Total da retirada</Text>
                    <Text style={styles.totalValue}>{withdrawalTotal}</Text>
                </Card>
                {error ? <FeedbackBanner title="Não foi possível retirar" message={error} variant="danger" /> : null}
                {success ? <FeedbackBanner title="Retirada registrada" message={success} /> : null}
                <Button label="Confirmar retirada" onPress={confirm} loading={sending} style={styles.confirmButton} />
            </Screen>
        );
    }

    return (
        <Screen>
            <Text style={styles.subtitle}>Consulte os saldos físicos do estoque central.</Text>

            <Card style={styles.summary}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{plushTotal + cartTotal}</Text>
                    <Text style={styles.summaryLabel}>Total</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{plushTotal}</Text>
                    <Text style={styles.summaryLabel}>Pelúcias</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{cartTotal}</Text>
                    <Text style={styles.summaryLabel}>Carrinho</Text>
                </View>
            </Card>

            <Section title="Produtos">
                <View style={styles.chips}>
                    <Chip label="Pelúcias" selected={group === "PELUCIAS"} onPress={() => setGroup("PELUCIAS")} />
                    <Chip label="Carrinho" selected={group === "CARRINHO"} onPress={() => setGroup("CARRINHO")} />
                </View>
                <Card style={styles.productList}>
                    {visibleProducts.map((productId) => (
                        <ProductStockRow
                            key={productId}
                            productName={nomeProduto(productId)}
                            quantity={stockQuantity(estoquePrincipal, productId)}
                            detail="Saldo físico"
                        />
                    ))}
                </Card>
            </Section>

            <Section title="Ações">
                <Button label="Retirar produtos" onPress={() => setWithdrawing(true)} />
                <View style={styles.secondaryActions}>
                    <Button label="Entrada / Ajuste" variant="secondary" onPress={() => router.push("/ajuste-estoque-principal")} style={styles.secondaryButton} />
                    <Button label="Histórico" variant="secondary" onPress={() => router.push("/historico-estoque-principal")} style={styles.secondaryButton} />
                </View>
            </Section>
        </Screen>
    );
}

const styles = StyleSheet.create({
    backButton: { alignSelf: "flex-start", marginLeft: -Spacing.three },
    formTitle: { ...Typography.screenTitle, color: Palette.text, marginTop: Spacing.two },
    subtitle: { ...Typography.body, color: Palette.textSecondary },
    summary: { flexDirection: "row", marginTop: Spacing.three },
    summaryItem: { flex: 1, alignItems: "center" },
    summaryValue: { fontSize: 24, lineHeight: 30, fontWeight: "700", color: Palette.text },
    summaryLabel: { ...Typography.caption, color: Palette.textSecondary, marginTop: Spacing.half },
    chips: { flexDirection: "row", gap: Spacing.two, marginBottom: Spacing.compact },
    productList: { paddingVertical: 0 },
    secondaryActions: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.two },
    secondaryButton: { flex: 1 },
    formGroup: { paddingVertical: Spacing.two, marginBottom: Spacing.compact },
    groupTitle: { ...Typography.cardTitle, color: Palette.text, paddingVertical: Spacing.two },
    inputRow: { minHeight: 64, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: Palette.border },
    productInfo: { flex: 1, paddingRight: Spacing.two },
    productName: { ...Typography.body, color: Palette.text, fontWeight: "600" },
    productBalance: { ...Typography.caption, color: Palette.textSecondary, marginTop: Spacing.half },
    input: { width: 68, height: ControlSize.input, borderRadius: Radius.small, borderWidth: 1, borderColor: Palette.border, backgroundColor: Palette.background, color: Palette.text, textAlign: "center", fontSize: 16, fontWeight: "700" },
    totalCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: Spacing.compact, marginBottom: Spacing.compact },
    totalLabel: { ...Typography.body, color: Palette.text },
    totalValue: { fontSize: 24, fontWeight: "700", color: Palette.primary },
    confirmButton: { marginTop: Spacing.compact }
});
