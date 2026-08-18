import React from "react";

import {
    StyleSheet,
    Text,
    View
} from "react-native";

import {
    Palette,
    Spacing,
    Typography
} from "../../constants/theme";

export interface TimelineEvent {
    id: string;
    title: string;
    quantity?: string;
    date: Date;
    note?: string;
}

interface Props {
    events: TimelineEvent[];
}

export function HistoryTimeline({ events }: Props) {
    return (
        <View style={styles.timeline}>
            {events.map((event, index) => (
                <View key={event.id} style={styles.event}>
                    <View style={styles.rail}>
                        <View style={styles.dot} />
                        {index < events.length - 1 ? <View style={styles.line} /> : null}
                    </View>
                    <View style={styles.content}>
                        <View style={styles.titleRow}>
                            <Text style={styles.title}>{event.title}</Text>
                            {event.quantity ? <Text style={styles.quantity}>{event.quantity}</Text> : null}
                        </View>
                        <Text style={styles.date}>{new Date(event.date).toLocaleString("pt-BR")}</Text>
                        {event.note ? <Text style={styles.note}>{event.note}</Text> : null}
                    </View>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    timeline: { marginTop: Spacing.two },
    event: { flexDirection: "row", minHeight: 58 },
    rail: { width: 20, alignItems: "center" },
    dot: { width: 9, height: 9, borderRadius: 99, backgroundColor: Palette.primary, marginTop: 5 },
    line: { width: 1, flex: 1, backgroundColor: Palette.border, marginVertical: 3 },
    content: { flex: 1, paddingLeft: Spacing.two, paddingBottom: Spacing.compact },
    titleRow: { flexDirection: "row", justifyContent: "space-between" },
    title: { ...Typography.label, color: Palette.text, fontWeight: "700" },
    quantity: { ...Typography.label, color: Palette.primary, fontWeight: "700" },
    date: { ...Typography.caption, color: Palette.textSecondary, marginTop: Spacing.half },
    note: { ...Typography.caption, color: Palette.text, marginTop: Spacing.one }
});
