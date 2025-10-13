import apiConfig from "../../config/apiConfig";
import { authorizedFetch } from "../apiClient";
import logger from "../../utils/logger";

const normalizeRows = (rows = []) => {
  const mapping = {};

  rows.forEach((row) => {
    if (!row) return;
    const category = String(row.category || "").toLowerCase();
    const action = String(row.action || "").toLowerCase();
    const points = Number(row.points);

    if (!category || !action || Number.isNaN(points)) return;

    if (!mapping[category]) {
      mapping[category] = {};
    }
    mapping[category][action] = points;
  });

  return mapping;
};

/**
 * Fetch rewards mapping from backend.
 *
 * @param {{ ecoId?: string, skipAuth?: boolean }} [options]
 * @returns {Promise<Record<string, Record<string, number>>>}
 */
export const fetchRewardsMapping = async ({ ecoId, skipAuth = false } = {}) => {
  try {
    const path = apiConfig.endpoints.rewards || "/rewards";
    const response = await authorizedFetch(
      path,
      undefined,
      ecoId ? { ecoId } : { skipAuth }
    );

    const raw = await response.text();
    logger.info("[rewardsAPI] raw response:", raw || "(empty)");

    if (!response.ok) {
      throw new Error(`Failed to fetch rewards mapping (${response.status})`);
    }

    const payload = raw ? JSON.parse(raw) : {};
    const rows = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [];

    const mapping = normalizeRows(rows);
    logger.info("[rewardsAPI] normalized mapping:", JSON.stringify(mapping));
    return mapping;
  } catch (error) {
    logger.warn("[rewardsAPI] fetchRewardsMapping error:", error);
    throw error;
  }
};

export default fetchRewardsMapping;
