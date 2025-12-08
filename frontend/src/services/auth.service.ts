"use client";

import { LoginRequest, LoginResponse } from "@/types/auth";
import { http } from "@/lib/http-client";
import { setCookie, deleteCookie } from "cookies-next";
import { getAuthToken } from "@/lib/auth-token";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await http.post<LoginResponse>(
        "/auth/login",
        credentials,
        {
          requireAuth: false,
        }
      );

      // Store token in cookie for server-side auth checks (middleware)
      setCookie("token", response.token, {
        maxAge: 60 * 60 * 3, // 3 hours (matching JWT expiry)
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      return response;
    } catch (error) {
      throw error;
    }
  },

  logout(): void {
    // Clear cookies
    deleteCookie("token");

    // Clear local storage
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("wallet");
    }
  },



  getToken(): string | null {
    return getAuthToken();
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getAuthHeader(): { Authorization: string } | Record<string, never> {
    const token = this.getToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  },
};
