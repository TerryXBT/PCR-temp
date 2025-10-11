import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import ProgressBar from "../../ProgressBar";
import CompletionOverlay from "../CompletionOverlay";
import styles from "./styles";

/**
 * ChallengeCard component.
 *
 * Displays a challenge with progress tracking, tick button,
 * and an overlay when completed.
 *
 * @param {Object} props
 * @param {string} props.id - Unique challenge identifier
 * @param {string} props.title - Challenge title
 * @param {number} props.initialProgress - Initial progress value
 * @param {number} props.total - Target progress to complete challenge
 * @param {{ points: number }} props.rewards - Rewards associated with challenge
 * @param {() => void} props.onInfoPress - Callback when info icon pressed
 * @param {(challenge: Object) => void} props.onComplete - Callback when challenge is completed
 * @returns {JSX.Element}
 */
const ChallengeCard = ({
  id,
  title = "Untitled Challenge",
  initialProgress = 0,
  total = 1,
  rewards = { points: 0 },
  onInfoPress,
  onComplete,
}) => {
  const [progress, setProgress] = useState(initialProgress);
  const [textWidth, setTextWidth] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  const remaining = Math.max(total - progress, 0);
  const completion = total > 0 ? progress / total : 0;
  const isCompleted = progress >= total;

  const handleTickPress = () => {
    if (isCompleted) return;

    const newProgress = Math.min(progress + 1, total);
    setProgress(newProgress);

    if (newProgress === total) {
      setShowOverlay(true);
    }
  };

  return (
    <Pressable onPress={onInfoPress} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.leftColumn}>
          <Pressable onPress={handleTickPress}>
            <View
              style={[
                styles.tickCircle,
                isCompleted && styles.tickCircleCompleted,
              ]}
            >
              <MaterialIcons
                name="check"
                size={18}
                color={isCompleted ? "#fff" : "#22C55E"}
              />
            </View>
          </Pressable>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.rightColumn}>
          <Pressable onPress={onInfoPress} style={styles.infoWrapper}>
            <MaterialIcons name="info-outline" size={22} color="#2563EB" />
          </Pressable>

          {remaining > 1 && (
            <View style={styles.progressContainer}>
              <Text
                style={styles.progressText}
                onLayout={(e) => {
                  const { width } = e.nativeEvent.layout;
                  setTextWidth(width);
                }}
              >
                {remaining} more to go
              </Text>

              {textWidth > 0 && (
                <View style={{ width: textWidth }}>
                  <ProgressBar
                    progress={completion}
                    height={6}
                    color={isCompleted ? "#9CA3AF" : "#22C55E"}
                    backgroundColor="#E5E7EB"
                  />
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {showOverlay && (
        <CompletionOverlay
          visible={showOverlay}
          points={rewards?.points || 0}
          onClose={() => {
            setShowOverlay(false);
            onComplete?.({
              id,
              title,
              rewards,
              progress,
              target: total,
              finished: true,
            });
          }}
        />
      )}
    </Pressable>
  );
};

export default ChallengeCard;
