import { Estoque } from "./models/Estoque";
import { ProdutoId } from "./models/Produto";
import { EstoqueService } from "./services/EstoqueService";
import { Reserva, StatusReserva } from "./models/Reserva";
import { ReservaService } from "./services/ReservaService";
import { LocalId } from "./models/Local";
import { Movimentacao } from "./models/Movimentacao";
import { MovimentacaoService } from "./services/MovimentacaoService";

// ==============================
// ESTOQUES
// ==============================

const estoquePrincipal: Estoque = {
    id: "ESTOQUE_PRINCIPAL",
    nome: "Estoque Principal",
    itens: [
        {
            produtoId: ProdutoId.MIX,
            quantidade: 100
        }
    ]
};

const estoqueRodrigo: Estoque = {
    id: "ESTOQUE_RODRIGO",
    nome: "Estoque Rodrigo",
    responsavelId: "RODRIGO",
    itens: []
};

// ==============================
// ARRAYS DO SISTEMA
// ==============================

const reservas: Reserva[] = [];

const movimentacoes: Movimentacao[] = [];

// ==============================
// TRANSFERÊNCIA
// ESTOQUE PRINCIPAL → RODRIGO
// ==============================

EstoqueService.remover(
    estoquePrincipal,
    ProdutoId.MIX,
    60
);

EstoqueService.adicionar(
    estoqueRodrigo,
    ProdutoId.MIX,
    60
);

MovimentacaoService.registrar(
    movimentacoes,
    {
        id: "MOV_1",
        produtoId: ProdutoId.MIX,
        quantidade: 60,
        origemId: estoquePrincipal.id,
        destinoId: estoqueRodrigo.id,
        responsavelId: "RODRIGO",
        data: new Date()
    }
);

// ==============================
// RESERVA
// ==============================

const reserva: Reserva = {
    id: "RESERVA_1",
    responsavelId: "RODRIGO",
    localDestinoId: LocalId.BOULEVARD,
    produtoId: ProdutoId.MIX,
    quantidade: 20,
    status: StatusReserva.ATIVA
};

ReservaService.criarReserva(
    estoqueRodrigo,
    reservas,
    reserva
);

// ==============================
// ESTADO ANTES DA CONCLUSÃO
// ==============================

console.log("=== ANTES DA CONCLUSÃO ===");

console.log(
    "Estoque Principal:",
    EstoqueService.consultarQuantidade(
        estoquePrincipal,
        ProdutoId.MIX
    )
);

console.log(
    "Estoque Rodrigo:",
    EstoqueService.consultarQuantidade(
        estoqueRodrigo,
        ProdutoId.MIX
    )
);

console.log(
    "Reservado:",
    ReservaService.quantidadeReservada(
        reservas,
        ProdutoId.MIX,
        "RODRIGO"
    )
);

console.log(
    "Disponível:",
    ReservaService.quantidadeDisponivel(
        estoqueRodrigo,
        reservas,
        ProdutoId.MIX
    )
);

console.log("\nReserva:");
console.log(reserva);

// ==============================
// CONCLUSÃO DA RESERVA
// ==============================

console.log("\n=== CONCLUINDO RESERVA ===");

ReservaService.concluirReserva(
    estoqueRodrigo,
    reservas,
    movimentacoes,
    reserva.id,
    "RODRIGO"
);

// ==============================
// ESTADO APÓS CONCLUSÃO
// ==============================

console.log("\n=== APÓS A CONCLUSÃO ===");

console.log(
    "Estoque Principal:",
    EstoqueService.consultarQuantidade(
        estoquePrincipal,
        ProdutoId.MIX
    )
);

console.log(
    "Estoque Rodrigo:",
    EstoqueService.consultarQuantidade(
        estoqueRodrigo,
        ProdutoId.MIX
    )
);

console.log(
    "Reservado:",
    ReservaService.quantidadeReservada(
        reservas,
        ProdutoId.MIX,
        "RODRIGO"
    )
);

console.log(
    "Disponível:",
    ReservaService.quantidadeDisponivel(
        estoqueRodrigo,
        reservas,
        ProdutoId.MIX
    )
);

// ==============================
// RESERVA CONCLUÍDA
// ==============================

console.log("\n=== RESERVA ===");
console.log(reserva);

// ==============================
// MOVIMENTAÇÕES
// ==============================

console.log("\n=== MOVIMENTAÇÕES ===");
console.log(movimentacoes);
