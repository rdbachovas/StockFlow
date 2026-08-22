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
    | "AUTENTICADO"
    | "NAO_AUTENTICADO";

interface AuthContextValue {
    estado: EstadoAutenticacao;
    usuario?: SessaoUsuario;
    login: (login: string, senha: string) => Promise<void>;
    logout: () => Promise<void>;
    restaurarSessao: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [estado, setEstado] = useState<EstadoAutenticacao>("CARREGANDO");
    const [usuario, setUsuario] = useState<SessaoUsuario>();

    const restaurarSessao = async (): Promise<void> => {
        setEstado("CARREGANDO");
        const restaurado = await AuthService.restaurarSessao();
        setUsuario(restaurado);
        setEstado(restaurado ? "AUTENTICADO" : "NAO_AUTENTICADO");
    };

    useEffect(() => {
        const parar = SessaoService.observarEncerramento(() => {
            setUsuario(undefined);
            setEstado("NAO_AUTENTICADO");
        });
        void restaurarSessao();
        return parar;
    }, []);

    const login = async (identificador: string, senha: string): Promise<void> => {
        const autenticado = await AuthService.login(identificador, senha);
        setUsuario(autenticado);
        setEstado("AUTENTICADO");
    };

    const logout = async (): Promise<void> => {
        await AuthService.logout();
        setUsuario(undefined);
        setEstado("NAO_AUTENTICADO");
    };

    return (
        <AuthContext.Provider value={{
            estado,
            usuario,
            login,
            logout,
            restaurarSessao
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const contexto = useContext(AuthContext);
    if (!contexto) {
        throw new Error("useAuth deve ser utilizado dentro de AuthProvider.");
    }
    return contexto;
}
