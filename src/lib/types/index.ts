// Re-export all types from this file
export * from "./transfer";
export * from "./coordinated";
export * from "./config";

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Database stats response
 */
export interface DatabaseStats {
  transferCount: number;
  coordinatedCount: number;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  uptime?: number;
}

/**
 * Auth user response
 */
export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  ok: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
}
