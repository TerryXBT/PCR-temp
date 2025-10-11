import { StyleSheet } from "react-native";

/**
 * Stylesheet for FeaturedChallengeCard component.
 * Defines card appearance, stacking visuals, and supporting UI elements.
 */
export default StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    minHeight: 260,
    alignSelf: "center",
    justifyContent: "flex-start",
    borderWidth: 0.45,
    borderColor: "#055d29ff",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  iconWrapper: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 24,
    padding: 8,
  },

  badge: {
    backgroundColor: "#FFA726",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "white",
    opacity: 0.9,
    marginBottom: 16,
  },

  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  progressLabel: {
    fontSize: 12,
    color: "white",
    opacity: 0.85,
  },

  progressValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },

  rewardsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 12,
    marginTop: 16,
  },

  rewardPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  rewardText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "500",
    color: "white",
  },

  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 100,
  },

  swipeText: {
    color: "white",
    fontWeight: "600",
  },

  activeCard: {
    borderColor: "#22c55e",
    borderWidth: 2,
  },

  ghostCardFirst: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 12,
    height: 260,
    borderRadius: 20,
    backgroundColor: "hsla(123, 46%, 34%, 0.90)",
    transform: [{ scale: 0.96 }],
    zIndex: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    opacity: 0.9,
  },

  ghostCardSecond: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 24,
    height: 260,
    borderRadius: 20,
    backgroundColor: "rgba(43, 106, 46, 0.6)",
    transform: [{ scale: 0.93 }],
    zIndex: -1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    opacity: 0.6,
  },

  // Swipe hints at the bottom
  swipeHints: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
    marginTop: 12,
    paddingHorizontal: 8,
  },

  hintLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  hintRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  hintText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
});
