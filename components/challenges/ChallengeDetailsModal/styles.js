import { StyleSheet } from "react-native";
import colors from "../../../theme/colors";

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    borderRadius: 16,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  content: {
    marginTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: 16,
    backgroundColor: "rgba(34,197,94,0.05)",
    borderRadius: 12,
    padding: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionTitle: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#16A34A",
  },
  sectionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  rewardText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#16A34A",
  },
  actions: {
    marginTop: 12,
  },
});
