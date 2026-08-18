import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

import {
    useLocalSearchParams,
    useRouter
} from "expo-router";

import { StockSummary } from "../components/domain/StockSummary";
import { Screen } from "../components/layout/Screen";
import { Section } from "../components/layout/Section";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import {
    ControlSize,
    Palette,
    Radius,
    Spacing,
    Typography
} from "../constants/theme";
import { useApp } from "../context/AppContext";
import { Estoque } from "../models/Estoque";
import { LocalId } from "../models/Local";
import { StatusReserva } from "../models/Reserva";
import { TipoMovimentoEstoquePrincipal } from "../models/MovimentoEstoquePrincipal";

interface DestinationOption {
    id: LocalId;
    name: string;
    group: "Locais principais" | "Mercados";
}

interface RecentMovement {
    id: string;
    title: string;
    detail: string;
    date: Date;
}

const DESTINATIONS: DestinationOption[] = [
    { id: LocalId.BOULEVARD, name: "Boulevard", group: "Locais principais" },
    { id: LocalId.AEROPORTO, name: "Aeroporto", group: "Locais principais" },
    { id: LocalId.GAUCHO_VICENTE_FONTOURA, name: "Gauchão Vicente da Fontoura", group: "Mercados" },
    { id: LocalId.SUPERMAGO_IPIRANGA, name: "SuperMago Ipiranga", group: "Mercados" },
    { id: LocalId.GAUCHO_ANTONIO_CARVALHO, name: "Gauchão Antônio de Carvalho", group: "Mercados" },
    { id: LocalId.SUPERMERCADO_FANTE, name: "Supermercado Fante", group: "Mercados" },
    { id: LocalId.SUPERMAGO_PLANALTO, name: "SuperMago Planalto", group: "Mercados" },
    { id: LocalId.SAMS_CLUB, name: "Sam's Club", group: "Mercados" },
    { id: LocalId.SUPERMAGO_BOA_VISTA, name: "SuperMago Boa Vista", group: "Mercados" }
];

function totalStock(stock: Estoque): number {
    return stock.itens.reduce((total, item) => total + item.quantidade, 0);
}

function personName(personId: string): string {
    return personId === "RODRIGO" ? "Rodrigo" : personId === "CESAR" ? "Cesar" : personId;
}

function locationName(locationId: LocalId): string {
    return DESTINATIONS.find((destination) => destination.id === locationId)?.name ?? locationId;
}

function itemCount(items: Array<{ quantidade: number }>): number {
    return items.reduce((total, item) => total + item.quantidade, 0);
}

function formatDate(date: Date): string {
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short"
    });
}

export function HomeScreen() {
    const router = useRouter();
    const { abastecer } = useLocalSearchParams<{ abastecer?: string }>();
    const [destinationModalOpen, setDestinationModalOpen] = useState(false);

    useEffect(() => {
        if (abastecer === "1") {
            setDestinationModalOpen(true);
            router.setParams({ abastecer: undefined });
        }
    }, [abastecer, router]);

    const {
        estoquePrincipal,
        estoqueRodrigo,
        estoqueCesar,
        reservas,
        abastecimentos,
        retiradas,
        devolucoes,
        movimentosEstoquePrincipal,
        consumosCarrinho
    } = useApp();

    const activeReservations = reservas.filter(
        (reservation) => reservation.status === StatusReserva.ATIVA
    );

    const reservedRemaining = activeReservations.reduce(
        (total, reservation) =>
            total + Math.max(
                0,
                reservation.quantidade -
                    reservation.quantidadeUtilizada -
                    (reservation.quantidadeLiberada ?? 0)
            ),
        0
    );

    const recentMovements = useMemo<RecentMovement[]>(() => {
        const movements: RecentMovement[] = [
            ...abastecimentos.map((supply) => ({
                id: `abastecimento-${supply.id}`,
                title: "Abastecimento",
                detail: `${locationName(supply.localId)} · ${itemCount(supply.itens)} itens`,
                date: supply.data
            })),
            ...retiradas.map((withdrawal) => ({
                id: `retirada-${withdrawal.id}`,
                title: "Retirada do Principal",
                detail: `${personName(withdrawal.responsavelId)} · ${itemCount(withdrawal.itens)} itens`,
                date: withdrawal.data
            })),
            ...devolucoes.map((returnRecord) => ({
                id: `devolucao-${returnRecord.id}`,
                title: "Devolução ao Principal",
                detail: `${personName(returnRecord.responsavelId)} · ${returnRecord.itens.reduce(
                    (total, item) => total + (item.quantidadeTotal ?? item.quantidadeLivre),
                    0
                )} itens`,
                date: returnRecord.data
            })),
            ...movimentosEstoquePrincipal.map((movement) => ({
                id: `principal-${movement.id}`,
                title: movement.tipo === TipoMovimentoEstoquePrincipal.ENTRADA
                    ? "Entrada no Principal"
                    : "Saída do Principal",
                detail: `${personName(movement.responsavelId)} · ${itemCount(movement.itens)} itens`,
                date: movement.data
            })),
            ...consumosCarrinho.map((consumption) => ({
                id: `consumo-${consumption.id}`,
                title: "Consumo do carrinho",
                detail: `${personName(consumption.responsavelId)} · ${itemCount(consumption.itens)} itens`,
                date: consumption.data
            }))
        ];

        return movements
            .sort((first, second) => second.date.getTime() - first.date.getTime())
            .slice(0, 3);
    }, [
        abastecimentos,
        consumosCarrinho,
        devolucoes,
        movimentosEstoquePrincipal,
        retiradas
    ]);

    const openSupply = (locationId: LocalId) => {
        setDestinationModalOpen(false);
        router.push({
            pathname: "/abastecimento",
            params: { localId: locationId }
        });
    };

    return (
        <Screen>
            <View style={styles.header}>
                <Text style={styles.title}>StockFlow</Text>
                <Text style={styles.subtitle}>Estoque e operações em um só lugar</Text>
            </View>

            <Section title="Ações rápidas">
                <View style={styles.primaryAction}>
                    <Button
                        label="Abastecer"
                        onPress={() => setDestinationModalOpen(true)}
                    />
                </View>
                <View style={styles.secondaryActions}>
                    <Button
                        label="Retirar do Principal"
                        variant="secondary"
                        onPress={() => router.push("/estoque-principal")}
                        style={styles.secondaryButton}
                    />
                    <Button
                        label="Criar reserva"
                        variant="secondary"
                        onPress={() => router.push("/reservas")}
                        style={styles.secondaryButton}
                    />
                </View>
            </Section>

            <Section title="Estoques" description="Quantidade física atual">
                <View style={styles.stockGrid}>
                    <StockSummary
                        name="Principal"
                        total={totalStock(estoquePrincipal)}
                        onPress={() => router.push("/estoque-principal")}
                    />
                    <StockSummary
                        name="Rodrigo"
                        total={totalStock(estoqueRodrigo)}
                        onPress={() => router.push("/estoque-pessoal")}
                    />
                    <StockSummary
                        name="Cesar"
                        total={totalStock(estoqueCesar)}
                        onPress={() => router.push("/estoque-pessoal")}
                    />
                </View>
            </Section>

            <Section title="Reservas">
                <Card
                    onPress={() => router.push("/reservas")}
                    accessibilityLabel="Abrir reservas"
                    style={styles.reservationCard}
                >
                    <View>
                        <Text style={styles.reservationValue}>{activeReservations.length}</Text>
                        <Text style={styles.reservationLabel}>reservas ativas</Text>
                    </View>
                    <View style={styles.reservationDivider} />
                    <View style={styles.reservationRemaining}>
                        <Text style={styles.reservationValue}>{reservedRemaining}</Text>
                        <Text style={styles.reservationLabel}>itens restantes</Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                </Card>
            </Section>

            <Section title="Últimas movimentações">
                <Card style={styles.movementCard}>
                    {recentMovements.length === 0 ? (
                        <EmptyState
                            title="Nenhuma movimentação"
                            description="As operações recentes aparecerão aqui."
                        />
                    ) : (
                        recentMovements.map((movement, index) => (
                            <View
                                key={movement.id}
                                style={[
                                    styles.movementRow,
                                    index < recentMovements.length - 1 && styles.movementBorder
                                ]}
                            >
                                <View style={styles.movementMarker} />
                                <View style={styles.movementContent}>
                                    <Text style={styles.movementTitle}>{movement.title}</Text>
                                    <Text style={styles.movementDetail}>{movement.detail}</Text>
                                </View>
                                <Text style={styles.movementDate}>{formatDate(movement.date)}</Text>
                            </View>
                        ))
                    )}
                </Card>
                <Button
                    label="Ver histórico de movimentações"
                    variant="ghost"
                    onPress={() => router.push("/historico-estoque-pessoal")}
                    style={styles.historyButton}
                />
            </Section>

            <Modal
                animationType="slide"
                transparent
                visible={destinationModalOpen}
                onRequestClose={() => setDestinationModalOpen(false)}
            >
                <View style={styles.modalBackdrop}>
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={() => setDestinationModalOpen(false)}
                        accessibilityLabel="Fechar seleção de destino"
                    />
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Onde será o abastecimento?</Text>
                        <Text style={styles.modalDescription}>Selecione o local para continuar.</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {(["Locais principais", "Mercados"] as const).map((group) => (
                                <View key={group} style={styles.destinationGroup}>
                                    <Text style={styles.destinationGroupTitle}>{group}</Text>
                                    {DESTINATIONS.filter((destination) => destination.group === group).map(
                                        (destination) => (
                                            <Pressable
                                                key={destination.id}
                                                accessibilityRole="button"
                                                onPress={() => openSupply(destination.id)}
                                                style={({ pressed }) => [
                                                    styles.destinationRow,
                                                    pressed && styles.destinationPressed
                                                ]}
                                            >
                                                <Text style={styles.destinationName}>{destination.name}</Text>
                                                <Text style={styles.arrow}>›</Text>
                                            </Pressable>
                                        )
                                    )}
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        marginBottom: Spacing.two
    },
    title: {
        ...Typography.screenTitle,
        color: Palette.text
    },
    subtitle: {
        ...Typography.body,
        color: Palette.textSecondary,
        marginTop: Spacing.one
    },
    primaryAction: {
        marginBottom: Spacing.two
    },
    secondaryActions: {
        flexDirection: "row",
        gap: Spacing.two
    },
    secondaryButton: {
        flex: 1,
        paddingHorizontal: Spacing.two
    },
    stockGrid: {
        flexDirection: "row",
        gap: Spacing.two
    },
    reservationCard: {
        flexDirection: "row",
        alignItems: "center"
    },
    reservationValue: {
        fontSize: 24,
        lineHeight: 28,
        fontWeight: "700",
        color: Palette.text
    },
    reservationLabel: {
        ...Typography.caption,
        color: Palette.textSecondary,
        marginTop: Spacing.half
    },
    reservationDivider: {
        width: 1,
        height: 40,
        backgroundColor: Palette.border,
        marginHorizontal: Spacing.three
    },
    reservationRemaining: {
        flex: 1
    },
    arrow: {
        fontSize: 24,
        lineHeight: 24,
        color: Palette.primary
    },
    movementCard: {
        paddingVertical: 0
    },
    movementRow: {
        minHeight: 68,
        flexDirection: "row",
        alignItems: "center"
    },
    movementBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Palette.border
    },
    movementMarker: {
        width: 8,
        height: 8,
        borderRadius: Radius.pill,
        backgroundColor: Palette.primary,
        marginRight: Spacing.compact
    },
    movementContent: {
        flex: 1,
        paddingRight: Spacing.two
    },
    movementTitle: {
        ...Typography.label,
        color: Palette.text,
        fontWeight: "700"
    },
    movementDetail: {
        ...Typography.caption,
        color: Palette.textSecondary,
        marginTop: Spacing.half
    },
    movementDate: {
        ...Typography.caption,
        color: Palette.textSecondary
    },
    historyButton: {
        marginTop: Spacing.two
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(23, 32, 42, 0.38)"
    },
    modalSheet: {
        maxHeight: "82%",
        backgroundColor: Palette.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: Spacing.three,
        paddingTop: Spacing.compact,
        paddingBottom: Spacing.four
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: Radius.pill,
        backgroundColor: Palette.border,
        alignSelf: "center",
        marginBottom: Spacing.three
    },
    modalTitle: {
        ...Typography.sectionTitle,
        color: Palette.text
    },
    modalDescription: {
        ...Typography.label,
        color: Palette.textSecondary,
        marginTop: Spacing.one,
        marginBottom: Spacing.three
    },
    destinationGroup: {
        marginBottom: Spacing.three
    },
    destinationGroupTitle: {
        ...Typography.caption,
        color: Palette.textSecondary,
        textTransform: "uppercase",
        marginBottom: Spacing.two
    },
    destinationRow: {
        minHeight: ControlSize.button,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: Palette.border
    },
    destinationPressed: {
        opacity: 0.6
    },
    destinationName: {
        ...Typography.body,
        color: Palette.text,
        fontWeight: "600"
    }
});
