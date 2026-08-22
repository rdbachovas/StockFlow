import { UsuarioId } from "../models/Usuario";

export class IdentidadeOperacionalService {
    static exigirUsuarioAutenticado(
        usuarioId: UsuarioId,
        responsavelId: string
    ): void {
        if (responsavelId !== usuarioId) {
            throw new Error("Não é permitido criar uma operação em nome de outro usuário.");
        }
    }
}
