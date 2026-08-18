import React, { ReactNode } from "react";

import {
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle
} from "react-native";

import {
    Palette,
    Spacing,
    Typography
} from "../../constants/theme";

interface Props {
    title: string;
    description?: string;
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
}

export function Section({
    title,
    description,
    children,
    style
}: Props) {
    return (
        <View style={[styles.section, style]}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {description ? (
                    <Text style={styles.description}>{description}</Text>
                ) : null}
            </View>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginTop: Spacing.four
    },
    header: {
        marginBottom: Spacing.compact
    },
    title: {
        ...Typography.sectionTitle,
        color: Palette.text
    },
    description: {
        ...Typography.label,
        color: Palette.textSecondary,
        marginTop: Spacing.one
    }
});
