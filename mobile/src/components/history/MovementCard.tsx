import React, { ReactNode } from "react";

import {
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";

import {
    Palette,
    Spacing,
    Typography
} from "../../constants/theme";
import { Card } from "../ui/Card";

interface Props {
    type: string;
    context: string;
    summary: string;
    date: Date;
    expanded: boolean;
    onToggle: () => void;
    children: ReactNode;
}

export function MovementCard({ type, context, summary, date, expanded, onToggle, children }: Props) {
    return (
        <Card style={styles.card}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={onToggle} style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
                <View style={styles.content}>
                    <Text style={styles.type}>{type}</Text>
                    <Text style={styles.context}>{context}</Text>
                    <Text style={styles.summary}>{summary}</Text>
                    <Text style={styles.date}>{new Date(date).toLocaleString("pt-BR")}</Text>
                </View>
                <Text style={styles.chevron}>{expanded ? "⌃" : "⌄"}</Text>
            </Pressable>
            {expanded ? <View style={styles.details}>{children}</View> : null}
        </Card>
    );
}

const styles = StyleSheet.create({
    card: { marginBottom: Spacing.two },
    header: { minHeight: 88, flexDirection: "row", alignItems: "center" },
    pressed: { opacity: 0.65 },
    content: { flex: 1, paddingRight: Spacing.two },
    type: { ...Typography.caption, color: Palette.primary, fontWeight: "700", textTransform: "uppercase" },
    context: { ...Typography.cardTitle, color: Palette.text, marginTop: Spacing.half },
    summary: { ...Typography.label, color: Palette.textSecondary, marginTop: Spacing.half },
    date: { ...Typography.caption, color: Palette.textSecondary, marginTop: Spacing.one },
    chevron: { fontSize: 19, color: Palette.primary },
    details: { borderTopWidth: 1, borderTopColor: Palette.border, paddingTop: Spacing.compact, marginTop: Spacing.two }
});
