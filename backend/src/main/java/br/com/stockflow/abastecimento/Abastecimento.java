package br.com.stockflow.abastecimento;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import br.com.stockflow.estoque.Estoque;
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
import jakarta.persistence.Table;

@Entity
@Table(name = "abastecimentos")
public class Abastecimento {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "responsavel_id", nullable = false)
    private Usuario responsavel;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estoque_origem_id", nullable = false)
    private Estoque estoqueOrigem;

    @Enumerated(EnumType.STRING)
    @Column(name = "local_id", length = 50, nullable = false)
    private LocalAbastecimento local;

    @Column(nullable = false)
    private OffsetDateTime data;

    @Column(length = 500)
    private String observacao;

    @OneToMany(mappedBy = "abastecimento", cascade = CascadeType.ALL)
    private List<AbastecimentoItem> itens = new ArrayList<>();

    @OneToMany(mappedBy = "abastecimento", cascade = CascadeType.ALL)
    private List<AbastecimentoSaldo> saldos = new ArrayList<>();

    protected Abastecimento() {
    }

    public Abastecimento(
            Usuario responsavel,
            Estoque estoqueOrigem,
            LocalAbastecimento local,
            OffsetDateTime data,
            String observacao
    ) {
        this.id = UUID.randomUUID();
        this.responsavel = responsavel;
        this.estoqueOrigem = estoqueOrigem;
        this.local = local;
        this.data = data;
        this.observacao = observacao;
    }

    public void adicionarItem(AbastecimentoItem item) {
        itens.add(item);
    }

    public void adicionarSaldo(AbastecimentoSaldo saldo) {
        saldos.add(saldo);
    }

    public UUID getId() { return id; }
    public Usuario getResponsavel() { return responsavel; }
    public Estoque getEstoqueOrigem() { return estoqueOrigem; }
    public LocalAbastecimento getLocal() { return local; }
    public OffsetDateTime getData() { return data; }
    public String getObservacao() { return observacao; }
    public List<AbastecimentoItem> getItens() { return List.copyOf(itens); }
    public List<AbastecimentoSaldo> getSaldos() { return List.copyOf(saldos); }
}
