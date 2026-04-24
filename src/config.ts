/**
 * Get the API base URL
 * - In development (localhost): uses http://localhost:8000
 * - In production: uses the configured backend URL from env vars
 */
export const getApiUrl = (): string => {
  // Check for environment variable first
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // Development: localhost
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:8000";
  }

  // Production: use the same domain as frontend
  // This works with Cloudflare tunnels that route to the backend
  return `${window.location.protocol}//${window.location.host}`;
};

/**
 * Get the WebSocket URL
 * - Converts http to ws, https to wss
 * - Uses the same domain and path as the API
 */
export const getWebSocketUrl = (apiUrl: string = getApiUrl()): string => {
  // Remove trailing slash
  const cleanUrl = apiUrl.replace(/\/$/, "");

  // For localhost development, construct manually
  if (cleanUrl.includes("localhost")) {
    return `ws://localhost:8000/ws/stream`;
  }

  // For production with Cloudflare tunnel or remote backend
  // Replace http with ws, https with wss
  const wsUrl = cleanUrl
    .replace(/^https:/, "wss:")
    .replace(/^http:/, "ws:");

  return `${wsUrl}/ws/stream`;
};

/**
 * Get backend status check URL
 */
export const getStatusUrl = (apiUrl: string = getApiUrl()): string => {
  return apiUrl.replace(/\/$/, "");
};
