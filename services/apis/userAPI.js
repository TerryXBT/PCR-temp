import apiConfig from "../../config/apiConfig";
import { authorizedFetch } from "../apiClient";
import { handleApiError } from "../../utils/apiErrorHandler";

/**
 * Fetches user profile data by eco_id.
 * @async
 * @param {string} ecoId - The eco_id of the user.
 * @returns {Promise<{ eco_id: string, daily: number, monthly: number, yearly: number, carbonPoints: number }>}
 */
export async function getUser(ecoId) {
  try {
    console.log("[API] GET /user/:ecoId", ecoId);

    const path = `${apiConfig.endpoints.getUser}/${ecoId}`;
    const response = await authorizedFetch(path, undefined, { ecoId });

    if (!response.ok) {
      const errorPayload = await response.text();
      const error = new Error("Failed to fetch user profile");
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorPayload,
      };
      throw error;
    }

    const res = await response.json();

    console.log("[API] Full Response Data:", JSON.stringify(res, null, 2));

    const data = res?.data;
    if (!data?.eco_id) {
      throw new Error("eco_id not found in API response");
    }

    return {
      eco_id: data.eco_id,
      daily: data.user_baseline_daily,
      monthly: data.user_baseline_monthly,
      yearly: data.user_baseline_yearly,
      carbonPoints: data.user_carbon_point,
    };
  } catch (error) {
    handleApiError(error, "GET /user");
    throw error;
  }
}

/**
 * Updates user carbon points.
 * @async
 * @param {string} ecoId - The eco_id of the user.
 * @param {number} points - New carbon points total.
 * @returns {Promise<void>}
 */
export async function updateUserPoints(ecoId, points) {
  try {
    if (!ecoId) {
      throw new Error("ecoId is required to update user points");
    }

    const path = `${apiConfig.endpoints.getUser}/${ecoId}`;
    const response = await authorizedFetch(
      path,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_carbon_point: points,
        }),
      },
      { ecoId }
    );

    if (!response.ok) {
      const errorPayload = await response.text();
      const error = new Error("Failed to update user points");
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorPayload,
      };
      throw error;
    }
  } catch (error) {
    handleApiError(error, "PATCH /user");
    throw error;
  }
}
