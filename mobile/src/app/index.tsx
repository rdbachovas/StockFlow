import { StyleSheet, Text, View, Pressable } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>StockFlow</Text>
      <Text style={styles.subtitle}>Controle de estoque</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estoque Principal</Text>

        <View style={styles.row}>
          <Text>Pelúcias</Text>
          <Text style={styles.value}>295</Text>
        </View>

        <View style={styles.row}>
          <Text>Milho de pipoca</Text>
          <Text style={styles.value}>20</Text>
        </View>

        <View style={styles.row}>
          <Text>Chocolate em pó</Text>
          <Text style={styles.value}>15</Text>
        </View>

        <View style={styles.row}>
          <Text>Óleo</Text>
          <Text style={styles.value}>10</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meu estoque</Text>

        <View style={styles.row}>
          <Text>Pelúcias</Text>
          <Text style={styles.value}>30</Text>
        </View>
      </View>

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>+ Nova movimentação</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 18,
    marginBottom: 24,
  },

  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#f2f2f2",
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },

  value: {
    fontWeight: "bold",
  },

  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#222",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});