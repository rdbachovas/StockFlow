import React from "react";

import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

import {
    Palette,
    Spacing,
    Typography
} from "../../constants/theme";
import { Chip } from "../ui/Chip";

export interface HistoryFilterOption<T extends string> {
    value: T;
    label: string;
}

export type HistoryPeriod = "TODOS" | "7_DIAS" | "30_DIAS";

export const HISTORY_PERIOD_OPTIONS: HistoryFilterOption<HistoryPeriod>[] = [
    { value: "TODOS", label: "Todo período" },
    { value: "7_DIAS", label: "7 dias" },
    { value: "30_DIAS", label: "30 dias" }
];

export function isWithinHistoryPeriod(date: Date, period: HistoryPeriod): boolean {
    if (period === "TODOS") return true;
    const days = period === "7_DIAS" ? 7 : 30;
    return new Date(date).getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}

interface Props<T extends string> {
    label: string;
    value: T;
    options: HistoryFilterOption<T>[];
    onChange: (value: T) => void;
}

export function HistoryFilters<T extends string>({ label, value, options, onChange }: Props<T>) {
    return (
        <View style={styles.group}>
            <Text style={styles.label}>{label}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.options}>
                {options.map((option) => (
                    <Chip key={option.value} label={option.label} selected={value === option.value} onPress={() => onChange(option.value)} />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    group: { marginBottom: Spacing.compact },
    label: { ...Typography.caption, color: Palette.textSecondary, marginBottom: Spacing.two, textTransform: "uppercase" },
    options: { gap: Spacing.two, paddingRight: Spacing.three }
});
