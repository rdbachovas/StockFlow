import React from "react";

import {
    StyleSheet,
    Text,
    View
} from "react-native";

import {
    Palette,
    Radius,
    Spacing,
    Typography
} from "../../constants/theme";

type FeedbackVariant = "success" | "warning" | "danger";

interface Props {
    title: string;
    message?: string;
    variant?: FeedbackVariant;
}

export function FeedbackBanner({
    title,
    message,
    variant = "success"
}: Props) {
    return (
        <View
            accessibilityRole="alert"
            style={[styles.banner, styles[variant]]}
        >
            <Text style={[styles.title, styles[`${variant}Text`]]}>
                {title}
            </Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        borderRadius: Radius.medium,
        padding: Spacing.three,
        borderWidth: 1,
        gap: Spacing.one
    },
    success: {
        backgroundColor: Palette.successSoft,
        borderColor: Palette.success
    },
    warning: {
        backgroundColor: Palette.warningSoft,
        borderColor: Palette.warning
    },
    danger: {
        backgroundColor: Palette.dangerSoft,
        borderColor: Palette.danger
    },
    title: {
        ...Typography.label,
        fontWeight: "700"
    },
    successText: {
        color: Palette.success
    },
    warningText: {
        color: Palette.warning
    },
    dangerText: {
        color: Palette.danger
    },
    message: {
        ...Typography.label,
        color: Palette.text
    }
});
