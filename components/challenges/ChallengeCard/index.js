import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import ProgressBar from "../../ProgressBar";
import styles from "./styles";

const ChallengeCard = ({
  title = "Untitled Challenge",
  initialProgress = 0,
  total = 1,
  onInfoPress,
}) => {
  const normalizedProgress =
    typeof initialProgress === "number" ? initialProgress : 0;
  const safeTotal = total || 1;
  const completion = Math.min(Math.max(normalizedProgress / safeTotal, 0), 1);
  const remaining = Math.max(safeTotal - normalizedProgress, 0);
  const progressColor = completion >= 1 ? "#9CA3AF" : "#22C55E";

  return (
    <Pressable
      onPress={onInfoPress}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${title}`}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.hint}>Tap to view details and complete</Text>
        </View>

        <View style={styles.infoWrapper} accessible={false}>
          <MaterialIcons name="info-outline" size={22} color="#22C55E" />
        </View>
      </View>

      <View style={styles.progressSection}>
        <ProgressBar
          progress={completion}
          height={6}
          color={progressColor}
          backgroundColor="#E5E7EB"
        />
      </View>
    </Pressable>
  );
};

export default ChallengeCard;
