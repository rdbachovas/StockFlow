import React, { ReactNode } from "react";

import {
    SafeAreaView,
    ScrollView,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle
} from "react-native";

import {
    Palette,
    Spacing
} from "../../constants/theme";

interface Props {
    children: ReactNode;
    scroll?: boolean;
    contentContainerStyle?: StyleProp<ViewStyle>;
}

export function Screen({
    children,
    scroll = true,
    contentContainerStyle
}: Props) {
    return (
        <SafeAreaView style={styles.safeArea}>
            {scroll ? (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.content, contentContainerStyle]}
                >
                    {children}
                </ScrollView>
            ) : (
                <View style={[styles.content, styles.flex, contentContainerStyle]}>
                    {children}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Palette.background
    },
    content: {
        paddingHorizontal: Spacing.three,
        paddingTop: Spacing.four,
        paddingBottom: Spacing.six
    },
    flex: {
        flex: 1
    }
});
