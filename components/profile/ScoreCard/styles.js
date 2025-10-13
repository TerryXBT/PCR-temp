import { StyleSheet } from "react-native";
import colors from "../../../theme/colors";

const base = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 6,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  left: { flex: 1 },
  right: { flex: 1, alignItems: "flex-end", justifyContent: "center" },
  value: { fontSize: 28, fontWeight: "700", color: colors.textPrimary },
  unit: { fontSize: 13, color: colors.textSecondary },
  subText: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  changeRow: { flexDirection: "row", alignItems: "center" },
  change: { fontSize: 12, marginLeft: 4, color: colors.textPrimary },
});

const carbon = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    backgroundColor: colors.neutral.white,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  shareIcon: {
    padding: 4,
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  left: { flex: 1, justifyContent: "center" },
  right: { justifyContent: "center", alignItems: "center" },
  value: { fontSize: 34, fontWeight: "700", color: colors.textPrimary },
  percentText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  stageRow: {
    marginTop: 12,
    alignItems: "center",
  },
  levelText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.eco.purple,
  },
  levelSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  progressMessage: {
    marginTop: 16,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

export default { base, carbon };
