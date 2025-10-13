// import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";
import styles from "./styles";

import CarbonPersona from "../CarbonPersona";

/**
 * AvatarCircle
 *
 * Displays the persona animation inside a circular gradient with status text and a star badge.
 *
 * @param {object} props
 * @param {"seed"|"leaf"|"sapling"|"youngPlant"|"tree"|"matureTree"|"finalStage"} props.stage - Persona stage.
 * @param {string} props.status - Persona status text.
 * @returns {JSX.Element}
 */
const AvatarCircle = ({ stage, status }) => {
  return (
    <View style={styles.avatarWrapper}>
      {/* <LinearGradient
        colors={["#2E7D32", "#388E3C"]}
        style={styles.avatarCircle}
      > */}
      <CarbonPersona stage={stage} status={status} />

      <View style={styles.statusPill}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
      {/* </LinearGradient> */}
    </View>
  );
};

export default AvatarCircle;
