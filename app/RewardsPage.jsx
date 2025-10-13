import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import colors from "../theme/colors";

import AchievementBanner from "../components/rewards/AchievementBanner";
import BadgeCarousel from "../components/rewards/BadgeCarousel";
import NextRewardCard from "../components/rewards/NextRewardCard";
import RewardsHeader from "../components/rewards/RewardsHeader";
import SharePosterModal from "../components/rewards/SharePosterModal";

import { useUser } from "../context/UserContext";

import { achievement, badges, nextReward } from "../services/rewardsData";

const RewardsPage = () => {
  const [showShareModal, setShowShareModal] = useState(false);
  const { user } = useUser();

  // Extract real user data with fallbacks
  const userPoints = user?.carbonPoints || 0;
  // TODO: Add CO₂ saved to user context when available
  // For now, estimate based on points (1 point ≈ 0.038 kg CO₂)
  const estimatedCO2Saved =
    userPoints > 0 ? (userPoints * 0.038).toFixed(1) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.white }}>
      <ScrollView contentContainerStyle={styles.container}>
        <RewardsHeader />

        <AchievementBanner
          {...achievement}
          onSharePress={() => setShowShareModal(true)}
        />

        <Text style={styles.text}>Work in Progress</Text>

        <BadgeCarousel badges={badges} />

        <NextRewardCard {...nextReward} />
      </ScrollView>

      {/* Share Poster Modal - Uses real user data, level auto-calculated */}
      <SharePosterModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        points={userPoints}
        co2SavedKg={estimatedCO2Saved}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  text: {
    fontSize: 14,
    color: colors.neutral.gray600,
    textAlign: "center",
    marginVertical: 16,
  },
});

export default RewardsPage;
