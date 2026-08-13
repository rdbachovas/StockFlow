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

interface Props {
    productName: string;
    quantity: number;
    detail?: string;
    status?: "default" | "warning" | "danger";
}

export function ProductStockRow({
    productName,
    quantity,
    detail,
    status = "default"
}: Props) {
    return (
        <View style={styles.row}>
            <View style={styles.content}>
                <Text style={styles.name}>{productName}</Text>
                {detail ? <Text style={styles.detail}>{detail}</Text> : null}
            </View>
            <Text style={[styles.quantity, styles[status]]}>{quantity}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: Spacing.two,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border
    },
    content: {
        flex: 1,
        paddingRight: Spacing.three
    },
    name: {
        ...Typography.body,
        color: Palette.text,
        fontWeight: "600"
    },
    detail: {
        ...Typography.caption,
        color: Palette.textSecondary,
        marginTop: Spacing.half
    },
    quantity: {
        ...Typography.cardTitle,
        color: Palette.text
    },
    default: {
        color: Palette.text
    },
    warning: {
        color: Palette.warning
    },
    danger: {
        color: Palette.danger
    }
});
