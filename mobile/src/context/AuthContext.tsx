import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState
} from "react";

import { SessaoUsuario } from "../models/SessaoUsuario";
import { AuthService } from "../services/AuthService";
import { SessaoService } from "../services/SessaoService";

export type EstadoAutenticacao =
    | "CARREGANDO"
    | "TROCA_SENHA_OBRIGATORIA"
    | "AUTENTICADO"
    | "NAO_AUTENTICADO";

interface AuthContextValue {
    estado: EstadoAutenticacao;
    usuario?: SessaoUsuario;
    login: (login: string, senha: string) => Promise<void>;
    logout: () => Promise<void>;
    alterarSenha: (senhaAtual: string, novaSenha: string) => Promise<void>;
    restaurarSessao: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [estado, setEstado] = useState<EstadoAutenticacao>("CARREGANDO");
    const [usuario, setUsuario] = useState<SessaoUsuario>();

    const restaurarSessao = async (): Promise<void> => {
        setEstado("CARREGANDO");
        try {
            const restaurado = await AuthService.restaurarSessao();
            setUsuario(restaurado);
            setEstado(restaurado
                ? estadoDoUsuario(restaurado)
                : "NAO_AUTENTICADO");
        } catch (erro) {
            setUsuario(undefined);
            setEstado("NAO_AUTENTICADO");
            throw erro;
        }
    };

    useEffect(() => {
        const parar = SessaoService.observarEncerramento(() => {
            setUsuario(undefined);
            setEstado("NAO_AUTENTICADO");
        });
        void restaurarSessao().catch(() => undefined);
        return parar;
    }, []);

    const login = async (identificador: string, senha: string): Promise<void> => {
        const autenticado = await AuthService.login(identificador, senha);
        setUsuario(autenticado);
        setEstado(estadoDoUsuario(autenticado));
    };

    const logout = async (): Promise<void> => {
        await AuthService.logout();
        setUsuario(undefined);
        setEstado("NAO_AUTENTICADO");
    };

    const alterarSenha = async (
        senhaAtual: string,
        novaSenha: string
    ): Promise<void> => {
        await AuthService.alterarSenha(senhaAtual, novaSenha);
        setUsuario(undefined);
        setEstado("NAO_AUTENTICADO");
    };

    return (
        <AuthContext.Provider value={{
            estado,
            usuario,
            login,
            logout,
            alterarSenha,
            restaurarSessao
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function estadoDoUsuario(usuario: SessaoUsuario): EstadoAutenticacao {
    return usuario.trocaSenhaObrigatoria
        ? "TROCA_SENHA_OBRIGATORIA"
        : "AUTENTICADO";
}

export function podeInicializarOperacoes(
    estado: EstadoAutenticacao
): boolean {
    return estado === "AUTENTICADO";
}

export function useAuth(): AuthContextValue {
    const contexto = useContext(AuthContext);
    if (!contexto) {
        throw new Error("useAuth deve ser utilizado dentro de AuthProvider.");
    }
    return contexto;
}
