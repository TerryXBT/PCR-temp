import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native";
import colors from "../../../theme/colors";
import styles from "./styles";

import { useUser } from "../../../context/UserContext";
import AvatarCircle from "../AvatarCircle";

/**
 * AvatarCard
 *
 * Displays the user's carbon persona with stage-specific animation and messages.
 *
 * @returns {JSX.Element}
 */
const AvatarCard = () => {
  const { user } = useUser();

  const personaMap = {
    seed: {
      status: "Just Starting",
      title: "Your First Seed",
      message:
        "Every journey begins with a single seed. Plant the change today!",
    },
    leaf: {
      status: "Sprouting",
      title: "Your First Leaf",
      message: "Every journey begins with a single step. Keep going!",
    },
    sapling: {
      status: "Growing Strong",
      title: "Your Green Guardian",
      message:
        "Great job! Your sapling is thriving. Stay consistent with your actions.",
    },
    youngPlant: {
      status: "Rising Up",
      title: "Young Plant Power",
      message:
        "Your efforts are blooming! Keep nurturing your eco-friendly habits.",
    },
    tree: {
      status: "Eco Warrior",
      title: "Your Flourishing Tree",
      message:
        "Amazing! Your tree is fully grown, showing the impact of your sustainable choices.",
    },
    matureTree: {
      status: "Nature's Guardian",
      title: "Mature Forest Guardian",
      message:
        "Extraordinary! Your mature tree stands tall. You're a true environmental champion.",
    },
    finalStage: {
      status: "Climate Legend",
      title: "Planet Protector",
      message:
        "You've reached the ultimate stage! Your impact is transforming the world. Thank you, Climate Champion!",
    },
  };

  const stage = user?.personaStage || "seed";
  const { status, title, message } = personaMap[stage];

  return (
    <LinearGradient
      colors={[colors.eco.green[50], colors.eco.green[100]]}
      style={styles.card}
    >
      <AvatarCircle stage={stage} status={status} />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </LinearGradient>
  );
};

export default AvatarCard;
