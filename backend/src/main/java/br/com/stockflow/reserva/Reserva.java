package br.com.stockflow.reserva;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import br.com.stockflow.produto.Produto;
import br.com.stockflow.usuario.Usuario;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "reservas")
public class Reserva {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "responsavel_id", nullable = false)
    private Usuario responsavel;

    @Enumerated(EnumType.STRING)
    @Column(name = "destino_id", length = 50, nullable = false)
    private DestinoReserva destino;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(nullable = false)
    private int quantidade;

    @Column(name = "quantidade_utilizada", nullable = false)
    private int quantidadeUtilizada;

    @Column(name = "quantidade_liberada", nullable = false)
    private int quantidadeLiberada;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private StatusReserva status;

    @Column(name = "data_criacao", nullable = false)
    private OffsetDateTime dataCriacao;

    @OneToMany(
            mappedBy = "reserva",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @OrderBy("data ASC")
    private List<ReservaEvento> eventos = new ArrayList<>();

    protected Reserva() {
    }

    public Reserva(
            Usuario responsavel,
            DestinoReserva destino,
            Produto produto,
            int quantidade,
            OffsetDateTime dataCriacao
    ) {
        if (quantidade <= 0) {
            throw new IllegalArgumentException(
                    "A quantidade deve ser maior que zero."
            );
        }

        this.id = UUID.randomUUID();
        this.responsavel = responsavel;
        this.destino = destino;
        this.produto = produto;
        this.quantidade = quantidade;
        this.quantidadeUtilizada = 0;
        this.quantidadeLiberada = 0;
        this.status = StatusReserva.ATIVA;
        this.dataCriacao = dataCriacao;
        adicionarEvento(TipoEventoReserva.CRIACAO, quantidade, dataCriacao);
    }

    public void registrarUtilizacao(int quantidade) {
        registrarUtilizacao(quantidade, OffsetDateTime.now());
    }

    public void registrarUtilizacao(
            int quantidade,
            OffsetDateTime data
    ) {
        if (status != StatusReserva.ATIVA) {
            throw new IllegalStateException("A reserva não está ativa.");
        }
        if (quantidade <= 0 || quantidade > getQuantidadeRestante()) {
            throw new IllegalArgumentException(
                    "Quantidade de utilização inválida."
            );
        }

        quantidadeUtilizada += quantidade;
        adicionarEvento(TipoEventoReserva.UTILIZACAO, quantidade, data);
        if (getQuantidadeRestante() == 0) {
            status = StatusReserva.CONCLUIDA;
            adicionarEvento(TipoEventoReserva.CONCLUSAO, 0, data);
        }
    }

    public int cancelar(OffsetDateTime data) {
        if (status != StatusReserva.ATIVA) {
            throw new IllegalStateException("A reserva não está ativa.");
        }

        int restante = getQuantidadeRestante();
        quantidadeLiberada += restante;
        status = StatusReserva.CANCELADA;
        adicionarEvento(TipoEventoReserva.CANCELAMENTO, restante, data);
        return restante;
    }

    private void adicionarEvento(
            TipoEventoReserva tipo,
            int quantidade,
            OffsetDateTime data
    ) {
        eventos.add(new ReservaEvento(this, tipo, quantidade, data));
    }

    public UUID getId() {
        return id;
    }

    public Usuario getResponsavel() {
        return responsavel;
    }

    public DestinoReserva getDestino() {
        return destino;
    }

    public Produto getProduto() {
        return produto;
    }

    public int getQuantidade() {
        return quantidade;
    }

    public int getQuantidadeUtilizada() {
        return quantidadeUtilizada;
    }

    public int getQuantidadeLiberada() {
        return quantidadeLiberada;
    }

    public int getQuantidadeRestante() {
        return quantidade - quantidadeUtilizada - quantidadeLiberada;
    }

    public StatusReserva getStatus() {
        return status;
    }

    public OffsetDateTime getDataCriacao() {
        return dataCriacao;
    }

    public List<ReservaEvento> getEventos() {
        return List.copyOf(eventos);
    }
}
