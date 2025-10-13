import { Platform, StyleSheet } from "react-native";
import colors from "../../../theme/colors";

export default StyleSheet.create({
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    marginBottom: 8,
  },
  sourceLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sourceLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sourceValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.infoTint,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  tipText: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
});
