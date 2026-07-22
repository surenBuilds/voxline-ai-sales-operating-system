/* eslint-disable @typescript-eslint/no-var-requires */
import {
  UserRole
} from '../src/types/index.js';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
}

// Helper to strip sensitive fields before sending to clients
export function sanitizeUser(user: any) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}
