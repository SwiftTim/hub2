import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { Ionicons } from "@expo/vector-icons"
import DashboardScreen from "../screens/DashboardScreen"
import UnitsScreen from "../screens/UnitsScreen"
import ChatScreen from "../screens/ChatScreen"
import AssignmentsScreen from "../screens/AssignmentsScreen"
import AssessmentsScreen from "../screens/AssessmentsScreen"
import ResourcesScreen from "../screens/ResourcesScreen"
import ProfileScreen from "../screens/ProfileScreen"
import TakeAssessmentScreen from "../screens/TakeAssessmentScreen"
import SubmitAssignmentScreen from "../screens/SubmitAssignmentScreen"
import GroupChatScreen from "../screens/GroupChatScreen"

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  )
}

function UnitsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Units" component={UnitsScreen} />
      <Stack.Screen name="Resources" component={ResourcesScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
    </Stack.Navigator>
  )
}

function AssignmentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Assignments" component={AssignmentsScreen} />
      <Stack.Screen name="SubmitAssignment" component={SubmitAssignmentScreen} />
    </Stack.Navigator>
  )
}

function AssessmentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Assessments" component={AssessmentsScreen} />
      <Stack.Screen name="TakeAssessment" component={TakeAssessmentScreen} />
    </Stack.Navigator>
  )
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === "DashboardTab") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "UnitsTab") {
            iconName = focused ? "school" : "school-outline"
          } else if (route.name === "Chat") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline"
          } else if (route.name === "AssignmentsTab") {
            iconName = focused ? "document-text" : "document-text-outline"
          } else if (route.name === "AssessmentsTab") {
            iconName = focused ? "clipboard" : "clipboard-outline"
          } else {
            iconName = "ellipse"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="UnitsTab" component={UnitsStack} options={{ tabBarLabel: "Units" }} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="AssignmentsTab" component={AssignmentsStack} options={{ tabBarLabel: "Assignments" }} />
      <Tab.Screen name="AssessmentsTab" component={AssessmentsStack} options={{ tabBarLabel: "Tests" }} />
    </Tab.Navigator>
  )
}
