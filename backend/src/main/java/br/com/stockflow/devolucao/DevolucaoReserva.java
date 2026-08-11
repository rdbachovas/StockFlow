package br.com.stockflow.devolucao;

import br.com.stockflow.reserva.DestinoReserva;
import br.com.stockflow.reserva.Reserva;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "devolucao_reservas")
public class DevolucaoReserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "devolucao_item_id", nullable = false)
    private DevolucaoItem devolucaoItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reserva_id", nullable = false)
    private Reserva reserva;

    @Enumerated(EnumType.STRING)
    @Column(name = "destino_id", length = 50, nullable = false)
    private DestinoReserva destino;

    @Column(nullable = false)
    private int quantidade;

    protected DevolucaoReserva() {
    }

    public DevolucaoReserva(
            DevolucaoItem devolucaoItem,
            Reserva reserva,
            int quantidade
    ) {
        this.devolucaoItem = devolucaoItem;
        this.reserva = reserva;
        this.destino = reserva.getDestino();
        this.quantidade = quantidade;
    }

    public java.util.UUID getReservaId() { return reserva.getId(); }
    public DestinoReserva getDestino() { return destino; }
    public int getQuantidade() { return quantidade; }
}
