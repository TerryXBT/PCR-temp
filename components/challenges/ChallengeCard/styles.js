import { StyleSheet } from "react-native";
import colors from "../../../theme/colors";

export default StyleSheet.create({
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleColumn: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral.gray900,
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    color: colors.neutral.gray400,
  },
  infoWrapper: {
    marginLeft: 8,
  },
  progressSection: {
    marginTop: 16,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.neutral.gray600,
    marginBottom: 8,
  },
});
