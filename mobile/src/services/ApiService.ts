import { SnapshotDto } from "../dtos/SnapshotDto";

export class ApiService {
    static async obterSnapshot(): Promise<SnapshotDto> {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

        if (!apiUrl) {
            throw new Error("EXPO_PUBLIC_API_URL não configurada.");
        }

        const resposta = await fetch(`${apiUrl}/api/v1/snapshot`);

        if (!resposta.ok) {
            throw new Error(`Falha ao obter snapshot: HTTP ${resposta.status}.`);
        }

        return await resposta.json() as SnapshotDto;
    }
}
