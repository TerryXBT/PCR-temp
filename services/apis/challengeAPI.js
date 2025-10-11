import apiConfig from "../../config/apiConfig";
import { authorizedFetch } from "../apiClient";

/**
 * Fetches challenges for a specific user.
 * @param {string} ecoId
 * @returns {Promise<any[]>}
 */
export const fetchUserChallenges = async (ecoId) => {
  try {
    const path = `/user/${ecoId}/challenge`;
    console.log("[fetchUserChallenges] URL:", `${apiConfig.baseURL}${path}`);

    const response = await authorizedFetch(path, undefined, { ecoId });
    if (!response.ok) throw new Error("Failed to fetch challenges");

    const result = await response.json();
    // console.log(
    //   "[fetchUserChallenges] Response:",
    //   JSON.stringify(result, null, 2)
    // );

    return result.data.map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      progress: challenge.progress,
      rewards: {
        points: challenge.rewards?.points || 0,
        badge: challenge.rewards?.badge || null,
      },
      status: challenge.status,
      isActive: challenge.isActive,
      icon: challenge.icon || "eco",
    }));
  } catch (error) {
    console.error("[challengeAPI] fetchUserChallenges error:", error);
    throw error;
  }
};

/**
 * Marks a challenge as complete or updates its progress.
 * Sends payload with `id`, `user_progress`, and `status` as required by backend.
 *
 * @param {string} ecoId - User Eco ID
 * @param {string} challengeId - Challenge identifier
 * @param {number} userProgress - Updated progress value
 * @param {number} status - Challenge status (1 = completed, 0 = not completed)
 * @returns {Promise<any>} Response from backend
 */
export const completeUserChallenge = async (
  ecoId,
  challengeId,
  userProgress = 1,
  status = 1
) => {
  try {
    const path = `/user/${ecoId}/challenge`;
    const payload = {
      id: challengeId,
      user_progress: userProgress,
      status,
    };

    // console.log("[completeUserChallenge] URL:", `${apiConfig.baseURL}${path}`);
    // console.log(
    //   "[completeUserChallenge] Payload:",
    //   JSON.stringify(payload, null, 2)
    // );

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
    console.log("[completeUserChallenge] Raw response text:", text);

    if (!response.ok) throw new Error("Failed to complete challenge");

    const result = JSON.parse(text);
    // console.log(
    //   "[completeUserChallenge] Parsed response:",
    //   JSON.stringify(result, null, 2)
    // );

    return result;
  } catch (error) {
    console.error("[challengeAPI] completeUserChallenge error:", error);
    throw error;
  }
};

/**
 * Activates or deactivates a challenge for a user.
 * @param {string} ecoId
 * @param {string} challengeId
 * @param {boolean} isActive
 * @returns {Promise<any>}
 */
export const activateChallenge = async (
  ecoId,
  challengeId,
  isActive = true
) => {
  try {
    const path = `/user/${ecoId}/activate-challenge`;
    const payload = { id: challengeId, isActive };
    console.log("[activateChallenge] URL:", `${apiConfig.baseURL}${path}`);
    console.log(
      "[activateChallenge] Payload:",
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
    console.log("[activateChallenge] Raw response text:", text);

    if (!response.ok) throw new Error("Failed to activate challenge");

    const result = JSON.parse(text);
    console.log(
      "[activateChallenge] Parsed response:",
      JSON.stringify(result, null, 2)
    );

    return result;
  } catch (error) {
    console.error("[challengeAPI] activateChallenge error:", error);
    throw error;
  }
};
