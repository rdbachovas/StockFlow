import React, { useState } from "react";

import {
    StyleSheet,
    Text,
    View
} from "react-native";

import {
    HISTORY_PERIOD_OPTIONS,
    HistoryFilters,
    HistoryPeriod,
    isWithinHistoryPeriod
} from "../components/history/HistoryFilters";
import { MovementCard } from "../components/history/MovementCard";
import { Screen } from "../components/layout/Screen";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import {
    Palette,
    Spacing,
    Typography
} from "../constants/theme";
import { Abastecimento } from "../models/Abastecimento";
import { LocalId } from "../models/Local";
import { UsuarioId } from "../models/Usuario";
import { HistoricoAbastecimentoService } from "../services/HistoricoAbastecimentoService";
import { nomeProduto } from "../utils/ProdutoUtils";

interface Props { abastecimentos: Abastecimento[]; }
type LocalFilter = "TODOS" | "PRINCIPAIS" | "MERCADOS";
type ResponsibleFilter = "TODOS" | UsuarioId;

function locationName(localId: LocalId): string {
    const names: Record<LocalId, string> = {
        [LocalId.BOULEVARD]: "Boulevard",
        [LocalId.AEROPORTO]: "Aeroporto",
        [LocalId.MERCADOS]: "Mercados",
        [LocalId.GAUCHO_VICENTE_FONTOURA]: "Gauchão Vicente da Fontoura",
        [LocalId.SUPERMAGO_IPIRANGA]: "SuperMago Ipiranga",
        [LocalId.GAUCHO_ANTONIO_CARVALHO]: "Gauchão Antônio de Carvalho",
        [LocalId.SUPERMERCADO_FANTE]: "Supermercado Fante",
        [LocalId.SUPERMAGO_PLANALTO]: "SuperMago Planalto",
        [LocalId.SAMS_CLUB]: "Sam's Club",
        [LocalId.SUPERMAGO_BOA_VISTA]: "SuperMago Boa Vista"
    };
    return names[localId];
}

function responsibleName(id: string): string {
    return id === UsuarioId.RODRIGO ? "Rodrigo" : id === UsuarioId.CESAR ? "Cesar" : id;
}

export function HistoricoScreen({ abastecimentos }: Props) {
    const [localFilter, setLocalFilter] = useState<LocalFilter>("TODOS");
    const [responsible, setResponsible] = useState<ResponsibleFilter>("TODOS");
    const [period, setPeriod] = useState<HistoryPeriod>("TODOS");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const principais = [LocalId.BOULEVARD, LocalId.AEROPORTO];
    const filtered = [...abastecimentos]
        .filter((item) => localFilter === "TODOS" || (localFilter === "PRINCIPAIS" ? principais.includes(item.localId) : !principais.includes(item.localId)))
        .filter((item) => responsible === "TODOS" || item.responsavelId === responsible)
        .filter((item) => isWithinHistoryPeriod(item.data, period))
        .sort((a, b) => b.data.getTime() - a.data.getTime());

    return (
        <Screen>
            <Text style={styles.subtitle}>Abastecimentos realizados por local e responsável.</Text>
            <Card style={styles.filters}>
                <HistoryFilters label="Local" value={localFilter} onChange={setLocalFilter} options={[{ value: "TODOS", label: "Todos" }, { value: "PRINCIPAIS", label: "Boulevard/Aeroporto" }, { value: "MERCADOS", label: "Mercados" }]} />
                <HistoryFilters label="Responsável" value={responsible} onChange={setResponsible} options={[{ value: "TODOS", label: "Todos" }, { value: UsuarioId.RODRIGO, label: "Rodrigo" }, { value: UsuarioId.CESAR, label: "Cesar" }]} />
                <HistoryFilters label="Período" value={period} onChange={setPeriod} options={HISTORY_PERIOD_OPTIONS} />
            </Card>

            {filtered.length === 0 ? <Card><EmptyState title="Nenhum abastecimento encontrado" description="Tente ampliar os filtros selecionados." /></Card> : filtered.map((supply) => {
                const machines = HistoricoAbastecimentoService.resumirPorMaquina(supply);
                const total = HistoricoAbastecimentoService.calcularTotal(supply);
                const expanded = expandedId === supply.id;
                return (
                    <MovementCard key={supply.id} type="Abastecimento" context={`${locationName(supply.localId)} · ${responsibleName(supply.responsavelId)}`} summary={`${total} pelúcias em ${machines.length} ${machines.length === 1 ? "máquina" : "máquinas"}`} date={supply.data} expanded={expanded} onToggle={() => setExpandedId(expanded ? null : supply.id)}>
                        {machines.map((machine) => (
                            <View key={machine.maquinaId} style={styles.machine}>
                                <Text style={styles.machineName}>{machine.maquinaId}</Text>
                                {machine.itens.map((item, index) => (
                                    <View key={`${item.maquinaId}-${item.produtoId}-${index}`} style={styles.itemRow}>
                                        <Text style={styles.itemName}>{nomeProduto(item.produtoId)}</Text><Text style={styles.itemQuantity}>{item.quantidade}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                        {supply.saldos?.map((saldo) => (
                            <View key={saldo.produtoId} style={styles.balanceRow}>
                                <Text style={styles.itemName}>{nomeProduto(saldo.produtoId)}</Text><Text style={styles.balance}>{saldo.saldoAnterior} → {saldo.saldoPosterior}</Text>
                            </View>
                        ))}
                        {supply.observacao ? <Text style={styles.note}>Observação: {supply.observacao}</Text> : null}
                    </MovementCard>
                );
            })}
        </Screen>
    );
}

const styles = StyleSheet.create({
    subtitle: { ...Typography.body, color: Palette.textSecondary, marginBottom: Spacing.three },
    filters: { paddingBottom: Spacing.one, marginBottom: Spacing.three },
    machine: { marginBottom: Spacing.compact },
    machineName: { ...Typography.label, color: Palette.text, fontWeight: "700", marginBottom: Spacing.one },
    itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.one },
    itemName: { ...Typography.label, color: Palette.textSecondary },
    itemQuantity: { ...Typography.label, color: Palette.text, fontWeight: "700" },
    balanceRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: Palette.border, paddingVertical: Spacing.two },
    balance: { ...Typography.label, color: Palette.primary, fontWeight: "700" },
    note: { ...Typography.label, color: Palette.text, marginTop: Spacing.two }
});
