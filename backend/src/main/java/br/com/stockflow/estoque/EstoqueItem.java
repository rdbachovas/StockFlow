package br.com.stockflow.estoque;

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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "estoque_itens",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_estoque_itens_estoque_produto",
                columnNames = {"estoque_id", "produto_id"}
        )
)
public class EstoqueItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estoque_id", nullable = false)
    private Estoque estoque;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(nullable = false)
    private int quantidade;

    protected EstoqueItem() {
    }

    public EstoqueItem(
            Estoque estoque,
            Produto produto,
            int quantidade
    ) {
        if (quantidade < 0) {
            throw new IllegalArgumentException(
                    "A quantidade não pode ser negativa."
            );
        }

        this.estoque = estoque;
        this.produto = produto;
        this.quantidade = quantidade;
    }

    public void adicionar(int quantidade) {
        if (quantidade <= 0) {
            throw new IllegalArgumentException(
                    "A quantidade deve ser maior que zero."
            );
        }

        this.quantidade += quantidade;
    }

    public void remover(int quantidade) {
        if (quantidade <= 0) {
            throw new IllegalArgumentException(
                    "A quantidade deve ser maior que zero."
            );
        }

        if (this.quantidade < quantidade) {
            throw new IllegalArgumentException(
                    "Estoque insuficiente."
            );
        }

        this.quantidade -= quantidade;
    }

    public Long getId() {
        return id;
    }

    public Produto getProduto() {
        return produto;
    }

    public int getQuantidade() {
        return quantidade;
    }
}
