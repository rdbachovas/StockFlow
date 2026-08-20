export function gerarCommandId(): string {
    const cryptoGlobal = globalThis.crypto as Crypto | undefined;

    if (typeof cryptoGlobal?.randomUUID === "function") {
        return cryptoGlobal.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        (caractere) => {
            const aleatorio = Math.floor(Math.random() * 16);
            const valor = caractere === "x"
                ? aleatorio
                : (aleatorio & 0x3) | 0x8;
            return valor.toString(16);
        }
    );
}
