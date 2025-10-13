/**
 * @file CarbonPersona.js
 * @description Persona visuals using Lottie animations for seed, leaf, sapling, young-plant, tree, mature-tree, and final-stage.
 */

import LottieView from "lottie-react-native";
import { StyleSheet, View } from "react-native";

/**
 * CarbonPersona
 *
 * Displays Lottie animation for the current persona stage.
 *
 * @param {object} props
 * @param {"seed"|"leaf"|"sapling"|"young-plant"|"tree"|"mature-tree"|"final-stage"} props.stage - Persona stage.
 * @returns {JSX.Element}
 */
const CarbonPersona = ({ stage }) => {
  const animationMap = {
    seed: require("../../../assets/animations/seed.json"),
    leaf: require("../../../assets/animations/leaf.json"),
    sapling: require("../../../assets/animations/sapling.json"),
    youngPlant: require("../../../assets/animations/young-plant.json"),
    tree: require("../../../assets/animations/tree.json"),
    matureTree: require("../../../assets/animations/mature-tree.json"),
    finalStage: require("../../../assets/animations/final-stage.json"),
  };

  const animationSource = animationMap[stage] || animationMap.seed;

  return (
    <View style={styles.wrapper}>
      <LottieView
        source={animationSource}
        autoPlay
        loop
        style={styles.animation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  animation: {
    width: 140,
    height: 140,
  },
});

export default CarbonPersona;
