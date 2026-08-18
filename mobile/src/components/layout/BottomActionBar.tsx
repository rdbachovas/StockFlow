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
import { Button } from "../ui/Button";

interface Props {
    summaryLabel: string;
    summaryValue: string;
    actionLabel: string;
    onPress: () => void;
    loading?: boolean;
    destructive?: boolean;
}

export function BottomActionBar({
    summaryLabel,
    summaryValue,
    actionLabel,
    onPress,
    loading = false,
    destructive = false
}: Props) {
    return (
        <View style={styles.bar}>
            <View style={styles.summary}>
                <Text style={styles.label}>{summaryLabel}</Text>
                <Text style={styles.value}>{summaryValue}</Text>
            </View>
            <Button
                label={actionLabel}
                onPress={onPress}
                loading={loading}
                variant={destructive ? "danger" : "primary"}
                style={styles.button}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.three,
        backgroundColor: Palette.surface,
        borderTopWidth: 1,
        borderTopColor: Palette.border,
        paddingHorizontal: Spacing.three,
        paddingTop: Spacing.compact,
        paddingBottom: Spacing.three
    },
    summary: {
        minWidth: 72
    },
    label: {
        ...Typography.caption,
        color: Palette.textSecondary
    },
    value: {
        ...Typography.cardTitle,
        color: Palette.text,
        marginTop: Spacing.half
    },
    button: {
        flex: 1
    }
});
