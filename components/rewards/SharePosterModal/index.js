/**
 * SharePosterModal - Modal overlay for poster preview and sharing
 * Captures poster as PNG and opens system share sheet
 *
 * LAYOUT FIX: Uses useSafeAreaInsets() to prevent first-render positioning bugs
 */

import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { captureRef } from "react-native-view-shot";

import colors from "../../../theme/colors";
import PosterCard from "../../PosterCard";

const HEADER_HEIGHT = 52; // Fixed header content height

const SharePosterModal = ({
  visible,
  onClose,
  points = 1247,
  co2SavedKg = 47.3,
  badgeName = "Eco Warrior",
  username,
  dateRangeLabel = "this month",
}) => {
  const posterRef = useRef();
  const [isSharing, setIsSharing] = useState(false);

  // Use safe area insets to position header correctly on first render
  const insets = useSafeAreaInsets();

  /**
   * Capture poster as PNG and open system share sheet
   */
  const sharePoster = async () => {
    if (isSharing) return;

    setIsSharing(true);
    try {
      // Capture poster as image (PNG format, high quality)
      const uri = await captureRef(posterRef, {
        format: "png",
        quality: 1.0,
        result: "tmpfile",
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Toast.show({
          type: "error",
          text1: "Sharing not available",
          text2: "Your device doesn't support sharing",
          position: "bottom",
        });
        return;
      }

      // Share via system share sheet
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share your Verde achievement",
        UTI: "public.png",
      });

      Toast.show({
        type: "success",
        text1: "Poster shared successfully!",
        position: "bottom",
      });

      // Close modal after successful share
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("Share error:", error);
      Toast.show({
        type: "error",
        text1: "Couldn't share poster",
        text2: "Please try again",
        position: "bottom",
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Only render modal content when visible to improve performance
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" translucent={false} />

        {/* Fixed Header with Back Button - uses safe area insets */}
        <View
          style={[
            styles.headerContainer,
            {
              paddingTop:
                insets.top > 0 ? insets.top : Platform.OS === "ios" ? 44 : 0,
              height:
                (insets.top > 0 ? insets.top : Platform.OS === "ios" ? 44 : 0) +
                HEADER_HEIGHT,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.backButton}
              activeOpacity={0.6}
            >
              <Ionicons
                name="arrow-back"
                size={26}
                color={colors.neutral.gray900}
              />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Content Area */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Poster preview - ONLY THIS PART is captured */}
          <View style={styles.posterWrapper}>
            <View ref={posterRef} collapsable={false}>
              <PosterCard
                points={points}
                co2SavedKg={co2SavedKg}
                badgeName={badgeName}
                username={username}
                dateRangeLabel={dateRangeLabel}
              />
            </View>
          </View>
        </ScrollView>

        {/* Fixed Footer with Share Button */}
        <View
          style={[
            styles.footerContainer,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.shareButton,
              isSharing && styles.shareButtonDisabled,
            ]}
            onPress={sharePoster}
            disabled={isSharing}
            activeOpacity={0.8}
          >
            {isSharing ? (
              <ActivityIndicator color={colors.neutral.white} size="small" />
            ) : (
              <Text style={styles.shareButtonText}>Share</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.footerHint}>
            Share your achievement on the socials
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.gray50,
  },

  // Header - Fixed at top with safe area insets
  headerContainer: {
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
    justifyContent: "flex-end", // Push content to bottom of safe area
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: HEADER_HEIGHT,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingRight: 16, // Extra touch area
  },
  backText: {
    fontSize: 17,
    color: colors.neutral.gray900,
    marginLeft: 6,
    fontWeight: "600",
  },

  // Scrollable content
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },

  // Poster wrapper - this is what gets captured
  posterWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Footer - Fixed at bottom with safe area insets
  footerContainer: {
    backgroundColor: colors.neutral.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray200,
    zIndex: 10,
  },
  shareButton: {
    backgroundColor: colors.poster.eco,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    color: colors.neutral.white,
    fontSize: 17,
    fontWeight: "700",
  },
  footerHint: {
    color: colors.neutral.gray600,
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
  },
});

export default SharePosterModal;
