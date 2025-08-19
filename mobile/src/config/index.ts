import { __DEV__ } from "react-native"

export const API_BASE_URL = __DEV__ ? "http://localhost:5000" : "https://your-production-api.com"

export const APP_CONFIG = {
  name: "Academic Hub",
  version: "1.0.0",
  supportEmail: "support@academichub.edu",
}
