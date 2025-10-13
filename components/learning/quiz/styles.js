// components/learning/quiz/styles.js
import { StyleSheet } from "react-native";
import colors from "../../../theme/colors";

export default StyleSheet.create({
  // Section (InteractiveQuiz)
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    maxWidth: 320,
    lineHeight: 20,
  },
  sectionItemSpacing: {
    marginTop: 10,
  },

  // QuizCard
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  cooldownText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
  },
  button: {
    borderRadius: 12,
    backgroundColor: colors.eco.green[600],
    paddingVertical: 12,
    marginTop: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: colors.neutral.gray200,
  },
  buttonLabel: {
    fontWeight: "600",
    color: colors.neutral.white,
    fontSize: 14,
  },
  buttonLabelDisabled: {
    color: colors.textSecondary,
  },
});
