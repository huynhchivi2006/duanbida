"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "./api-client";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string | Date | null;
  membershipTier?: "STANDARD" | "SILVER" | "GOLD" | "VIP";
  points?: number;
  totalSpending?: number;
  visitCount?: number;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = async () => {
    try {
      const data = await apiClient<User>("/auth/me");
      setUser(data);
    } catch (err) {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("billiards_access_token");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient<{ user: User; accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.accessToken && typeof window !== "undefined") {
      localStorage.setItem("billiards_access_token", res.accessToken);
    }

    setUser(res.user);

    // Chuyển hướng theo vai trò
    if (res.user.role === "ADMIN") {
      router.push("/admin/dashboard");
    } else if (res.user.role === "STAFF") {
      router.push("/staff/dashboard");
    } else {
      router.push("/customer/dashboard");
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => {
    const res = await apiClient<{ user: User; accessToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (res.accessToken && typeof window !== "undefined") {
      localStorage.setItem("billiards_access_token", res.accessToken);
    }

    setUser(res.user);
    router.push("/customer/dashboard");
  };

  const logout = async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch (err) {
      // Bỏ qua lỗi mạng khi logout
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("billiards_access_token");
      }
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        isAdmin: user?.role === "ADMIN",
        isStaff: user?.role === "STAFF",
        isCustomer: user?.role === "CUSTOMER",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

