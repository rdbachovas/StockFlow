import React from "react";

import {
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

import {
    ControlSize,
    Palette,
    Radius,
    Spacing,
    Typography
} from "../../constants/theme";

interface Props {
    name: string;
    balance: string;
    value: string;
    onChange: (value: string) => void;
    projection?: string;
    projectionDanger?: boolean;
}

export function QuantityRow({
    name,
    balance,
    value,
    onChange,
    projection,
    projectionDanger = false
}: Props) {
    return (
        <View style={styles.row}>
            <View style={styles.content}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.balance}>{balance}</Text>
                {projection ? (
                    <Text style={[styles.projection, projectionDanger && styles.danger]}>
                        {projection}
                    </Text>
                ) : null}
            </View>
            <TextInput
                accessibilityLabel={`Quantidade de ${name}`}
                style={styles.input}
                value={value}
                onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Palette.disabled}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: Palette.border
    },
    content: {
        flex: 1,
        paddingRight: Spacing.two
    },
    name: {
        ...Typography.body,
        color: Palette.text,
        fontWeight: "600"
    },
    balance: {
        ...Typography.caption,
        color: Palette.textSecondary,
        marginTop: Spacing.half
    },
    projection: {
        ...Typography.caption,
        color: Palette.primary,
        marginTop: Spacing.half
    },
    danger: {
        color: Palette.danger
    },
    input: {
        width: 68,
        height: ControlSize.input,
        borderRadius: Radius.small,
        borderWidth: 1,
        borderColor: Palette.border,
        backgroundColor: Palette.background,
        color: Palette.text,
        textAlign: "center",
        fontSize: 16,
        fontWeight: "700"
    }
});
