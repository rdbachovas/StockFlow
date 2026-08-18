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
import { Card } from "../ui/Card";

interface Props {
    name: string;
    total: number;
    description?: string;
    onPress?: () => void;
}

export function StockSummary({
    name,
    total,
    description,
    onPress
}: Props) {
    return (
        <Card
            onPress={onPress}
            accessibilityLabel={`Abrir estoque ${name}`}
            style={styles.card}
        >
            <View style={styles.header}>
                <Text style={styles.name}>{name}</Text>
                {onPress ? <Text style={styles.arrow}>›</Text> : null}
            </View>
            <Text style={styles.total}>{total}</Text>
            <Text style={styles.description}>{description ?? "itens em estoque"}</Text>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        minWidth: 104,
        padding: Spacing.compact
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    name: {
        ...Typography.label,
        color: Palette.textSecondary,
        fontWeight: "700"
    },
    arrow: {
        fontSize: 20,
        lineHeight: 20,
        color: Palette.primary
    },
    total: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "700",
        color: Palette.text,
        marginTop: Spacing.two
    },
    description: {
        ...Typography.caption,
        color: Palette.textSecondary,
        marginTop: Spacing.half
    }
});
