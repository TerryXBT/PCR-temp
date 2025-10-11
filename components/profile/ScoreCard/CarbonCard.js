/**
 * @fileoverview CarbonCard component.
 * Displays carbon points with tree-ring progress visualization and level.
 * Adds SharePosterModal integration (top-right share icon).
 */

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useUser } from "../../../context/UserContext";
import colors from "../../../theme/colors";
import { getLevelTier } from "../../../utils/levelTiers";
import TreeRingProgress from "../../progress/TreeRingProgress";
import SharePosterModal from "../../rewards/SharePosterModal/index";
import styles from "./styles";

const POINTS_PER_RING = 500;

const CarbonCard = ({ data }) => {
  if (!data) return null;

  const [showShareModal, setShowShareModal] = useState(false);
  const { user } = useUser();

  // 安全读取与下限保护
  const rawPoints = Number(data.value);
  const points = Number.isFinite(rawPoints) && rawPoints >= 0 ? rawPoints : 0;

  const levelTier = getLevelTier(points);
  const stage = Math.floor(points / POINTS_PER_RING) + 1;

  const pointsIntoCurrentRing = points % POINTS_PER_RING;
  const pointsToNextMilestone =
    pointsIntoCurrentRing === 0 ? 0 : POINTS_PER_RING - pointsIntoCurrentRing;

  // 估算碳减排（占位公式）
  const co2SavedKg = Number((points / 18).toFixed(1));

  return (
    <View style={styles.carbon.card}>
      {/* Header Row */}
      <View style={styles.carbon.header}>
        {data.icon?.name && (
          <MaterialIcons
            name={data.icon.name}
            size={20}
            color={colors.eco.yellow}
          />
        )}
        <Text style={styles.carbon.title}>{data.title}</Text>

        {/* Share Button (top-right) */}
        <TouchableOpacity
          style={styles.carbon.shareIcon}
          onPress={() => setShowShareModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="share-outline"
            size={22}
            color={colors.eco.green[600]}
          />
        </TouchableOpacity>
      </View>

      {/* Points + Tree-ring */}
      <View style={styles.carbon.mainRow}>
        <View style={styles.carbon.pointsContainer}>
          <Text style={styles.carbon.value}>{String(points)}</Text>
          <Text style={styles.carbon.pointsLabel}>Carbon Points</Text>
        </View>

        <TreeRingProgress
          points={points}
          size={120}
          strokeWidth={10}
          maxPerRing={POINTS_PER_RING}
        >
          <View style={styles.carbon.stageBadge}>
            <Text style={styles.carbon.stageBadgeText}>Stage {stage}</Text>
          </View>
        </TreeRingProgress>
      </View>

      {/* Level row with subtitle */}
      <View style={styles.carbon.levelRow}>
        <MaterialIcons name="eco" size={20} color={colors.eco.green[600]} />
        <View style={styles.carbon.levelTextContainer}>
          <Text style={styles.carbon.levelText}>
            {data.level?.text || levelTier.name}
          </Text>
          <Text style={styles.carbon.levelSubtitle}>
            Stage {stage} · {levelTier.min}–
            {levelTier.max === Infinity ? "∞" : levelTier.max} pts
          </Text>
        </View>
      </View>

      {/* Next reward hint） */}
      {pointsToNextMilestone > 0 && (
        <View style={styles.carbon.rewardHint}>
          <MaterialIcons
            name="emoji-events"
            size={16}
            color={colors.eco.green[700]}
          />
          <Text style={styles.carbon.rewardText}>
            Earn {pointsToNextMilestone} pts more to unlock next stage!
          </Text>
        </View>
      )}

      {/* Share Poster Modal */}
      <SharePosterModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        points={points}
        co2SavedKg={co2SavedKg}
        badgeName={data.level?.text || levelTier.name}
        username={user?.name || "Verde User"}
        dateRangeLabel="this month"
      />
    </View>
  );
};

export default CarbonCard;