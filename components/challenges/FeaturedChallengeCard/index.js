// src/components/challenges/FeaturedChallengeCard/index.js
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Swiper from "react-native-deck-swiper";
import { fetchUserChallenges } from "../../../services/apis/challengeAPI";
import StorageService from "../../../services/storage";
import { useHapticsUtils } from "../../../utils/haptics";
import AllChallengesComplete from "../AllChallengesComplete";
import styles from "./styles";

/**
 * FeaturedChallengeCard
 *
 * Swipeable deck of challenges.
 * Shows loading state while fetching.
 * Shows AllChallengesComplete when no challenges remain.
 *
 * @param {object} props
 * @param {(challenge: object) => void} props.onActivateChallenge
 * @param {number} props.activeCount
 * @returns {JSX.Element}
 */
const FeaturedChallengeCard = ({ onActivateChallenge, activeCount }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardIndex, setCardIndex] = useState(0);
  const { hapticSuccess, hapticError } = useHapticsUtils();
  const swiperRef = useRef(null);

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        const user = await StorageService.getUser();
        if (!user?.eco_id) return;
        const data = await fetchUserChallenges(user.eco_id);

        // Do not surface challenges the user already activated.
        const available = data.filter((c) => !c.isActive);

        // Temporary filter: only allow CH14 and above (backend bug with CH1–CH13)
        const valid = available.filter((c) => {
          const num = parseInt(c.id.replace("CH", ""), 10);
          return !isNaN(num) && num >= 14;
        });

        console.log(
          "[FeaturedChallengeCard] Fetched challenges:",
          data.map((c) => c.id)
        );
        console.log(
          "[FeaturedChallengeCard] Filtered to valid challenges:",
          valid.map((c) => c.id)
        );

        setChallenges(valid);
      } catch (error) {
        console.error(
          "[FeaturedChallengeCard] Failed to load challenges:",
          error
        );
      } finally {
        setLoading(false);
      }
    };
    loadChallenges();
  }, []);

  const handleSwipeRight = async (index) => {
    if (activeCount >= 5) {
      const blocked = challenges[index];
      if (blocked) {
        const updated = challenges.filter((_, i) => i !== index);
        setChallenges([...updated, blocked]);
        setCardIndex(0);
        await hapticError();
        return;
      }
    }
    const activated = challenges[index];
    if (!activated) return;
    const updated = challenges.filter((_, i) => i !== index);
    setChallenges(updated);
    setCardIndex(0);
    if (updated.length === 0) {
      return;
    }
    await hapticSuccess();
    onActivateChallenge?.(activated);
  };

  const handleSwipeLeft = async (index) => {
    const skipped = challenges[index];
    if (!skipped) return;
    const updated = challenges.filter((_, i) => i !== index);
    setChallenges([...updated, skipped]);
    setCardIndex(0);
    await hapticError();
  };

  if (loading) {
    return (
      <View
        style={{ height: 320, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={{ marginTop: 8, color: "#6B7280" }}>
          Loading challenges…
        </Text>
      </View>
    );
  }

  if (!challenges.length) {
    return <AllChallengesComplete />;
  }

  return (
    <View style={{ alignItems: "center" }}>
      <Swiper
        ref={swiperRef}
        key={challenges.map((c) => c.id).join("-")}
        cards={challenges}
        cardIndex={cardIndex}
        onSwipedRight={handleSwipeRight}
        onSwipedLeft={handleSwipeLeft}
        onSwipedAll={() => setChallenges([])}
        disableTopSwipe
        disableBottomSwipe
        verticalSwipe={false}
        backgroundColor="transparent"
        containerStyle={{ width: "100%", height: 320 }}
        cardStyle={{ width: "90%", alignSelf: "center", borderRadius: 16 }}
        stackSize={3}
        stackSeparation={15}
        animateCardOpacity
        renderCard={(challenge) =>
          challenge && (
            <LinearGradient
              colors={["#22C55E", "#16A34A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.topRow}>
                <View style={styles.iconWrapper}>
                  <MaterialIcons
                    name={challenge.icon || "eco"}
                    size={24}
                    color="white"
                  />
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Featured</Text>
                </View>
              </View>

              <Text style={styles.title}>{challenge.title}</Text>
              <Text
                style={styles.subtitle}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {challenge.description}
              </Text>

              <View style={styles.rewardsRow}>
                <View style={styles.rewardPill}>
                  <MaterialIcons name="emoji-events" size={18} color="gold" />
                  <Text style={styles.rewardText}>
                    +{challenge.rewards.points} points
                  </Text>
                </View>
                {challenge.rewards.badge && (
                  <View style={styles.rewardPill}>
                    <MaterialIcons
                      name="military-tech"
                      size={18}
                      color="gold"
                    />
                    <Text style={styles.rewardText}>
                      {challenge.rewards.badge} badge
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          )
        }
      />

      {/* Instructional hints */}
      <View style={styles.swipeHints}>
        <View style={styles.hintLeft}>
          <MaterialIcons name="arrow-back" size={20} color="#EF4444" />
          <Text style={styles.hintText}>Swipe left to skip</Text>
        </View>
        <View style={styles.hintRight}>
          <Text style={styles.hintText}>Swipe right to accept</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#22C55E" />
        </View>
      </View>
    </View>
  );
};

export default FeaturedChallengeCard;
