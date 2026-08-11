package br.com.stockflow.movimentoprincipal;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "movimentos_estoque_principal")
public class MovimentoEstoquePrincipal {

    @Id
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private TipoMovimentoEstoquePrincipal tipo;

    @Column(nullable = false)
    private OffsetDateTime data;

    @Column(length = 500)
    private String observacao;

    @OneToMany(mappedBy = "movimento", cascade = CascadeType.ALL)
    private List<MovimentoEstoquePrincipalItem> itens = new ArrayList<>();

    protected MovimentoEstoquePrincipal() {
    }

    public MovimentoEstoquePrincipal(
            TipoMovimentoEstoquePrincipal tipo,
            OffsetDateTime data,
            String observacao
    ) {
        this.id = UUID.randomUUID();
        this.tipo = tipo;
        this.data = data;
        this.observacao = observacao;
    }

    public void adicionarItem(MovimentoEstoquePrincipalItem item) {
        itens.add(item);
    }

    public UUID getId() { return id; }
    public TipoMovimentoEstoquePrincipal getTipo() { return tipo; }
    public OffsetDateTime getData() { return data; }
    public String getObservacao() { return observacao; }
    public List<MovimentoEstoquePrincipalItem> getItens() {
        return List.copyOf(itens);
    }
}
