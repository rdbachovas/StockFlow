import { Estoque } from "./models/Estoque";
import { ProdutoId } from "./models/Produto";
import { LocalId } from "./models/Local";
import { EstoqueService } from "./services/EstoqueService";
import { ReservaService } from "./services/ReservaService";
import { Reserva } from "./models/Reserva";

const estoquePrincipal: Estoque = {
    id: "ESTOQUE_PRINCIPAL",
    nome: "Estoque Principal",
    itens: [
        {
            produtoId: ProdutoId.MIX,
            quantidade: 100,
        },
    ],
};

const estoqueRodrigo: Estoque = {
    id: "ESTOQUE_RODRIGO",
    nome: "Estoque Rodrigo",
    responsavelId: "RODRIGO",
    itens: [],
};

const reservas: Reserva[] = [];

// Rodrigo pega 60 MIX
EstoqueService.transferir(
    estoquePrincipal,
    estoqueRodrigo,
    ProdutoId.MIX,
    60,
    "RODRIGO"
);

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

// Reserva 20 MIX para o Boulevard
const reservaBoulevard: Reserva = {
    id: crypto.randomUUID(),
    responsavelId: "RODRIGO",
    localDestinoId: LocalId.BOULEVARD,
    produtoId: ProdutoId.MIX,
    quantidade: 20,
};

ReservaService.criarReserva(
    estoqueRodrigo,
    reservas,
    reservaBoulevard
);

console.log("\n=== RESERVAS ===");
console.log(reservas);

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
