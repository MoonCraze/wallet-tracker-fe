import axios from "axios";
import { getSession } from "next-auth/react";

/**
 * Axios instance configured for the backend API
 * Automatically adds JWT token from NextAuth session to protected requests
 */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor - add JWT to protected requests
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Skip adding token for SSE streams (they're public)
    if (config.url?.includes("/stream/")) {
      return config;
    }

    // Get session with JWT token
    const session = await getSession();
    
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different error scenarios
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      if (typeof window !== "undefined") {
        // Clear any stale session data
        window.location.href = "/login?error=session_expired";
      }
    }
    
    if (error.response?.status === 403) {
      console.error("Access forbidden - insufficient permissions");
    }
    
    if (error.response?.status === 429) {
      console.error("Rate limited - too many requests");
    }
    
    if (error.response?.status >= 500) {
      console.error("Server error:", error.response?.data?.message || "Unknown error");
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * Create an AbortController for request cancellation
 * Use this with API calls that should be cancelled on component unmount
 * 
 * @example
 * const controller = createAbortController();
 * apiClient.get('/endpoint', { signal: controller.signal });
 * // On cleanup: controller.abort();
 */
export function createAbortController(): AbortController {
  return new AbortController();
}

/**
 * Server-side API client creator
 * Use this in server components or API routes where getSession doesn't work
 */
export function createServerApiClient(token?: string) {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  
  return client;
}
