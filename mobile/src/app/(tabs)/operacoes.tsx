import React from "react";

import {
    StyleSheet,
    Text,
    View
} from "react-native";

import { Href, useRouter } from "expo-router";

import { Screen } from "../../components/layout/Screen";
import { Section } from "../../components/layout/Section";
import { Button } from "../../components/ui/Button";
import {
    Palette,
    Spacing,
    Typography
} from "../../constants/theme";

export default function OperationsPage() {
    const router = useRouter();

    return (
        <Screen>
            <Text style={styles.title}>Operações</Text>
            <Text style={styles.subtitle}>Acesse os fluxos de movimentação do estoque.</Text>

            <Section title="Abastecimento">
                <Button
                    label="Abastecer local"
                    onPress={() => router.push("/abastecimento")}
                />
            </Section>

            <Section title="Estoque">
                <View style={styles.actions}>
                    <Button label="Retirar do Principal" variant="secondary" onPress={() => router.push("/estoque-principal")} />
                    <Button label="Entrada ou ajuste" variant="secondary" onPress={() => router.push("/ajuste-estoque-principal")} />
                    <Button label="Consumo do carrinho" variant="secondary" onPress={() => router.push("/consumo-carrinho")} />
                    <Button label="Devolução ao Principal" variant="secondary" onPress={() => router.push("/devolucao")} />
                </View>
            </Section>

            <Section title="Planejamento">
                <Button label="Criar ou consultar reservas" variant="secondary" onPress={() => router.push("/reservas")} />
            </Section>

            <Section title="Sincronização">
                <Button label="Ver fila de operações" variant="secondary" onPress={() => router.push("/sincronizacao" as Href)} />
            </Section>
        </Screen>
    );
}

const styles = StyleSheet.create({
    title: { ...Typography.screenTitle, color: Palette.text },
    subtitle: { ...Typography.body, color: Palette.textSecondary, marginTop: Spacing.one },
    actions: { gap: Spacing.two }
});
