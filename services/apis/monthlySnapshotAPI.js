import apiConfig from "../../config/apiConfig";
import { authorizedFetch } from "../apiClient";
import StorageService from "../storage";

/**
 * Fetch monthly snapshot for a user by eco_id.
 * Saves it to AsyncStorage for reuse.
 *
 * @param {string} ecoId - user eco_id
 * @returns {Promise<object>} - raw monthly snapshot response
 */
export const fetchMonthlySnapshot = async (ecoId) => {
  try {
    const path = `/user/${ecoId}/monthlysnapshot`;
    const response = await authorizedFetch(path, undefined, { ecoId });

    if (!response.ok) {
      throw new Error("Failed to fetch monthly snapshot");
    }

    const result = await response.json();
    const data = result?.data || {};

    // Persist in AsyncStorage
    await StorageService.setMonthlySnapshot(data);

    return data;
  } catch (err) {
    console.error("[monthlySnapshotAPI] fetchMonthlySnapshot error:", err);
    throw err;
  }
};

/**
 * Load monthly snapshot from AsyncStorage if available.
 * @returns {Promise<object|null>}
 */
export const getStoredMonthlySnapshot = async () => {
  try {
    return await StorageService.getMonthlySnapshot();
  } catch (err) {
    console.error("[monthlySnapshotAPI] getStoredMonthlySnapshot error:", err);
    return null;
  }
};
