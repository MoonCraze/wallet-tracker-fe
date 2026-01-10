import apiClient from "./client";
import type { AuthUser } from "../types";

/**
 * Get current authenticated user from the backend
 * Requires valid JWT token in session
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get("/api/auth/me");
  return data.user || data;
}

/**
 * Logout from the backend
 * Invalidates the JWT token
 */
export async function logout(): Promise<{ ok: boolean; message?: string }> {
  const { data } = await apiClient.post("/api/auth/logout");
  return data;
}

/**
 * Login to the backend (used by NextAuth internally)
 * This is typically called server-side during the NextAuth authorize flow
 */
export async function login(
  username: string,
  password: string
): Promise<{ ok: boolean; token?: string; user?: AuthUser; error?: string }> {
  const { data } = await apiClient.post("/api/auth/login", {
    username,
    password,
  });
  return data;
}

/**
 * Verify if a token is still valid
 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}
