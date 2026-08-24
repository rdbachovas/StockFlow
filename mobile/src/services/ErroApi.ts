export type TipoErroApi =
    | "TIMEOUT"
    | "REDE_INDISPONIVEL"
    | "HTTP_401"
    | "HTTP_403"
    | "HTTP_4XX"
    | "HTTP_5XX";

export class ErroApi extends Error {
    readonly tipo: TipoErroApi;

    constructor(
        mensagem: string,
        readonly status?: number,
        tipo?: TipoErroApi
    ) {
        super(mensagem);
        this.name = "ErroApi";
        this.tipo = tipo ?? classificarStatus(status);
    }
}

function classificarStatus(status?: number): TipoErroApi {
    if (status === 401) {
        return "HTTP_401";
    }
    if (status === 403) {
        return "HTTP_403";
    }
    if (status !== undefined && status >= 400 && status < 500) {
        return "HTTP_4XX";
    }
    if (status !== undefined && status >= 500) {
        return "HTTP_5XX";
    }
    return "REDE_INDISPONIVEL";
}
