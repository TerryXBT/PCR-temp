/**
 * Centralized logger utility.
 * Replaces console.* usage with consistent logging methods.
 * Allows future extension (e.g., sending logs to backend or external service).
 */

const levels = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
  debug: "DEBUG",
};

function formatMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    return `[${timestamp}] [${level}] ${message} | Data: ${safeStringify(data)}`;
  }
  return `[${timestamp}] [${level}] ${message}`;
}

function safeStringify(value, maxLength = 2000) {
  try {
    const result = JSON.stringify(value, replacer);
    if (!result) {
      return String(value);
    }
    return result.length > maxLength
      ? `${result.slice(0, maxLength)}…`
      : result;
  } catch {
    return String(value);
  }
}

function replacer(_key, val) {
  if (typeof val === "bigint") return val.toString();
  return val;
}

function normalizeError(err) {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }

  const isAxios =
    err && (err.isAxiosError || (err.config && (err.request || err.response)));

  if (isAxios) {
    const res = err.response || {};
    return {
      isAxiosError: true,
      message: err.message,
      url: err.config?.url,
      method: err.config?.method,
      status: res.status,
      statusText: res.statusText,
      responseData: res.data,
    };
  }

  if (typeof err === "object") {
    return err;
  }

  return { value: err };
}

const logger = {
  info: (message, data) => {
    console.log(formatMessage(levels.info, message, data));
  },
  warn: (message, data) => {
    console.warn(formatMessage(levels.warn, message, data));
  },
  error: (message, error) => {
    console.error(formatMessage(levels.error, message, normalizeError(error)));
  },
  debug: (message, data) => {
    if (__DEV__) {
      console.debug(formatMessage(levels.debug, message, data));
    }
  },
};

export default logger;
