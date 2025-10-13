import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CTAButton from "../components/CTAButton";
import LogoutModal from "../components/settings/LogoutModal";
import SettingsCard from "../components/settings/SettingsCard";
import SettingsIcon from "../components/settings/SettingsIcon";
import PrivacyPolicyModal from "../components/settings/PrivacyPolicyModal";
import UserInfoCard from "../components/settings/UserInfoCard";
import { useHaptics } from "../context/HapticsContext";
import { useUser } from "../context/UserContext";
import StorageService from "../services/storage";
import colors from "../theme/colors";

const SettingsPage = () => {
  const version = Constants.expoConfig?.version || "1.0.0";
  const buildStage = Constants.expoConfig?.extra?.buildStage || "";
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const router = useRouter();
  const { enabled, toggleHaptics } = useHaptics();
  const { user, resetUser, updateUser } = useUser();

  // Debug toggle
  // const [showDebug, setShowDebug] = useState(false);

  const cyclePersonaStage = async () => {
    if (!user) return;
    const order = ["leaf", "sapling", "tree"];
    const currentIndex = order.indexOf(user.personaStage || "leaf");
    const nextStage = order[(currentIndex + 1) % order.length];

    const newUser = { ...user, personaStage: nextStage };
    await StorageService.setUser(newUser); // force persist first
    await updateUser(newUser); // then sync into context

  };

  const copyEcoId = async () => {
    if (user?.eco_id) {
      await Clipboard.setStringAsync(user.eco_id);
      Alert.alert("Copied", "Your Eco ID has been copied to clipboard.");
    }
  };

  const sendEcoIdByEmail = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    try {

      Alert.alert("Success", `Eco ID sent to ${email}`);
      setEmail("");
      setShowEmailInput(false);
    } catch (err) {
      Alert.alert("Error", "Failed to send Eco ID. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await resetUser();

      router.replace("/");
    } catch (err) {

    }
  };

  const handleCloseLogoutModal = () => {
    setLogoutModalVisible(false);
    setShowEmailInput(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/ProfilePage")}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Manage your account and preferences
          </Text>
        </View>
      </View>

      {/* User Information Card */}
      <UserInfoCard ecoId={user?.eco_id} onCopy={copyEcoId} />

      {/* Haptics Toggle */}
      <SettingsCard
        title="Haptic Feedback"
        subtitle="Enable vibration for app interactions"
        icon={
          <LinearGradient
            colors={["#A855F7", "#9333EA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 45,
              height: 45,
              borderRadius: 12,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons name="vibrate" size={22} color="white" />
          </LinearGradient>
        }
        rightContent={<Switch value={enabled} onValueChange={toggleHaptics} />}
      />

      {/* Privacy & Security */}
      <SettingsCard
        title="Privacy & Security"
        subtitle="Control your data and security settings"
        icon={<SettingsIcon name="shield-checkmark" bgColor={colors.info} />}
        rightContent={<Text style={styles.arrow}>›</Text>}
        onPress={() => setPrivacyVisible(true)}
      />

      {/* Debug */}
      {/* <CTAButton
        label="Show User Context"
        variant="outlined"
        onPress={() => setShowDebug((prev) => !prev)}
        style={{ marginTop: 12 }}
      />

      {showDebug && (
        <Text style={{ color: "red", fontSize: 12, marginTop: 8 }}>
          {JSON.stringify(user, null, 2)}
        </Text>
      )}

      <CTAButton
        label="Cycle Persona Stage"
        variant="outlined"
        onPress={cyclePersonaStage}
        style={{ marginTop: 12 }}
      /> */}
      {/* End - Debug */}

      {/* Logout Button */}
      <CTAButton
        label="Log Out"
        variant="filled"
        onPress={() => setLogoutModalVisible(true)}
        iconLeft={<Ionicons name="log-out-outline" size={20} color="white" />}
        style={styles.logoutBtn}
      />

      {/* Logout Guard Modal */}
      <LogoutModal
        visible={logoutModalVisible}
        onClose={handleCloseLogoutModal}
        ecoId={user?.eco_id}
        onCopyEcoId={copyEcoId}
        onSendEmail={sendEcoIdByEmail}
        showEmailInput={showEmailInput}
        setShowEmailInput={setShowEmailInput}
        email={email}
        setEmail={setEmail}
        onLogout={handleLogout}
      />
      <PrivacyPolicyModal
        visible={privacyVisible}
        onClose={() => setPrivacyVisible(false)}
      />
      <Text style={styles.versionText}>
        {`Version ${version}${buildStage ? ` (${buildStage})` : ""}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  arrow: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  logoutBtn: {
    backgroundColor: "#DC2626",
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: colors.textPrimary,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  ecoIdBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  ecoIdValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  copyHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emailIconWrapper: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.eco.green[50],
    justifyContent: "center",
    alignItems: "center",
  },
  noEcoId: {
    fontSize: 14,
    color: colors.error,
    marginBottom: 16,
    textAlign: "center",
  },
  emailInput: {
    borderWidth: 1,
    borderColor: colors.neutral.gray200,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    color: colors.textPrimary,
  },
  modalActions: {
    marginTop: 20,
  },
  confirmBtn: {
    backgroundColor: "#DC2626",
  },
  versionText: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    fontSize: 12,
    color: colors.neutral.gray600,
  },
});

export default SettingsPage;
