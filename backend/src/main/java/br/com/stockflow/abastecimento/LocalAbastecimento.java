package br.com.stockflow.abastecimento;

import br.com.stockflow.reserva.DestinoReserva;

public enum LocalAbastecimento {
    BOULEVARD,
    AEROPORTO,
    MERCADOS,
    GAUCHO_VICENTE_FONTOURA,
    SUPERMAGO_IPIRANGA,
    GAUCHO_ANTONIO_CARVALHO,
    SUPERMERCADO_FANTE,
    SUPERMAGO_PLANALTO,
    SAMS_CLUB,
    SUPERMAGO_BOA_VISTA;

    public DestinoReserva destinoReserva() {
        return switch (this) {
            case BOULEVARD -> DestinoReserva.BOULEVARD;
            case AEROPORTO -> DestinoReserva.AEROPORTO;
            case SUPERMAGO_BOA_VISTA -> DestinoReserva.SUPERMAGO_BOA_VISTA;
            default -> DestinoReserva.MERCADOS;
        };
    }
}
