import apiConfig from "../config/apiConfig";
import { requestAuthToken } from "./apis/authAPI";

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const TOKEN_REFRESH_BUFFER_MS = 30 * 1000; // Refresh 30s early

const tokenCache = new Map();

const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url);

const getCachedToken = (ecoId) => {
  const entry = tokenCache.get(ecoId);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (entry.expiry && entry.expiry > now && entry.token) {
    return entry.token;
  }

  return null;
};

const setCachedToken = (ecoId, token) => {
  const expiry = Date.now() + TOKEN_TTL_MS - TOKEN_REFRESH_BUFFER_MS;
  tokenCache.set(ecoId, { token, expiry });
};

const getAuthToken = async (ecoId) => {
  if (!ecoId) {
    throw new Error("ecoId is required to request auth token");
  }

  const cachedToken = getCachedToken(ecoId);
  if (cachedToken) {
    return cachedToken;
  }

  const inflight = tokenCache.get(`${ecoId}-promise`);
  if (inflight) {
    return inflight;
  }

  const tokenPromise = (async () => {
    const token = await requestAuthToken(ecoId);
    setCachedToken(ecoId, token);
    tokenCache.delete(`${ecoId}-promise`);
    return token;
  })().catch((error) => {
    tokenCache.delete(`${ecoId}-promise`);
    throw error;
  });

  tokenCache.set(`${ecoId}-promise`, tokenPromise);
  return tokenPromise;
};

/**
 * Wrapper around fetch that automatically attaches the Bearer token.
 *
 * @param {string} path - Relative or absolute URL
 * @param {RequestInit} [options] - Fetch options
 * @param {{ ecoId?: string, skipAuth?: boolean }} [config]
 * @returns {Promise<Response>}
 */
export const authorizedFetch = async (
  path,
  options = {},
  { ecoId, skipAuth = false } = {}
) => {
  const url = isAbsoluteUrl(path) ? path : `${apiConfig.baseURL}${path}`;

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (!skipAuth && ecoId) {
    const token = await getAuthToken(ecoId);
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

