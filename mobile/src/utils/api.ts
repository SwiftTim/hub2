import * as SecureStore from "expo-secure-store"
import { API_BASE_URL } from "../config"

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const token = await SecureStore.getItemAsync("accessToken")

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await refreshToken()
        if (refreshed) {
          // Retry the request with new token
          const newToken = await SecureStore.getItemAsync("accessToken")
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${newToken}`,
          }
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, config)
          if (retryResponse.ok) {
            return await retryResponse.json()
          }
        }
        throw new Error("Authentication failed")
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API request error:", error)
    throw error
  }
}

async function refreshToken(): Promise<boolean> {
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
      return true
    }
    return false
  } catch (error) {
    console.error("Token refresh error:", error)
    return false
  }
}
