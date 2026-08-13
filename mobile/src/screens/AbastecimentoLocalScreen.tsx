import React, {
    useMemo,
    useState
} from "react";

import {
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";

import { QuantityRow } from "../components/domain/QuantityRow";
import { BottomActionBar } from "../components/layout/BottomActionBar";
import { Screen } from "../components/layout/Screen";
import { Section } from "../components/layout/Section";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Chip } from "../components/ui/Chip";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import {
    Palette,
    Spacing,
    Typography
} from "../constants/theme";
import { Abastecimento } from "../models/Abastecimento";
import { Estoque } from "../models/Estoque";
import { ItemAbastecimento } from "../models/ItemAbastecimento";
import { LocalId } from "../models/Local";
import {
    CategoriaPelucia,
    ProdutoId
} from "../models/Produto";
import { Reserva } from "../models/Reserva";
import { UsuarioId } from "../models/Usuario";
import { MaquinaService } from "../services/MaquinaService";
import { ReservaService } from "../services/ReservaService";
import { nomeProduto } from "../utils/ProdutoUtils";

interface Props {
    localId: LocalId;
    localNome: string;
    responsavelId: UsuarioId;
    estoque: Estoque;
    reservas: Reserva[];
    registrarAbastecimento: (abastecimento: Abastecimento) => void;
    onChangeLocal?: () => void;
    onChangeResponsible?: (responsavel: UsuarioId) => void;
}

function categoriaParaProduto(categoria: CategoriaPelucia): ProdutoId {
    return categoria as unknown as ProdutoId;
}

export function AbastecimentoLocalScreen({
    localId,
    localNome,
    responsavelId,
    estoque,
    reservas,
    registrarAbastecimento,
    onChangeLocal,
    onChangeResponsible
}: Props) {
    const maquinas = useMemo(() => MaquinaService.listarPorLocal(localId), [localId]);
    const destinoReserva = useMemo(() => ReservaService.destinoReservaDoLocal(localId), [localId]);
    const [quantidades, setQuantidades] = useState<Record<string, string>>({});
    const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
    const [mensagemErro, setMensagemErro] = useState<string | null>(null);
    const [detalhesAbertos, setDetalhesAbertos] = useState(false);
    const [revisando, setRevisando] = useState(false);

    const categorias = useMemo(() => Array.from(new Set(
        maquinas.flatMap((maquina) => maquina.categoriasPermitidas)
    )), [maquinas]);
    const saldos = useMemo(() => categorias.map((categoria) => {
        const produtoId = categoriaParaProduto(categoria);
        const fisico = estoque.itens.find((item) => item.produtoId === produtoId)?.quantidade ?? 0;
        const reservadoTotal = ReservaService.quantidadeReservada(reservas, produtoId, responsavelId);
        const reservadoDestino = ReservaService.quantidadeReservadaNoDestino(reservas, produtoId, responsavelId, destinoReserva);
        const livre = ReservaService.quantidadeDisponivel(estoque, reservas, produtoId);
        return { categoria, produtoId, fisico, reservadoTotal, reservadoDestino, livre, podeUsarAqui: livre + reservadoDestino };
    }), [categorias, destinoReserva, estoque, reservas, responsavelId]);

    const chave = (maquinaId: string, categoria: CategoriaPelucia) => `${maquinaId}_${categoria}`;
    const itens = useMemo<ItemAbastecimento[]>(() => maquinas.flatMap((maquina) =>
        maquina.categoriasPermitidas
            .map((categoria) => ({
                maquinaId: maquina.id,
                produtoId: categoriaParaProduto(categoria),
                quantidade: Number(quantidades[chave(maquina.id, categoria)] || 0)
            }))
            .filter((item) => Number.isInteger(item.quantidade) && item.quantidade > 0)
    ), [maquinas, quantidades]);
    const total = itens.reduce((soma, item) => soma + item.quantidade, 0);
    const digitadoPorProduto = itens.reduce<Record<string, number>>((totais, item) => ({
        ...totais,
        [item.produtoId]: (totais[item.produtoId] ?? 0) + item.quantidade
    }), {});
    const disponivel = (categoria: CategoriaPelucia) => {
        const produtoId = categoriaParaProduto(categoria);
        const permitido = saldos.find((saldo) => saldo.produtoId === produtoId)?.podeUsarAqui ?? 0;
        return permitido - (digitadoPorProduto[produtoId] ?? 0);
    };

    const revisar = () => {
        setMensagemErro(null);
        setMensagemSucesso(null);
        if (itens.length === 0) {
            setMensagemErro("Informe pelo menos uma quantidade.");
            return;
        }
        setRevisando(true);
    };

    const confirmar = () => {
        setMensagemErro(null);
        setMensagemSucesso(null);
        const abastecimento: Abastecimento = {
            id: `AB_${Date.now()}`,
            localId,
            responsavelId,
            itens,
            data: new Date()
        };
        try {
            registrarAbastecimento(abastecimento);
            setQuantidades({});
            setRevisando(false);
            setMensagemSucesso(`${total} pelúcias registradas com sucesso.`);
        } catch (caughtError) {
            setMensagemErro(caughtError instanceof Error ? caughtError.message : "Erro ao registrar abastecimento.");
        }
    };

    return (
        <View style={styles.container}>
            <Screen contentContainerStyle={styles.content}>
                <Card style={styles.contextCard}>
                    <View style={styles.contextContent}>
                        <Text style={styles.stepLabel}>1. Local</Text>
                        <Text style={styles.contextValue}>{localNome}</Text>
                    </View>
                    {onChangeLocal ? <Button label="Alterar" variant="ghost" onPress={onChangeLocal} /> : null}
                </Card>

                {onChangeResponsible ? (
                    <Section title="2. Responsável">
                        <View style={styles.chips}>
                            <Chip label="Rodrigo" selected={responsavelId === UsuarioId.RODRIGO} onPress={() => onChangeResponsible(UsuarioId.RODRIGO)} />
                            <Chip label="Cesar" selected={responsavelId === UsuarioId.CESAR} onPress={() => onChangeResponsible(UsuarioId.CESAR)} />
                        </View>
                    </Section>
                ) : (
                    <Text style={styles.responsible}>Responsável: {responsavelId === UsuarioId.RODRIGO ? "Rodrigo" : "Cesar"}</Text>
                )}

                {revisando ? (
                    <Section title="4. Revisão" description="Confira as quantidades antes de confirmar.">
                        <Card style={styles.reviewCard}>
                            {itens.map((item) => {
                                const maquina = maquinas.find((candidate) => candidate.id === item.maquinaId);
                                return (
                                    <View key={`${item.maquinaId}-${item.produtoId}`} style={styles.reviewRow}>
                                        <View><Text style={styles.reviewProduct}>{nomeProduto(item.produtoId)}</Text><Text style={styles.reviewMachine}>{maquina?.nome ?? item.maquinaId}</Text></View>
                                        <Text style={styles.reviewQuantity}>{item.quantidade}</Text>
                                    </View>
                                );
                            })}
                        </Card>
                        <Button label="Editar quantidades" variant="secondary" onPress={() => setRevisando(false)} style={styles.editButton} />
                    </Section>
                ) : (
                    <>
                        <Section title={onChangeResponsible ? "3. Quantidades" : "2. Quantidades"}>
                            <Pressable onPress={() => setDetalhesAbertos(!detalhesAbertos)} style={({ pressed }) => [styles.detailsToggle, pressed && styles.pressed]}>
                                <Text style={styles.detailsToggleText}>Detalhes do estoque</Text>
                                <Text style={styles.chevron}>{detalhesAbertos ? "⌃" : "⌄"}</Text>
                            </Pressable>
                            {detalhesAbertos ? (
                                <Card style={styles.balanceCard}>
                                    {saldos.map((saldo) => (
                                        <View key={saldo.produtoId} style={styles.balanceBlock}>
                                            <Text style={styles.balanceProduct}>{nomeProduto(saldo.produtoId)}</Text>
                                            <Text style={styles.balanceText}>Físico {saldo.fisico} · Reservado {saldo.reservadoTotal} · Livre {saldo.livre}</Text>
                                            <Text style={styles.usableText}>Pode usar aqui: {saldo.podeUsarAqui}</Text>
                                        </View>
                                    ))}
                                </Card>
                            ) : null}
                        </Section>

                        {maquinas.map((maquina) => (
                            <Card key={maquina.id} style={styles.machineCard}>
                                <Text style={styles.machineName}>{maquina.nome}</Text>
                                {maquina.categoriasPermitidas.map((categoria) => {
                                    const inputKey = chave(maquina.id, categoria);
                                    const restante = disponivel(categoria);
                                    return (
                                        <QuantityRow
                                            key={inputKey}
                                            name={nomeProduto(categoriaParaProduto(categoria))}
                                            balance={`Disponível: ${restante}`}
                                            value={quantidades[inputKey] ?? ""}
                                            onChange={(valor) => {
                                                setQuantidades((anterior) => ({ ...anterior, [inputKey]: valor }));
                                                setMensagemErro(null);
                                                setMensagemSucesso(null);
                                            }}
                                            projectionDanger={restante < 0}
                                        />
                                    );
                                })}
                            </Card>
                        ))}
                    </>
                )}
                {mensagemErro ? <FeedbackBanner title="Não foi possível registrar" message={mensagemErro} variant="danger" /> : null}
                {mensagemSucesso ? <FeedbackBanner title="Abastecimento registrado" message={mensagemSucesso} /> : null}
            </Screen>
            <BottomActionBar summaryLabel="Total" summaryValue={`${total} pelúcias`} actionLabel={revisando ? "Confirmar abastecimento" : "Revisar abastecimento"} onPress={revisando ? confirmar : revisar} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Palette.background },
    content: { paddingTop: Spacing.three, paddingBottom: Spacing.four },
    contextCard: { flexDirection: "row", alignItems: "center" },
    contextContent: { flex: 1 },
    stepLabel: { ...Typography.caption, color: Palette.textSecondary },
    contextValue: { ...Typography.cardTitle, color: Palette.text, marginTop: Spacing.half },
    chips: { flexDirection: "row", gap: Spacing.two },
    responsible: { ...Typography.label, color: Palette.textSecondary, marginTop: Spacing.compact },
    detailsToggle: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    detailsToggleText: { ...Typography.label, color: Palette.primary, fontWeight: "700" },
    chevron: { fontSize: 18, color: Palette.primary },
    pressed: { opacity: 0.65 },
    balanceCard: { paddingVertical: Spacing.two },
    balanceBlock: { paddingVertical: Spacing.two },
    balanceProduct: { ...Typography.label, color: Palette.text, fontWeight: "700" },
    balanceText: { ...Typography.caption, color: Palette.textSecondary, marginTop: Spacing.half },
    usableText: { ...Typography.caption, color: Palette.primary, marginTop: Spacing.half, fontWeight: "700" },
    machineCard: { paddingVertical: Spacing.two, marginBottom: Spacing.compact },
    machineName: { ...Typography.cardTitle, color: Palette.text, paddingVertical: Spacing.two },
    reviewCard: { paddingVertical: Spacing.two },
    reviewRow: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: Palette.border },
    reviewProduct: { ...Typography.body, color: Palette.text, fontWeight: "600" },
    reviewMachine: { ...Typography.caption, color: Palette.textSecondary },
    reviewQuantity: { ...Typography.cardTitle, color: Palette.primary },
    editButton: { marginTop: Spacing.compact }
});
