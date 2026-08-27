/**
 * Centralized HTTP client for the VI-PHARMACY Flask API.
 *
 * Every request:
 *  - goes to VITE_API_BASE_URL (e.g. http://127.0.0.1:5000/api)
 *  - sends credentials: "include" so the signed session cookie from
 *    /api/auth/login is attached automatically
 *  - normalizes backend errors (which are always {"error": "message"})
 *    into a single ApiError shape the rest of the app can rely on
 *  - normalizes network failures (backend not running at all) into the
 *    same ApiError shape, with a clear message instead of a raw
 *    "Failed to fetch" the rest of the app would have to special-case
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status; // 0 means "no response at all" (network/server down)
    this.data = data;
  }
}

function buildUrl(path, params) {
  // BASE_URL is expected to be absolute (e.g. http://127.0.0.1:5000/api).
  // window.location.origin is passed as a base only so a relative
  // VITE_API_BASE_URL wouldn't throw — the normal case never uses it.
  const url = new URL(BASE_URL.replace(/\/$/, "") + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

async function request(path, { method = "GET", body, params } = {}) {
  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new ApiError(
      "Unable to connect to the pharmacy server. Make sure the backend is running.",
      0,
      null
    );
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON response body (shouldn't normally happen) — leave data null.
    }
  }

  if (!response.ok) {
    const message =
      (data && data.error) ||
      `Request failed (${response.status}). Please try again.`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
};
