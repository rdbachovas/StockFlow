import React, { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { ControlSize, Palette, Radius, Spacing, Typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { ErroApi } from "../services/ApiService";

export function LoginScreen() {
    const { login } = useAuth();
    const enviandoRef = useRef(false);
    const [identificador, setIdentificador] = useState("");
    const [senha, setSenha] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string>();

    const entrar = async (): Promise<void> => {
        if (enviandoRef.current) {
            return;
        }
        if (!identificador.trim() || !senha) {
            setErro("Informe login e senha.");
            return;
        }
        try {
            enviandoRef.current = true;
            setEnviando(true);
            setErro(undefined);
            await login(identificador, senha);
        } catch (erroRecebido) {
            setErro(
                erroRecebido instanceof ErroApi && erroRecebido.status === 401
                    ? "Login ou senha inválidos."
                    : erroRecebido instanceof Error
                        ? erroRecebido.message
                        : "Não foi possível entrar."
            );
        } finally {
            enviandoRef.current = false;
            setEnviando(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>StockFlow</Text>
                <Text style={styles.subtitle}>Entre para acessar os estoques e operações.</Text>
                <Card style={styles.card}>
                    <Text style={styles.label}>Login</Text>
                    <TextInput
                        accessibilityLabel="Login"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={identificador}
                        onChangeText={setIdentificador}
                        style={styles.input}
                    />
                    <Text style={styles.label}>Senha</Text>
                    <TextInput
                        accessibilityLabel="Senha"
                        autoCapitalize="none"
                        secureTextEntry
                        value={senha}
                        onChangeText={setSenha}
                        onSubmitEditing={() => { void entrar(); }}
                        style={styles.input}
                    />
                    {erro ? (
                        <FeedbackBanner
                            title="Não foi possível entrar"
                            message={erro}
                            variant="danger"
                        />
                    ) : null}
                    <Button label="Entrar" onPress={() => { void entrar(); }} loading={enviando} />
                </Card>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", backgroundColor: Palette.background },
    content: { width: "100%", maxWidth: 440, alignSelf: "center", padding: Spacing.four },
    title: { ...Typography.screenTitle, color: Palette.text, textAlign: "center" },
    subtitle: { ...Typography.body, color: Palette.textSecondary, textAlign: "center", marginTop: Spacing.one, marginBottom: Spacing.four },
    card: { gap: Spacing.two },
    label: { ...Typography.label, color: Palette.text },
    input: { height: ControlSize.input, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.medium, backgroundColor: Palette.surface, paddingHorizontal: Spacing.compact, color: Palette.text, ...Typography.body }
});
