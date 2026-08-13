import React from "react";

import {
    Pressable,
    StyleSheet,
    Text
} from "react-native";

import {
    ControlSize,
    Palette,
    Radius,
    Spacing,
    Typography
} from "../../constants/theme";

interface Props {
    label: string;
    selected?: boolean;
    onPress: () => void;
    disabled?: boolean;
}

export function Chip({
    label,
    selected = false,
    onPress,
    disabled = false
}: Props) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.chip,
                selected && styles.selected,
                pressed && styles.pressed,
                disabled && styles.disabled
            ]}
        >
            <Text style={[styles.label, selected && styles.selectedLabel]}>
                {label}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    chip: {
        minHeight: ControlSize.compact,
        paddingHorizontal: Spacing.three,
        borderRadius: Radius.pill,
        borderWidth: 1,
        borderColor: Palette.border,
        backgroundColor: Palette.surface,
        alignItems: "center",
        justifyContent: "center"
    },
    selected: {
        backgroundColor: Palette.primarySoft,
        borderColor: Palette.primary
    },
    label: {
        ...Typography.label,
        color: Palette.text,
        fontWeight: "700"
    },
    selectedLabel: {
        color: Palette.primary
    },
    pressed: {
        opacity: 0.8
    },
    disabled: {
        opacity: 0.5
    }
});
