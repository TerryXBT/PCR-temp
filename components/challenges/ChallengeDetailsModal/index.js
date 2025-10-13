import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableWithoutFeedback,
  Pressable,
} from "react-native";
import CTAButton from "../../CTAButton";
import logger from "../../../utils/logger";
import styles from "./styles";

/**
 * ChallengeDetailsModal
 *
 * Modal showing details for a selected challenge.
 * - Opens on card press.
 * - Closes on outside press or back action.
 *
 * @param {object} props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {function} props.onClose - Callback to close modal
 * @param {object} props.challenge - Challenge object with title, description, rewards
 */
const ChallengeDetailsModal = ({
  visible,
  onClose,
  challenge,
  onCompleteChallenge,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  if (!challenge) return null;

  const handleComplete = async () => {
    if (!challenge || !onCompleteChallenge || isCompleting) return;
    setIsCompleting(true);
    try {
      await onCompleteChallenge(challenge);
      onClose?.();
    } catch (error) {
      logger.error(
        "[ChallengeDetailsModal] Failed to complete challenge:",
        error
      );
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <Pressable style={styles.modalContainer}>
            <View style={styles.header}>
              <Ionicons
                name="chevron-back"
                size={24}
                color="black"
                onPress={onClose}
              />
              <Text style={styles.headerTitle}>Challenge Details</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
              <Text style={styles.title}>{challenge.title}</Text>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="information-circle"
                    size={18}
                    color="#16A34A"
                  />
                  <Text style={styles.sectionTitle}>Description</Text>
                </View>
                <Text style={styles.sectionText}>{challenge.description}</Text>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="gift" size={18} color="#16A34A" />
                  <Text style={styles.sectionTitle}>Rewards</Text>
                </View>
                <View style={styles.rewardRow}>
                  <Ionicons name="trophy" size={18} color="#22C55E" />
                  <Text style={styles.rewardText}>
                    +{challenge.rewards.points} points
                  </Text>
                </View>
                {challenge.rewards.badge && (
                  <View style={styles.rewardRow}>
                    <Ionicons name="leaf" size={18} color="#22C55E" />
                    <Text style={styles.rewardText}>
                      {challenge.rewards.badge}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.actions}>
              <CTAButton
                label={isCompleting ? "Completing..." : "Mark as Completed"}
                onPress={handleComplete}
                disabled={isCompleting}
              />
            </View>
         </Pressable>
       </View>
     </TouchableWithoutFeedback>
   </Modal>
  );
};

export default ChallengeDetailsModal;
