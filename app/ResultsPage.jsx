/**
 * @fileoverview ResultsPage.
 * Displays the user’s sustainability results after onboarding.
 * Includes daily footprint, comparison to national average,
 * carbon persona, tip of the day, and a CTA button to continue.
 */

import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import CTAButton from "../components/CTAButton";
import AvatarCard from "../components/persona/AvatarCard";
import {
  ComparedToAverageCard,
  DailyFootprintCard,
  TipOfTheDayCard,
} from "../components/results";
import { useUser } from "../context/UserContext";
import colors from "../theme/colors";

/**
 * ResultsPage component.
 *
 * @component
 * @returns {JSX.Element} The rendered ResultsPage screen.
 *
 * @description
 * - Reads `baseline` value from UserContext (synced with StorageService during onboarding).
 * - Displays results using modular cards:
 *   - DailyFootprintCard → shows user’s baseline.
 *   - ComparedToAverageCard → compares user’s baseline with national average.
 *   - AvatarCard → dynamic persona visuals based on carbon points.
 *   - TipOfTheDayCard → static sustainability tip.
 * - Provides a CTA button that navigates the user to `/ProfilePage`.
 */
export default function ResultsPage() {
  const { user } = useUser();
  const nationalAverage = 8.4;
  const router = useRouter();

  const baseline = user?.daily ?? null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Results</Text>
        <Text style={styles.subtitle}>
          Here’s your sustainability footprint
        </Text>
      </View>

      {/* Cards */}
      <DailyFootprintCard baseline={baseline} />
      <ComparedToAverageCard
        baseline={baseline}
        nationalAverage={nationalAverage}
      />
      <AvatarCard />
      <TipOfTheDayCard tip="Try using public transport twice a week instead of driving. This simple change can reduce your weekly emissions by up to 2.1 kg CO₂e!" />

      {/* CTA */}
      <View style={styles.ctaWrapper}>
        <CTAButton
          label="Get Started"
          variant="filled"
          onPress={() => router.replace("/ProfilePage")}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colors.neutral.white,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  ctaWrapper: {
    marginTop: 20,
    marginBottom: 40,
  },
});
