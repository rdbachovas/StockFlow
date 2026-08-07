import { Estoque } from "./models/Estoque";
import { ProdutoId } from "./models/Produto";
import { EstoqueService } from "./services/EstoqueService";
import { Reserva } from "./models/Reserva";
import { ReservaService } from "./services/ReservaService";
import { LocalId } from "./models/Local";

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
// TRANSFERÊNCIA
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

// ==============================
// RESERVAS
// ==============================

const reservas: Reserva[] = [];

const reserva: Reserva = {
    id: "RESERVA_1",
    responsavelId: "RODRIGO",
    localDestinoId: LocalId.BOULEVARD,
    produtoId: ProdutoId.MIX,
    quantidade: 20
};

ReservaService.criarReserva(
    estoqueRodrigo,
    reservas,
    reserva
);

// ==============================
// ESTOQUE
// ==============================

console.log("=== ESTOQUE ===");

console.log(
    "Principal:",
    EstoqueService.consultarQuantidade(
        estoquePrincipal,
        ProdutoId.MIX
    )
);

console.log(
    "Rodrigo:",
    EstoqueService.consultarQuantidade(
        estoqueRodrigo,
        ProdutoId.MIX
    )
);

// ==============================
// RESERVAS
// ==============================

console.log("\n=== RESERVAS ===");
console.log(reservas);

// ==============================
// QUANTIDADES
// ==============================

console.log("\n=== QUANTIDADES ===");

console.log(
    "Físico:",
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
// CANCELAMENTO
// ==============================

console.log("\n=== CANCELANDO RESERVA ===");

ReservaService.cancelarReserva(
    reservas,
    reserva.id,
    "RODRIGO"
);

console.log("\nReservas após cancelamento:");
console.log(reservas);

// ==============================
// QUANTIDADES APÓS CANCELAMENTO
// ==============================

console.log("\n=== QUANTIDADES APÓS CANCELAMENTO ===");

console.log(
    "Físico:",
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
