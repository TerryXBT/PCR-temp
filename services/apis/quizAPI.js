import apiConfig from "../../config/apiConfig";
import { authorizedFetch } from "../apiClient";
import StorageService from "../storage";

/**
 * Fetches all quiz topics and their questions.
 * @returns {Promise<any[]>}
 */
export const fetchQuizzes = async (ecoId, { skipAuth = false } = {}) => {
  try {
    const path = apiConfig.endpoints.quiz || "/quiz";
    console.log("[fetchQuizzes] URL:", `${apiConfig.baseURL}${path}`);

    const response = await authorizedFetch(
      path,
      undefined,
      { ecoId, skipAuth }
    );
    if (!response.ok) throw new Error("Failed to fetch quizzes");

    const result = await response.json();

    return result;

    // return (result.data || []).map((topic) => ({
    //   name: topic.topic_name,
    //   description: topic.topic_description,
    //   questions: (topic.questions || []).map((q) => ({
    //     id: q.quiz_ques_id,
    //     text: q.quiz_ques_text,
    //     options: (q.options || []).map((opt) => ({
    //       id: opt.quiz_option_id,
    //       text: opt.quiz_option_text,
    //       isCorrect: opt.quiz_option_is_correct === 1,
    //       explanation: opt.quiz_option_explanation,
    //     })),
    //   })),
    // }));
  } catch (error) {
    console.error("[quizAPI] fetchQuizzes error:", error);
    throw error;
  }
};

/**
 * Fetches a single quiz topic by index (or ID if backend adds it later).
 * @param {number} index - Index in the data array (0-based).
 * @returns {Promise<any>}
 */
export const fetchQuizByIndex = async (index = 0, ecoId, options) => {
  try {
    const quizzes = await fetchQuizzes(ecoId, options);
    return quizzes[index] || null;
  } catch (error) {
    console.error("[quizAPI] fetchQuizByIndex error:", error);
    throw error;
  }
};

// ---------- Quiz Points Awarding ----------

const DEFAULT_QUIZ_AWARD_ENDPOINT =
  "https://ayrnx5os0c.execute-api.ap-southeast-2.amazonaws.com/dev/quiz";

const calculateAwardedPoints = (correct, total) => {
  const safeCorrect = Math.max(0, Number.isFinite(correct) ? correct : 0);
  const safeTotal = Math.max(0, Number.isFinite(total) ? total : 0);
  return Math.max(0, Math.min(safeCorrect, safeTotal));
};

const parseAwardResponse = async (response) => {
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.warn("[quizAPI] awardQuizPoints invalid JSON response:", err);
    }
  }
  if (!response.ok) {
    const message = data?.message || "Failed to award quiz points";
    const error = new Error(message);
    error.response = response;
    error.data = data;
    throw error;
  }
  return {
    awardedPoints:
      typeof data.awardedPoints === "number" ? data.awardedPoints : undefined,
    newBalance:
      typeof data.newBalance === "number" ? data.newBalance : undefined,
    reason: data.reason,
  };
};

const postQuizAward = async (
  payload,
  endpoint = DEFAULT_QUIZ_AWARD_ENDPOINT
) => {
  const res = await authorizedFetch(
    endpoint,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": payload.idempotencyKey,
      },
      body: JSON.stringify(payload),
    },
    { ecoId: payload.ecoId }
  );

  const parsed = await parseAwardResponse(res);
  return parsed;
};

/**
 * Attempts to award quiz points. On network failure, rethrows after queuing
 * the payload so it can be retried later.
 */
export const awardQuizPoints = async ({
  ecoId,
  quizId,
  correct,
  total,
  endpoint = DEFAULT_QUIZ_AWARD_ENDPOINT,
  idempotencyKey,
}) => {
  if (!ecoId || !quizId) {
    return {
      awardedPoints: calculateAwardedPoints(correct, total),
      newBalance: undefined,
      idempotencyKey,
      skipped: true,
    };
  }

  const key =
    idempotencyKey || `${quizId}:${ecoId}:${new Date().toISOString()}`;
  const awardedPoints = calculateAwardedPoints(correct, total);

  const payload = {
    ecoId,
    quizId,
    correct: Math.max(0, Number.isFinite(correct) ? correct : 0),
    total: Math.max(0, Number.isFinite(total) ? total : 0),
    awardedPoints,
    idempotencyKey: key,
  };

  try {
    const result = await postQuizAward(payload, endpoint);
    return {
      awardedPoints: result.awardedPoints ?? awardedPoints,
      newBalance: result.newBalance,
      reason: result.reason,
      idempotencyKey: key,
    };
  } catch (err) {
    await StorageService.enqueueQuizAward({ ...payload, endpoint });
    const error = new Error(err?.message || "Failed to award quiz points");
    error.cause = err;
    error.awardedPoints = awardedPoints;
    error.idempotencyKey = key;
    error.wasQueued = true;
    throw error;
  }
};

/**
 * Flush any queued quiz award requests (e.g., when back online).
 * Returns an array of results for successfully processed payloads.
 */
export const flushQuizAwardQueue = async ({
  endpoint = DEFAULT_QUIZ_AWARD_ENDPOINT,
} = {}) => {
  const queue = await StorageService.getQuizAwardQueue();
  if (!queue.length) return [];

  const processed = [];
  for (const payload of queue) {
    const targetEndpoint = payload.endpoint || endpoint;
    try {
      const result = await postQuizAward(payload, targetEndpoint);
      await StorageService.removeQuizAward(payload.idempotencyKey);
      processed.push({
        payload,
        awardedPoints: result.awardedPoints ?? payload.awardedPoints,
        newBalance: result.newBalance,
        reason: result.reason,
      });
    } catch (err) {
      console.error(
        "[quizAPI] flushQuizAwardQueue failed for payload:",
        payload.idempotencyKey,
        err?.message || err
      );
      break;
    }
  }

  return processed;
};
