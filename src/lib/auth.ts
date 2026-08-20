// Authentication utilities for MySQL-based auth
// Frontend-only: All auth operations go through backend API

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  created_at: string;
}

export interface Session {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  user: User;
}

// Simple token decode (just for reading, not verification)
// Real verification happens on backend
export function decodeToken(token: string): { userId: string; email: string } | null {
  try {
    // JWT tokens are base64 encoded JSON
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return {
      userId: payload.userId || payload.sub,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

// Sign up user (via API)
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: 'creator' | 'brand' = 'creator'
): Promise<{ user: User | null; error: Error | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { user: null, error: new Error(data.message || data.error || 'Signup failed') };
    }

    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error: error as Error };
  }
}

// Sign in user (via API)
export async function signIn(
  email: string,
  password: string
): Promise<{ session: Session | null; error: Error | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { session: null, error: new Error(data.message || data.error || 'Sign in failed') };
    }

    return { session: data.session, error: null };
  } catch (error: any) {
    return { session: null, error: error as Error };
  }
}

// Get user from token (verify with backend)
export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('[Auth] Failed to get user:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('[Auth] Error getting user from token:', error);
    return null;
  }
}

