// src/components/challenges/FeaturedChallengeCard/index.js
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Swiper from "react-native-deck-swiper";
import { fetchUserChallenges } from "../../../services/apis/challengeAPI";
import { useUser } from "../../../context/UserContext";
import { useHapticsUtils } from "../../../utils/haptics";
import AllChallengesComplete from "../AllChallengesComplete";
import styles from "./styles";

const MAX_ACTIVE = 5;

/**
 * FeaturedChallengeCard
 *
 * Swipeable deck of challenges. Locks when user already has 5 active.
 */
const FeaturedChallengeCard = ({
  onActivateChallenge,
  activeCount,
  onMaxActiveLimitReached,
}) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardIndex, setCardIndex] = useState(0);
  const [limitMessage, setLimitMessage] = useState(false);
  const { hapticSuccess, hapticError } = useHapticsUtils();
  const swiperRef = useRef(null);
  const { user } = useUser();

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        if (!user?.eco_id) {
          setChallenges([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        const data = await fetchUserChallenges(user.eco_id);

        const available = data.filter((c) => !c.isActive);
        const valid = available.filter((c) => {
          const num = parseInt(c.id.replace("CH", ""), 10);
          return !isNaN(num) && num >= 14;
        });

        setChallenges(valid);
      } catch (error) {
        console.error("[FeaturedChallengeCard] Failed to load challenges:", error);
      } finally {
        setLoading(false);
      }
    };
    loadChallenges();
  }, [user?.eco_id]);

  const handleSwipeRight = async (index) => {
    if (activeCount >= MAX_ACTIVE) {
      try {
        await hapticError();
      } catch {
        /* noop */
      }
      onMaxActiveLimitReached?.();
      setLimitMessage(true);
      const blocked = challenges[index];
      if (blocked) {
        const updated = challenges.filter((_, i) => i !== index);
        setChallenges([...updated, blocked]);
        setCardIndex(0);
      }
      return;
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
    try {
      await hapticError();
    } catch {
      /* noop */
    }
  };

  const resetLimitMessage = () => {
    if (limitMessage) setLimitMessage(false);
  };

  useEffect(() => {
    resetLimitMessage();
  }, [activeCount]);

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

  const isLocked = activeCount >= MAX_ACTIVE;

  if (!challenges.length) {
    return <AllChallengesComplete />;
  }

  return (
    <View style={{ alignItems: "center" }}>
      {isLocked ? (
        <View style={styles.lockedCard}>
          <MaterialIcons name="lock" size={32} color="#2E7D32" />
          <Text style={styles.lockedTitle}>All Slots Filled</Text>
          <Text style={styles.lockedSubtitle}>
            Complete a challenge to accept a new one.
          </Text>
        </View>
      ) : (
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
      )}

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

      {limitMessage && (
        <View style={styles.limitMessage}>
          <MaterialIcons name="info" size={18} color="#2563EB" />
          <Text style={styles.limitMessageText}>
            Complete a current challenge before adding another.
          </Text>
        </View>
      )}
    </View>
  );
};

export default FeaturedChallengeCard;
