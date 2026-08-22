import React from "react";
import { Redirect } from "expo-router";

import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";

export default function LoginPage() {
    const { estado } = useAuth();
    if (estado === "AUTENTICADO") {
        return <Redirect href="/" />;
    }
    return <LoginScreen />;
}
