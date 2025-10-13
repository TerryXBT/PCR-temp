/**
 * @file storage.ts
 * @description Centralized AsyncStorage service for user, persona, settings, challenges, and snapshots.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

type User = {
  eco_id: string;
  carbonPoints: number;
  daily: number;
  monthly: number;
  yearly: number;
  personaStage?: "leaf" | "sapling" | "tree";
};

type QuizAwardPayload = {
  ecoId: string;
  quizId: string;
  correct: number;
  total: number;
  awardedPoints: number;
  idempotencyKey: string;
  endpoint?: string;
};

type QuizCooldownMap = Record<string, number>;

class StorageService {
  // ---------- USER ----------
  /**
   * Get the full user object.
   * @returns {Promise<User | null>} Parsed user object or null if not found.
   */
  static async getUser(): Promise<User | null> {
    try {
      const json = await AsyncStorage.getItem("user");
      return json ? JSON.parse(json) : null;
    } catch (err) {
      console.error("[StorageService] getUser error:", err);
      return null;
    }
  }

  /**
   * Save the full user object.
   * @param {User} user - User object to persist.
   */
  static async setUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(user));
    } catch (err) {
      console.error("[StorageService] setUser error:", err);
    }
  }

  // ---------- CARBON POINTS ----------
  /**
   * Get carbon points from user object.
   * @returns {Promise<number>} Carbon points or 0 if not found.
   */
  static async getCarbonPoints(): Promise<number> {
    try {
      const user = await StorageService.getUser();
      return user?.carbonPoints ?? 0;
    } catch (err) {
      console.error("[StorageService] getCarbonPoints error:", err);
      return 0;
    }
  }

  /**
   * Update carbon points in user object.
   * @param {number} points - New carbon points value.
   */
  static async setCarbonPoints(points: number): Promise<void> {
    try {
      const user = (await StorageService.getUser()) || {
        eco_id: "",
        carbonPoints: 0,
        daily: 0,
        monthly: 0,
        yearly: 0,
      };
      user.carbonPoints = points;
      await StorageService.setUser(user);
    } catch (err) {
      console.error("[StorageService] setCarbonPoints error:", err);
    }
  }

  // ---------- PERSONA ----------
  /**
   * Get persona stage.
   * @returns {Promise<"leaf"|"sapling"|"tree"|null>} Persona stage or null.
   */
  static async getPersonaStage(): Promise<"leaf" | "sapling" | "tree" | null> {
    try {
      return (await AsyncStorage.getItem("personaStage")) as
        | "leaf"
        | "sapling"
        | "tree"
        | null;
    } catch (err) {
      console.error("[StorageService] getPersonaStage error:", err);
      return null;
    }
  }

  /**
   * Set persona stage.
   * @param {"leaf"|"sapling"|"tree"} stage - Persona stage to persist.
   */
  static async setPersonaStage(
    stage: "leaf" | "sapling" | "tree"
  ): Promise<void> {
    try {
      await AsyncStorage.setItem("personaStage", stage);
    } catch (err) {
      console.error("[StorageService] setPersonaStage error:", err);
    }
  }

  // ---------- ECO ID ----------
  static async getEcoId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("eco_id");
    } catch (err) {
      console.error("[StorageService] getEcoId error:", err);
      return null;
    }
  }

  static async setEcoId(ecoId: string): Promise<void> {
    try {
      await AsyncStorage.setItem("eco_id", ecoId);
    } catch (err) {
      console.error("[StorageService] setEcoId error:", err);
    }
  }

  // ---------- BASELINE ----------
  static async getBaseline(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("baseline");
    } catch (err) {
      console.error("[StorageService] getBaseline error:", err);
      return null;
    }
  }

  static async setBaseline(baseline: string): Promise<void> {
    try {
      await AsyncStorage.setItem("baseline", baseline);
    } catch (err) {
      console.error("[StorageService] setBaseline error:", err);
    }
  }

  // ---------- SETTINGS ----------
  static async getHapticsEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem("hapticsEnabled");
      return value === "true";
    } catch (err) {
      console.error("[StorageService] getHapticsEnabled error:", err);
      return false;
    }
  }

  static async setHapticsEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem("hapticsEnabled", String(enabled));
    } catch (err) {
      console.error("[StorageService] setHapticsEnabled error:", err);
    }
  }

  // ---------- CHALLENGES ----------
  static async getChallenges(): Promise<any | null> {
    try {
      const json = await AsyncStorage.getItem("challenges");
      return json ? JSON.parse(json) : null;
    } catch (err) {
      console.error("[StorageService] getChallenges error:", err);
      return null;
    }
  }

  static async setChallenges(challenges: any): Promise<void> {
    try {
      await AsyncStorage.setItem("challenges", JSON.stringify(challenges));
    } catch (err) {
      console.error("[StorageService] setChallenges error:", err);
    }
  }

  // ---------- MONTHLY SNAPSHOT ----------
  static async getMonthlySnapshot(): Promise<any | null> {
    try {
      const json = await AsyncStorage.getItem("monthlySnapshot");
      return json ? JSON.parse(json) : null;
    } catch (err) {
      console.error("[StorageService] getMonthlySnapshot error:", err);
      return null;
    }
  }

  static async setMonthlySnapshot(snapshot: any): Promise<void> {
    try {
      await AsyncStorage.setItem("monthlySnapshot", JSON.stringify(snapshot));
    } catch (err) {
      console.error("[StorageService] setMonthlySnapshot error:", err);
    }
  }

  // ---------- QUIZ AWARDS ----------
  static async getQuizAwardQueue(): Promise<QuizAwardPayload[]> {
    try {
      const raw = await AsyncStorage.getItem("quizAwardQueue");
      return raw ? (JSON.parse(raw) as QuizAwardPayload[]) : [];
    } catch (err) {
      console.error("[StorageService] getQuizAwardQueue error:", err);
      return [];
    }
  }

  static async setQuizAwardQueue(queue: QuizAwardPayload[]): Promise<void> {
    try {
      await AsyncStorage.setItem("quizAwardQueue", JSON.stringify(queue));
    } catch (err) {
      console.error("[StorageService] setQuizAwardQueue error:", err);
    }
  }

  static async enqueueQuizAward(payload: QuizAwardPayload): Promise<void> {
    try {
      const queue = await StorageService.getQuizAwardQueue();
      const deduped = queue.filter(
        (item) => item.idempotencyKey !== payload.idempotencyKey
      );
      deduped.push(payload);
      await StorageService.setQuizAwardQueue(deduped);
    } catch (err) {
      console.error("[StorageService] enqueueQuizAward error:", err);
    }
  }

  static async removeQuizAward(idempotencyKey: string): Promise<void> {
    try {
      const queue = await StorageService.getQuizAwardQueue();
      const filtered = queue.filter(
        (item) => item.idempotencyKey !== idempotencyKey
      );
      await StorageService.setQuizAwardQueue(filtered);
    } catch (err) {
      console.error("[StorageService] removeQuizAward error:", err);
    }
  }

  // ---------- QUIZ COOLDOWN ----------
  static async getQuizCooldownMap(): Promise<QuizCooldownMap> {
    try {
      const raw = await AsyncStorage.getItem("quizCooldowns");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch (err) {
      console.error("[StorageService] getQuizCooldownMap error:", err);
      return {};
    }
  }

  static async setQuizCooldownMap(map: QuizCooldownMap): Promise<void> {
    try {
      await AsyncStorage.setItem("quizCooldowns", JSON.stringify(map));
    } catch (err) {
      console.error("[StorageService] setQuizCooldownMap error:", err);
    }
  }

  static async getQuizCompletionTimestamp(quizId: string): Promise<number | null> {
    if (!quizId) return null;
    try {
      const map = await StorageService.getQuizCooldownMap();
      const value = map[quizId];
      return typeof value === "number" ? value : null;
    } catch (err) {
      console.error("[StorageService] getQuizCompletionTimestamp error:", err);
      return null;
    }
  }

  static async setQuizCompletionTimestamp(
    quizId: string,
    timestamp: number = Date.now()
  ): Promise<void> {
    if (!quizId) return;
    try {
      const map = await StorageService.getQuizCooldownMap();
      map[quizId] = timestamp;
      await StorageService.setQuizCooldownMap(map);
    } catch (err) {
      console.error("[StorageService] setQuizCompletionTimestamp error:", err);
    }
  }

  static async clearQuizCompletionTimestamp(quizId: string): Promise<void> {
    if (!quizId) return;
    try {
      const map = await StorageService.getQuizCooldownMap();
      if (map[quizId] !== undefined) {
        delete map[quizId];
        await StorageService.setQuizCooldownMap(map);
      }
    } catch (err) {
      console.error("[StorageService] clearQuizCompletionTimestamp error:", err);
    }
  }

  static async isQuizOnCooldown(
    quizId: string,
    windowMs: number = 24 * 60 * 60 * 1000
  ): Promise<boolean> {
    if (!quizId) return false;
    try {
      const timestamp = await StorageService.getQuizCompletionTimestamp(quizId);
      if (!timestamp) return false;
      const elapsed = Date.now() - timestamp;
      if (elapsed < windowMs) {
        return true;
      }
      await StorageService.clearQuizCompletionTimestamp(quizId);
      return false;
    } catch (err) {
      console.error("[StorageService] isQuizOnCooldown error:", err);
      return false;
    }
  }

  // ---------- FLAGS ----------
  static async getHasSeenSwipeOverlay(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem("hasSeenSwipeOverlay");
      return value === "true";
    } catch (err) {
      console.error("[StorageService] getHasSeenSwipeOverlay error:", err);
      return false;
    }
  }

  static async setHasSeenSwipeOverlay(seen: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem("hasSeenSwipeOverlay", String(seen));
    } catch (err) {
      console.error("[StorageService] setHasSeenSwipeOverlay error:", err);
    }
  }

  // ---------- CLEAR ----------
  /**
   * Clear only user-related data (eco_id, user, baseline, personaStage, challenges, monthlySnapshot).
   */
  static async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        "user",
        "eco_id",
        "baseline",
        "personaStage",
        "challenges",
        "monthlySnapshot",
        "quizAwardQueue",
        "quizCooldowns",
      ]);
    } catch (err) {
      console.error("[StorageService] clearUserData error:", err);
    }
  }

  /**
   * Clear entire AsyncStorage.
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (err) {
      console.error("[StorageService] clearAll error:", err);
    }
  }
}

export default StorageService;
