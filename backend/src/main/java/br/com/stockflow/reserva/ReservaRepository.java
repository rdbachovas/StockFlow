package br.com.stockflow.reserva;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservaRepository extends JpaRepository<Reserva, UUID> {

    @Query("""
            SELECT COALESCE(SUM(
                reserva.quantidade
                - reserva.quantidadeUtilizada
                - reserva.quantidadeLiberada
            ), 0)
            FROM Reserva reserva
            WHERE reserva.responsavel.id = :responsavelId
              AND reserva.produto.id = :produtoId
              AND reserva.status = br.com.stockflow.reserva.StatusReserva.ATIVA
            """)
    long somarQuantidadeRestanteAtiva(
            @Param("responsavelId") String responsavelId,
            @Param("produtoId") String produtoId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT reserva
            FROM Reserva reserva
            JOIN FETCH reserva.responsavel
            JOIN FETCH reserva.produto
            WHERE reserva.id = :id
            """)
    Optional<Reserva> buscarParaCancelamento(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT reserva
            FROM Reserva reserva
            JOIN FETCH reserva.responsavel
            JOIN FETCH reserva.produto
            WHERE reserva.responsavel.id = :responsavelId
              AND reserva.produto.id IN :produtoIds
              AND reserva.status = br.com.stockflow.reserva.StatusReserva.ATIVA
            ORDER BY reserva.produto.id, reserva.dataCriacao, reserva.id
            """)
    List<Reserva> buscarAtivasParaAbastecimento(
            @Param("responsavelId") String responsavelId,
            @Param("produtoIds") Collection<String> produtoIds
    );
}
