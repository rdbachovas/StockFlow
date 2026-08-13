import React, { ReactNode } from "react";

import {
    Pressable,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle
} from "react-native";

import {
    Palette,
    Radius,
    Spacing
} from "../../constants/theme";

interface Props {
    children: ReactNode;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
}

export function Card({
    children,
    onPress,
    style,
    accessibilityLabel
}: Props) {
    if (onPress) {
        return (
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                onPress={onPress}
                style={({ pressed }) => [
                    styles.card,
                    pressed && styles.pressed,
                    style
                ]}
            >
                {children}
            </Pressable>
        );
    }

    return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Palette.surface,
        borderWidth: 1,
        borderColor: Palette.border,
        borderRadius: Radius.large,
        padding: Spacing.three
    },
    pressed: {
        opacity: 0.82
    }
});
