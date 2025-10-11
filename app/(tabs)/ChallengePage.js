import logger from "../../utils/logger";
// app/(tabs)/ChallengePage.js
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import ChallengeCard from "../../components/challenges/ChallengeCard";
import ChallengeDetailsModal from "../../components/challenges/ChallengeDetailsModal";
import FeaturedChallengeCard from "../../components/challenges/FeaturedChallengeCard";
import CTAButton from "../../components/CTAButton";
import PageHeader from "../../components/PageHeader";
import { useUser } from "../../context/UserContext";
import {
  activateChallenge,
  completeUserChallenge,
  fetchUserChallenges,
} from "../../services/apis/challengeAPI";
import { getUser } from "../../services/apis/userAPI";
import colors from "../../theme/colors";
import layout from "../../theme/layout";
import { showFeedbackToast } from "../../utils/toast";

/**
 * ChallengePage component.
 *
 * Fetches user’s active challenges from API,
 * handles activation and completion,
 * and keeps user points in sync with backend.
 *
 * @returns {JSX.Element}
 */
const ChallengePage = () => {
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [hasCompletedAny, setHasCompletedAny] = useState(false);
  const { user, updateUser } = useUser();
  const router = useRouter();

  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  /**
   * Load active challenges from API on mount or when user changes.
   */
  useEffect(() => {
    const loadChallenges = async () => {
      try {
        if (!user?.eco_id) {
          setActiveChallenges([]);
          return;
        }
        const data = await fetchUserChallenges(user.eco_id);
        const active = data.filter((c) => c.isActive);
        setActiveChallenges(active);
      } catch (err) {
        logger.error("[ChallengePage] Failed to fetch challenges:", err);
      }
    };
    loadChallenges();
  }, [user?.eco_id]);

  /**
   * Activates a new challenge (persisted to API).
   * Called by FeaturedChallengeCard when swiping right.
   *
   * @async
   * @param {Object} challenge - Challenge object to activate
   */
  const handleActivateChallenge = async (challenge) => {
    try {
      if (!user?.eco_id) {
        showFeedbackToast({
          variant: 'info',
          title: 'Sign in required',
          message: 'Sign in to activate challenges.',
        });
        return;
      }
      await activateChallenge(user.eco_id, challenge.id, true);
      setActiveChallenges((prev) => [challenge, ...prev]);
      showFeedbackToast({
        variant: 'success',
        title: 'Challenge activated',
        message: `${challenge.title} is now in your active list.`,
      });
    } catch (err) {
      logger.error("[ChallengePage] Failed to activate challenge:", err);
      showFeedbackToast({
        variant: 'error',
        title: 'Unable to activate',
        message: 'Please try again in a moment.',
      });
    }
  };

  /**
   * Handles completion of a challenge.
   * Updates backend, refreshes points, and removes challenge locally.
   *
   * @async
   * @param {Object} challenge - Completed challenge
   */
  const handleCompleteChallenge = async (challenge) => {
    try {
      if (!user?.eco_id) {
        showFeedbackToast({
          variant: 'info',
          title: 'Sign in required',
          message: 'Sign in to track challenge progress.',
        });
        return;
      }

      await completeUserChallenge(
        user.eco_id,
        challenge.id,
        challenge.progress?.target || 1,
        1
      );

      // Refresh user from backend for updated points/persona
      const refreshed = await getUser(user.eco_id);
      await updateUser(refreshed);

      setHasCompletedAny(true);
      setActiveChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
      showFeedbackToast({
        variant: 'success',
        title: 'Challenge complete',
        message: `${challenge.title} marked as complete. Well done!`,
      });
    } catch (err) {
      logger.error("[ChallengePage] Failed to complete challenge:", err);
      showFeedbackToast({
        variant: 'error',
        title: 'Unable to save progress',
        message: 'Check your connection and try again.',
      });
    }
  };

  const renderEmptyState = () => {
    if (!hasCompletedAny) {
      return (
        <Text style={styles.emptyStateText}>
          Pick a challenge above to get started!
        </Text>
      );
    }
    return (
      <Text style={styles.emptyStateText}>
        Well done! You’ve completed your active challenges. Pick a new one to
        keep going!
      </Text>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSpacing}>
          <PageHeader title="Challenges" />
        </View>

        <View style={styles.featuredWrapper}>
          <FeaturedChallengeCard
            onActivateChallenge={handleActivateChallenge}
            activeCount={activeChallenges.length}
          />
        </View>

        <View style={styles.activeSection}>
          <Text style={styles.sectionTitle}>Active Challenges</Text>
          {activeChallenges.length > 0
            ? activeChallenges.map((challenge) => (
                <View key={challenge.id} style={styles.cardWrapper}>
                  <ChallengeCard
                    id={challenge.id}
                    title={challenge.title}
                    initialProgress={challenge.progress?.current || 0}
                    total={challenge.progress?.target || 1}
                    rewards={challenge.rewards}
                    onInfoPress={() => {
                      setSelectedChallenge(challenge);
                      setModalVisible(true);
                    }}
                    onComplete={handleCompleteChallenge}
                  />
                </View>
              ))
            : renderEmptyState()}
        </View>

        <View style={styles.section}>{/* <EncouragementBanner /> */}</View>

        <View style={styles.section}>
          <CTAButton
            label="View My Rewards"
            onPress={() => router.push("RewardsPage")}
          />
        </View>
      </ScrollView>

      <ChallengeDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        challenge={selectedChallenge}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: layout.screenPadding,
    paddingBottom: layout.blockSpacing,
  },
  headerSpacing: {
    marginBottom: layout.sectionSpacing,
  },
  featuredWrapper: {
    height: 300,
    marginBottom: layout.blockSpacing,
  },
  activeSection: {
    marginTop: layout.sectionSpacing,
    marginBottom: layout.blockSpacing / 2,
    zIndex: 1,
  },
  section: {
    marginBottom: layout.sectionSpacing,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: layout.cardSpacing,
    marginTop: layout.sectionSpacing,
    color: colors.textPrimary,
  },
  cardWrapper: {
    marginBottom: layout.cardSpacing,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
});

export default ChallengePage;
