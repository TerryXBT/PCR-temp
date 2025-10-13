import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet, Text, View } from "react-native";
import colors from "../theme/colors";
import { getLevelTier } from "../utils/levelTiers";

/**
 * PosterCard component - Shareable poster for social media
 * Renders a 9:16 aspect ratio poster with user achievements
 *
 * @param {Object} props
 * @param {number} props.points - Total Verde points earned
 * @param {number} props.co2SavedKg - CO₂ saved in kg
 * @param {string} [props.badgeName] - Optional: Override badge name (defaults to level tier)
 * @param {string} [props.username] - Optional username
 * @param {string} [props.dateRangeLabel] - Optional date range (e.g., "this month")
 */
const PosterCard = ({
  points = 1247,
  co2SavedKg = 47.3,
  badgeName,
  username,
  dateRangeLabel = "this month",
}) => {
  // Get level tier based on points
  const levelTier = getLevelTier(points);
  const displayBadgeName = badgeName || levelTier.name;
  return (
    <View style={styles.posterContainer}>
      <LinearGradient
        colors={["#1DA96B", "#A8E6CF"]} // Dark green (top) → Light green (bottom)
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        {/* Safe zone top */}
        <View style={styles.safeZoneTop} />

        {/* Brand header */}
        <View style={styles.header}>
          <Text style={styles.brandText}>Verde</Text>
          <Text style={styles.brandSubtext}>Eco Action Tracker</Text>
        </View>

        {/* Main content card */}
        <View style={styles.card}>
          {/* Main achievement */}
          <View style={styles.achievementSection}>
            <Text style={styles.pointsNumber}>{points.toLocaleString()}</Text>
            <Text style={styles.pointsLabel}>points on Verde</Text>
          </View>

          {/* Level name */}
          <View style={styles.badgeSection}>
            <View style={styles.badgeBadge}>
              <Text style={styles.badgeIcon}>⭐</Text>
            </View>
            <Text style={styles.badgeName}>Level: {displayBadgeName}</Text>
          </View>

          {/* CO₂ savings */}
          <View style={styles.co2Section}>
            <Text style={styles.co2Text}>
              {`${"You've saved"}`}
              <Text style={styles.co2Number}> {co2SavedKg} kg CO₂</Text>{" "}
              {dateRangeLabel}
            </Text>
          </View>

          {/* Divider */}
          {/* <View style={styles.divider} /> */}

          {/* CTA footer */}
          {/* <View style={styles.ctaSection}>
            <Text style={styles.ctaText}>Join me on Verde</Text>
            <Text style={styles.ctaSubtext}>Save CO₂ and earn rewards</Text>
          </View> */}
        </View>

        {/* Safe zone bottom */}
        <View style={styles.safeZoneBottom} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  posterContainer: {
    width: "100%",
    aspectRatio: 9 / 16,
    maxWidth: 540,
    alignSelf: "center",
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
  },
  safeZoneTop: {
    height: 60,
  },
  safeZoneBottom: {
    height: 60,
  },

  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  brandText: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.neutral.white,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandSubtext: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral.white,
    marginTop: 4,
    opacity: 0.9,
  },

  // Main card
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: 24,
    padding: 32,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // Achievement section
  achievementSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  pointsNumber: {
    fontSize: 64,
    fontWeight: "800",
    color: colors.poster.eco,
    lineHeight: 72,
  },
  pointsLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.poster.text,
    marginTop: 4,
  },

  // Badge section
  badgeSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  badgeBadge: {
    backgroundColor: colors.poster.cta,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  badgeIcon: {
    fontSize: 28,
  },
  badgeName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.poster.text,
    textAlign: "center",
  },

  // CO₂ section
  co2Section: {
    alignItems: "center",
    marginBottom: 24,
  },
  co2Text: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.poster.muted,
    textAlign: "center",
    lineHeight: 24,
  },
  co2Number: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.poster.eco,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.neutral.gray200,
    marginVertical: 20,
  },

  // CTA section
  ctaSection: {
    alignItems: "center",
  },
  ctaText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.poster.text,
    marginBottom: 4,
  },
  ctaSubtext: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.poster.muted,
  },
});

export default PosterCard;
