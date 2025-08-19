"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import * as SecureStore from "expo-secure-store"
import * as WebBrowser from "expo-web-browser"
import * as Linking from "expo-linking"
import { API_BASE_URL } from "../config"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "student" | "lecturer"
  studentId?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken")
      if (token) {
        const isValid = await verifyToken(token)
        if (!isValid) {
          const refreshed = await refreshToken()
          if (!refreshed) {
            await logout()
          }
        }
      }
    } catch (error) {
      console.error("Auth check error:", error)
    } finally {
      setLoading(false)
    }
  }

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        return true
      }
      return false
    } catch (error) {
      console.error("Token verification error:", error)
      return false
    }
  }

  const login = async () => {
    try {
      // Get SSO URLs from backend
      const response = await fetch(`${API_BASE_URL}/api/auth/sso-urls`)
      const { saml, oauth2 } = await response.json()

      // Use SAML by default, fallback to OAuth2
      const ssoUrl = saml || oauth2

      if (!ssoUrl) {
        throw new Error("No SSO configuration available")
      }

      // Open SSO login in browser
      const result = await WebBrowser.openAuthSessionAsync(ssoUrl, Linking.createURL("/auth/callback"))

      if (result.type === "success" && result.url) {
        const url = new URL(result.url)
        const token = url.searchParams.get("token")
        const refreshToken = url.searchParams.get("refresh")

        if (token && refreshToken) {
          await SecureStore.setItemAsync("accessToken", token)
          await SecureStore.setItemAsync("refreshToken", refreshToken)
          await verifyToken(token)
        } else {
          throw new Error("No tokens received from SSO")
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = await SecureStore.getItemAsync("refreshToken")
      if (!refreshToken) return false

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        await SecureStore.setItemAsync("accessToken", data.accessToken)
        setUser(data.user)
        return true
      }
      return false
    } catch (error) {
      console.error("Token refresh error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync("refreshToken")
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        })
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      await SecureStore.deleteItemAsync("accessToken")
      await SecureStore.deleteItemAsync("refreshToken")
      setUser(null)
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, refreshToken }}>{children}</AuthContext.Provider>
}
