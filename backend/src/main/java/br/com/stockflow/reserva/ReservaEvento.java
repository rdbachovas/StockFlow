package br.com.stockflow.reserva;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "reserva_eventos")
public class ReservaEvento {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reserva_id", nullable = false)
    private Reserva reserva;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private TipoEventoReserva tipo;

    @Column(nullable = false)
    private int quantidade;

    @Column(nullable = false)
    private OffsetDateTime data;

    protected ReservaEvento() {
    }

    ReservaEvento(
            Reserva reserva,
            TipoEventoReserva tipo,
            int quantidade,
            OffsetDateTime data
    ) {
        this.id = UUID.randomUUID();
        this.reserva = reserva;
        this.tipo = tipo;
        this.quantidade = quantidade;
        this.data = data;
    }

    public UUID getId() {
        return id;
    }

    public TipoEventoReserva getTipo() {
        return tipo;
    }

    public int getQuantidade() {
        return quantidade;
    }

    public OffsetDateTime getData() {
        return data;
    }
}
