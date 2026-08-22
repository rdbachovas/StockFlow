import { RegistrarAbastecimentoRequestDto } from "../dtos/AbastecimentoDto";
import { RegistrarConsumoCarrinhoRequestDto } from "../dtos/ConsumoCarrinhoDto";
import { RegistrarDevolucaoRequestDto } from "../dtos/DevolucaoDto";
import { RegistrarMovimentoEstoquePrincipalRequestDto } from "../dtos/MovimentoEstoquePrincipalDto";
import {
    CancelarReservaRequestDto,
    CriarReservaRequestDto
} from "../dtos/ReservaDto";
import { RegistrarRetiradaRequestDto } from "../dtos/RetiradaDto";

export type StatusComandoPendente =
    | "PENDENTE"
    | "ENVIANDO"
    | "CONFIRMADO"
    | "ERRO"
    | "CONFLITO"
    | "REQUER_ATENCAO";

export type ComandoPendente =
    | Comando<"RETIRADA", RegistrarRetiradaRequestDto>
    | Comando<"CRIAR_RESERVA", CriarReservaRequestDto>
    | Comando<"CANCELAR_RESERVA", PayloadCancelamentoReserva>
    | Comando<"ABASTECIMENTO", RegistrarAbastecimentoRequestDto>
    | Comando<"DEVOLUCAO", RegistrarDevolucaoRequestDto>
    | Comando<"MOVIMENTO_PRINCIPAL", RegistrarMovimentoEstoquePrincipalRequestDto>
    | Comando<"CONSUMO_CARRINHO", RegistrarConsumoCarrinhoRequestDto>;

interface Comando<Tipo extends string, Payload> {
    commandId: string;
    usuarioIdCriador?: string;
    tipo: Tipo;
    payload: Payload;
    dataCriacao: string;
    status: StatusComandoPendente;
    tentativas: number;
    erro?: string;
    motivo?: string;
    revisaoConhecida?: number;
}

export interface PayloadCancelamentoReserva {
    reservaId: string;
    corpo: CancelarReservaRequestDto;
}

export type TipoComandoPendente = ComandoPendente["tipo"];
