import "@/global.css";

import { Platform } from "react-native";

export const Palette = {
    background: "#F6F7F9",
    surface: "#FFFFFF",
    text: "#17202A",
    textSecondary: "#667085",
    border: "#E4E7EC",
    primary: "#087E8B",
    primarySoft: "#E7F4F5",
    success: "#16845B",
    successSoft: "#EAF7F1",
    warning: "#B26A00",
    warningSoft: "#FFF5E0",
    danger: "#C73535",
    dangerSoft: "#FDECEC",
    disabled: "#98A2B3"
} as const;

export const Colors = {
    light: {
        text: Palette.text,
        background: Palette.background,
        backgroundElement: Palette.surface,
        backgroundSelected: Palette.primarySoft,
        textSecondary: Palette.textSecondary
    },
    dark: {
        text: "#FFFFFF",
        background: "#101828",
        backgroundElement: "#1D2939",
        backgroundSelected: "#344054",
        textSecondary: "#D0D5DD"
    }
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
    ios: {
        sans: "system-ui",
        serif: "ui-serif",
        rounded: "ui-rounded",
        mono: "ui-monospace"
    },
    default: {
        sans: "normal",
        serif: "serif",
        rounded: "normal",
        mono: "monospace"
    },
    web: {
        sans: "var(--font-display)",
        serif: "var(--font-serif)",
        rounded: "var(--font-rounded)",
        mono: "var(--font-mono)"
    }
});

export const Spacing = {
    half: 2,
    one: 4,
    two: 8,
    compact: 12,
    three: 16,
    four: 24,
    five: 32,
    six: 64
} as const;

export const Radius = {
    small: 8,
    medium: 12,
    large: 14,
    pill: 999
} as const;

export const Typography = {
    screenTitle: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "700" as const
    },
    sectionTitle: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: "700" as const
    },
    cardTitle: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: "700" as const
    },
    body: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: "400" as const
    },
    label: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "500" as const
    },
    caption: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "500" as const
    }
} as const;

export const ControlSize = {
    minimumTouch: 44,
    button: 48,
    input: 48,
    compact: 40,
    icon: 20
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
