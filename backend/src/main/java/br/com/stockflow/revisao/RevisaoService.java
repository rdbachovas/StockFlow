package br.com.stockflow.revisao;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RevisaoService {

    private static final int ID_REVISAO_GLOBAL = 1;

    private final RevisaoEstadoRepository repository;

    public RevisaoService(RevisaoEstadoRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public long avancar() {
        return repository.buscarParaAtualizacao(ID_REVISAO_GLOBAL)
                .orElseThrow(() -> new IllegalStateException(
                        "Revisão global não inicializada."
                ))
                .avancar();
    }

    @Transactional(propagation = Propagation.MANDATORY, readOnly = true)
    public long atual() {
        return repository.findById(ID_REVISAO_GLOBAL)
                .orElseThrow(() -> new IllegalStateException(
                        "Revisão global não inicializada."
                ))
                .getRevisao();
    }
}
