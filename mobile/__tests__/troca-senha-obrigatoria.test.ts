import { describe, expect, test } from "@jest/globals";

import {
    estadoDoUsuario,
    podeInicializarOperacoes
} from "../src/context/AuthContext";
import { UsuarioId } from "../src/models/Usuario";
import { validarTrocaSenha } from "../src/services/PasswordPolicyClient";

describe("troca de senha obrigatória", () => {
    test("sessão temporária não inicializa AppProvider operacional", () => {
        const estado = estadoDoUsuario({
            id: UsuarioId.RODRIGO,
            nome: "Rodrigo",
            trocaSenhaObrigatoria: true
        });

        expect(estado).toBe("TROCA_SENHA_OBRIGATORIA");
        expect(podeInicializarOperacoes(estado)).toBe(false);
        expect(podeInicializarOperacoes("AUTENTICADO")).toBe(true);
    });

    test("valida senha atual, tamanho e confirmação", () => {
        expect(validarTrocaSenha("", "nova senha definitiva", "nova senha definitiva"))
            .toContain("pelo menos 12");
        expect(validarTrocaSenha("atual", "curta", "curta"))
            .toContain("pelo menos 12");
        expect(validarTrocaSenha("atual", "nova senha definitiva", "diferente"))
            .toContain("confirmação");
        expect(validarTrocaSenha(
            "atual", "nova senha definitiva", "nova senha definitiva"
        )).toBeUndefined();
    });
});
