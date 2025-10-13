/**
 * @fileoverview PersonaCard component.
 * Displays the user's carbon persona with an icon and stage-specific label.
 */

import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useUser } from "../../../context/UserContext";
import colors from "../../../theme/colors";
import styles from "./styles";

/**
 * PersonaCard
 *
 * Displays the persona stage based on user progress (seed, leaf, sapling, youngPlant, tree, matureTree, finalStage).
 *
 * @returns {JSX.Element}
 */
const PersonaCard = () => {
  const { user } = useUser();

  const personaLabels = {
    seed: "Eco Seedling",
    leaf: "Eco Sprout",
    sapling: "Eco Explorer",
    youngPlant: "Eco Grower",
    tree: "Eco Warrior",
    matureTree: "Forest Guardian",
    finalStage: "Climate Champion",
  };

  const stage = user?.personaStage || "seed";
  const label = personaLabels[stage];

  const iconMap = {
    seed: "leaf",
    leaf: "leaf",
    sapling: "leaf-outline",
    youngPlant: "leaf-outline",
    tree: "tree-outline",
    matureTree: "tree-outline",
    finalStage: "planet",
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Your Carbon Persona</Text>
      <View style={styles.iconWrapper}>
        <Ionicons
          name={iconMap[stage] || "leaf"}
          size={42}
          color={colors.eco.green[600]}
        />
      </View>
      <Text style={styles.persona}>{label}</Text>
    </View>
  );
};

export default PersonaCard;
