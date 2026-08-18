import React, {
    useMemo,
    useState
} from "react";

import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

import { BottomActionBar } from "../components/layout/BottomActionBar";
import { Screen } from "../components/layout/Screen";
import { Section } from "../components/layout/Section";
import { Card } from "../components/ui/Card";
import { Chip } from "../components/ui/Chip";
import { EmptyState } from "../components/ui/EmptyState";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import {
    ControlSize,
    Palette,
    Radius,
    Spacing,
    Typography
} from "../constants/theme";
import { DestinoReservaId } from "../models/DestinoReserva";
import { DevolucaoEstoque } from "../models/DevolucaoEstoque";
import { Estoque } from "../models/Estoque";
import { ProdutoId } from "../models/Produto";
import {
    Reserva,
    StatusReserva
} from "../models/Reserva";
import { UsuarioId } from "../models/Usuario";
import { ReservaService } from "../services/ReservaService";
import {
    nomeProduto,
    TODOS_PRODUTOS
} from "../utils/ProdutoUtils";

interface Props {
    responsavelInicial: UsuarioId;
    produtoInicial?: ProdutoId;
    estoqueRodrigo: Estoque;
    estoqueCesar: Estoque;
    estoquePrincipal: Estoque;
    reservas: Reserva[];
    registrarDevolucao: (devolucao: DevolucaoEstoque) => Promise<void>;
}

function nomeDestino(destinoId: DestinoReservaId): string {
    switch (destinoId) {
        case DestinoReservaId.BOULEVARD: return "Boulevard";
        case DestinoReservaId.AEROPORTO: return "Aeroporto";
        case DestinoReservaId.MERCADOS: return "Mercados";
        case DestinoReservaId.SUPERMAGO_BOA_VISTA: return "SuperMago Boa Vista";
    }
}

export function DevolucaoEstoqueScreen({
    responsavelInicial,
    produtoInicial,
    estoqueRodrigo,
    estoqueCesar,
    estoquePrincipal,
    reservas,
    registrarDevolucao
}: Props) {
    const [responsavel, setResponsavel] = useState<UsuarioId>(responsavelInicial);
    const [produto, setProduto] = useState<ProdutoId | undefined>(produtoInicial);
    const [quantidadeLivre, setQuantidadeLivre] = useState("");
    const [quantidadesReservas, setQuantidadesReservas] = useState<Record<string, string>>({});
    const [mensagem, setMensagem] = useState<string | null>(null);
    const [erro, setErro] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
    const estoquePessoal = responsavel === UsuarioId.RODRIGO ? estoqueRodrigo : estoqueCesar;
    const produtos = TODOS_PRODUTOS.filter((produtoId) =>
        (estoquePessoal.itens.find((item) => item.produtoId === produtoId)?.quantidade ?? 0) > 0
    );
    const produtoSelecionado = produto && produtos.includes(produto) ? produto : produtos[0];
    const fisico = produtoSelecionado
        ? estoquePessoal.itens.find((item) => item.produtoId === produtoSelecionado)?.quantidade ?? 0
        : 0;
    const livre = produtoSelecionado
        ? ReservaService.quantidadeDisponivel(estoquePessoal, reservas, produtoSelecionado)
        : 0;
    const reservasProduto = produtoSelecionado ? reservas.filter((reserva) =>
        reserva.responsavelId === responsavel &&
        reserva.produtoId === produtoSelecionado &&
        reserva.status === StatusReserva.ATIVA
    ) : [];
    const destinos = useMemo(
        () => Array.from(new Set(reservasProduto.map((reserva) => reserva.destinoId))),
        [reservasProduto]
    );
    const reservadoTotal = destinos.reduce(
        (total, destinoId) => total + ReservaService.quantidadeReservadaNoDestino(
            reservas,
            produtoSelecionado as ProdutoId,
            responsavel,
            destinoId
        ),
        0
    );
    const total = Number(quantidadeLivre || 0) + destinos.reduce(
        (soma, destinoId) => soma + Number(quantidadesReservas[destinoId] || 0),
        0
    );

    const limparSelecao = () => {
        setQuantidadeLivre("");
        setQuantidadesReservas({});
        setErro(null);
        setMensagem(null);
    };

    const confirmar = async () => {
        if (enviando) {
            return;
        }

        setErro(null);
        setMensagem(null);
        if (!produtoSelecionado || total <= 0) {
            setErro("Selecione um produto e informe alguma quantidade para devolver.");
            return;
        }
        const parcelas = destinos
            .map((destinoId) => ({ destinoId, quantidade: Number(quantidadesReservas[destinoId] || 0) }))
            .filter((parcela) => parcela.quantidade > 0);
        const devolucao: DevolucaoEstoque = {
            id: `DEV_${Date.now()}`,
            estoqueOrigemId: estoquePessoal.id,
            estoqueDestinoId: estoquePrincipal.id,
            responsavelId: responsavel,
            itens: [{
                produtoId: produtoSelecionado,
                quantidadeLivre: Number(quantidadeLivre || 0),
                reservas: parcelas
            }],
            data: new Date()
        };
        setEnviando(true);
        try {
            await registrarDevolucao(devolucao);
            limparSelecao();
            setMensagem(`${total} ${nomeProduto(produtoSelecionado)} devolvidos ao Estoque Principal.`);
        } catch (caughtError) {
            setErro(caughtError instanceof Error ? caughtError.message : "Erro ao registrar devolução.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <View style={styles.container}>
            <Screen contentContainerStyle={styles.content}>
                <Section title="Responsável">
                    <View style={styles.chips}>
                        <Chip label="Rodrigo" selected={responsavel === UsuarioId.RODRIGO} onPress={() => { setResponsavel(UsuarioId.RODRIGO); setProduto(undefined); limparSelecao(); }} />
                        <Chip label="Cesar" selected={responsavel === UsuarioId.CESAR} onPress={() => { setResponsavel(UsuarioId.CESAR); setProduto(undefined); limparSelecao(); }} />
                    </View>
                </Section>

                <Section title="Produto" description="Selecione um item em posse do responsável.">
                    {produtos.length === 0 ? <Card><EmptyState title="Estoque pessoal vazio" /></Card> : (
                        <Card style={styles.productList}>
                            {produtos.map((produtoId, index) => {
                                const saldo = estoquePessoal.itens.find((item) => item.produtoId === produtoId)?.quantidade ?? 0;
                                const selected = produtoSelecionado === produtoId;
                                return (
                                    <Pressable key={produtoId} onPress={() => { setProduto(produtoId); limparSelecao(); }} style={({ pressed }) => [styles.productRow, index > 0 && styles.border, selected && styles.selectedRow, pressed && styles.pressed]}>
                                        <Text style={[styles.productName, selected && styles.selectedText]}>{nomeProduto(produtoId)}</Text>
                                        <Text style={[styles.productBalance, selected && styles.selectedText]}>{saldo}</Text>
                                    </Pressable>
                                );
                            })}
                        </Card>
                    )}
                </Section>

                {produtoSelecionado ? (
                    <>
                        <Card style={styles.summaryCard}>
                            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{fisico}</Text><Text style={styles.summaryLabel}>Físico</Text></View>
                            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{livre}</Text><Text style={styles.summaryLabel}>Livre</Text></View>
                            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{reservadoTotal}</Text><Text style={styles.summaryLabel}>Reservado</Text></View>
                        </Card>

                        <Section title="Quantidade livre">
                            <Card style={styles.quantityRow}>
                                <View><Text style={styles.quantityTitle}>Sem reserva</Text><Text style={styles.quantityHint}>Máximo: {livre}</Text></View>
                                <TextInput accessibilityLabel="Quantidade livre" style={styles.input} value={quantidadeLivre} onChangeText={(valor) => setQuantidadeLivre(valor.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder="0" placeholderTextColor={Palette.disabled} />
                            </Card>
                        </Section>

                        {destinos.length > 0 ? (
                            <Section title="Reservas" description="Escolha explicitamente quanto retirar de cada destino.">
                                <Card style={styles.reservationList}>
                                    {destinos.map((destinoId) => {
                                        const maximo = ReservaService.quantidadeReservadaNoDestino(reservas, produtoSelecionado, responsavel, destinoId);
                                        return (
                                            <View key={destinoId} style={styles.quantityRow}>
                                                <View style={styles.quantityContent}><Text style={styles.quantityTitle}>{nomeDestino(destinoId)}</Text><Text style={styles.quantityHint}>Reservado neste destino: {maximo}</Text></View>
                                                <TextInput accessibilityLabel={`Quantidade da reserva ${nomeDestino(destinoId)}`} style={styles.input} value={quantidadesReservas[destinoId] ?? ""} onChangeText={(valor) => setQuantidadesReservas((anterior) => ({ ...anterior, [destinoId]: valor.replace(/[^0-9]/g, "") }))} keyboardType="number-pad" placeholder="0" placeholderTextColor={Palette.disabled} />
                                            </View>
                                        );
                                    })}
                                </Card>
                            </Section>
                        ) : null}
                    </>
                ) : null}

                {erro ? <FeedbackBanner title="Não foi possível devolver" message={erro} variant="danger" /> : null}
                {mensagem ? <FeedbackBanner title="Devolução registrada" message={mensagem} /> : null}
            </Screen>
            <BottomActionBar summaryLabel="Devolução" summaryValue={`${total} itens`} actionLabel="Confirmar devolução" onPress={() => { void confirmar(); }} loading={enviando} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Palette.background },
    content: { paddingTop: 0, paddingBottom: Spacing.four },
    chips: { flexDirection: "row", gap: Spacing.two },
    productList: { paddingVertical: 0 },
    productRow: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.two },
    border: { borderTopWidth: 1, borderTopColor: Palette.border },
    selectedRow: { backgroundColor: Palette.primarySoft },
    pressed: { opacity: 0.65 },
    productName: { ...Typography.body, color: Palette.text, fontWeight: "600" },
    productBalance: { ...Typography.cardTitle, color: Palette.text },
    selectedText: { color: Palette.primary },
    summaryCard: { flexDirection: "row", marginTop: Spacing.three },
    summaryItem: { flex: 1, alignItems: "center" },
    summaryValue: { fontSize: 22, fontWeight: "700", color: Palette.text },
    summaryLabel: { ...Typography.caption, color: Palette.textSecondary },
    reservationList: { paddingVertical: 0 },
    quantityRow: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    quantityContent: { flex: 1 },
    quantityTitle: { ...Typography.body, color: Palette.text, fontWeight: "600" },
    quantityHint: { ...Typography.caption, color: Palette.textSecondary, marginTop: Spacing.half },
    input: { width: 68, height: ControlSize.input, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.small, backgroundColor: Palette.background, textAlign: "center", fontSize: 16, fontWeight: "700", color: Palette.text }
});
