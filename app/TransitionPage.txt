/**
 * @fileoverview Transition screen shown after onboarding completes.
 * Displays placeholder text while simulating setup before navigating
 * to ProfilePage.
 */

import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "../theme/colors";

const TransitionPage = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/ProfilePage");
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Calculating a few things...{"\n"}
        Getting things setup for you...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.neutral.white,
    padding: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    color: colors.textPrimary,
  },
});

export default TransitionPage;
