import React, { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { ControlSize, Palette, Radius, Spacing, Typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { validarTrocaSenha } from "../services/PasswordPolicyClient";

export function ChangePasswordScreen() {
    const { alterarSenha, logout } = useAuth();
    const enviandoRef = useRef(false);
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmacao, setConfirmacao] = useState("");
    const [erro, setErro] = useState<string>();
    const [enviando, setEnviando] = useState(false);

    const salvar = async (): Promise<void> => {
        if (enviandoRef.current) return;
        const erroValidacao = validarTrocaSenha(
            senhaAtual, novaSenha, confirmacao
        );
        if (erroValidacao) {
            setErro(erroValidacao);
            return;
        }
        try {
            enviandoRef.current = true;
            setEnviando(true);
            setErro(undefined);
            await alterarSenha(senhaAtual, novaSenha);
        } catch (erroRecebido) {
            setErro(erroRecebido instanceof Error
                ? erroRecebido.message
                : "Não foi possível alterar a senha.");
        } finally {
            enviandoRef.current = false;
            setEnviando(false);
        }
    };

    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Text style={styles.title}>Crie uma senha definitiva</Text>
                <Text style={styles.subtitle}>
                    Por segurança, troque a senha temporária antes de operar o estoque.
                </Text>
                <PasswordInput label="Senha atual" value={senhaAtual} onChange={setSenhaAtual} />
                <PasswordInput label="Nova senha" value={novaSenha} onChange={setNovaSenha} />
                <PasswordInput label="Confirmar nova senha" value={confirmacao} onChange={setConfirmacao} />
                {erro ? <FeedbackBanner title="Não foi possível trocar a senha" message={erro} variant="danger" /> : null}
                <Button label="Trocar senha" loading={enviando} onPress={() => { void salvar(); }} />
                <Button label="Sair" variant="secondary" onPress={() => { void logout(); }} />
            </Card>
        </View>
    );
}

function PasswordInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return <><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} autoCapitalize="none" secureTextEntry value={value} onChangeText={onChange} style={styles.input} /></>;
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", backgroundColor: Palette.background, padding: Spacing.four },
    card: { width: "100%", maxWidth: 440, alignSelf: "center", gap: Spacing.two },
    title: { ...Typography.screenTitle, color: Palette.text },
    subtitle: { ...Typography.body, color: Palette.textSecondary },
    label: { ...Typography.label, color: Palette.text },
    input: { height: ControlSize.input, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.medium, backgroundColor: Palette.surface, paddingHorizontal: Spacing.compact, color: Palette.text, ...Typography.body }
});
