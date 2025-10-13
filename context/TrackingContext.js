import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useUser } from "./UserContext";
import { logAnalyticsEvent } from "../utils/analytics";
import {
  longTermActivities as baseLongTermActivities,
  todaysActivities as baseTodaysActivities,
  weeklyImpact as baseWeeklyImpact,
} from "../services/trackingData";
import {
  fetchDailySnapshot,
  fetchUserBaseline,
  fetchWeeklySnapshot,
  submitTrackingActivity,
} from "../services/apis/trackingAPI";
import {
  DEFAULT_REWARD_MAPPING,
  loadRewardsMapping,
  getRewardPoints,
  canAwardToday as rewardsCanAwardToday,
  markAwardedToday as rewardsMarkAwardedToday,
  canAwardThisMonth as rewardsCanAwardThisMonth,
  markAwardedThisMonth as rewardsMarkAwardedThisMonth,
} from "../services/rewardsService";
import logger from "../utils/logger";

const TrackingContext = createContext(null);

const HOBART_TZ = "Australia/Hobart";
const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CATEGORY_KEYS = {
  transport: "Transport",
  meals: "Meals",
  shopping: "Shopping",
  energy: "Energy",
};

const SNAPSHOT_KEY_TO_TITLE = {
  transport: CATEGORY_KEYS.transport,
  meals: CATEGORY_KEYS.meals,
  shopping: CATEGORY_KEYS.shopping,
  energy: CATEGORY_KEYS.energy,
};

const REWARD_DB_KEYS = {
  transport: "transport",
  meals: "diet",
  shopping: "shopping",
  energy: "energy",
};

const REWARD_ACTIONS = {
  daily: "daily_log",
  monthly: "monthly_log",
};

const TRANSPORT_LABELS = {
  "diesel-car": "Diesel car",
  "petrol-car": "Petrol car",
  "electric-car": "Electric car",
  "plug-in-hybrid": "Plug-in hybrid",
  motorbike: "Motorbike",
  "short-haul-flight": "Short-haul flight",
  "long-haul-flight": "Long-haul flight",
  train: "Train",
  bus: "Bus",
  bike: "Bike",
  "on-foot": "On Foot",
};

const TRANSPORT_IMPACT_FACTORS = {
  "diesel-car": 0.27,
  "petrol-car": 0.24,
  "electric-car": 0.08,
  "plug-in-hybrid": 0.12,
  motorbike: 0.18,
  "short-haul-flight": 0.38,
  "long-haul-flight": 0.45,
  train: 0.09,
  bus: 0.07,
  bike: 0,
  "on-foot": 0,
};

const DEFAULT_TRANSPORT_FACTOR = 0.12;

const MEAL_DIET_FACTORS = {
  vegan: 0.3,
  vegetarian: 0.5,
  flexitarian: 0.8,
  omnivore: 1.0,
  "heavy-meat": 1.6,
};

const MEAL_ITEM_ADJUSTMENTS = {
  "plant-based": -0.1,
  seafood: 0.2,
  dairy: 0.15,
  poultry: 0.25,
  "red-meat": 0.45,
  dessert: 0.1,
};

const MEAL_ITEM_LABELS = {
  "plant-based": "Plant-based",
  seafood: "Seafood",
  dairy: "Dairy",
  poultry: "Poultry",
  "red-meat": "Red meat",
  dessert: "Dessert",
};

const DEFAULT_MEAL_FACTOR = 0.9;
const SHOPPING_EMISSION_FACTOR = 0.0018;
const ENERGY_EMISSION_FACTORS = {
  electricity: 0.00042,
  gas: 0.00053,
};

const formatPositive = (value) => `+${value.toFixed(1)} kg CO₂`;
const formatCurrency = (value) => `$${value.toFixed(2)}`;
const clampToStep = (value) => parseFloat(value.toFixed(1));

const TITLE_TO_SNAPSHOT_KEY = Object.entries(SNAPSHOT_KEY_TO_TITLE).reduce(
  (accumulator, [snapshotKey, title]) => {
    accumulator[title] = snapshotKey;
    return accumulator;
  },
  {}
);

const formatSnapshotValue = (value) => (value > 0 ? formatPositive(value) : "+0 kg CO₂");

const getDatePartsInTimeZone = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const partValue = (type) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: partValue("year"),
    month: partValue("month"),
    day: partValue("day"),
  };
};

const getWeekdayLabelInTimeZone = (date, timeZone) =>
  new Intl.DateTimeFormat("en-AU", { timeZone, weekday: "short" }).format(date);

const formatDateKey = (parts) => `${parts.year}-${parts.month}-${parts.day}`;

const buildWeekTemplate = () => {
  const now = new Date();
  const currentLabel = getWeekdayLabelInTimeZone(now, HOBART_TZ);
  const offset = WEEKDAY_ORDER.indexOf(currentLabel);
  const template = [];

  for (let i = 0; i < WEEKDAY_ORDER.length; i += 1) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() + (i - offset));
    date.setUTCHours(0, 0, 0, 0);

    const parts = getDatePartsInTimeZone(date, HOBART_TZ);
    template.push({
      dateKey: formatDateKey(parts),
      label: WEEKDAY_ORDER[i],
      value: 0,
    });
  }

  return template;
};

const buildRollingTrendFromValues = (values = []) => {
  const totalDays = 7;
  const trimmed = Array.isArray(values) ? values.slice(-totalDays) : [];
  const padding = Math.max(totalDays - trimmed.length, 0);
  const normalizedValues = [
    ...Array.from({ length: padding }, () => 0),
    ...trimmed,
  ];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setUTCDate(today.getUTCDate() - (totalDays - 1));

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    date.setUTCHours(0, 0, 0, 0);
    const rawValue = Number(normalizedValues[index]);
    const safeValue = Number.isNaN(rawValue) ? 0 : rawValue;

    const parts = getDatePartsInTimeZone(date, HOBART_TZ);
    const label = getWeekdayLabelInTimeZone(date, HOBART_TZ);

    return {
      dateKey: formatDateKey(parts),
      label,
      day: label,
      value: clampToStep(safeValue),
    };
  });
};

const computeWeeklyImpactFromSnapshot = (snapshot = [], previous = {}) => {
  const baseline = previous?.baseline ?? baseWeeklyImpact.baseline ?? 0;
  const previousTrend = Array.isArray(previous?.trend)
    ? previous.trend
    : buildRollingTrendFromValues();
  const template = buildRollingTrendFromValues(snapshot);

  const mergedTrend = template.map((point) => {
    const prior =
      previousTrend.find((item) => item.dateKey === point.dateKey) ?? null;
    const mergedValue = clampToStep(
      Math.max(point.value ?? 0, prior?.value ?? 0)
    );

    return {
      ...point,
      value: mergedValue,
    };
  });

  const total = clampToStep(
    mergedTrend.reduce((sum, point) => sum + (point.value ?? 0), 0)
  );
  const saved = clampToStep(Math.max(baseline - total, 0));

  return {
    ...previous,
    baseline,
    trend: mergedTrend,
    total,
    saved,
    emitted: total,
  };
};

const mergeTrendWithTemplate = (baseTrend = []) => {
  const template = buildWeekTemplate();

  if (!Array.isArray(baseTrend) || baseTrend.length === 0) {
    return template;
  }

  return template.map((entry) => {
    const match =
      baseTrend.find((item) => item.dateKey === entry.dateKey) ||
      baseTrend.find((item) => item.day === entry.label);

    return {
      ...entry,
      value: clampToStep(match?.value ?? 0),
    };
  });
};

const getTodayInfo = () => {
  const now = new Date();
  const parts = getDatePartsInTimeZone(now, HOBART_TZ);
  return {
    dateKey: formatDateKey(parts),
    label: getWeekdayLabelInTimeZone(now, HOBART_TZ),
  };
};

const buildTransportSummary = (entries) => {
  const segments = Object.entries(entries)
    .map(([transportId, distanceValue]) => {
      const parsedDistance = parseFloat(distanceValue);

      if (Number.isNaN(parsedDistance) || parsedDistance <= 0) {
        return null;
      }

      const label = TRANSPORT_LABELS[transportId] ?? transportId;
      const factor = TRANSPORT_IMPACT_FACTORS[transportId] ?? DEFAULT_TRANSPORT_FACTOR;
      const distanceText = `${clampToStep(parsedDistance)}km`;

      return factor === 0
        ? `${label} ${distanceText} • 0 kg CO₂`
        : `${label} ${distanceText}`;
    })
    .filter(Boolean);

  if (!segments.length) {
    return "Log your first transport activity.";
  }

  return segments.join(" • ");
};

const buildMealSummary = ({ dietLabel, selectedItems, spending }) => {
  const displayItems = (selectedItems ?? [])
    .map((item) => MEAL_ITEM_LABELS[item] ?? item)
    .join(" • ");

  const parts = [dietLabel];

  if (displayItems) {
    parts.push(displayItems);
  }

  parts.push(formatCurrency(spending));

  return parts.join(" • ");
};

const getAnalyticsTimestamp = () =>
  new Date().toLocaleString("en-AU", { timeZone: HOBART_TZ });

const getMonthInfo = () => {
  const now = new Date();
  const parts = getDatePartsInTimeZone(now, HOBART_TZ);
  const monthFormatter = new Intl.DateTimeFormat('en-AU', { timeZone: HOBART_TZ, month: 'long', year: 'numeric' });

  return {
    monthKey: `${parts.year}-${parts.month}`,
    label: monthFormatter.format(now),
  };
};

export const TrackingProvider = ({ children }) => {
  const { user, addCarbonPoints } = useUser();

  const [weeklyImpact, setWeeklyImpact] = useState(() => {
    const baseline = baseWeeklyImpact.baseline ?? 0;
    const template = mergeTrendWithTemplate(baseWeeklyImpact.trend);
    const total = clampToStep(template.reduce((sum, point) => sum + (point.value ?? 0), 0));
    const saved = clampToStep(Math.max(baseline - total, 0));

    return {
      baseline,
      previous: baseWeeklyImpact.previous ?? 0,
      emitted: baseWeeklyImpact.emitted ?? 0,
      trend: template,
      total,
      saved,
    };
  });

  const [todaysActivities, setTodaysActivities] = useState(() =>
    (baseTodaysActivities ?? []).map((activity) => ({ ...activity }))
  );

  const [longTermActivities, setLongTermActivities] = useState(() =>
    (baseLongTermActivities ?? []).map((activity) => ({ ...activity }))
  );

  const categoryTotalsRef = useRef({
    [CATEGORY_KEYS.transport]: 0,
    [CATEGORY_KEYS.meals]: 0,
    [CATEGORY_KEYS.shopping]: 0,
  });

  const categoryDayRef = useRef({
    [CATEGORY_KEYS.transport]: null,
    [CATEGORY_KEYS.meals]: null,
    [CATEGORY_KEYS.shopping]: null,
  });

  const shoppingSpendRef = useRef(0);
  const shoppingSpendDayRef = useRef(null);
  const [energyRecord, setEnergyRecord] = useState(null);
  const [rewardMapping, setRewardMapping] = useState({
    ...DEFAULT_REWARD_MAPPING,
  });

  const applyDailySnapshotToActivities = useCallback((totals = {}) => {
    setTodaysActivities((previous) =>
      previous.map((activity) => {
        const snapshotKey = TITLE_TO_SNAPSHOT_KEY[activity.title];
        if (!snapshotKey || !(snapshotKey in totals)) {
          return activity;
        }

        const snapshotValue = Number(totals[snapshotKey]) || 0;
        return {
          ...activity,
          value: formatSnapshotValue(snapshotValue),
        };
      })
    );

    setLongTermActivities((previous) =>
      previous.map((activity) => {
        const snapshotKey = TITLE_TO_SNAPSHOT_KEY[activity.title];
        if (!snapshotKey || !(snapshotKey in totals)) {
          return activity;
        }

        const snapshotValue = Number(totals[snapshotKey]) || 0;
        return {
          ...activity,
          value: formatSnapshotValue(snapshotValue),
        };
      })
    );
  }, []);

  const applySnapshotToWeeklyImpact = useCallback((snapshot) => {
    setWeeklyImpact((previous) =>
      computeWeeklyImpactFromSnapshot(snapshot, previous)
    );
  }, []);

  const applyBaselineToWeeklyImpact = useCallback((baselineValue) => {
    if (baselineValue == null || Number.isNaN(Number(baselineValue))) {
      return;
    }

    const numericBaseline = Math.max(Number(baselineValue), 0);

    setWeeklyImpact((previous) => {
      const total = clampToStep(
        (previous?.trend ?? []).reduce(
          (sum, point) => sum + (point.value ?? 0),
          0
        )
      );
      const saved = clampToStep(Math.max(numericBaseline - total, 0));

      return {
        ...(previous ?? {}),
        baseline: numericBaseline,
        saved,
      };
    });
  }, []);

  useEffect(() => {
    if (!user?.eco_id) return;

    let isActive = true;

    const loadSnapshots = async () => {
      try {
        const snapshot = await fetchWeeklySnapshot(user.eco_id);
        if (!isActive) return;

        applySnapshotToWeeklyImpact(snapshot);
      } catch (error) {
        logger.error("[TrackingContext] Failed to fetch weekly snapshot:", error);
      }

      try {
        const daily = await fetchDailySnapshot(user.eco_id);
        if (!isActive) return;

        applyDailySnapshotToActivities(daily?.totals_kg ?? {});
      } catch (error) {
        logger.error("[TrackingContext] Failed to fetch daily snapshot:", error);
      }

      try {
        const baseline = await fetchUserBaseline(user.eco_id);
        if (!isActive) return;

        applyBaselineToWeeklyImpact(baseline?.user_baseline_weekly);
      } catch (error) {
        logger.error("[TrackingContext] Failed to fetch user baseline:", error);
      }
    };

    loadSnapshots();

    return () => {
      isActive = false;
    };
  }, [
    applyBaselineToWeeklyImpact,
    applyDailySnapshotToActivities,
    applySnapshotToWeeklyImpact,
    user?.eco_id,
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadMappingSafely = async () => {
      try {
        const mapping = await loadRewardsMapping(user?.eco_id);
        if (isMounted && mapping) {
          setRewardMapping(mapping);
        }
      } catch (error) {
        logger.warn("[TrackingContext] Unable to load rewards mapping:", error);
      }
    };

    loadMappingSafely();

    return () => {
      isMounted = false;
    };
  }, [user?.eco_id]);

  const refreshWeeklyImpact = useCallback(async () => {
    if (!user?.eco_id) {
      return null;
    }

    try {
      const snapshot = await fetchWeeklySnapshot(user.eco_id);
      applySnapshotToWeeklyImpact(snapshot);
      return snapshot;
    } catch (error) {
      logger.error("[TrackingContext] Unable to refresh weekly snapshot:", error);
      throw error;
    }
  }, [applySnapshotToWeeklyImpact, user?.eco_id]);

  const refreshBaseline = useCallback(async () => {
    if (!user?.eco_id) {
      return null;
    }

    try {
      const baseline = await fetchUserBaseline(user.eco_id);
      applyBaselineToWeeklyImpact(baseline?.user_baseline_weekly);
      return baseline;
    } catch (error) {
      logger.error("[TrackingContext] Unable to refresh user baseline:", error);
      throw error;
    }
  }, [applyBaselineToWeeklyImpact, user?.eco_id]);

  const refreshDailySnapshot = useCallback(async () => {
    if (!user?.eco_id) {
      return null;
    }

    try {
      const snapshot = await fetchDailySnapshot(user.eco_id);
      applyDailySnapshotToActivities(snapshot?.totals_kg ?? {});
      return snapshot;
    } catch (error) {
      logger.error("[TrackingContext] Unable to refresh daily snapshot:", error);
      throw error;
    }
  }, [applyDailySnapshotToActivities, user?.eco_id]);

const applyImpactToTrend = useCallback((impact, dayInfo) => {
  let dayTotal = 0;

  setWeeklyImpact((previous) => {
      const updatedTrend = previous.trend.map((point) => {
        if (point.dateKey !== dayInfo.dateKey) {
          return point;
        }

        const value = clampToStep((point.value ?? 0) + impact);
        dayTotal = value;
        return { ...point, value };
      });

      const total = clampToStep(updatedTrend.reduce((sum, point) => sum + point.value, 0));
      const saved = clampToStep(Math.max(previous.baseline - total, 0));

      return {
        ...previous,
        trend: updatedTrend,
        total,
        saved,
        emitted: total,
      };
    });

    return dayTotal;
  }, []);

  const ensureWeekData = useCallback((dayInfo) => {
    let initialized = false;

    setWeeklyImpact((previous) => {
      const trend = Array.isArray(previous?.trend) ? previous.trend : [];
      const hasDay = trend.some((point) => point.dateKey === dayInfo.dateKey);

      if (hasDay) {
        return previous;
      }

      initialized = true;

      const sortedValues = trend
        .slice()
        .sort((a, b) => (a.dateKey ?? "").localeCompare(b.dateKey ?? ""))
        .map((point) => Number(point.value ?? 0));

      const extendedValues = [
        ...sortedValues.slice(-6),
        0, // Seed today with zero before updates
      ];

      const updatedTrend = buildRollingTrendFromValues(extendedValues);
      const total = clampToStep(
        updatedTrend.reduce((sum, point) => sum + (point.value ?? 0), 0)
      );
      const baseline = previous?.baseline ?? baseWeeklyImpact.baseline ?? 0;
      const saved = clampToStep(Math.max(baseline - total, 0));

      return {
        ...previous,
        previous: previous?.total ?? 0,
        trend: updatedTrend,
        total,
        saved,
        emitted: total,
      };
    });

    if (initialized) {
      Object.keys(categoryDayRef.current).forEach((key) => {
        categoryDayRef.current[key] = null;
        categoryTotalsRef.current[key] = 0;
      });
      shoppingSpendRef.current = 0;
      shoppingSpendDayRef.current = null;
    }
  }, []);

  const ensureDailyReset = useCallback((categoryKey, dayInfo) => {
    if (categoryDayRef.current[categoryKey] === dayInfo.dateKey) {
      return;
    }

    categoryDayRef.current[categoryKey] = dayInfo.dateKey;
    categoryTotalsRef.current[categoryKey] = 0;

    if (categoryKey === CATEGORY_KEYS.shopping) {
      shoppingSpendRef.current = 0;
      shoppingSpendDayRef.current = dayInfo.dateKey;

      setLongTermActivities((previous) =>
        previous.map((activity) =>
          activity.title === CATEGORY_KEYS.shopping
            ? {
                ...activity,
                value: "+0 kg CO₂",
                description: "Track mindful purchases",
              }
            : activity
        )
      );
    }

    if (categoryKey === CATEGORY_KEYS.transport || categoryKey === CATEGORY_KEYS.meals) {
      setTodaysActivities((previous) =>
        previous.map((activity) =>
          activity.title === categoryKey
            ? {
                ...activity,
                value: "+0 kg CO₂",
              }
            : activity
        )
      );
    }
  }, []);

  const updateLongTermActivity = useCallback((title, updater) => {
    setLongTermActivities((previous) =>
      previous.map((activity) =>
        activity.title === title ? updater(activity) : activity
      )
    );
  }, []);

  /**
   * Helper function to submit activity data to backend API.
   * @param {string} activityName - Activity type (transport, diet, shopping, energy)
   * @param {Object} items - Activity items to submit
   * @returns {Promise<void>}
   */
  const submitActivityToBackend = useCallback(
    async (activityName, items) => {
      if (!user?.eco_id) {
        logger.warn("[TrackingContext] No eco_id available, skipping API call");
        return;
      }

      try {
        await submitTrackingActivity(user.eco_id, {
          activity_name: activityName,
          items,
        });
        logger.info(`[TrackingContext] Successfully submitted ${activityName} activity`);
      } catch (error) {
        logger.error(`[TrackingContext] Failed to submit ${activityName} activity:`, error);
        return;
      }

      try {
        await refreshWeeklyImpact();
      } catch (error) {
        // Already logged inside refreshWeeklyImpact; keep UI usable even if refresh fails.
      }

      try {
        await refreshDailySnapshot();
      } catch (error) {
        // Already logged inside refreshDailySnapshot; do not block user flow.
      }

      try {
        await refreshBaseline();
      } catch (error) {
        // Already logged inside refreshBaseline.
      }
    },
    [refreshBaseline, refreshDailySnapshot, refreshWeeklyImpact, user?.eco_id]
  );

  const logTransportActivity = useCallback(
    async (entries) => {
      const dayInfo = getTodayInfo();
      ensureWeekData(dayInfo);
      ensureDailyReset(CATEGORY_KEYS.transport, dayInfo);

      const impact = clampToStep(
        Object.entries(entries).reduce((runningTotal, [transportId, distanceValue]) => {
          const parsedDistance = parseFloat(distanceValue);

          if (Number.isNaN(parsedDistance) || parsedDistance <= 0) {
            return runningTotal;
          }

          const factor = TRANSPORT_IMPACT_FACTORS[transportId] ?? DEFAULT_TRANSPORT_FACTOR;
          return runningTotal + parsedDistance * factor;
        }, 0)
      );

      const summary = buildTransportSummary(entries);
      applyImpactToTrend(impact, dayInfo);

      const previousTotal = categoryTotalsRef.current[CATEGORY_KEYS.transport] ?? 0;
      const categoryTotal = clampToStep(previousTotal + impact);
      categoryTotalsRef.current[CATEGORY_KEYS.transport] = categoryTotal;

      setTodaysActivities((previousActivities) =>
        previousActivities.map((activity) => {
          if (activity.title !== CATEGORY_KEYS.transport) {
            return activity;
          }

          return {
            ...activity,
            value: categoryTotal > 0 ? formatPositive(categoryTotal) : activity.value,
            description: summary,
          };
        })
      );

      let pointsAwarded = 0;
      let awarded = false;
      let awardError = false;

      try {
        const rewardCategory = REWARD_DB_KEYS.transport;
        const canAward = await rewardsCanAwardToday(
          rewardCategory,
          dayInfo.dateKey
        );

        if (canAward) {
          const pointsValue = await getRewardPoints(
            rewardCategory,
            REWARD_ACTIONS.daily,
            { ecoId: user?.eco_id }
          );

          if (pointsValue > 0) {
            await addCarbonPoints(pointsValue);
            await rewardsMarkAwardedToday(rewardCategory, dayInfo.dateKey);
            logAnalyticsEvent("points_awarded", {
              category: rewardCategory,
              points: pointsValue,
              dateLocal: getAnalyticsTimestamp(),
            });
            pointsAwarded = pointsValue;
            awarded = true;
          }
        }
      } catch (error) {
        awardError = true;
        logger.error(
          "[TrackingContext] Unable to award transport points:",
          error
        );
      }

      // Submit to backend API
      const apiItems = {};
      Object.entries(entries).forEach(([transportId, distanceValue]) => {
        const parsedDistance = parseFloat(distanceValue);
        if (!Number.isNaN(parsedDistance) && parsedDistance > 0) {
          const label = TRANSPORT_LABELS[transportId] ?? transportId;
          apiItems[label] = parsedDistance;
        }
      });
      await submitActivityToBackend("transport", apiItems);

      return { points: pointsAwarded, awarded, awardError };
    },
    [
      addCarbonPoints,
      applyImpactToTrend,
      ensureDailyReset,
      ensureWeekData,
      submitActivityToBackend,
      user?.eco_id,
    ]
  );

  const logMealActivity = useCallback(
    async ({ dietType, dietLabel, selectedItems = [], spendingValue }) => {
      const dayInfo = getTodayInfo();
      ensureWeekData(dayInfo);
      ensureDailyReset(CATEGORY_KEYS.meals, dayInfo);

      const dietImpact = MEAL_DIET_FACTORS[dietType] ?? DEFAULT_MEAL_FACTOR;
      const itemImpact = selectedItems.reduce(
        (total, item) => total + (MEAL_ITEM_ADJUSTMENTS[item] ?? 0),
        0
      );

      const impact = clampToStep(Math.max(dietImpact + itemImpact, 0));
      const spending = Math.max(parseFloat(spendingValue) || 0, 0);

      applyImpactToTrend(impact, dayInfo);

      const previousTotal = categoryTotalsRef.current[CATEGORY_KEYS.meals] ?? 0;
      const categoryTotal = clampToStep(previousTotal + impact);
      categoryTotalsRef.current[CATEGORY_KEYS.meals] = categoryTotal;

      const description = buildMealSummary({
        dietLabel,
        selectedItems,
        spending,
      });

      setTodaysActivities((previousActivities) =>
        previousActivities.map((activity) => {
          if (activity.title !== CATEGORY_KEYS.meals) {
            return activity;
          }

          return {
            ...activity,
            value: categoryTotal > 0 ? formatPositive(categoryTotal) : activity.value,
            description,
          };
        })
      );

      let pointsAwarded = 0;
      let awarded = false;
      let awardError = false;

      try {
        const rewardCategory = REWARD_DB_KEYS.meals;
        const canAward = await rewardsCanAwardToday(
          rewardCategory,
          dayInfo.dateKey
        );

        if (canAward) {
          const pointsValue = await getRewardPoints(
            rewardCategory,
            REWARD_ACTIONS.daily,
            { ecoId: user?.eco_id }
          );

          if (pointsValue > 0) {
            await addCarbonPoints(pointsValue);
            await rewardsMarkAwardedToday(rewardCategory, dayInfo.dateKey);
            logAnalyticsEvent("points_awarded", {
              category: rewardCategory,
              points: pointsValue,
              dateLocal: getAnalyticsTimestamp(),
            });
            pointsAwarded = pointsValue;
            awarded = true;
          }
        }
      } catch (error) {
        awardError = true;
        logger.error(
          "[TrackingContext] Unable to award meal points:",
          error
        );
      }

      // Submit to backend API (diet activity expects number of days as value)
      await submitActivityToBackend("diet", {
        [dietType]: 1, // Log 1 meal entry (use dietType ID, not display label)
      });

      return { points: pointsAwarded, awarded, awardError };
    },
    [
      addCarbonPoints,
      applyImpactToTrend,
      ensureDailyReset,
      ensureWeekData,
      submitActivityToBackend,
      user?.eco_id,
    ]
  );

  const logShoppingActivity = useCallback(
    async ({ entries }) => {
      if (!entries?.length) {
        return;
      }

      const dayInfo = getTodayInfo();
      ensureWeekData(dayInfo);
      ensureDailyReset(CATEGORY_KEYS.shopping, dayInfo);

      const totalSpend = entries.reduce((sum, entry) => sum + (entry.spend ?? 0), 0);
      const totalImpact = clampToStep(
        entries.reduce(
          (sum, entry) =>
            sum + (entry.impact ?? entry.spend * SHOPPING_EMISSION_FACTOR),
          0
        )
      );

      if (totalSpend <= 0 && totalImpact <= 0) {
        return;
      }

      applyImpactToTrend(totalImpact, dayInfo);

      const previousTotal = categoryTotalsRef.current[CATEGORY_KEYS.shopping] ?? 0;
      const categoryTotal = clampToStep(previousTotal + totalImpact);
      categoryTotalsRef.current[CATEGORY_KEYS.shopping] = categoryTotal;

      const cumulativeSpend = parseFloat((shoppingSpendRef.current + totalSpend).toFixed(2));
      shoppingSpendRef.current = cumulativeSpend;
      shoppingSpendDayRef.current = dayInfo.dateKey;

      updateLongTermActivity(CATEGORY_KEYS.shopping, (activity) => ({
        ...activity,
        value: categoryTotal > 0 ? formatPositive(categoryTotal) : "+0 kg CO₂",
        description: `Daily spend ${formatCurrency(cumulativeSpend)}`,
      }));

      let pointsAwarded = 0;
      let awarded = false;
      let awardError = false;

      try {
        const rewardCategory = REWARD_DB_KEYS.shopping;
        const canAward = await rewardsCanAwardToday(
          rewardCategory,
          dayInfo.dateKey
        );

        if (canAward) {
          const pointsValue = await getRewardPoints(
            rewardCategory,
            REWARD_ACTIONS.daily,
            { ecoId: user?.eco_id }
          );

          if (pointsValue > 0) {
            await addCarbonPoints(pointsValue);
            await rewardsMarkAwardedToday(rewardCategory, dayInfo.dateKey);
            logAnalyticsEvent("points_awarded", {
              category: rewardCategory,
              points: pointsValue,
              dateLocal: getAnalyticsTimestamp(),
            });
            pointsAwarded = pointsValue;
            awarded = true;
          }
        }
      } catch (error) {
        awardError = true;
        logger.error(
          "[TrackingContext] Unable to award shopping points:",
          error
        );
      }

      // Submit to backend API (shopping expects category title: price range string)
      const apiItems = {};
      entries.forEach((entry) => {
        const categoryTitle = entry.sectionId === 'clothing'
          ? 'Clothing & Footwear'
          : entry.sectionId === 'electronics'
          ? 'Electronics'
          : entry.sectionId;

        // Normalize price range labels: replace en-dash with hyphen, remove spaces
        const normalizedLabel = entry.label
          .replace(/\s*–\s*/g, '-')  // Replace en-dash (–) with hyphen
          .replace(/\s*-\s*/g, '-')   // Remove spaces around hyphens
          .replace(/< \$/g, '<$')     // Remove space after <
          .replace(/\s*\+/g, '+');    // Remove spaces before +

        apiItems[categoryTitle] = normalizedLabel;
      });
      await submitActivityToBackend("shopping", apiItems);

      return { points: pointsAwarded, awarded, awardError };
    },
    [
      addCarbonPoints,
      applyImpactToTrend,
      ensureDailyReset,
      ensureWeekData,
      updateLongTermActivity,
      submitActivityToBackend,
      user?.eco_id,
    ]
  );


  const logEnergyActivity = useCallback(
    async ({ electricityValue = 0, gasValue = 0 }) => {
      const electricity = Math.max(electricityValue, 0);
      const gas = Math.max(gasValue, 0);

      const impact = clampToStep(
        electricity * ENERGY_EMISSION_FACTORS.electricity +
          gas * ENERGY_EMISSION_FACTORS.gas
      );

      setEnergyRecord({
        electricity,
        gas,
        impact,
        month: new Date().toISOString(),
      });

      const descriptionParts = [
        electricity > 0 ? `Electric ${formatCurrency(electricity)}` : null,
        gas > 0 ? `Gas ${formatCurrency(gas)}` : null,
      ].filter(Boolean);

      updateLongTermActivity(CATEGORY_KEYS.energy, (activity) => ({
        ...activity,
        value: impact > 0 ? formatPositive(impact) : "+0 kg CO₂",
        description: descriptionParts.length
          ? descriptionParts.join(" • ")
          : activity.description,
      }));

      let pointsAwarded = 0;
      let awarded = false;
      let awardError = false;

      const { monthKey } = getMonthInfo();

      try {
        const rewardCategory = REWARD_DB_KEYS.energy;
        const canAward = await rewardsCanAwardThisMonth(
          rewardCategory,
          monthKey
        );

        if (canAward) {
          const pointsValue = await getRewardPoints(
            rewardCategory,
            REWARD_ACTIONS.monthly,
            { ecoId: user?.eco_id }
          );

          if (pointsValue > 0) {
            await addCarbonPoints(pointsValue);
            await rewardsMarkAwardedThisMonth(rewardCategory, monthKey);
            logAnalyticsEvent("points_awarded", {
              category: rewardCategory,
              points: pointsValue,
              dateLocal: getAnalyticsTimestamp(),
            });
            pointsAwarded = pointsValue;
            awarded = true;
          }
        }
      } catch (error) {
        awardError = true;
        logger.error(
          "[TrackingContext] Unable to award energy points:",
          error
        );
      }

      // Submit to backend API (energy expects bill amounts)
      const apiItems = {};
      if (electricity > 0) {
        apiItems["Electricity Bill"] = electricity;
      }
      if (gas > 0) {
        apiItems["Gas Bill"] = gas;
      }
      await submitActivityToBackend("energy", apiItems);

      return { points: pointsAwarded, awarded, monthKey, awardError };
    },
    [addCarbonPoints, updateLongTermActivity, submitActivityToBackend, user?.eco_id]
  );

  const rewardPointsSummary = useMemo(
    () => ({
      transport:
        rewardMapping.transport?.[REWARD_ACTIONS.daily] ??
        DEFAULT_REWARD_MAPPING.transport.daily_log,
      meals:
        rewardMapping.diet?.[REWARD_ACTIONS.daily] ??
        DEFAULT_REWARD_MAPPING.diet.daily_log,
      shopping:
        rewardMapping.shopping?.[REWARD_ACTIONS.daily] ??
        DEFAULT_REWARD_MAPPING.shopping.daily_log,
      energy:
        rewardMapping.energy?.[REWARD_ACTIONS.monthly] ??
        DEFAULT_REWARD_MAPPING.energy.monthly_log,
    }),
    [rewardMapping]
  );

  const value = useMemo(
    () => ({
      weeklyImpact,
      todaysActivities,
      longTermActivities,
      logTransportActivity,
      logMealActivity,
      logShoppingActivity,
      logEnergyActivity,
      energyRecord,
      rewardPoints: rewardPointsSummary,
      refreshWeeklyImpact,
      refreshBaseline,
    }),
    [
      weeklyImpact,
      todaysActivities,
      longTermActivities,
      logTransportActivity,
      logMealActivity,
      logShoppingActivity,
      logEnergyActivity,
      energyRecord,
      rewardPointsSummary,
      refreshWeeklyImpact,
      refreshBaseline,
    ]
  );

  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>;
};

export const useTracking = () => {
  const context = useContext(TrackingContext);

  if (!context) {
    throw new Error("useTracking must be used within a TrackingProvider");
  }

  return context;
};
