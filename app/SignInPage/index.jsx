/**
 * @fileoverview SignInPage.
 * Refined layout with top-right info icon replacing bottom link.
 */

import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import AppIcon from "../../components/AppIcon";
import CTAButton from "../../components/CTAButton";
import { AuthCard } from "../../components/forms/auth";
import { useUser } from "../../context/UserContext";
import { setSeenIntro } from "../../lib/storage/firstRun";
import { getUser } from "../../services/apis/userAPI";
import StorageService from "../../services/storage";
import styles from "./styles";

const SignInPage = () => {
  const [ecoId, setEcoId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { updateUser } = useUser();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!ecoId.trim()) {
      setError("Please enter a valid Eco ID");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      Keyboard.dismiss();
      const user = await getUser(ecoId.trim());
      await updateUser(user);
      await StorageService.setEcoId(user.eco_id);
      await StorageService.setUser(user);
      router.replace("/ProfilePage");
    } catch {
      setError("Invalid Eco ID or failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewIntro = async () => {
    try {
      await setSeenIntro(false);
    } catch (err) {
      if (__DEV__) console.warn("[SignIn] Failed to reset intro flag", err);
    } finally {
      router.replace("/(intro)/intro");
    }
  };

  const handleLinkPress = async (callback) => {
    await Haptics.selectionAsync();
    callback();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Info Icon Top-Right */}
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => handleLinkPress(handleViewIntro)}
            style={styles.infoIcon}
          >
            <MaterialIcons
              name="info-outline"
              size={26}
              color={styles.infoIconColor.color}
            />
          </TouchableOpacity>

          <View style={styles.iconWrapper}>
            <AppIcon size={32} />
          </View>

          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>
            Enter your Eco ID to access your account
          </Text>

          <AuthCard
            label="Your Eco ID"
            value={ecoId}
            onChangeText={setEcoId}
            placeholder="Enter Eco ID"
            helper="Your Eco ID was generated after completing the questionnaire."
            icon="key-outline"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <CTAButton
            label={loading ? "Signing In..." : "Sign In"}
            onPress={handleSignIn}
            disabled={loading}
          />

          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() =>
              handleLinkPress(() => router.push("/OnboardingPage"))
            }
          >
            <Text style={styles.primaryLink}>New user? Start here →</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default SignInPage;
