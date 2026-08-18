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
import { Abastecimento } from "../models/Abastecimento";
import { ConsumoCarrinho } from "../models/ConsumoCarrinho";
import { DevolucaoEstoque } from "../models/DevolucaoEstoque";
import { LocalId } from "../models/Local";
import { ProdutoId } from "../models/Produto";
import { RetiradaEstoque } from "../models/RetiradaEstoque";
import { UsuarioId } from "../models/Usuario";
import { nomeProduto } from "../utils/ProdutoUtils";

interface Props {
    retiradas: RetiradaEstoque[];
    abastecimentos: Abastecimento[];
    devolucoes: DevolucaoEstoque[];
    consumosCarrinho: ConsumoCarrinho[];
}

type HistoryType = "TODOS" | "ENTRADA" | "ABASTECIMENTO" | "DEVOLUCAO" | "CONSUMO";
type ResponsibleFilter = "TODOS" | UsuarioId;
interface HistoryItem { produtoId: ProdutoId; quantidade: number; anterior?: number; posterior?: number; }
interface PersonalEvent { id: string; type: Exclude<HistoryType, "TODOS">; responsible: string; date: Date; context: string; items: HistoryItem[]; observation?: string; }

function responsibleName(id: string): string { return id === UsuarioId.RODRIGO ? "Rodrigo" : id === UsuarioId.CESAR ? "Cesar" : id; }
function locationName(id: LocalId): string {
    return ({
        [LocalId.BOULEVARD]: "Boulevard", [LocalId.AEROPORTO]: "Aeroporto", [LocalId.MERCADOS]: "Mercados",
        [LocalId.GAUCHO_VICENTE_FONTOURA]: "Gauchão Vicente da Fontoura", [LocalId.SUPERMAGO_IPIRANGA]: "SuperMago Ipiranga",
        [LocalId.GAUCHO_ANTONIO_CARVALHO]: "Gauchão Antônio de Carvalho", [LocalId.SUPERMERCADO_FANTE]: "Supermercado Fante",
        [LocalId.SUPERMAGO_PLANALTO]: "SuperMago Planalto", [LocalId.SAMS_CLUB]: "Sam's Club", [LocalId.SUPERMAGO_BOA_VISTA]: "SuperMago Boa Vista"
    } as Record<LocalId, string>)[id];
}
function typeName(type: PersonalEvent["type"]): string {
    return type === "ENTRADA" ? "Entrada" : type === "ABASTECIMENTO" ? "Abastecimento" : type === "DEVOLUCAO" ? "Devolução" : "Consumo do carrinho";
}

export function HistoricoEstoquePessoalScreen({ retiradas, abastecimentos, devolucoes, consumosCarrinho }: Props) {
    const [type, setType] = useState<HistoryType>("TODOS");
    const [responsible, setResponsible] = useState<ResponsibleFilter>("TODOS");
    const [period, setPeriod] = useState<HistoryPeriod>("TODOS");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const events = useMemo<PersonalEvent[]>(() => [
        ...retiradas.map((item) => ({ id: `RET_${item.id}`, type: "ENTRADA" as const, responsible: item.responsavelId, date: item.data, context: "Recebido do Estoque Principal", observation: item.observacao, items: item.itens.map((detail) => ({ produtoId: detail.produtoId, quantidade: detail.quantidade })) })),
        ...abastecimentos.map((item) => ({ id: `ABA_${item.id}`, type: "ABASTECIMENTO" as const, responsible: item.responsavelId, date: item.data, context: `Enviado para ${locationName(item.localId)}`, observation: item.observacao, items: item.itens.reduce<HistoryItem[]>((grouped, detail) => {
            const existing = grouped.find((candidate) => candidate.produtoId === detail.produtoId);
            if (existing) existing.quantidade += detail.quantidade;
            else {
                const balance = item.saldos?.find((saldo) => saldo.produtoId === detail.produtoId);
                grouped.push({ produtoId: detail.produtoId, quantidade: detail.quantidade, anterior: balance?.saldoAnterior, posterior: balance?.saldoPosterior });
            }
            return grouped;
        }, []) })),
        ...devolucoes.map((item) => ({ id: `DEV_${item.id}`, type: "DEVOLUCAO" as const, responsible: item.responsavelId, date: item.data, context: "Devolvido ao Estoque Principal", observation: item.observacao, items: item.itens.map((detail) => ({ produtoId: detail.produtoId, quantidade: detail.quantidadeTotal ?? detail.quantidadeLivre + detail.reservas.reduce((sum, parcel) => sum + parcel.quantidade, 0), anterior: detail.saldoPessoalAnterior, posterior: detail.saldoPessoalPosterior })) })),
        ...consumosCarrinho.map((item) => ({ id: `CONS_${item.id}`, type: "CONSUMO" as const, responsible: item.responsavelId, date: item.data, context: "Utilizado no carrinho", observation: item.observacao, items: item.itens.map((detail) => ({ produtoId: detail.produtoId, quantidade: detail.quantidade, anterior: detail.saldoAnterior, posterior: detail.saldoPosterior })) }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()), [retiradas, abastecimentos, devolucoes, consumosCarrinho]);
    const filtered = events.filter((event) => type === "TODOS" || event.type === type).filter((event) => responsible === "TODOS" || event.responsible === responsible).filter((event) => isWithinHistoryPeriod(event.date, period));

    return (
        <Screen>
            <Text style={styles.subtitle}>Entradas e saídas dos estoques de Rodrigo e Cesar.</Text>
            <Card style={styles.filters}>
                <HistoryFilters label="Tipo" value={type} onChange={setType} options={[{ value: "TODOS", label: "Todos" }, { value: "ENTRADA", label: "Entradas" }, { value: "ABASTECIMENTO", label: "Abastecimentos" }, { value: "DEVOLUCAO", label: "Devoluções" }, { value: "CONSUMO", label: "Carrinho" }]} />
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
                                <View><Text style={styles.itemName}>{nomeProduto(item.produtoId)}</Text>{item.anterior !== undefined && item.posterior !== undefined ? <Text style={styles.balance}>Saldo {item.anterior} → {item.posterior}</Text> : null}</View>
                                <Text style={styles.quantity}>{item.quantidade}</Text>
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
    itemRow: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: Palette.border },
    itemName: { ...Typography.label, color: Palette.text, fontWeight: "600" },
    balance: { ...Typography.caption, color: Palette.textSecondary, marginTop: Spacing.half },
    quantity: { ...Typography.cardTitle, color: Palette.text },
    note: { ...Typography.label, color: Palette.text, marginTop: Spacing.compact }
});
