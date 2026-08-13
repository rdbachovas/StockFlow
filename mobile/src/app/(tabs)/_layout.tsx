import React from "react";

import {
    ColorValue,
    StyleSheet,
    Text
} from "react-native";

import { Tabs } from "expo-router";

import {
    ControlSize,
    Palette,
    Typography
} from "../../constants/theme";

interface TabIconProps {
    symbol: string;
    color: ColorValue;
}

function TabIcon({ symbol, color }: TabIconProps) {
    return <Text style={[styles.icon, { color }]}>{symbol}</Text>;
}

export default function MainTabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Palette.primary,
                tabBarInactiveTintColor: Palette.textSecondary,
                tabBarLabelStyle: styles.label,
                tabBarStyle: styles.tabBar,
                tabBarItemStyle: styles.tabItem
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Início",
                    tabBarIcon: ({ color }) => <TabIcon symbol="⌂" color={color} />
                }}
            />
            <Tabs.Screen
                name="estoques"
                options={{
                    title: "Estoques",
                    tabBarIcon: ({ color }) => <TabIcon symbol="▦" color={color} />
                }}
            />
            <Tabs.Screen
                name="operacoes"
                options={{
                    title: "Operações",
                    tabBarIcon: ({ color }) => <TabIcon symbol="＋" color={color} />
                }}
            />
            <Tabs.Screen
                name="historicos"
                options={{
                    title: "Histórico",
                    tabBarIcon: ({ color }) => <TabIcon symbol="↻" color={color} />
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        height: 68,
        paddingTop: 6,
        paddingBottom: 8,
        backgroundColor: Palette.surface,
        borderTopColor: Palette.border
    },
    tabItem: {
        minHeight: ControlSize.minimumTouch
    },
    label: {
        ...Typography.caption,
        fontWeight: "600"
    },
    icon: {
        fontSize: 22,
        lineHeight: 24,
        fontWeight: "600"
    }
});
