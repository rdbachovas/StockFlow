package br.com.stockflow.consumocarrinho;

import br.com.stockflow.produto.Produto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "consumo_carrinho_itens")
public class ConsumoCarrinhoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consumo_id", nullable = false)
    private ConsumoCarrinho consumo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(nullable = false)
    private int quantidade;

    @Column(name = "saldo_anterior", nullable = false)
    private int saldoAnterior;

    @Column(name = "saldo_posterior", nullable = false)
    private int saldoPosterior;

    protected ConsumoCarrinhoItem() {
    }

    public ConsumoCarrinhoItem(
            ConsumoCarrinho consumo,
            Produto produto,
            int quantidade,
            int saldoAnterior,
            int saldoPosterior
    ) {
        this.consumo = consumo;
        this.produto = produto;
        this.quantidade = quantidade;
        this.saldoAnterior = saldoAnterior;
        this.saldoPosterior = saldoPosterior;
    }

    public Produto getProduto() { return produto; }
    public int getQuantidade() { return quantidade; }
    public int getSaldoAnterior() { return saldoAnterior; }
    public int getSaldoPosterior() { return saldoPosterior; }
}
