import React, { useState } from "react";

import {
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";

import { useRouter } from "expo-router";

import { Screen } from "../components/layout/Screen";
import { Section } from "../components/layout/Section";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Chip } from "../components/ui/Chip";
import { EmptyState } from "../components/ui/EmptyState";
import { useAuth } from "../context/AuthContext";
import {
    Palette,
    Spacing,
    Typography
} from "../constants/theme";
import { DestinoReservaId } from "../models/DestinoReserva";
import { Estoque } from "../models/Estoque";
import { ProdutoId } from "../models/Produto";
import {
    Reserva,
    StatusReserva
} from "../models/Reserva";
import { UsuarioId } from "../models/Usuario";
import { ReservaService } from "../services/ReservaService";
import {
    nomeProduto,
    PRODUTOS_CARRINHO,
    PRODUTOS_PELUCIAS
} from "../utils/ProdutoUtils";

interface Props {
    estoqueRodrigo: Estoque;
    estoqueCesar: Estoque;
    reservas: Reserva[];
    responsavelInicial?: UsuarioId;
}

function destinationName(destinationId: DestinoReservaId): string {
    switch (destinationId) {
        case DestinoReservaId.BOULEVARD:
            return "Boulevard";
        case DestinoReservaId.AEROPORTO:
            return "Aeroporto";
        case DestinoReservaId.MERCADOS:
            return "Mercados";
        case DestinoReservaId.SUPERMAGO_BOA_VISTA:
            return "SuperMago Boa Vista";
    }
}

export function EstoquePessoalScreen({
    estoqueRodrigo,
    estoqueCesar,
    reservas,
    responsavelInicial: _responsavelInicial = UsuarioId.RODRIGO
}: Props) {
    const router = useRouter();
    const { usuario } = useAuth();
    const responsible = usuario!.id;
    const [expandedProduct, setExpandedProduct] = useState<ProdutoId | null>(null);

    const stock = responsible === UsuarioId.RODRIGO ? estoqueRodrigo : estoqueCesar;
    const allProducts = [...PRODUTOS_PELUCIAS, ...PRODUTOS_CARRINHO];
    const quantity = (productId: ProdutoId) =>
        stock.itens.find((item) => item.produtoId === productId)?.quantidade ?? 0;
    const reserved = (productId: ProdutoId) =>
        ReservaService.quantidadeReservada(reservas, productId, responsible);
    const free = (productId: ProdutoId) =>
        PRODUTOS_CARRINHO.includes(productId)
            ? quantity(productId)
            : ReservaService.quantidadeDisponivel(stock, reservas, productId);

    const physicalTotal = allProducts.reduce((total, productId) => total + quantity(productId), 0);
    const reservedTotal = PRODUTOS_PELUCIAS.reduce((total, productId) => total + reserved(productId), 0);
    const freeTotal = allProducts.reduce((total, productId) => total + free(productId), 0);

    const renderGroup = (title: string, products: ProdutoId[], isCart: boolean) => {
        const availableProducts = products.filter((productId) => quantity(productId) > 0);

        return (
            <Section
                title={title}
                description={isCart ? "Insumos sob responsabilidade pessoal" : "Produtos usados nos abastecimentos"}
            >
                {availableProducts.length === 0 ? (
                    <Card>
                        <EmptyState title={`Nenhum item em ${title.toLowerCase()}`} />
                    </Card>
                ) : (
                    <Card style={styles.productList}>
                        {availableProducts.map((productId, index) => {
                            const isExpanded = expandedProduct === productId;
                            const productReservations = reservas.filter(
                                (reservation) =>
                                    reservation.responsavelId === responsible &&
                                    reservation.produtoId === productId &&
                                    reservation.status === StatusReserva.ATIVA
                            );
                            const destinations = Array.from(
                                new Set(productReservations.map((reservation) => reservation.destinoId))
                            );

                            return (
                                <View
                                    key={productId}
                                    style={index > 0 ? styles.productBorder : undefined}
                                >
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityState={{ expanded: isExpanded }}
                                        onPress={() => setExpandedProduct(isExpanded ? null : productId)}
                                        style={({ pressed }) => [
                                            styles.productRow,
                                            pressed && styles.pressed
                                        ]}
                                    >
                                        <View style={styles.productContent}>
                                            <Text style={styles.productName}>{nomeProduto(productId)}</Text>
                                            <Text style={styles.productDetail}>
                                                {isCart
                                                    ? `${quantity(productId)} em posse`
                                                    : `${quantity(productId)} físico · ${reserved(productId)} reservado · ${free(productId)} livre`}
                                            </Text>
                                        </View>
                                        <Text style={styles.productQuantity}>{quantity(productId)}</Text>
                                        <Text style={styles.chevron}>{isExpanded ? "⌃" : "⌄"}</Text>
                                    </Pressable>

                                    {isExpanded ? (
                                        <View style={styles.details}>
                                            {!isCart && destinations.length > 0 ? (
                                                <View style={styles.allocations}>
                                                    <Text style={styles.detailsTitle}>Alocação das reservas</Text>
                                                    {destinations.map((destinationId) => (
                                                        <View key={destinationId} style={styles.allocationRow}>
                                                            <Text style={styles.allocationName}>{destinationName(destinationId)}</Text>
                                                            <Text style={styles.allocationValue}>
                                                                {ReservaService.quantidadeReservadaNoDestino(
                                                                    reservas,
                                                                    productId,
                                                                    responsible,
                                                                    destinationId
                                                                )}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            ) : !isCart ? (
                                                <Text style={styles.noAllocation}>Sem reserva ativa para este produto.</Text>
                                            ) : null}
                                            <Button
                                                label="Devolver ao Principal"
                                                variant="ghost"
                                                onPress={() => router.push({
                                                    pathname: "/devolucao",
                                                    params: {
                                                        responsavelId: responsible,
                                                        produtoId: productId
                                                    }
                                                })}
                                                style={styles.returnButton}
                                            />
                                        </View>
                                    ) : null}
                                </View>
                            );
                        })}
                    </Card>
                )}
            </Section>
        );
    };

    return (
        <Screen>
            <Text style={styles.subtitle}>Saldos físicos, reservas e disponibilidade por responsável.</Text>

            <View style={styles.personSelector}>
                <Text style={styles.productName}>{usuario!.nome}</Text>
            </View>

            <Card style={styles.summary}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{physicalTotal}</Text>
                    <Text style={styles.summaryLabel}>Físico</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{reservedTotal}</Text>
                    <Text style={styles.summaryLabel}>Reservado</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{freeTotal}</Text>
                    <Text style={styles.summaryLabel}>Livre</Text>
                </View>
            </Card>

            {renderGroup("Pelúcias", PRODUTOS_PELUCIAS, false)}
            {renderGroup("Carrinho", PRODUTOS_CARRINHO, true)}

            <Section title="Ações do carrinho">
                <Button
                    label="Registrar consumo"
                    variant="secondary"
                    onPress={() => router.push("/consumo-carrinho")}
                />
            </Section>
        </Screen>
    );
}

const styles = StyleSheet.create({
    subtitle: { ...Typography.body, color: Palette.textSecondary },
    personSelector: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.three },
    summary: { flexDirection: "row", marginTop: Spacing.three },
    summaryItem: { flex: 1, alignItems: "center" },
    summaryValue: { fontSize: 24, lineHeight: 30, fontWeight: "700", color: Palette.text },
    summaryLabel: { ...Typography.caption, color: Palette.textSecondary, marginTop: Spacing.half },
    productList: { paddingVertical: 0 },
    productBorder: { borderTopWidth: 1, borderTopColor: Palette.border },
    productRow: { minHeight: 64, flexDirection: "row", alignItems: "center" },
    pressed: { opacity: 0.65 },
    productContent: { flex: 1, paddingRight: Spacing.two },
    productName: { ...Typography.body, color: Palette.text, fontWeight: "600" },
    productDetail: { ...Typography.caption, color: Palette.textSecondary, marginTop: Spacing.half },
    productQuantity: { ...Typography.cardTitle, color: Palette.text, marginRight: Spacing.compact },
    chevron: { fontSize: 18, color: Palette.primary },
    details: { backgroundColor: Palette.background, borderRadius: 10, padding: Spacing.compact, marginBottom: Spacing.compact },
    allocations: { gap: Spacing.two },
    detailsTitle: { ...Typography.label, color: Palette.text, fontWeight: "700" },
    allocationRow: { flexDirection: "row", justifyContent: "space-between" },
    allocationName: { ...Typography.label, color: Palette.textSecondary },
    allocationValue: { ...Typography.label, color: Palette.text, fontWeight: "700" },
    noAllocation: { ...Typography.label, color: Palette.textSecondary },
    returnButton: { marginTop: Spacing.two },
});
