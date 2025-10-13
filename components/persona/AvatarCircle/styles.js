import { StyleSheet } from "react-native";
import colors from "../../../theme/colors";

export default StyleSheet.create({
  avatarWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  treeImage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  statusPill: {
    position: "absolute",
    bottom: 12,
    backgroundColor: colors.eco.green[600],
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    // marginTop: 10,
  },
  statusText: {
    color: colors.neutral.white,
    fontWeight: "600",
  },
});
