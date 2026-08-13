import React from "react";

import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    ViewStyle
} from "react-native";

import {
    ControlSize,
    Palette,
    Radius,
    Spacing,
    Typography
} from "../../constants/theme";

type ButtonVariant = "primary" | "secondary" | "danger" | "dangerGhost" | "ghost";

interface Props {
    label: string;
    onPress?: () => void;
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    accessibilityLabel?: string;
}

export function Button({
    label,
    onPress,
    variant = "primary",
    disabled = false,
    loading = false,
    style,
    accessibilityLabel
}: Props) {
    const indisponivel = disabled || loading;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            disabled={indisponivel}
            onPress={onPress}
            style={({ pressed }) => [
                styles.base,
                styles[variant],
                pressed && styles.pressed,
                indisponivel && styles.disabled,
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === "primary" ? Palette.surface : Palette.primary}
                />
            ) : (
                <Text style={[styles.label, styles[`${variant}Label`]]}>
                    {label}
                </Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        minHeight: ControlSize.button,
        borderRadius: Radius.medium,
        paddingHorizontal: Spacing.three,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1
    },
    primary: {
        backgroundColor: Palette.primary,
        borderColor: Palette.primary
    },
    secondary: {
        backgroundColor: Palette.surface,
        borderColor: Palette.border
    },
    danger: {
        backgroundColor: Palette.danger,
        borderColor: Palette.danger
    },
    dangerGhost: {
        backgroundColor: "transparent",
        borderColor: "transparent"
    },
    ghost: {
        backgroundColor: "transparent",
        borderColor: "transparent"
    },
    label: {
        ...Typography.body,
        fontWeight: "700"
    },
    primaryLabel: {
        color: Palette.surface
    },
    secondaryLabel: {
        color: Palette.text
    },
    dangerLabel: {
        color: Palette.surface
    },
    dangerGhostLabel: {
        color: Palette.danger
    },
    ghostLabel: {
        color: Palette.primary
    },
    pressed: {
        opacity: 0.82
    },
    disabled: {
        opacity: 0.5
    }
});
