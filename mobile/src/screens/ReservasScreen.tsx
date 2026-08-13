import React, {
    useMemo,
    useRef,
    useState
} from "react";

import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

import { useRouter } from "expo-router";

import { BottomActionBar } from "../components/layout/BottomActionBar";
import { Screen } from "../components/layout/Screen";
import { Section } from "../components/layout/Section";
import { Button } from "../components/ui/Button";
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
import { useApp } from "../context/AppContext";
import { DestinoReservaId } from "../models/DestinoReserva";
import { ProdutoId } from "../models/Produto";
import {
    Reserva,
    StatusReserva
} from "../models/Reserva";
import { UsuarioId } from "../models/Usuario";
import { ReservaService } from "../services/ReservaService";
import { nomeProduto } from "../utils/ProdutoUtils";

type Area = "ATIVAS" | "NOVA";

function nomeDestino(destinoId: DestinoReservaId): string {
    switch (destinoId) {
        case DestinoReservaId.BOULEVARD: return "Boulevard";
        case DestinoReservaId.AEROPORTO: return "Aeroporto";
        case DestinoReservaId.MERCADOS: return "Mercados";
        case DestinoReservaId.SUPERMAGO_BOA_VISTA: return "SuperMago Boa Vista";
    }
}

export function ReservasScreen() {
    const router = useRouter();
    const {
        estoqueRodrigo,
        estoqueCesar,
        reservas,
        criarReserva,
        cancelarReserva
    } = useApp();
    const [area, setArea] = useState<Area>("ATIVAS");
    const [responsavel, setResponsavel] = useState<UsuarioId>(UsuarioId.RODRIGO);
    const [destino, setDestino] = useState<DestinoReservaId>(DestinoReservaId.BOULEVARD);
    const [produto, setProduto] = useState<ProdutoId>(ProdutoId.MIX);
    const [quantidade, setQuantidade] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
    const [mensagemErro, setMensagemErro] = useState<string | null>(null);
    const [criando, setCriando] = useState(false);
    const [cancelandoId, setCancelandoId] = useState<string | null>(null);
    const operationRef = useRef(false);

    const estoque = responsavel === UsuarioId.RODRIGO ? estoqueRodrigo : estoqueCesar;
    const destinos = useMemo(() => ReservaService.listarDestinosPermitidos(responsavel), [responsavel]);
    const produtos = useMemo(() => ReservaService.listarProdutosPermitidos(destino), [destino]);
    const livre = ReservaService.quantidadeDisponivel(estoque, reservas, produto);
    const ativas = reservas.filter((reserva) => reserva.status === StatusReserva.ATIVA);

    const trocarResponsavel = (novo: UsuarioId) => {
        const novosDestinos = ReservaService.listarDestinosPermitidos(novo);
        const novoDestino = novosDestinos[0];
        setResponsavel(novo);
        setDestino(novoDestino);
        setProduto(ReservaService.listarProdutosPermitidos(novoDestino)[0]);
        setQuantidade("");
        setMensagemErro(null);
        setMensagemSucesso(null);
    };

    const trocarDestino = (novo: DestinoReservaId) => {
        setDestino(novo);
        setProduto(ReservaService.listarProdutosPermitidos(novo)[0]);
        setQuantidade("");
        setMensagemErro(null);
        setMensagemSucesso(null);
    };

    const confirmar = async () => {
        if (operationRef.current) return;
        setMensagemErro(null);
        setMensagemSucesso(null);
        const valor = Number(quantidade);
        if (!Number.isInteger(valor) || valor <= 0) {
            setMensagemErro("Informe uma quantidade válida.");
            return;
        }
        const reserva: Reserva = {
            id: `RES_${Date.now()}`,
            responsavelId: responsavel,
            destinoId: destino,
            produtoId: produto,
            quantidade: valor,
            quantidadeUtilizada: 0,
            status: StatusReserva.ATIVA
        };
        try {
            operationRef.current = true;
            setCriando(true);
            await criarReserva(reserva);
            setQuantidade("");
            setMensagemSucesso(`${valor} ${nomeProduto(produto)} reservados para ${nomeDestino(destino)}.`);
        } catch (caughtError) {
            setMensagemErro(caughtError instanceof Error ? caughtError.message : "Erro ao criar reserva.");
        } finally {
            operationRef.current = false;
            setCriando(false);
        }
    };

    const cancelar = async (reserva: Reserva) => {
        if (operationRef.current) return;
        try {
            operationRef.current = true;
            setCancelandoId(reserva.id);
            await cancelarReserva(reserva.id, reserva.responsavelId);
            setMensagemErro(null);
            setMensagemSucesso("Reserva cancelada. O restante voltou a ficar livre.");
        } catch (caughtError) {
            setMensagemErro(caughtError instanceof Error ? caughtError.message : "Erro ao cancelar reserva.");
        } finally {
            operationRef.current = false;
            setCancelandoId(null);
        }
    };

    return (
        <View style={styles.container}>
            <Screen contentContainerStyle={styles.content}>
                <View style={styles.areaSelector}>
                    <Chip label={`Ativas (${ativas.length})`} selected={area === "ATIVAS"} onPress={() => setArea("ATIVAS")} />
                    <Chip label="Nova reserva" selected={area === "NOVA"} onPress={() => setArea("NOVA")} />
                </View>

                {area === "ATIVAS" ? (
                    <>
                        {mensagemErro ? <FeedbackBanner title="Não foi possível cancelar" message={mensagemErro} variant="danger" /> : null}
                        {mensagemSucesso ? <FeedbackBanner title="Reservas atualizadas" message={mensagemSucesso} /> : null}
                        {ativas.length === 0 ? (
                            <Card><EmptyState title="Nenhuma reserva ativa" description="Crie uma reserva para proteger estoque futuro." actionLabel="Criar reserva" onAction={() => setArea("NOVA")} /></Card>
                        ) : ativas.map((reserva) => {
                            const restante = ReservaService.quantidadeRestante(reserva);
                            const expanded = expandedId === reserva.id;
                            return (
                                <Card key={reserva.id} style={styles.reservationCard}>
                                    <Pressable onPress={() => setExpandedId(expanded ? null : reserva.id)} style={({ pressed }) => [styles.reservationHeader, pressed && styles.pressed]}>
                                        <View style={styles.reservationContent}>
                                            <Text style={styles.destination}>{nomeDestino(reserva.destinoId)}</Text>
                                            <Text style={styles.product}>{nomeProduto(reserva.produtoId)} · {reserva.responsavelId === UsuarioId.RODRIGO ? "Rodrigo" : "Cesar"}</Text>
                                        </View>
                                        <View style={styles.remainingBox}>
                                            <Text style={styles.remaining}>{restante}</Text>
                                            <Text style={styles.remainingLabel}>restante</Text>
                                        </View>
                                        <Text style={styles.chevron}>{expanded ? "⌃" : "⌄"}</Text>
                                    </Pressable>
                                    {expanded ? (
                                        <View style={styles.details}>
                                            <View style={styles.detailRow}><Text style={styles.detailLabel}>Status</Text><Text style={styles.activeStatus}>Ativa</Text></View>
                                            <View style={styles.detailRow}><Text style={styles.detailLabel}>Reservado</Text><Text style={styles.detailValue}>{reserva.quantidade}</Text></View>
                                            <View style={styles.detailRow}><Text style={styles.detailLabel}>Utilizado</Text><Text style={styles.detailValue}>{reserva.quantidadeUtilizada}</Text></View>
                                            <Button label="Cancelar reserva" variant="dangerGhost" loading={cancelandoId === reserva.id} disabled={cancelandoId !== null || criando} onPress={() => void cancelar(reserva)} style={styles.cancelButton} />
                                        </View>
                                    ) : null}
                                </Card>
                            );
                        })}
                        <Button label="Ver histórico de reservas" variant="ghost" onPress={() => router.push("/historico-reservas")} />
                    </>
                ) : (
                    <>
                        <Section title="1. Responsável">
                            <View style={styles.chips}><Chip label="Rodrigo" selected={responsavel === UsuarioId.RODRIGO} onPress={() => trocarResponsavel(UsuarioId.RODRIGO)} /><Chip label="Cesar" selected={responsavel === UsuarioId.CESAR} onPress={() => trocarResponsavel(UsuarioId.CESAR)} /></View>
                        </Section>
                        <Section title="2. Destino">
                            <View style={styles.wrap}>{destinos.map((item) => <Chip key={item} label={nomeDestino(item)} selected={destino === item} onPress={() => trocarDestino(item)} />)}</View>
                        </Section>
                        <Section title="3. Produto">
                            <View style={styles.wrap}>{produtos.map((item) => <Chip key={item} label={nomeProduto(item)} selected={produto === item} onPress={() => { setProduto(item); setQuantidade(""); setMensagemErro(null); setMensagemSucesso(null); }} />)}</View>
                        </Section>
                        <Section title="4. Quantidade">
                            <Card style={styles.quantityCard}>
                                <View><Text style={styles.freeValue}>{livre}</Text><Text style={styles.freeLabel}>Livre para reservar</Text></View>
                                <TextInput accessibilityLabel="Quantidade da reserva" style={styles.input} value={quantidade} onChangeText={(valor) => setQuantidade(valor.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder="0" placeholderTextColor={Palette.disabled} />
                            </Card>
                        </Section>
                        {mensagemErro ? <FeedbackBanner title="Não foi possível criar" message={mensagemErro} variant="danger" /> : null}
                        {mensagemSucesso ? <FeedbackBanner title="Reserva criada" message={mensagemSucesso} /> : null}
                    </>
                )}
            </Screen>
            {area === "NOVA" ? <BottomActionBar summaryLabel="Reserva" summaryValue={`${Number(quantidade || 0)} itens`} actionLabel="Criar reserva" onPress={() => void confirmar()} loading={criando} /> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Palette.background },
    content: { paddingTop: Spacing.three, paddingBottom: Spacing.four },
    areaSelector: { flexDirection: "row", gap: Spacing.two, marginBottom: Spacing.three },
    chips: { flexDirection: "row", gap: Spacing.two },
    wrap: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
    reservationCard: { marginBottom: Spacing.two },
    reservationHeader: { minHeight: 60, flexDirection: "row", alignItems: "center" },
    pressed: { opacity: 0.65 },
    reservationContent: { flex: 1 },
    destination: { ...Typography.cardTitle, color: Palette.text },
    product: { ...Typography.caption, color: Palette.textSecondary, marginTop: Spacing.half },
    remainingBox: { alignItems: "center", marginHorizontal: Spacing.compact },
    remaining: { fontSize: 22, fontWeight: "700", color: Palette.primary },
    remainingLabel: { ...Typography.caption, color: Palette.textSecondary },
    chevron: { fontSize: 18, color: Palette.primary },
    details: { borderTopWidth: 1, borderTopColor: Palette.border, paddingTop: Spacing.compact, marginTop: Spacing.two },
    detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.two },
    detailLabel: { ...Typography.label, color: Palette.textSecondary },
    detailValue: { ...Typography.label, color: Palette.text, fontWeight: "700" },
    activeStatus: { ...Typography.label, color: Palette.success, fontWeight: "700" },
    cancelButton: { marginTop: Spacing.one },
    quantityCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    freeValue: { fontSize: 24, fontWeight: "700", color: Palette.text },
    freeLabel: { ...Typography.caption, color: Palette.textSecondary },
    input: { width: 88, height: ControlSize.input, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.small, backgroundColor: Palette.background, textAlign: "center", fontSize: 18, fontWeight: "700", color: Palette.text }
});
