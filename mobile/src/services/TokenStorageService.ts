import * as SecureStore from "expo-secure-store";

export const CHAVE_REFRESH_TOKEN = "stockflow.refresh-token";

export class TokenStorageService {
    static async obterRefreshToken(): Promise<string | null> {
        return await SecureStore.getItemAsync(CHAVE_REFRESH_TOKEN);
    }

    static async salvarRefreshToken(refreshToken: string): Promise<void> {
        await SecureStore.setItemAsync(CHAVE_REFRESH_TOKEN, refreshToken);
    }

    static async removerRefreshToken(): Promise<void> {
        await SecureStore.deleteItemAsync(CHAVE_REFRESH_TOKEN);
    }
}
