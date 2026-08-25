export function validarTrocaSenha(
    senhaAtual: string,
    novaSenha: string,
    confirmacao: string
): string | undefined {
    if (!senhaAtual || novaSenha.length < 12) {
        return "A nova senha deve ter pelo menos 12 caracteres.";
    }
    if (novaSenha !== confirmacao) {
        return "A confirmação não corresponde à nova senha.";
    }
    return undefined;
}
