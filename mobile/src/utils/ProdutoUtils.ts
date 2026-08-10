import { GrupoProduto } from "../models/GrupoProduto";
import { ProdutoId } from "../models/Produto";

export const PRODUTOS_PELUCIAS: ProdutoId[] = [
    ProdutoId.MIX,
    ProdutoId.PERSONAGENS,
    ProdutoId.CAPIVARAS,
    ProdutoId.BIG,
    ProdutoId.STITCH,
    ProdutoId.POKEMON,
    ProdutoId.LABUBU
];

export const PRODUTOS_CARRINHO: ProdutoId[] = [
    ProdutoId.MILHO,
    ProdutoId.CHOCOLATE,
    ProdutoId.EMBALAGEM_CARRINHO_MEDIA,
    ProdutoId.EMBALAGEM_CARRINHO_GRANDE,
    ProdutoId.OLEO
];

export const TODOS_PRODUTOS: ProdutoId[] = [
    ...PRODUTOS_PELUCIAS,
    ...PRODUTOS_CARRINHO
];

export function grupoDoProduto(
    produtoId: ProdutoId
): GrupoProduto {

    if (
        PRODUTOS_PELUCIAS.includes(
            produtoId
        )
    ) {
        return GrupoProduto.PELUCIAS;
    }

    return GrupoProduto.CARRINHO_PIPOCA;
}

export function nomeProduto(
    produtoId: ProdutoId
): string {

    switch (produtoId) {

        case ProdutoId.MIX:
            return "Mix";

        case ProdutoId.PERSONAGENS:
            return "Personagens";

        case ProdutoId.CAPIVARAS:
            return "Capivaras";

        case ProdutoId.BIG:
            return "Big";

        case ProdutoId.STITCH:
            return "Stitch";

        case ProdutoId.POKEMON:
            return "Pokémon";

        case ProdutoId.LABUBU:
            return "Labubu";

        case ProdutoId.MILHO:
            return "Milho";

        case ProdutoId.CHOCOLATE:
            return "Chocolate em pó";

        case ProdutoId.EMBALAGEM_CARRINHO_MEDIA:
            return "Embalagem carrinho média";

        case ProdutoId.EMBALAGEM_CARRINHO_GRANDE:
            return "Embalagem carrinho grande";

        case ProdutoId.OLEO:
            return "Óleo";

        default:
            return String(produtoId);
    }
}
