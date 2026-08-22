import React, { useState } from "react";

import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

import {
    useLocalSearchParams,
    useRouter
} from "expo-router";

import { Screen } from "../components/layout/Screen";
import { Section } from "../components/layout/Section";
import { Card } from "../components/ui/Card";
import {
    ControlSize,
    Palette,
    Radius,
    Spacing,
    Typography
} from "../constants/theme";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { LocalId } from "../models/Local";
import { UsuarioId } from "../models/Usuario";
import { AbastecimentoLocalScreen } from "../screens/AbastecimentoLocalScreen";
import { AbastecimentoMercadoScreen } from "../screens/AbastecimentoMercadoScreen";

const locais = [
    { id: LocalId.BOULEVARD, nome: "Boulevard", destaque: true },
    { id: LocalId.AEROPORTO, nome: "Aeroporto", destaque: true },
    { id: LocalId.GAUCHO_VICENTE_FONTOURA, nome: "Gauchão Vicente da Fontoura", destaque: false },
    { id: LocalId.SUPERMAGO_IPIRANGA, nome: "SuperMago Ipiranga", destaque: false },
    { id: LocalId.GAUCHO_ANTONIO_CARVALHO, nome: "Gauchão Antônio de Carvalho", destaque: false },
    { id: LocalId.SUPERMERCADO_FANTE, nome: "Supermercado Fante", destaque: false },
    { id: LocalId.SUPERMAGO_PLANALTO, nome: "SuperMago Planalto", destaque: false },
    { id: LocalId.SAMS_CLUB, nome: "Sam's Club", destaque: false },
    { id: LocalId.SUPERMAGO_BOA_VISTA, nome: "SuperMago Boa Vista", destaque: false }
] as const;

export default function SupplyPage() {
    const router = useRouter();
    const { localId } = useLocalSearchParams<{ localId?: string }>();
    const [busca, setBusca] = useState("");
    const { estoqueRodrigo, estoqueCesar, reservas, registrarAbastecimento } = useApp();
    const { usuario } = useAuth();
    const locaisPermitidos = locais.filter((local) => !local.destaque ||
        (usuario!.id === UsuarioId.RODRIGO && local.id === LocalId.BOULEVARD) ||
        (usuario!.id === UsuarioId.CESAR && local.id === LocalId.AEROPORTO)
    );
    const selecionado = locaisPermitidos.find((local) => local.id === localId);
    const alterarLocal = () => router.setParams({ localId: undefined });

    if (!selecionado) {
        const termo = busca.trim().toLocaleLowerCase("pt-BR");
        const mercados = locaisPermitidos.filter((local) => !local.destaque && local.nome.toLocaleLowerCase("pt-BR").includes(termo));
        return (
            <Screen>
                <Text style={styles.subtitle}>1. Escolha o local do abastecimento.</Text>
                <Section title="Locais principais">
                    <View style={styles.highlighted}>
                        {locaisPermitidos.filter((local) => local.destaque).map((local) => (
                            <Card key={local.id} onPress={() => router.setParams({ localId: local.id })} style={styles.highlightCard} accessibilityLabel={`Abastecer ${local.nome}`}>
                                <Text style={styles.highlightTitle}>{local.nome}</Text>
                                <Text style={styles.highlightAction}>Continuar ›</Text>
                            </Card>
                        ))}
                    </View>
                </Section>
                <Section title="Mercados">
                    <TextInput style={styles.search} value={busca} onChangeText={setBusca} placeholder="Buscar mercado" placeholderTextColor={Palette.disabled} />
                    <Card style={styles.marketList}>
                        {mercados.map((local, index) => (
                            <Pressable key={local.id} onPress={() => router.setParams({ localId: local.id })} style={({ pressed }) => [styles.marketRow, index > 0 && styles.border, pressed && styles.pressed]}>
                                <Text style={styles.marketName}>{local.nome}</Text><Text style={styles.arrow}>›</Text>
                            </Pressable>
                        ))}
                        {mercados.length === 0 ? <Text style={styles.noResults}>Nenhum mercado encontrado.</Text> : null}
                    </Card>
                </Section>
            </Screen>
        );
    }

    if (selecionado.id === LocalId.BOULEVARD || selecionado.id === LocalId.AEROPORTO) {
        const rodrigo = usuario!.id === UsuarioId.RODRIGO;
        return (
            <AbastecimentoLocalScreen
                localId={selecionado.id}
                localNome={selecionado.nome}
                responsavelId={usuario!.id}
                estoque={rodrigo ? estoqueRodrigo : estoqueCesar}
                reservas={reservas}
                registrarAbastecimento={registrarAbastecimento}
                onChangeLocal={alterarLocal}
            />
        );
    }

    return <AbastecimentoMercadoScreen localId={selecionado.id} localNome={selecionado.nome} onChangeLocal={alterarLocal} />;
}

const styles = StyleSheet.create({
    subtitle: { ...Typography.body, color: Palette.textSecondary },
    highlighted: { flexDirection: "row", gap: Spacing.two },
    highlightCard: { flex: 1, minHeight: 104, justifyContent: "space-between", backgroundColor: Palette.primarySoft, borderColor: Palette.primary },
    highlightTitle: { ...Typography.cardTitle, color: Palette.text },
    highlightAction: { ...Typography.label, color: Palette.primary, fontWeight: "700" },
    search: { height: ControlSize.input, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.medium, backgroundColor: Palette.surface, paddingHorizontal: Spacing.compact, color: Palette.text, ...Typography.body, marginBottom: Spacing.compact },
    marketList: { paddingVertical: 0 },
    marketRow: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    border: { borderTopWidth: 1, borderTopColor: Palette.border },
    pressed: { opacity: 0.65 },
    marketName: { ...Typography.body, color: Palette.text, fontWeight: "600" },
    arrow: { fontSize: 22, color: Palette.primary },
    noResults: { ...Typography.label, color: Palette.textSecondary, textAlign: "center", paddingVertical: Spacing.four }
});
