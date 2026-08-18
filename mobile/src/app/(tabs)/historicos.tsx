import React, { useState } from "react";

import {
    StyleSheet,
    Text,
    View
} from "react-native";

import { useRouter } from "expo-router";

import { Screen } from "../../components/layout/Screen";
import { Section } from "../../components/layout/Section";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import {
    Palette,
    Spacing,
    Typography
} from "../../constants/theme";
import { useApp } from "../../context/AppContext";

type Category = "TODOS" | "ESTOQUES" | "OPERACOES" | "PLANEJAMENTO";

interface HistoryAccess {
    title: string;
    description: string;
    count: number;
    category: Exclude<Category, "TODOS">;
    route: "/historico-estoque-pessoal" | "/historico-estoque-principal" | "/historico" | "/historico-reservas";
}

export default function HistoryPage() {
    const router = useRouter();
    const [category, setCategory] = useState<Category>("TODOS");
    const { abastecimentos, retiradas, devolucoes, movimentosEstoquePrincipal, consumosCarrinho, reservas } = useApp();
    const accesses: HistoryAccess[] = [
        { title: "Estoque Principal", description: "Entradas, saídas, retiradas e devoluções", count: movimentosEstoquePrincipal.length + retiradas.length + devolucoes.length, category: "ESTOQUES", route: "/historico-estoque-principal" },
        { title: "Estoques pessoais", description: "Movimentações de Rodrigo e Cesar", count: retiradas.length + abastecimentos.length + devolucoes.length + consumosCarrinho.length, category: "ESTOQUES", route: "/historico-estoque-pessoal" },
        { title: "Abastecimentos", description: "Registros agregados por local", count: abastecimentos.length, category: "OPERACOES", route: "/historico" },
        { title: "Reservas", description: "Criação, utilização e encerramento", count: reservas.reduce((total, reservation) => total + (reservation.historico?.length ?? 0), 0), category: "PLANEJAMENTO", route: "/historico-reservas" }
    ];
    const visible = accesses.filter((access) => category === "TODOS" || access.category === category);

    return (
        <Screen>
            <Text style={styles.title}>Histórico</Text>
            <Text style={styles.subtitle}>Consulte os registros por área.</Text>
            <View style={styles.filters}>
                <Chip label="Todos" selected={category === "TODOS"} onPress={() => setCategory("TODOS")} />
                <Chip label="Estoques" selected={category === "ESTOQUES"} onPress={() => setCategory("ESTOQUES")} />
                <Chip label="Operações" selected={category === "OPERACOES"} onPress={() => setCategory("OPERACOES")} />
                <Chip label="Reservas" selected={category === "PLANEJAMENTO"} onPress={() => setCategory("PLANEJAMENTO")} />
            </View>
            <Section title="Categorias">
                <View style={styles.list}>
                    {visible.map((access) => (
                        <Card key={access.route} onPress={() => router.push(access.route)} accessibilityLabel={`Abrir histórico de ${access.title}`} style={styles.card}>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{access.title}</Text>
                                <Text style={styles.cardDescription}>{access.description}</Text>
                            </View>
                            <View style={styles.countBox}><Text style={styles.count}>{access.count}</Text><Text style={styles.countLabel}>registros</Text></View>
                            <Text style={styles.arrow}>›</Text>
                        </Card>
                    ))}
                </View>
            </Section>
        </Screen>
    );
}

const styles = StyleSheet.create({
    title: { ...Typography.screenTitle, color: Palette.text },
    subtitle: { ...Typography.body, color: Palette.textSecondary, marginTop: Spacing.one },
    filters: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two, marginTop: Spacing.three },
    list: { gap: Spacing.two },
    card: { minHeight: 82, flexDirection: "row", alignItems: "center" },
    cardContent: { flex: 1, paddingRight: Spacing.two },
    cardTitle: { ...Typography.cardTitle, color: Palette.text },
    cardDescription: { ...Typography.caption, color: Palette.textSecondary, marginTop: Spacing.half },
    countBox: { alignItems: "center", marginHorizontal: Spacing.compact },
    count: { ...Typography.cardTitle, color: Palette.primary },
    countLabel: { ...Typography.caption, color: Palette.textSecondary },
    arrow: { fontSize: 22, color: Palette.primary }
});
