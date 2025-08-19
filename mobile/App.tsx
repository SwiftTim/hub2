"use client"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { Provider as PaperProvider } from "react-native-paper"
import { StatusBar } from "expo-status-bar"
import { AuthProvider, useAuth } from "./src/contexts/AuthContext"
import { SocketProvider } from "./src/contexts/SocketContext"
import AuthNavigator from "./src/navigation/AuthNavigator"
import MainNavigator from "./src/navigation/MainNavigator"
import LoadingScreen from "./src/screens/LoadingScreen"
import { theme } from "./src/theme"

const Stack = createStackNavigator()

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <NavigationContainer>
      {user ? (
        <SocketProvider>
          <MainNavigator />
        </SocketProvider>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppContent />
      </AuthProvider>
    </PaperProvider>
  )
}
