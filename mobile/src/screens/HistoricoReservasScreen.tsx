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
import { HistoryTimeline } from "../components/history/HistoryTimeline";
import { MovementCard } from "../components/history/MovementCard";
import { Screen } from "../components/layout/Screen";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import {
    Palette,
    Spacing,
    Typography
} from "../constants/theme";
import { DestinoReservaId } from "../models/DestinoReserva";
import {
    Reserva,
    StatusReserva,
    TipoEventoReserva
} from "../models/Reserva";
import { UsuarioId } from "../models/Usuario";
import { ReservaService } from "../services/ReservaService";
import { nomeProduto } from "../utils/ProdutoUtils";

interface Props { reservas: Reserva[]; }
type EventFilter = "TODOS" | TipoEventoReserva;
type ResponsibleFilter = "TODOS" | UsuarioId;
interface ReservationEvent { id: string; reservation: Reserva; type: TipoEventoReserva; quantity: number; date: Date; observation?: string; }

function responsibleName(id: string): string { return id === UsuarioId.RODRIGO ? "Rodrigo" : id === UsuarioId.CESAR ? "Cesar" : id; }
function destinationName(id: DestinoReservaId): string { return id === DestinoReservaId.BOULEVARD ? "Boulevard" : id === DestinoReservaId.AEROPORTO ? "Aeroporto" : id === DestinoReservaId.MERCADOS ? "Mercados" : "SuperMago Boa Vista"; }
function eventName(type: TipoEventoReserva): string { return type === TipoEventoReserva.CRIACAO ? "Criação" : type === TipoEventoReserva.UTILIZACAO ? "Utilização" : type === TipoEventoReserva.LIBERACAO ? "Liberação" : type === TipoEventoReserva.CANCELAMENTO ? "Cancelamento" : "Conclusão"; }
function statusName(status: StatusReserva): string { return status === StatusReserva.ATIVA ? "Ativa" : status === StatusReserva.CANCELADA ? "Cancelada" : "Concluída"; }
function eventQuantity(type: TipoEventoReserva, quantity: number): string { return type === TipoEventoReserva.CRIACAO ? `+${quantity}` : type === TipoEventoReserva.CONCLUSAO ? "✓" : `-${quantity}`; }

export function HistoricoReservasScreen({ reservas }: Props) {
    const [type, setType] = useState<EventFilter>("TODOS");
    const [responsible, setResponsible] = useState<ResponsibleFilter>("TODOS");
    const [period, setPeriod] = useState<HistoryPeriod>("TODOS");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const events = useMemo<ReservationEvent[]>(() => reservas.flatMap((reservation) =>
        (reservation.historico ?? []).map((event) => ({ id: `${reservation.id}_${event.id}`, reservation, type: event.tipo, quantity: event.quantidade, date: event.data, observation: event.observacao }))
    ).sort((a, b) => b.date.getTime() - a.date.getTime()), [reservas]);
    const filtered = events.filter((event) => type === "TODOS" || event.type === type).filter((event) => responsible === "TODOS" || event.reservation.responsavelId === responsible).filter((event) => isWithinHistoryPeriod(event.date, period));

    return (
        <Screen>
            <Text style={styles.subtitle}>Ciclo completo de criação, uso e encerramento das reservas.</Text>
            <Card style={styles.filters}>
                <HistoryFilters label="Evento" value={type} onChange={setType} options={[{ value: "TODOS", label: "Todos" }, { value: TipoEventoReserva.CRIACAO, label: "Criação" }, { value: TipoEventoReserva.UTILIZACAO, label: "Utilização" }, { value: TipoEventoReserva.LIBERACAO, label: "Liberação" }, { value: TipoEventoReserva.CANCELAMENTO, label: "Cancelamento" }, { value: TipoEventoReserva.CONCLUSAO, label: "Conclusão" }]} />
                <HistoryFilters label="Responsável" value={responsible} onChange={setResponsible} options={[{ value: "TODOS", label: "Todos" }, { value: UsuarioId.RODRIGO, label: "Rodrigo" }, { value: UsuarioId.CESAR, label: "Cesar" }]} />
                <HistoryFilters label="Período" value={period} onChange={setPeriod} options={HISTORY_PERIOD_OPTIONS} />
            </Card>
            {filtered.length === 0 ? <Card><EmptyState title="Nenhum evento de reserva encontrado" description="Tente ampliar os filtros selecionados." /></Card> : filtered.map((event) => {
                const reservation = event.reservation;
                const expanded = expandedId === event.id;
                const remaining = ReservaService.quantidadeRestante(reservation);
                const timeline = [...(reservation.historico ?? [])].sort((a, b) => a.data.getTime() - b.data.getTime()).map((item) => ({ id: item.id, title: eventName(item.tipo), quantity: eventQuantity(item.tipo, item.quantidade), date: item.data, note: item.observacao }));
                return (
                    <MovementCard key={event.id} type={eventName(event.type)} context={`${responsibleName(reservation.responsavelId)} · ${destinationName(reservation.destinoId)}`} summary={`${nomeProduto(reservation.produtoId)} · ${eventQuantity(event.type, event.quantity)}`} date={event.date} expanded={expanded} onToggle={() => setExpandedId(expanded ? null : event.id)}>
                        <View style={styles.stats}>
                            <View style={styles.stat}><Text style={styles.statValue}>{reservation.quantidade}</Text><Text style={styles.statLabel}>Original</Text></View>
                            <View style={styles.stat}><Text style={styles.statValue}>{reservation.quantidadeUtilizada}</Text><Text style={styles.statLabel}>Utilizada</Text></View>
                            <View style={styles.stat}><Text style={styles.statValue}>{reservation.quantidadeLiberada ?? 0}</Text><Text style={styles.statLabel}>Liberada</Text></View>
                            <View style={styles.stat}><Text style={styles.statValue}>{remaining}</Text><Text style={styles.statLabel}>Restante</Text></View>
                        </View>
                        <View style={styles.statusRow}><Text style={styles.statusLabel}>Status atual</Text><Text style={[styles.status, reservation.status === StatusReserva.ATIVA && styles.active]}>{statusName(reservation.status)}</Text></View>
                        <Text style={styles.timelineTitle}>Eventos relacionados</Text>
                        <HistoryTimeline events={timeline} />
                    </MovementCard>
                );
            })}
        </Screen>
    );
}

const styles = StyleSheet.create({
    subtitle: { ...Typography.body, color: Palette.textSecondary, marginBottom: Spacing.three },
    filters: { paddingBottom: Spacing.one, marginBottom: Spacing.three },
    stats: { flexDirection: "row", backgroundColor: Palette.background, borderRadius: 10, paddingVertical: Spacing.compact },
    stat: { flex: 1, alignItems: "center" },
    statValue: { ...Typography.cardTitle, color: Palette.text },
    statLabel: { ...Typography.caption, color: Palette.textSecondary, marginTop: Spacing.half },
    statusRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.compact, borderBottomWidth: 1, borderBottomColor: Palette.border },
    statusLabel: { ...Typography.label, color: Palette.textSecondary },
    status: { ...Typography.label, color: Palette.text, fontWeight: "700" },
    active: { color: Palette.success },
    timelineTitle: { ...Typography.label, color: Palette.text, fontWeight: "700", marginTop: Spacing.compact }
});
