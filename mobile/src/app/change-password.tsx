import React from "react";
import { Href, Redirect } from "expo-router";

import { useAuth } from "../context/AuthContext";
import { ChangePasswordScreen } from "../screens/ChangePasswordScreen";

export default function ChangePasswordPage() {
    const { estado } = useAuth();
    if (estado === "NAO_AUTENTICADO") {
        return <Redirect href={"/login" as Href} />;
    }
    if (estado === "AUTENTICADO") {
        return <Redirect href="/" />;
    }
    return <ChangePasswordScreen />;
}
