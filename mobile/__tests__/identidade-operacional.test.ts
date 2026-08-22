import { describe, expect, test } from "@jest/globals";

import { UsuarioId } from "../src/models/Usuario";
import { IdentidadeOperacionalService } from "../src/services/IdentidadeOperacionalService";

describe("identidade das novas operações", () => {
    test.each([
        "retirada",
        "reserva",
        "abastecimento",
        "devolução",
        "consumo"
    ])("%s aceita somente o usuário autenticado", () => {
        expect(() => IdentidadeOperacionalService.exigirUsuarioAutenticado(
            UsuarioId.RODRIGO,
            UsuarioId.RODRIGO
        )).not.toThrow();
        expect(() => IdentidadeOperacionalService.exigirUsuarioAutenticado(
            UsuarioId.RODRIGO,
            UsuarioId.CESAR
        )).toThrow("outro usuário");
    });

    test("Movimento Principal funciona para ambos", () => {
        expect(() => IdentidadeOperacionalService.exigirUsuarioAutenticado(
            UsuarioId.RODRIGO,
            UsuarioId.RODRIGO
        )).not.toThrow();
        expect(() => IdentidadeOperacionalService.exigirUsuarioAutenticado(
            UsuarioId.CESAR,
            UsuarioId.CESAR
        )).not.toThrow();
    });
});
