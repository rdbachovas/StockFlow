package br.com.stockflow.devolucao;

import java.util.ArrayList;
import java.util.List;

import br.com.stockflow.produto.Produto;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "devolucao_itens")
public class DevolucaoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "devolucao_id", nullable = false)
    private Devolucao devolucao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(name = "quantidade_livre", nullable = false)
    private int quantidadeLivre;

    @Column(name = "quantidade_reservada", nullable = false)
    private int quantidadeReservada;

    @Column(name = "quantidade_total", nullable = false)
    private int quantidadeTotal;

    @Column(name = "saldo_pessoal_anterior", nullable = false)
    private int saldoPessoalAnterior;

    @Column(name = "saldo_pessoal_posterior", nullable = false)
    private int saldoPessoalPosterior;

    @Column(name = "saldo_principal_anterior", nullable = false)
    private int saldoPrincipalAnterior;

    @Column(name = "saldo_principal_posterior", nullable = false)
    private int saldoPrincipalPosterior;

    @OneToMany(mappedBy = "devolucaoItem", cascade = CascadeType.ALL)
    private List<DevolucaoReserva> reservas = new ArrayList<>();

    protected DevolucaoItem() {
    }

    public DevolucaoItem(
            Devolucao devolucao,
            Produto produto,
            int quantidadeLivre,
            int quantidadeReservada,
            int saldoPessoalAnterior,
            int saldoPessoalPosterior,
            int saldoPrincipalAnterior,
            int saldoPrincipalPosterior
    ) {
        this.devolucao = devolucao;
        this.produto = produto;
        this.quantidadeLivre = quantidadeLivre;
        this.quantidadeReservada = quantidadeReservada;
        this.quantidadeTotal = quantidadeLivre + quantidadeReservada;
        this.saldoPessoalAnterior = saldoPessoalAnterior;
        this.saldoPessoalPosterior = saldoPessoalPosterior;
        this.saldoPrincipalAnterior = saldoPrincipalAnterior;
        this.saldoPrincipalPosterior = saldoPrincipalPosterior;
    }

    public void adicionarReserva(DevolucaoReserva reserva) {
        reservas.add(reserva);
    }

    public Produto getProduto() { return produto; }
    public int getQuantidadeLivre() { return quantidadeLivre; }
    public int getQuantidadeReservada() { return quantidadeReservada; }
    public int getQuantidadeTotal() { return quantidadeTotal; }
    public int getSaldoPessoalAnterior() { return saldoPessoalAnterior; }
    public int getSaldoPessoalPosterior() { return saldoPessoalPosterior; }
    public int getSaldoPrincipalAnterior() { return saldoPrincipalAnterior; }
    public int getSaldoPrincipalPosterior() { return saldoPrincipalPosterior; }
    public List<DevolucaoReserva> getReservas() { return List.copyOf(reservas); }
}
