package br.com.stockflow.abastecimento;

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
@Table(name = "abastecimento_itens")
public class AbastecimentoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "abastecimento_id", nullable = false)
    private Abastecimento abastecimento;

    @Column(name = "maquina_id", length = 100, nullable = false)
    private String maquinaId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(nullable = false)
    private int quantidade;

    protected AbastecimentoItem() {
    }

    public AbastecimentoItem(
            Abastecimento abastecimento,
            String maquinaId,
            Produto produto,
            int quantidade
    ) {
        this.abastecimento = abastecimento;
        this.maquinaId = maquinaId;
        this.produto = produto;
        this.quantidade = quantidade;
    }

    public String getMaquinaId() { return maquinaId; }
    public Produto getProduto() { return produto; }
    public int getQuantidade() { return quantidade; }
}
