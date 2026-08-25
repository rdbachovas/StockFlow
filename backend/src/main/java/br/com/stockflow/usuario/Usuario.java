package br.com.stockflow.usuario;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @Column(length = 50, nullable = false)
    private String id;

    @Column(length = 100, nullable = false)
    private String nome;

    @Column(length = 100, nullable = false, unique = true)
    private String login;

    @Column(name = "senha_hash", length = 100)
    private String senhaHash;

    @Column(nullable = false)
    private boolean ativo;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;

    @Column(name = "senha_alterada_em")
    private OffsetDateTime senhaAlteradaEm;

    @Column(name = "troca_senha_obrigatoria", nullable = false)
    private boolean trocaSenhaObrigatoria;

    protected Usuario() {
    }

    public String getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getLogin() { return login; }
    public String getSenhaHash() { return senhaHash; }
    public boolean isAtivo() { return ativo; }
    public boolean isTrocaSenhaObrigatoria() { return trocaSenhaObrigatoria; }

    public void definirSenhaHash(String senhaHash, OffsetDateTime agora) {
        this.senhaHash = senhaHash;
        this.atualizadoEm = agora;
    }

    public void definirSenhaTemporaria(
            String senhaHash,
            OffsetDateTime agora,
            boolean temporaria
    ) {
        definirSenhaHash(senhaHash, agora);
        this.trocaSenhaObrigatoria = temporaria;
    }

    public void alterarSenha(String senhaHash, OffsetDateTime agora) {
        definirSenhaHash(senhaHash, agora);
        this.senhaAlteradaEm = agora;
        this.trocaSenhaObrigatoria = false;
    }
}
