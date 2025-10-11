import apiConfig from "../../config/apiConfig";

/**
 * Requests a new JWT bearer token for the provided eco_id.
 *
 * @param {string} ecoId
 * @returns {Promise<string>} JWT token string
 */
export const requestAuthToken = async (ecoId) => {
  try {
    const url = `${apiConfig.baseURL}/token`;
    console.log("[requestAuthToken] URL:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eco_id: ecoId }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[requestAuthToken] Failure payload:", text);
      throw new Error("Failed to fetch auth token");
    }

    const result = await response.json();
    if (!result?.token) {
      throw new Error("Auth token missing in response");
    }

    return result.token;
  } catch (error) {
    console.error("[authAPI] requestAuthToken error:", error);
    throw error;
  }
};

