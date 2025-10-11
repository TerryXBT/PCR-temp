import apiConfig from "../../config/apiConfig";
import { authorizedFetch } from "../apiClient";

/**
 * Fetches tracking activity categories and structure for a specific user.
 * Returns the available activity types and their subcategories.
 *
 * @param {string} ecoId - User's eco_id
 * @returns {Promise<any[]>} Array of activity categories with structure
 */
export const fetchTrackingCategories = async (ecoId) => {
  try {
    const path = `/user/${ecoId}/tracking`;
    console.log("[fetchTrackingCategories] URL:", `${apiConfig.baseURL}${path}`);

    const response = await authorizedFetch(path, undefined, { ecoId });
    if (!response.ok) throw new Error("Failed to fetch tracking categories");

    const result = await response.json();
    console.log(
      "[fetchTrackingCategories] Response:",
      JSON.stringify(result, null, 2)
    );

    return result.data || [];
  } catch (error) {
    console.error("[trackingAPI] fetchTrackingCategories error:", error);
    throw error;
  }
};

/**
 * Submits a tracking activity to the backend.
 *
 * Payload format varies by activity_name:
 * - transport: { activity_name: "transport", items: { "Diesel car": 1.4, "Bus": 50 } }
 * - diet: { activity_name: "diet", items: { "Flexitarian": 15 } }
 * - shopping: { activity_name: "shopping", items: { "Clothing & Footwear": "$301+" } }
 * - energy: { activity_name: "energy", items: { "Electricity Bill": 100 } }
 *
 * @param {string} ecoId - User's eco_id
 * @param {Object} payload - Activity data with activity_name and items
 * @param {string} payload.activity_name - Type of activity (transport, diet, shopping, energy)
 * @param {Object} payload.items - Key-value pairs of activity items
 * @returns {Promise<any>} Response from backend
 */
export const submitTrackingActivity = async (ecoId, payload) => {
  try {
    const path = `/user/${ecoId}/tracking`;

    console.log("[submitTrackingActivity] URL:", `${apiConfig.baseURL}${path}`);
    console.log(
      "[submitTrackingActivity] Payload:",
      JSON.stringify(payload, null, 2)
    );

    const response = await authorizedFetch(
      path,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      { ecoId }
    );

    const text = await response.text();
    console.log("[submitTrackingActivity] Raw response text:", text);

    if (!response.ok) throw new Error("Failed to submit tracking activity");

    const result = text ? JSON.parse(text) : { success: true };
    console.log(
      "[submitTrackingActivity] Parsed response:",
      JSON.stringify(result, null, 2)
    );

    return result;
  } catch (error) {
    console.error("[trackingAPI] submitTrackingActivity error:", error);
    throw error;
  }
};

/**
 * Fetches the weekly emissions snapshot for a user (past 7 days).
 *
 * @param {string} ecoId - User's eco_id
 * @returns {Promise<number[]>} Array of emission values ordered oldest -> newest
 */
export const fetchWeeklySnapshot = async (ecoId) => {
  try {
    const path = `/user/${ecoId}/weeklysnapshot`;
    console.log("[fetchWeeklySnapshot] URL:", `${apiConfig.baseURL}${path}`);

    const response = await authorizedFetch(path, undefined, { ecoId });
    if (!response.ok) throw new Error("Failed to fetch weekly snapshot");

    const result = await response.json();
    console.log(
      "[fetchWeeklySnapshot] Response:",
      JSON.stringify(result, null, 2)
    );

    if (!Array.isArray(result?.data)) {
      console.warn("[fetchWeeklySnapshot] Unexpected response shape:", result);
      return [];
    }

    return result.data.map((value) => {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    });
  } catch (error) {
    console.error("[trackingAPI] fetchWeeklySnapshot error:", error);
    throw error;
  }
};

/**
 * Fetches the daily emissions snapshot for the latest date.
 *
 * @param {string} ecoId - User's eco_id
 * @returns {Promise<{ date: string, totals_kg: Record<string, number> }>} Snapshot payload
 */
export const fetchDailySnapshot = async (ecoId) => {
  try {
    const path = `/user/${ecoId}/dailysnapshot`;
    console.log("[fetchDailySnapshot] URL:", `${apiConfig.baseURL}${path}`);

    const response = await authorizedFetch(path, undefined, { ecoId });
    if (!response.ok) throw new Error("Failed to fetch daily snapshot");

    const result = await response.json();
    console.log(
      "[fetchDailySnapshot] Response:",
      JSON.stringify(result, null, 2)
    );

    if (!result?.data || typeof result.data !== "object") {
      console.warn("[fetchDailySnapshot] Unexpected response shape:", result);
      return { date: null, totals_kg: {} };
    }

    const { date = null, totals_kg: totals = {} } = result.data;
    const normalizedTotals = Object.fromEntries(
      Object.entries(totals).map(([key, value]) => {
        const parsed = Number(value);
        return [key, Number.isNaN(parsed) ? 0 : parsed];
      })
    );

    return { date, totals_kg: normalizedTotals };
  } catch (error) {
    console.error("[trackingAPI] fetchDailySnapshot error:", error);
    throw error;
  }
};

/**
 * Fetches the user's baseline information (daily/weekly/monthly/yearly totals).
 *
 * @param {string} ecoId - User's eco_id
 * @returns {Promise<{ user_baseline_weekly?: number }>} Baseline payload
 */
export const fetchUserBaseline = async (ecoId) => {
  try {
    const path = `/user/${ecoId}`;
    console.log("[fetchUserBaseline] URL:", `${apiConfig.baseURL}${path}`);

    const response = await authorizedFetch(path, undefined, { ecoId });
    if (!response.ok) throw new Error("Failed to fetch user baseline");

    const result = await response.json();
    console.log(
      "[fetchUserBaseline] Response:",
      JSON.stringify(result, null, 2)
    );

    if (!result?.data || typeof result.data !== "object") {
      console.warn("[fetchUserBaseline] Unexpected response shape:", result);
      return {};
    }

    return result.data;
  } catch (error) {
    console.error("[trackingAPI] fetchUserBaseline error:", error);
    throw error;
  }
};
