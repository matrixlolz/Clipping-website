"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { signUp, signIn, getUserFromToken, decodeToken, User, Session } from "@/lib/auth";
import { mysqlApi as mysqlClient } from "@/integrations/mysql/api";

type AppRole = "creator" | "brand" | "admin";

/** Row shape returned by `mysqlClient.profiles.getById` */
interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  referral_code: string | null;
  payout_method: string | null;
  payout_email: string | null;
  solana_wallet_address: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  referral_code: string | null;
  payout_method: string | null;
  payout_email: string | null;
  solana_wallet_address: string | null;
  is_banned: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, role: "creator" | "brand") => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'apex_auth_token';
const SESSION_KEY = 'apex_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      console.log("[Auth] Fetching profile for user:", userId);
      
      // Fetch profile and role in parallel
      const [profileData, roleData] = await Promise.all([
        mysqlClient.profiles.getById(userId),
        mysqlClient.userRoles.getByUserId(userId)
      ]);

      if (profileData) {
        const p = profileData as ProfileRow;
        console.log("[Auth] Profile loaded:", p.email);
        setProfile({
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          bio: p.bio,
          referral_code: p.referral_code,
          payout_method: p.payout_method,
          payout_email: p.payout_email,
          solana_wallet_address: p.solana_wallet_address,
          is_banned: false, // Add this field to MySQL schema if needed
          created_at: p.created_at,
        });
      }

      if (roleData && Array.isArray(roleData) && roleData.length > 0) {
        console.log("[Auth] Role loaded:", roleData[0].role);
        setRole(roleData[0].role as AppRole);
      } else {
        console.log("[Auth] No role found for user, defaulting to null");
        setRole(null);
      }
    } catch (error) {
      console.error("[Auth] Error in fetchProfile:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const sessionStr = localStorage.getItem(SESSION_KEY);

        if (token && sessionStr) {
          const sessionData = JSON.parse(sessionStr) as Session;
          
          // Check if session is expired
          if (sessionData.expires_at <= Date.now()) {
            console.log("[Auth] Session expired");
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(SESSION_KEY);
            setIsLoading(false);
            return;
          }
          
          // Try to verify token with backend; fall back to client-side decode
          let userData = await getUserFromToken(token);
          
          if (!userData) {
            // Backend unavailable — decode token locally so UI still works
            const decoded = decodeToken(token);
            if (decoded) {
              userData = {
                id: decoded.userId,
                email: decoded.email,
                email_verified: false,
                created_at: "",
              };
              console.log("[Auth] Using client-side decoded token for:", decoded.email);
            }
          }

          if (userData) {
            console.log("[Auth] Session loaded successfully for user:", userData.email);
            setUser(userData);
            setSession(sessionData);
            await fetchProfile(userData.id);
          } else {
            // Token invalid or user not found
            console.log("[Auth] Token verification failed, clearing session");
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(SESSION_KEY);
          }
        } else {
          console.log("[Auth] No session found in localStorage");
        }
      } catch (error) {
        console.error("[Auth] Error loading session:", error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const handleSignUp = async (email: string, password: string, fullName: string, role: "creator" | "brand") => {
    const { user: newUser, error } = await signUp(email, password, fullName, role);
    
    if (error || !newUser) {
      return { error: error || new Error('Failed to create account') };
    }

    // Auto sign in after sign up
    return handleSignIn(email, password);
  };

  const handleSignIn = async (email: string, password: string) => {
    const { session: newSession, error } = await signIn(email, password);
    
    if (error || !newSession) {
      return { error: error || new Error('Failed to sign in') };
    }

    // Save to localStorage
    localStorage.setItem(TOKEN_KEY, newSession.access_token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));

    setUser(newSession.user);
    setSession(newSession);
    await fetchProfile(newSession.user.id);

    return { error: null };
  };

  const handleSignOut = async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role,
      isLoading,
      signUp: handleSignUp,
      signIn: handleSignIn,
      signOut: handleSignOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
