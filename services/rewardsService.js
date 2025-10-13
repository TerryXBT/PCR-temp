import AsyncStorage from "@react-native-async-storage/async-storage";
import logger from "../utils/logger";
import { fetchRewardsMapping } from "./apis/rewardsAPI";

const DEFAULT_MAPPING = {
  diet: { daily_log: 5 },
  shopping: { daily_log: 5 },
  transport: { daily_log: 5 },
  energy: { monthly_log: 100 },
};

const STORAGE_KEYS = {
  mapping: "rewards:mapping",
  daily: "rewards:lastAwardedDaily",
  monthly: "rewards:lastAwardedMonthly",
};

let inMemoryMapping = null;
let inflightPromise = null;
let dailyCache = null;
let monthlyCache = null;

const readJSON = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.warn(`[rewards] failed reading ${key}:`, error);
    return null;
  }
};

const writeJSON = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.warn(`[rewards] failed writing ${key}:`, error);
  }
};

const loadAwardCache = async (type) => {
  if (type === "daily") {
    if (dailyCache) return dailyCache;
    dailyCache = (await readJSON(STORAGE_KEYS.daily)) || {};
    return dailyCache;
  }
  if (monthlyCache) return monthlyCache;
  monthlyCache = (await readJSON(STORAGE_KEYS.monthly)) || {};
  return monthlyCache;
};

const persistAwardCache = async (type, data) => {
  if (type === "daily") {
    dailyCache = data;
    await writeJSON(STORAGE_KEYS.daily, data);
    return;
  }
  monthlyCache = data;
  await writeJSON(STORAGE_KEYS.monthly, data);
};

const applyOverrides = (mapping) => {
  const override = globalThis?.__VERDE_REWARDS_OVERRIDE__;
  if (!override || typeof override !== "object") return mapping;
  return {
    ...mapping,
    ...override,
  };
};

const mergeMapping = (remote, fallback) => {
  const result = { ...fallback };
  Object.entries(remote || {}).forEach(([category, actions]) => {
    if (!result[category]) result[category] = {};
    Object.entries(actions || {}).forEach(([action, points]) => {
      result[category][action] = points;
    });
  });
  return result;
};

export const DEFAULT_REWARD_MAPPING = { ...DEFAULT_MAPPING };

export const loadRewardsMapping = async (ecoId, { forceRefresh = false } = {}) => {
  if (inMemoryMapping && !forceRefresh) {
    return { ...inMemoryMapping };
  }

  if (!forceRefresh && inflightPromise) {
    await inflightPromise;
    return { ...inMemoryMapping };
  }

  inflightPromise = (async () => {
    if (!forceRefresh && !inMemoryMapping) {
      const cached = await readJSON(STORAGE_KEYS.mapping);
      if (cached) {
        inMemoryMapping = mergeMapping(applyOverrides(cached), DEFAULT_MAPPING);
        logger.info("[rewards] loaded mapping from cache");
        inflightPromise = null;
        return;
      }
    }

    try {
      const fetched = await fetchRewardsMapping({ ecoId, skipAuth: !ecoId });
      inMemoryMapping = mergeMapping(applyOverrides(fetched), DEFAULT_MAPPING);
      await writeJSON(STORAGE_KEYS.mapping, inMemoryMapping);
      logger.info(
        "[rewards] mapping loaded:",
        JSON.stringify(inMemoryMapping)
      );
    } catch (error) {
      logger.warn("[rewards] falling back to default mapping:", error);
      if (!inMemoryMapping) {
        inMemoryMapping = { ...DEFAULT_MAPPING };
      }
    } finally {
      inflightPromise = null;
    }
  })();

  await inflightPromise;
  return { ...inMemoryMapping };
};

export const getRewardPoints = async (category, action, options = {}) => {
  const mapping = await loadRewardsMapping(options.ecoId, options);
  const categoryKey = String(category || "").toLowerCase();
  const actionKey = String(action || "").toLowerCase();
  return mapping?.[categoryKey]?.[actionKey] ?? 0;
};

export const canAwardToday = async (category, dateKey) => {
  const cache = await loadAwardCache("daily");
  const key = String(category || "").toLowerCase();
  return cache[key] !== dateKey;
};

export const markAwardedToday = async (category, dateKey) => {
  const cache = await loadAwardCache("daily");
  const key = String(category || "").toLowerCase();
  cache[key] = dateKey;
  await persistAwardCache("daily", cache);
};

export const canAwardThisMonth = async (category, monthKey) => {
  const cache = await loadAwardCache("monthly");
  const key = String(category || "").toLowerCase();
  return cache[key] !== monthKey;
};

export const markAwardedThisMonth = async (category, monthKey) => {
  const cache = await loadAwardCache("monthly");
  const key = String(category || "").toLowerCase();
  cache[key] = monthKey;
  await persistAwardCache("monthly", cache);
};

export const resetRewardStateForTests = async () => {
  inMemoryMapping = null;
  inflightPromise = null;
  dailyCache = {};
  monthlyCache = {};
  await AsyncStorage.removeItem(STORAGE_KEYS.mapping);
  await AsyncStorage.removeItem(STORAGE_KEYS.daily);
  await AsyncStorage.removeItem(STORAGE_KEYS.monthly);
};

export default {
  loadRewardsMapping,
  getRewardPoints,
  canAwardToday,
  markAwardedToday,
  canAwardThisMonth,
  markAwardedThisMonth,
};
