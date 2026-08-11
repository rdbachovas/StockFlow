package br.com.stockflow.snapshot;

import java.util.Comparator;

import br.com.stockflow.abastecimento.Abastecimento;
import br.com.stockflow.abastecimento.AbastecimentoRepository;
import br.com.stockflow.consumocarrinho.ConsumoCarrinho;
import br.com.stockflow.consumocarrinho.ConsumoCarrinhoRepository;
import br.com.stockflow.devolucao.Devolucao;
import br.com.stockflow.devolucao.DevolucaoRepository;
import br.com.stockflow.estoque.EstoqueRepository;
import br.com.stockflow.movimentoprincipal.MovimentoEstoquePrincipal;
import br.com.stockflow.movimentoprincipal.MovimentoEstoquePrincipalRepository;
import br.com.stockflow.reserva.Reserva;
import br.com.stockflow.reserva.ReservaRepository;
import br.com.stockflow.retirada.Retirada;
import br.com.stockflow.retirada.RetiradaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SnapshotService {

    private final EstoqueRepository estoqueRepository;
    private final ReservaRepository reservaRepository;
    private final RetiradaRepository retiradaRepository;
    private final AbastecimentoRepository abastecimentoRepository;
    private final DevolucaoRepository devolucaoRepository;
    private final MovimentoEstoquePrincipalRepository movimentoRepository;
    private final ConsumoCarrinhoRepository consumoRepository;

    public SnapshotService(
            EstoqueRepository estoqueRepository,
            ReservaRepository reservaRepository,
            RetiradaRepository retiradaRepository,
            AbastecimentoRepository abastecimentoRepository,
            DevolucaoRepository devolucaoRepository,
            MovimentoEstoquePrincipalRepository movimentoRepository,
            ConsumoCarrinhoRepository consumoRepository
    ) {
        this.estoqueRepository = estoqueRepository;
        this.reservaRepository = reservaRepository;
        this.retiradaRepository = retiradaRepository;
        this.abastecimentoRepository = abastecimentoRepository;
        this.devolucaoRepository = devolucaoRepository;
        this.movimentoRepository = movimentoRepository;
        this.consumoRepository = consumoRepository;
    }

    @Transactional(readOnly = true)
    public SnapshotResponse obter() {
        return new SnapshotResponse(
                estoqueRepository.findAllByOrderByIdAsc().stream()
                        .map(SnapshotResponse.EstoqueDto::de)
                        .toList(),
                reservaRepository.findAll().stream()
                        .sorted(Comparator
                                .comparing(Reserva::getDataCriacao)
                                .thenComparing(Reserva::getId))
                        .map(SnapshotResponse.ReservaDto::de)
                        .toList(),
                retiradaRepository.findAll().stream()
                        .sorted(Comparator
                                .comparing(Retirada::getData)
                                .thenComparing(Retirada::getId))
                        .map(SnapshotResponse.RetiradaDto::de)
                        .toList(),
                abastecimentoRepository.findAll().stream()
                        .sorted(Comparator
                                .comparing(Abastecimento::getData)
                                .thenComparing(Abastecimento::getId))
                        .map(SnapshotResponse.AbastecimentoDto::de)
                        .toList(),
                devolucaoRepository.findAll().stream()
                        .sorted(Comparator
                                .comparing(Devolucao::getData)
                                .thenComparing(Devolucao::getId))
                        .map(SnapshotResponse.DevolucaoDto::de)
                        .toList(),
                movimentoRepository.findAll().stream()
                        .sorted(Comparator
                                .comparing(MovimentoEstoquePrincipal::getData)
                                .thenComparing(MovimentoEstoquePrincipal::getId))
                        .map(SnapshotResponse.MovimentoPrincipalDto::de)
                        .toList(),
                consumoRepository.findAll().stream()
                        .sorted(Comparator
                                .comparing(ConsumoCarrinho::getData)
                                .thenComparing(ConsumoCarrinho::getId))
                        .map(SnapshotResponse.ConsumoCarrinhoDto::de)
                        .toList()
        );
    }
}
