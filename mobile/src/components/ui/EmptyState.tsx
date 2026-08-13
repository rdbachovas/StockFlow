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
import { Button } from "./Button";

interface Props {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    title,
    description,
    actionLabel,
    onAction
}: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {description ? (
                <Text style={styles.description}>{description}</Text>
            ) : null}
            {actionLabel && onAction ? (
                <Button
                    label={actionLabel}
                    onPress={onAction}
                    variant="secondary"
                    style={styles.action}
                />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        paddingVertical: Spacing.four,
        paddingHorizontal: Spacing.three
    },
    title: {
        ...Typography.cardTitle,
        color: Palette.text,
        textAlign: "center"
    },
    description: {
        ...Typography.label,
        color: Palette.textSecondary,
        textAlign: "center",
        marginTop: Spacing.one
    },
    action: {
        marginTop: Spacing.three
    }
});
