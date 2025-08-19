"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Clock, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Question {
  id: string
  question_text: string
  question_type: string
  options: string[] | null
  marks: number
  order_index: number
}

interface AssessmentInterfaceProps {
  assessment: any
  attempt: any
  questions: Question[]
  user: any
}

export default function AssessmentInterface({ assessment, attempt, questions, user }: AssessmentInterfaceProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(attempt.answers || {})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "error">("saved")
  const [leaveCount, setLeaveCount] = useState(0)
  const [copyPasteCount, setCopyPasteCount] = useState(0)
  const [suspiciousActivity, setSuspiciousActivity] = useState<string[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [keyboardActivity, setKeyboardActivity] = useState(0)
  const router = useRouter()
  const autoSaveRef = useRef<NodeJS.Timeout>()
  const supabase = createClient()

  // Calculate time remaining
  useEffect(() => {
    const startTime = new Date(attempt.started_at).getTime()
    const durationMs = assessment.duration_minutes * 60 * 1000
    const endTime = startTime + durationMs

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, endTime - now)
      setTimeRemaining(remaining)

      if (remaining === 0) {
        handleSubmit(true) // Auto-submit when time runs out
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [attempt.started_at, assessment.duration_minutes])

  // Auto-save answers
  useEffect(() => {
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current)
    }

    setAutoSaveStatus("saving")
    autoSaveRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase.from("assessment_attempts").update({ answers }).eq("id", attempt.id)

        setAutoSaveStatus(error ? "error" : "saved")
      } catch (error) {
        setAutoSaveStatus("error")
      }
    }, 2000)

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current)
      }
    }
  }, [answers, attempt.id])

  // Enhanced anti-cheating measures
  useEffect(() => {
    if (!assessment.anti_cheat_enabled) return

    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } catch (error) {
        console.log("Fullscreen not supported")
      }
    }

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFullscreen)

      if (!isCurrentlyFullscreen && assessment.anti_cheat_enabled) {
        setSuspiciousActivity((prev) => [...prev, `Exited fullscreen at ${new Date().toLocaleTimeString()}`])
        alert("Please return to fullscreen mode to continue the assessment.")
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setLeaveCount((prev) => prev + 1)
        setSuspiciousActivity((prev) => [...prev, `Left tab at ${new Date().toLocaleTimeString()}`])
        alert("You have left the assessment tab. This action has been logged.")
      }
    }

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault()
      setCopyPasteCount((prev) => prev + 1)
      setSuspiciousActivity((prev) => [...prev, `Copy/paste attempt at ${new Date().toLocaleTimeString()}`])
      alert("Copying and pasting is disabled during this assessment.")
    }

    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault()
      setSuspiciousActivity((prev) => [...prev, `Right-click attempt at ${new Date().toLocaleTimeString()}`])
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common shortcuts
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "a" || e.key === "s" || e.key === "f")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault()
        setSuspiciousActivity((prev) => [...prev, `Blocked shortcut: ${e.key} at ${new Date().toLocaleTimeString()}`])
      }
      setKeyboardActivity((prev) => prev + 1)
    }

    // Initialize fullscreen for secure assessments
    if (assessment.anti_cheat_enabled) {
      enterFullscreen()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("copy", handleCopyPaste)
    document.addEventListener("paste", handleCopyPaste)
    document.addEventListener("contextmenu", handleRightClick)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("copy", handleCopyPaste)
      document.removeEventListener("paste", handleCopyPaste)
      document.removeEventListener("contextmenu", handleRightClick)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [assessment.anti_cheat_enabled])

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleSubmit = async (isAutoSubmit = false) => {
    if (isSubmitting) return

    if (!isAutoSubmit) {
      const confirmSubmit = window.confirm(
        "Are you sure you want to submit your assessment? You cannot change your answers after submission.",
      )
      if (!confirmSubmit) return
    }

    setIsSubmitting(true)

    try {
      // Calculate score for auto-gradable questions
      let totalScore = 0
      questions.forEach((question) => {
        const userAnswer = answers[question.id]
        if (question.question_type === "multiple_choice" || question.question_type === "true_false") {
          // Auto-grade these question types
          // Note: In production, this should be done server-side for security
          if (userAnswer === question.correct_answer) {
            totalScore += question.marks
          }
        }
      })

      const { error } = await supabase
        .from("assessment_attempts")
        .update({
          answers,
          submitted_at: new Date().toISOString(),
          status: "submitted",
          score: totalScore,
          time_taken: Math.round((assessment.duration_minutes * 60 * 1000 - timeRemaining) / 60000),
          tab_switches: leaveCount,
          copy_paste_attempts: copyPasteCount,
          suspicious_activities: suspiciousActivity,
          keyboard_activity_count: keyboardActivity,
        })
        .eq("id", attempt.id)

      if (error) {
        throw error
      }

      // Exit fullscreen on submission
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }

      router.push("/dashboard/assessments")
    } catch (error) {
      console.error("Submit error:", error)
      alert("Failed to submit assessment. Please try again.")
      setIsSubmitting(false)
    }
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const renderQuestion = (question: Question) => {
    const answer = answers[question.id] || ""

    switch (question.question_type) {
      case "multiple_choice":
        return (
          <RadioGroup
            value={answer}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "true_false":
        return (
          <RadioGroup
            value={answer}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="True" id={`${question.id}-true`} />
              <Label htmlFor={`${question.id}-true`} className="cursor-pointer">
                True
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="False" id={`${question.id}-false`} />
              <Label htmlFor={`${question.id}-false`} className="cursor-pointer">
                False
              </Label>
            </div>
          </RadioGroup>
        )

      case "short_answer":
        return (
          <Input
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full"
          />
        )

      case "essay":
        return (
          <Textarea
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Write your essay answer here..."
            className="w-full min-h-[200px]"
          />
        )

      default:
        return <div>Unsupported question type</div>
    }
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
            <p className="text-gray-600">This assessment has no questions configured.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{assessment.title}</h1>
              <p className="text-sm text-gray-600">{assessment.units?.unit_code}</p>
            </div>
            <div className="flex items-center space-x-4">
              {assessment.anti_cheat_enabled && (
                <>
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <Shield className="h-3 w-3 mr-1" />
                    Secure Mode
                  </Badge>
                  {!isFullscreen && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Not Fullscreen
                    </Badge>
                  )}
                  {leaveCount > 0 && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Tab Switches: {leaveCount}
                    </Badge>
                  )}
                  {copyPasteCount > 0 && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Copy/Paste: {copyPasteCount}
                    </Badge>
                  )}
                </>
              )}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-red-500" />
                <span className={`font-mono text-lg ${timeRemaining < 300000 ? "text-red-500" : "text-gray-900"}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                {autoSaveStatus === "saving" && <span>Saving...</span>}
                {autoSaveStatus === "saved" && <CheckCircle className="h-3 w-3 text-green-500" />}
                {autoSaveStatus === "error" && <AlertTriangle className="h-3 w-3 text-red-500" />}
              </div>
            </div>
          </div>
        </div>
      </header>

      {assessment.anti_cheat_enabled && !isFullscreen && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Please enable fullscreen mode for secure assessment</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await document.documentElement.requestFullscreen()
                  } catch (error) {
                    console.log("Fullscreen not supported")
                  }
                }}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                Enable Fullscreen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-sm">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
                  {questions.map((_, index) => (
                    <Button
                      key={index}
                      variant={
                        currentQuestion === index ? "default" : answers[questions[index].id] ? "outline" : "ghost"
                      }
                      size="sm"
                      onClick={() => setCurrentQuestion(index)}
                      className={`h-8 w-8 p-0 ${
                        answers[questions[index].id] ? "bg-green-50 border-green-200 text-green-700" : ""
                      }`}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                    <span>Answered</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Question {currentQuestion + 1} of {questions.length}
                    </CardTitle>
                    <Badge variant="secondary" className="mt-2">
                      {questions[currentQuestion].marks} marks
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose max-w-none">
                  <p className="text-gray-900 leading-relaxed">{questions[currentQuestion].question_text}</p>
                </div>

                <div>{renderQuestion(questions[currentQuestion])}</div>

                <div className="flex justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>

                  <div className="space-x-2">
                    {currentQuestion < questions.length - 1 ? (
                      <Button
                        onClick={() => setCurrentQuestion(currentQuestion + 1)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSubmit()}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Assessment"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
