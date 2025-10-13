import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import CTAButton from "../../components/CTAButton";
import PageHeader from "../../components/PageHeader";
import AvatarCard from "../../components/persona/AvatarCard";
import MonthlySnapshot from "../../components/profile/MonthlySnapshot";
import ScoreCard from "../../components/profile/ScoreCard";
import colors from "../../theme/colors";
import layout from "../../theme/layout";

import { useUser } from "../../context/UserContext";
import { fetchMonthlySnapshot } from "../../services/apis/monthlySnapshotAPI";
import { avatar } from "../../services/profileData";
import { getLevelTier } from "../../utils/levelTiers";

/**
 * ProfilePage
 *
 * Displays user profile with:
 * - Carbon score card
 * - Avatar progress
 * - Monthly emissions snapshot (API + context + AsyncStorage)
 * - Rewards navigation
 */
const ProfilePage = () => {
  const { user, getMonthlySnapshot, setMonthlySnapshot } = useUser();
  const router = useRouter();
  const [snapshotData, setSnapshotData] = useState(null);

  useEffect(() => {
    const loadSnapshot = async () => {
      try {
        // 1. Load cached snapshot from context/storage
        const stored = await getMonthlySnapshot();
        if (stored) {
          setSnapshotData(stored);
        }

        // 2. Fetch fresh snapshot if eco_id is available
        if (user?.eco_id) {
          const fresh = await fetchMonthlySnapshot(user.eco_id);
          if (fresh) {
            setSnapshotData(fresh);
            await setMonthlySnapshot(fresh);
          }
        }
      } catch (err) {
        console.error("[ProfilePage] Failed to load monthly snapshot:", err);
      }
    };

    loadSnapshot();
  }, [user?.eco_id]);

  // Get current level tier name dynamically
  const currentLevelTier = user?.carbonPoints
    ? getLevelTier(user.carbonPoints)
    : getLevelTier(0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerSpacing}>
          <PageHeader
            title="My Profile"
            onSettingsPress={() => router.push("/SettingsPage")}
            showSettings
          />
        </View>

        {/* Growth Journey Card */}
        {user && (
          <ScoreCard
            key={user.carbonPoints}
            data={{
              title: "Growth Journey",
              value: user.carbonPoints,
              progress: user.carbonPoints / 5000,
              icon: { name: "eco" },
              level: {
                icon: { name: "star" },
                text: currentLevelTier.name,
              },
            }}
          />
        )}

        {/* Avatar */}
        <AvatarCard {...avatar} />

        {/* Monthly Snapshot */}
        {snapshotData && <MonthlySnapshot data={snapshotData} />}

        {/* Rewards */}
        <CTAButton
          label="View My Rewards"
          onPress={() => router.push("RewardsPage")}
        />
      </ScrollView>
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
});

export default ProfilePage;
