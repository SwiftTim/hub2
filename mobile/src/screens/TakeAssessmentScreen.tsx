"use client"

import { useState, useEffect } from "react"
import { View, ScrollView, StyleSheet, Alert, BackHandler } from "react-native"
import { Card, Title, Paragraph, Button, RadioButton, TextInput, ProgressBar } from "react-native-paper"
import { useSocket } from "../contexts/SocketContext"
import { useAuth } from "../contexts/AuthContext"
import { apiRequest } from "../utils/api"

interface Question {
  id: string
  type: "multiple_choice" | "essay" | "true_false"
  question: string
  options?: string[]
  points: number
}

interface Assessment {
  id: string
  title: string
  duration: number
  questions: Question[]
  antiCheatEnabled: boolean
}

export default function TakeAssessmentScreen({ route, navigation }: any) {
  const { assessmentId } = route.params
  const { user } = useAuth()
  const { socket } = useSocket()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    loadAssessment()

    // Disable back button during assessment
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      logSuspiciousActivity("back_button_pressed")
      return true // Prevent back navigation
    })

    return () => {
      backHandler.remove()
    }
  }, [])

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeRemaining === 0 && assessment) {
      // Auto-submit when time expires
      handleSubmit()
    }
  }, [timeRemaining, assessment])

  const loadAssessment = async () => {
    try {
      const data = await apiRequest(`/api/cats/${assessmentId}`)
      setAssessment(data)
      setTimeRemaining(data.duration * 60) // Convert minutes to seconds

      if (data.antiCheatEnabled) {
        setupAntiCheatMonitoring()
      }
    } catch (error) {
      console.error("Load assessment error:", error)
      Alert.alert("Error", "Failed to load assessment")
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  const setupAntiCheatMonitoring = () => {
    // Monitor app state changes
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "background") {
        logSuspiciousActivity("app_backgrounded")
      }
    }

    // Log initial activity
    logSuspiciousActivity("assessment_started")
  }

  const logSuspiciousActivity = (activityType: string, details?: any) => {
    if (socket && assessment?.antiCheatEnabled) {
      socket.emit("cat-activity", {
        assessmentId: assessment.id,
        activityType,
        details: details || {},
        riskLevel: getRiskLevel(activityType),
        timestamp: new Date().toISOString(),
      })
    }
  }

  const getRiskLevel = (activityType: string): "low" | "medium" | "high" => {
    const highRiskActivities = ["app_backgrounded", "back_button_pressed", "copy_attempt"]
    const mediumRiskActivities = ["long_pause", "rapid_clicking"]

    if (highRiskActivities.includes(activityType)) return "high"
    if (mediumRiskActivities.includes(activityType)) return "medium"
    return "low"
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleSubmit = async () => {
    if (submitting) return

    Alert.alert("Submit Assessment", "Are you sure you want to submit your answers? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Submit", onPress: confirmSubmit },
    ])
  }

  const confirmSubmit = async () => {
    setSubmitting(true)

    try {
      await apiRequest(`/api/cats/${assessmentId}/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers,
          timeSpent: assessment!.duration * 60 - timeRemaining,
        }),
      })

      logSuspiciousActivity("assessment_submitted")

      Alert.alert("Assessment Submitted", "Your answers have been submitted successfully.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ])
    } catch (error) {
      console.error("Submit error:", error)
      Alert.alert("Error", "Failed to submit assessment. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const renderQuestion = (question: Question, index: number) => {
    const answer = answers[question.id] || ""

    return (
      <Card key={question.id} style={styles.questionCard}>
        <Card.Content>
          <Title style={styles.questionTitle}>
            Question {index + 1} ({question.points} points)
          </Title>
          <Paragraph style={styles.questionText}>{question.question}</Paragraph>

          {question.type === "multiple_choice" && question.options && (
            <RadioButton.Group onValueChange={(value) => handleAnswerChange(question.id, value)} value={answer}>
              {question.options.map((option, optionIndex) => (
                <View key={optionIndex} style={styles.optionContainer}>
                  <RadioButton value={option} />
                  <Paragraph style={styles.optionText}>{option}</Paragraph>
                </View>
              ))}
            </RadioButton.Group>
          )}

          {question.type === "true_false" && (
            <RadioButton.Group onValueChange={(value) => handleAnswerChange(question.id, value)} value={answer}>
              <View style={styles.optionContainer}>
                <RadioButton value="true" />
                <Paragraph style={styles.optionText}>True</Paragraph>
              </View>
              <View style={styles.optionContainer}>
                <RadioButton value="false" />
                <Paragraph style={styles.optionText}>False</Paragraph>
              </View>
            </RadioButton.Group>
          )}

          {question.type === "essay" && (
            <TextInput
              value={answer}
              onChangeText={(text) => handleAnswerChange(question.id, text)}
              placeholder="Type your answer here..."
              multiline
              numberOfLines={6}
              style={styles.essayInput}
            />
          )}
        </Card.Content>
      </Card>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Card style={styles.loadingCard}>
          <Card.Content>
            <Paragraph>Loading assessment...</Paragraph>
          </Card.Content>
        </Card>
      </View>
    )
  }

  if (!assessment) {
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Paragraph>Assessment not found</Paragraph>
          </Card.Content>
        </Card>
      </View>
    )
  }

  const progress = Object.keys(answers).length / assessment.questions.length

  return (
    <View style={styles.container}>
      {/* Header with timer and progress */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <View>
              <Title style={styles.assessmentTitle}>{assessment.title}</Title>
              <Paragraph>Time Remaining: {formatTime(timeRemaining)}</Paragraph>
            </View>
            <View style={styles.progressContainer}>
              <Paragraph>Progress: {Math.round(progress * 100)}%</Paragraph>
              <ProgressBar progress={progress} color="#2563eb" style={styles.progressBar} />
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Questions */}
      <ScrollView style={styles.questionsContainer}>
        {assessment.questions.map((question, index) => renderQuestion(question, index))}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={submitting}
          loading={submitting}
          style={styles.submitButton}
        >
          Submit Assessment
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingCard: {
    margin: 16,
    marginTop: 50,
  },
  errorCard: {
    margin: 16,
    marginTop: 50,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  assessmentTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  progressContainer: {
    alignItems: "flex-end",
    minWidth: 120,
  },
  progressBar: {
    width: 120,
    marginTop: 4,
  },
  questionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  questionCard: {
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
  },
  questionText: {
    fontSize: 16,
    marginVertical: 12,
    lineHeight: 24,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  optionText: {
    marginLeft: 8,
    flex: 1,
  },
  essayInput: {
    marginTop: 8,
    backgroundColor: "white",
  },
  submitContainer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 8,
  },
})
