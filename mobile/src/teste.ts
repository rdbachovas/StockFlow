import { DestinoReservaId } from "./models/DestinoReserva";
import { Estoque } from "./models/Estoque";
import { ProdutoId } from "./models/Produto";
import {
    Reserva,
    StatusReserva
} from "./models/Reserva";
import { LocalId } from "./models/Local";
import { MaquinaId } from "./models/Maquina";
import { Abastecimento } from "./models/Abastecimento";
import { Movimentacao } from "./models/Movimentacao";

import { EstoqueService } from "./services/EstoqueService";
import { ReservaService } from "./services/ReservaService";
import { AbastecimentoService } from "./services/AbastecimentoService";
import { HistoricoAbastecimentoService } from "./services/HistoricoAbastecimentoService";

// ==============================
// ESTOQUES
// ==============================

const estoquePrincipal: Estoque = {
    id: "ESTOQUE_PRINCIPAL",
    nome: "Estoque Principal",

    itens: [
        {
            produtoId: ProdutoId.MIX,
            quantidade: 150
        },
        {
            produtoId: ProdutoId.PERSONAGENS,
            quantidade: 50
        },
        {
            produtoId: ProdutoId.CAPIVARAS,
            quantidade: 80
        },
        {
            produtoId: ProdutoId.BIG,
            quantidade: 60
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
// HISTÓRICOS
// ==============================

const movimentacoes: Movimentacao[] = [];
const reservas: Reserva[] = [];
const abastecimentos: Abastecimento[] = [];

// ==============================
// PRINCIPAL → RODRIGO
// ==============================

movimentacoes.push(
    EstoqueService.transferir(
        estoquePrincipal,
        estoqueRodrigo,
        ProdutoId.MIX,
        100,
        "RODRIGO"
    )
);

movimentacoes.push(
    EstoqueService.transferir(
        estoquePrincipal,
        estoqueRodrigo,
        ProdutoId.PERSONAGENS,
        20,
        "RODRIGO"
    )
);

movimentacoes.push(
    EstoqueService.transferir(
        estoquePrincipal,
        estoqueRodrigo,
        ProdutoId.CAPIVARAS,
        40,
        "RODRIGO"
    )
);

movimentacoes.push(
    EstoqueService.transferir(
        estoquePrincipal,
        estoqueRodrigo,
        ProdutoId.BIG,
        30,
        "RODRIGO"
    )
);

// ==============================
// RESERVA
// 20 MIX → BOULEVARD
// ==============================

const reservaBoulevard: Reserva = {
    id: "RESERVA_BOULEVARD_1",

    responsavelId: "RODRIGO",

    destinoId: DestinoReservaId.BOULEVARD,

    produtoId:
        ProdutoId.MIX,

    quantidade: 20,

    quantidadeUtilizada: 0,

    status:
        StatusReserva.ATIVA
};

ReservaService.criarReserva(
    estoqueRodrigo,
    reservas,
    reservaBoulevard
);

// ==============================
// ABASTECIMENTO 1
// 07/08/2026
// ==============================

const abastecimento1: Abastecimento = {

    id: "AB_1",

    localId:
        LocalId.BOULEVARD,

    responsavelId:
        "RODRIGO",

    itens: [
        {
            maquinaId: MaquinaId.M1,
            produtoId: ProdutoId.MIX,
            quantidade: 6
        },

        {
            maquinaId: MaquinaId.M2,
            produtoId: ProdutoId.MIX,
            quantidade: 4
        },

        {
            maquinaId: MaquinaId.M4,
            produtoId: ProdutoId.CAPIVARAS,
            quantidade: 8
        },

        {
            maquinaId: MaquinaId.M5,
            produtoId: ProdutoId.BIG,
            quantidade: 5
        }
    ],

    data:
        new Date(
            "2026-08-07T10:00:00-03:00"
        ),

    observacao:
        "Abastecimento de sexta-feira"
};

AbastecimentoService.registrar(
    estoqueRodrigo,
    reservas,
    abastecimentos,
    abastecimento1
);

// ==============================
// ABASTECIMENTO 2
// 10/08/2026
// ==============================

const abastecimento2: Abastecimento = {

    id: "AB_2",

    localId:
        LocalId.BOULEVARD,

    responsavelId:
        "RODRIGO",

    itens: [
        {
            maquinaId: MaquinaId.M1,
            produtoId: ProdutoId.MIX,
            quantidade: 8
        },

        {
            maquinaId: MaquinaId.M1,
            produtoId: ProdutoId.PERSONAGENS,
            quantidade: 4
        },

        {
            maquinaId: MaquinaId.M2,
            produtoId: ProdutoId.MIX,
            quantidade: 5
        },

        {
            maquinaId: MaquinaId.M3,
            produtoId: ProdutoId.MIX,
            quantidade: 7
        },

        {
            maquinaId: MaquinaId.M4,
            produtoId: ProdutoId.CAPIVARAS,
            quantidade: 12
        },

        {
            maquinaId: MaquinaId.M5,
            produtoId: ProdutoId.BIG,
            quantidade: 10
        }
    ],

    data:
        new Date(
            "2026-08-10T09:00:00-03:00"
        ),

    observacao:
        "Abastecimento completo do Boulevard"
};

AbastecimentoService.registrar(
    estoqueRodrigo,
    reservas,
    abastecimentos,
    abastecimento2
);

// ==============================
// HISTÓRICO BOULEVARD
// ==============================

const historicoBoulevard =
    HistoricoAbastecimentoService.listarPorLocal(
        abastecimentos,
        LocalId.BOULEVARD
    );

console.log(
    "=== HISTÓRICO BOULEVARD ==="
);

for (
    const abastecimento of
    historicoBoulevard
) {

    console.log(
        `${abastecimento.id} | ${abastecimento.data.toLocaleString("pt-BR")} | Total: ${HistoricoAbastecimentoService.calcularTotal(abastecimento)}`
    );
}

// ==============================
// ÚLTIMO ABASTECIMENTO
// ==============================

const ultimoAbastecimento =
    HistoricoAbastecimentoService.buscarUltimoPorLocal(
        abastecimentos,
        LocalId.BOULEVARD
    );

if (!ultimoAbastecimento) {
    throw new Error(
        "Nenhum abastecimento encontrado."
    );
}

console.log(
    "\n=== ÚLTIMO ABASTECIMENTO ==="
);

console.log(
    "ID:",
    ultimoAbastecimento.id
);

console.log(
    "Local:",
    ultimoAbastecimento.localId
);

console.log(
    "Responsável:",
    ultimoAbastecimento.responsavelId
);

console.log(
    "Data:",
    ultimoAbastecimento.data.toLocaleString(
        "pt-BR"
    )
);

// ==============================
// RESUMO POR MÁQUINA
// ==============================

console.log(
    "\n=== POR MÁQUINA ==="
);

const resumoMaquinas =
    HistoricoAbastecimentoService.resumirPorMaquina(
        ultimoAbastecimento
    );

for (const maquina of resumoMaquinas) {

    console.log(
        `\n${maquina.maquinaId}`
    );

    for (const item of maquina.itens) {

        console.log(
            `  ${item.produtoId}: ${item.quantidade}`
        );
    }

    console.log(
        `  Total: ${maquina.total}`
    );
}

// ==============================
// RESUMO POR PRODUTO
// ==============================

console.log(
    "\n=== RESUMO POR PRODUTO ==="
);

const totaisPorProduto =
    HistoricoAbastecimentoService.calcularTotaisPorProduto(
        ultimoAbastecimento
    );

for (
    const [produto, quantidade]
    of Object.entries(totaisPorProduto)
) {

    console.log(
        `${produto}: ${quantidade}`
    );
}

// ==============================
// TOTAL GERAL
// ==============================

console.log(
    "\nTOTAL GERAL:",
    HistoricoAbastecimentoService.calcularTotal(
        ultimoAbastecimento
    )
);

// ==============================
// RESERVA
// ==============================

console.log(
    "\n=== RESERVA MIX BOULEVARD ==="
);

console.log(
    "Quantidade original:",
    reservaBoulevard.quantidade
);

console.log(
    "Quantidade utilizada:",
    reservaBoulevard.quantidadeUtilizada
);

console.log(
    "Restante:",
    ReservaService.quantidadeRestante(
        reservaBoulevard
    )
);

console.log(
    "Status:",
    reservaBoulevard.status
);

// ==============================
// ESTOQUE ATUAL RODRIGO
// ==============================

console.log(
    "\n=== ESTOQUE ATUAL RODRIGO ==="
);

console.log(
    "MIX:",
    EstoqueService.consultarQuantidade(
        estoqueRodrigo,
        ProdutoId.MIX
    )
);

console.log(
    "PERSONAGENS:",
    EstoqueService.consultarQuantidade(
        estoqueRodrigo,
        ProdutoId.PERSONAGENS
    )
);

console.log(
    "CAPIVARAS:",
    EstoqueService.consultarQuantidade(
        estoqueRodrigo,
        ProdutoId.CAPIVARAS
    )
);

console.log(
    "BIG:",
    EstoqueService.consultarQuantidade(
        estoqueRodrigo,
        ProdutoId.BIG
    )
);
