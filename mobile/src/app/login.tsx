import React from "react";
import { Href, Redirect } from "expo-router";

import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";

export default function LoginPage() {
    const { estado } = useAuth();
    if (estado === "AUTENTICADO") {
        return <Redirect href="/" />;
    }
    if (estado === "TROCA_SENHA_OBRIGATORIA") {
        return <Redirect href={"/change-password" as Href} />;
    }
    return <LoginScreen />;
}
