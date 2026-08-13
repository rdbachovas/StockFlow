import React from "react";

import {
    StyleSheet,
    Text,
    View
} from "react-native";

import { useRouter } from "expo-router";

import { StockSummary } from "../../components/domain/StockSummary";
import { Screen } from "../../components/layout/Screen";
import { Section } from "../../components/layout/Section";
import { Estoque } from "../../models/Estoque";
import { useApp } from "../../context/AppContext";
import {
    Palette,
    Spacing,
    Typography
} from "../../constants/theme";

function total(estoque: Estoque): number {
    return estoque.itens.reduce((soma, item) => soma + item.quantidade, 0);
}

export default function StocksPage() {
    const router = useRouter();
    const { estoquePrincipal, estoqueRodrigo, estoqueCesar } = useApp();

    return (
        <Screen>
            <Text style={styles.title}>Estoques</Text>
            <Text style={styles.subtitle}>Consulte saldos físicos e disponibilidade.</Text>

            <Section title="Estoque central">
                <StockSummary
                    name="Principal"
                    total={total(estoquePrincipal)}
                    description="itens no estoque central"
                    onPress={() => router.push("/estoque-principal")}
                />
            </Section>

            <Section title="Estoques pessoais">
                <View style={styles.personalStocks}>
                    <StockSummary
                        name="Rodrigo"
                        total={total(estoqueRodrigo)}
                        onPress={() => router.push({
                            pathname: "/estoque-pessoal",
                            params: { responsavelId: "RODRIGO" }
                        })}
                    />
                    <StockSummary
                        name="Cesar"
                        total={total(estoqueCesar)}
                        onPress={() => router.push({
                            pathname: "/estoque-pessoal",
                            params: { responsavelId: "CESAR" }
                        })}
                    />
                </View>
            </Section>
        </Screen>
    );
}

const styles = StyleSheet.create({
    title: {
        ...Typography.screenTitle,
        color: Palette.text
    },
    subtitle: {
        ...Typography.body,
        color: Palette.textSecondary,
        marginTop: Spacing.one
    },
    personalStocks: {
        flexDirection: "row",
        gap: Spacing.two
    }
});
