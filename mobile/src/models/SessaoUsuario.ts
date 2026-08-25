import { UsuarioId } from "./Usuario";

export interface SessaoUsuario {
    id: UsuarioId;
    nome: string;
    trocaSenhaObrigatoria?: boolean;
}
