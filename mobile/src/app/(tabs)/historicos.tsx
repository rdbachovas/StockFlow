import React from "react";

import {
    StyleSheet,
    Text,
    View
} from "react-native";

import { useRouter } from "expo-router";

import { Screen } from "../../components/layout/Screen";
import { Section } from "../../components/layout/Section";
import { Button } from "../../components/ui/Button";
import {
    Palette,
    Spacing,
    Typography
} from "../../constants/theme";

export default function HistoryPage() {
    const router = useRouter();

    return (
        <Screen>
            <Text style={styles.title}>Histórico</Text>
            <Text style={styles.subtitle}>Escolha o tipo de movimentação que deseja consultar.</Text>

            <Section title="Registros">
                <View style={styles.actions}>
                    <Button label="Movimentações dos estoques pessoais" variant="secondary" onPress={() => router.push("/historico-estoque-pessoal")} />
                    <Button label="Movimentações do Principal" variant="secondary" onPress={() => router.push("/historico-estoque-principal")} />
                    <Button label="Abastecimentos" variant="secondary" onPress={() => router.push("/historico")} />
                    <Button label="Reservas" variant="secondary" onPress={() => router.push("/historico-reservas")} />
                </View>
            </Section>
        </Screen>
    );
}

const styles = StyleSheet.create({
    title: { ...Typography.screenTitle, color: Palette.text },
    subtitle: { ...Typography.body, color: Palette.textSecondary, marginTop: Spacing.one },
    actions: { gap: Spacing.two }
});
