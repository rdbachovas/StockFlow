package br.com.stockflow.estoque;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EstoqueItemRepository
        extends JpaRepository<EstoqueItem, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT item
            FROM EstoqueItem item
            JOIN FETCH item.produto
            WHERE item.estoque.id = :estoqueId
              AND item.produto.id IN :produtoIds
            ORDER BY item.produto.id
            """)
    List<EstoqueItem> buscarParaAtualizacao(
            @Param("estoqueId") String estoqueId,
            @Param("produtoIds") Collection<String> produtoIds
    );

    @Query("""
            SELECT item
            FROM EstoqueItem item
            JOIN FETCH item.produto
            WHERE item.estoque.id = :estoqueId
              AND item.produto.id = :produtoId
            """)
    Optional<EstoqueItem> buscarPorEstoqueEProduto(
            @Param("estoqueId") String estoqueId,
            @Param("produtoId") String produtoId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT item
            FROM EstoqueItem item
            JOIN FETCH item.produto
            WHERE item.estoque.id = :estoqueId
              AND item.produto.id = :produtoId
            """)
    Optional<EstoqueItem> buscarUmParaAtualizacao(
            @Param("estoqueId") String estoqueId,
            @Param("produtoId") String produtoId
    );
}
