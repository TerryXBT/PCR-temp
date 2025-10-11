/**
 * @fileoverview Intro/onboarding screen with swipeable slides.
 * Shows first-time users a visual introduction to the app's features.
 */

import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { setSeenIntro } from "../../lib/storage/firstRun";
import colors from "../../theme/colors";
import { useHapticsUtils } from "../../utils/haptics";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Track Your Impact",
    description:
      "Monitor your carbon footprint and see how your daily choices make a difference.",
    image: require("../../assets/intro/tracking(2).svg"),
  },
  {
    id: "2",
    title: "Take Challenges",
    description:
      "Join eco-friendly challenges and earn points while making the planet greener.",
    image: require("../../assets/intro/challenges.svg"),
  },
  {
    id: "3",
    title: "Learn & Grow",
    description:
      "Discover sustainable tips and grow your eco-persona from leaf to tree.",
    image: require("../../assets/intro/learn&grow.svg"),
  },
];

/**
 * IntroPage renders a swipeable onboarding flow.
 *
 * @component
 * @returns {JSX.Element} Intro screen with slides and navigation.
 */
export default function IntroPage() {
  const router = useRouter();
  const { hapticPress } = useHapticsUtils();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const skipTopOffset = Math.max((insets.top || 0) + 12, 40);

  const handleNext = async () => {
    await hapticPress();
    if (isLastSlide) {
      await setSeenIntro(true);
      router.replace("/");
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const handleSkip = async () => {
    await hapticPress();
    await setSeenIntro(true);
    router.replace("/");
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {SLIDES.map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index === currentIndex && styles.activeDot]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Skip button */}
      {!isLastSlide && (
        <TouchableOpacity
          style={[
            styles.skipButton,
            { top: skipTopOffset },
          ]}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Pagination dots */}
      {renderPagination()}

      {/* Next/Get Started button */}
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {isLastSlide ? "Get Started" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  image: {
    width: width * 0.7,
    height: height * 0.4,
    marginBottom: 40,
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral.gray300,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.eco.green[600],
    width: 24,
  },
  button: {
    marginHorizontal: 40,
    marginBottom: 60,
    backgroundColor: colors.eco.green[600],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.neutral.white,
  },
});
