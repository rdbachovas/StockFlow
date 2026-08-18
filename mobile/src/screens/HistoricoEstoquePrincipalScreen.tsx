import React, {
    useMemo,
    useState
} from "react";

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
import { DevolucaoEstoque } from "../models/DevolucaoEstoque";
import { Estoque } from "../models/Estoque";
import {
    MovimentoEstoquePrincipal,
    TipoMovimentoEstoquePrincipal
} from "../models/MovimentoEstoquePrincipal";
import { ProdutoId } from "../models/Produto";
import { RetiradaEstoque } from "../models/RetiradaEstoque";
import { UsuarioId } from "../models/Usuario";
import { nomeProduto } from "../utils/ProdutoUtils";

type EventType = "ENTRADA" | "AJUSTE_SAIDA" | "RETIRADA" | "DEVOLUCAO";
type DirectionFilter = "TODOS" | "ENTRADAS" | "SAIDAS";
type ResponsibleFilter = "TODOS" | UsuarioId;
interface EventItem { produtoId: ProdutoId; quantidade: number; delta: number; anterior?: number; posterior?: number; }
interface MainEvent { id: string; type: EventType; responsible: string; date: Date; context: string; items: EventItem[]; observation?: string; }
interface Props { estoquePrincipal: Estoque; movimentos: MovimentoEstoquePrincipal[]; retiradas: RetiradaEstoque[]; devolucoes: DevolucaoEstoque[]; }

function responsibleName(id: string): string { return id === UsuarioId.RODRIGO ? "Rodrigo" : id === UsuarioId.CESAR ? "Cesar" : id; }
function typeName(type: EventType): string { return type === "ENTRADA" ? "Entrada" : type === "AJUSTE_SAIDA" ? "Saída/Ajuste" : type === "RETIRADA" ? "Retirada" : "Devolução"; }

export function HistoricoEstoquePrincipalScreen({ estoquePrincipal, movimentos, retiradas, devolucoes }: Props) {
    const [direction, setDirection] = useState<DirectionFilter>("TODOS");
    const [responsible, setResponsible] = useState<ResponsibleFilter>("TODOS");
    const [period, setPeriod] = useState<HistoryPeriod>("TODOS");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const events = useMemo<MainEvent[]>(() => {
        const list: MainEvent[] = [
            ...movimentos.map((movement) => {
                const entry = movement.tipo === TipoMovimentoEstoquePrincipal.ENTRADA;
                return { id: `MOV_${movement.id}`, type: entry ? "ENTRADA" as const : "AJUSTE_SAIDA" as const, responsible: movement.responsavelId, date: movement.data, context: entry ? "Mercadoria adicionada ao estoque central" : "Remoção direta do estoque central", observation: movement.observacao, items: movement.itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade, delta: entry ? item.quantidade : -item.quantidade })) };
            }),
            ...retiradas.map((withdrawal) => ({ id: `RET_${withdrawal.id}`, type: "RETIRADA" as const, responsible: withdrawal.responsavelId, date: withdrawal.data, context: `Principal → ${responsibleName(withdrawal.responsavelId)}`, observation: withdrawal.observacao, items: withdrawal.itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade, delta: -item.quantidade })) })),
            ...devolucoes.map((returnRecord) => ({ id: `DEV_${returnRecord.id}`, type: "DEVOLUCAO" as const, responsible: returnRecord.responsavelId, date: returnRecord.data, context: `${responsibleName(returnRecord.responsavelId)} → Principal`, observation: returnRecord.observacao, items: returnRecord.itens.map((item) => { const quantity = item.quantidadeTotal ?? item.quantidadeLivre + item.reservas.reduce((sum, parcel) => sum + parcel.quantidade, 0); return { produtoId: item.produtoId, quantidade: quantity, delta: quantity }; }) }))
        ];
        const totalDelta = new Map<ProdutoId, number>();
        list.forEach((event) => event.items.forEach((item) => totalDelta.set(item.produtoId, (totalDelta.get(item.produtoId) ?? 0) + item.delta)));
        const balances = new Map<ProdutoId, number>();
        estoquePrincipal.itens.forEach((item) => balances.set(item.produtoId, item.quantidade - (totalDelta.get(item.produtoId) ?? 0)));
        [...list].sort((a, b) => a.date.getTime() - b.date.getTime()).forEach((event) => event.items.forEach((item) => {
            item.anterior = balances.get(item.produtoId) ?? 0;
            item.posterior = item.anterior + item.delta;
            balances.set(item.produtoId, item.posterior);
        }));
        return list.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [estoquePrincipal, movimentos, retiradas, devolucoes]);

    const filtered = events
        .filter((event) => direction === "TODOS" || (direction === "ENTRADAS" ? event.type === "ENTRADA" || event.type === "DEVOLUCAO" : event.type === "AJUSTE_SAIDA" || event.type === "RETIRADA"))
        .filter((event) => responsible === "TODOS" || event.responsible === responsible)
        .filter((event) => isWithinHistoryPeriod(event.date, period));

    return (
        <Screen>
            <Text style={styles.subtitle}>Tudo que alterou fisicamente o estoque central.</Text>
            <Card style={styles.filters}>
                <HistoryFilters label="Tipo" value={direction} onChange={setDirection} options={[{ value: "TODOS", label: "Todos" }, { value: "ENTRADAS", label: "Entradas" }, { value: "SAIDAS", label: "Saídas" }]} />
                <HistoryFilters label="Responsável" value={responsible} onChange={setResponsible} options={[{ value: "TODOS", label: "Todos" }, { value: UsuarioId.RODRIGO, label: "Rodrigo" }, { value: UsuarioId.CESAR, label: "Cesar" }]} />
                <HistoryFilters label="Período" value={period} onChange={setPeriod} options={HISTORY_PERIOD_OPTIONS} />
            </Card>
            {filtered.length === 0 ? <Card><EmptyState title="Nenhuma movimentação encontrada" description="Tente ampliar os filtros selecionados." /></Card> : filtered.map((event) => {
                const total = event.items.reduce((sum, item) => sum + item.quantidade, 0);
                const expanded = expandedId === event.id;
                return (
                    <MovementCard key={event.id} type={typeName(event.type)} context={`${responsibleName(event.responsible)} · ${event.context}`} summary={`${total} itens em ${event.items.length} ${event.items.length === 1 ? "produto" : "produtos"}`} date={event.date} expanded={expanded} onToggle={() => setExpandedId(expanded ? null : event.id)}>
                        {event.items.map((item) => (
                            <View key={item.produtoId} style={styles.itemRow}>
                                <View><Text style={styles.itemName}>{nomeProduto(item.produtoId)}</Text><Text style={styles.balance}>Saldo {item.anterior} → {item.posterior}</Text></View>
                                <Text style={[styles.quantity, item.delta < 0 && styles.negative]}>{item.delta > 0 ? "+" : ""}{item.delta}</Text>
                            </View>
                        ))}
                        {event.observation ? <Text style={styles.note}>Observação: {event.observation}</Text> : null}
                    </MovementCard>
                );
            })}
        </Screen>
    );
}

const styles = StyleSheet.create({
    subtitle: { ...Typography.body, color: Palette.textSecondary, marginBottom: Spacing.three },
    filters: { paddingBottom: Spacing.one, marginBottom: Spacing.three },
    itemRow: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: Palette.border },
    itemName: { ...Typography.label, color: Palette.text, fontWeight: "600" },
    balance: { ...Typography.caption, color: Palette.textSecondary, marginTop: Spacing.half },
    quantity: { ...Typography.cardTitle, color: Palette.success },
    negative: { color: Palette.danger },
    note: { ...Typography.label, color: Palette.text, marginTop: Spacing.compact }
});
