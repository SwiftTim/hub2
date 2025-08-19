"use client"

import { useEffect, useState } from "react"
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native"
import { Card, Title, Paragraph, Button, Avatar } from "react-native-paper"
import { useAuth } from "../contexts/AuthContext"
import { apiRequest } from "../utils/api"

interface DashboardData {
  recentAssignments: any[]
  upcomingAssessments: any[]
  recentMessages: any[]
  stats: {
    totalUnits: number
    pendingAssignments: number
    averageGrade: number
  }
}

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const data = await apiRequest("/api/dashboard")
      setDashboardData(data)
    } catch (error) {
      console.error("Dashboard load error:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboardData()
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Card style={styles.loadingCard}>
          <Card.Content>
            <Paragraph>Loading dashboard...</Paragraph>
          </Card.Content>
        </Card>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome Card */}
      <Card style={styles.card}>
        <Card.Content style={styles.welcomeContent}>
          <Avatar.Text size={60} label={`${user?.firstName?.[0]}${user?.lastName?.[0]}`} style={styles.avatar} />
          <View style={styles.welcomeText}>
            <Title>Welcome back, {user?.firstName}!</Title>
            <Paragraph>{user?.role === "student" ? "Student" : "Lecturer"}</Paragraph>
          </View>
          <Button mode="outlined" onPress={() => navigation.navigate("Profile")} style={styles.profileButton}>
            Profile
          </Button>
        </Card.Content>
      </Card>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statNumber}>{dashboardData?.stats.totalUnits || 0}</Title>
            <Paragraph>Enrolled Units</Paragraph>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statNumber}>{dashboardData?.stats.pendingAssignments || 0}</Title>
            <Paragraph>Pending Tasks</Paragraph>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statNumber}>{dashboardData?.stats.averageGrade || 0}%</Title>
            <Paragraph>Average Grade</Paragraph>
          </Card.Content>
        </Card>
      </View>

      {/* Recent Assignments */}
      <Card style={styles.card}>
        <Card.Title title="Recent Assignments" />
        <Card.Content>
          {dashboardData?.recentAssignments?.length ? (
            dashboardData.recentAssignments.slice(0, 3).map((assignment, index) => (
              <View key={index} style={styles.listItem}>
                <Paragraph style={styles.itemTitle}>{assignment.title}</Paragraph>
                <Paragraph style={styles.itemSubtitle}>Due: {assignment.dueDate}</Paragraph>
              </View>
            ))
          ) : (
            <Paragraph>No recent assignments</Paragraph>
          )}
          <Button mode="text" onPress={() => navigation.navigate("AssignmentsTab")} style={styles.viewAllButton}>
            View All Assignments
          </Button>
        </Card.Content>
      </Card>

      {/* Upcoming Assessments */}
      <Card style={styles.card}>
        <Card.Title title="Upcoming Tests" />
        <Card.Content>
          {dashboardData?.upcomingAssessments?.length ? (
            dashboardData.upcomingAssessments.slice(0, 3).map((assessment, index) => (
              <View key={index} style={styles.listItem}>
                <Paragraph style={styles.itemTitle}>{assessment.title}</Paragraph>
                <Paragraph style={styles.itemSubtitle}>
                  {assessment.scheduledDate} • {assessment.duration} mins
                </Paragraph>
              </View>
            ))
          ) : (
            <Paragraph>No upcoming tests</Paragraph>
          )}
          <Button mode="text" onPress={() => navigation.navigate("AssessmentsTab")} style={styles.viewAllButton}>
            View All Tests
          </Button>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Title title="Quick Actions" />
        <Card.Content>
          <View style={styles.quickActions}>
            <Button mode="contained" onPress={() => navigation.navigate("UnitsTab")} style={styles.actionButton}>
              Browse Units
            </Button>
            <Button mode="contained" onPress={() => navigation.navigate("Chat")} style={styles.actionButton}>
              Open Chat
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  loadingCard: {
    marginTop: 50,
  },
  welcomeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#2563eb",
  },
  welcomeText: {
    flex: 1,
    marginLeft: 16,
  },
  profileButton: {
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
    textAlign: "center",
  },
  listItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  itemTitle: {
    fontWeight: "600",
    fontSize: 16,
  },
  itemSubtitle: {
    color: "#666",
    fontSize: 14,
  },
  viewAllButton: {
    marginTop: 8,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
})
