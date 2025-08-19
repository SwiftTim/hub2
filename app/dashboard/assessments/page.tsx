import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, FileText, Shield } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, format, isAfter, isBefore } from "date-fns"

export default async function AssessmentsPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Connect Supabase to get started</h1>
      </div>
    )
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Get user's enrolled units
  const { data: enrollments } = await supabase
    .from("unit_enrollments")
    .select("unit_id")
    .eq("student_id", user.id)
    .eq("status", "active")

  const enrolledUnitIds = enrollments?.map((e) => e.unit_id) || []

  // Get assessments for enrolled units
  const { data: assessments } = await supabase
    .from("assessments")
    .select(`
      *,
      units(unit_code, unit_name),
      assessment_attempts(id, status, score, submitted_at)
    `)
    .in("unit_id", enrolledUnitIds)
    .order("start_time", { ascending: true })

  // Get user's attempts
  const { data: attempts } = await supabase
    .from("assessment_attempts")
    .select("assessment_id, status, score, submitted_at")
    .eq("student_id", user.id)

  const attemptsByAssessment =
    attempts?.reduce(
      (acc, attempt) => {
        acc[attempt.assessment_id] = attempt
        return acc
      },
      {} as Record<string, any>,
    ) || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-green-600" />
                <h1 className="text-lg font-semibold text-gray-900">Assessments</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Assessments</h1>
          <p className="text-gray-600">Complete your CATs and track your progress</p>
        </div>

        {/* Assessments Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments?.map((assessment) => {
            const now = new Date()
            const startTime = new Date(assessment.start_time)
            const endTime = new Date(assessment.end_time)
            const attempt = attemptsByAssessment[assessment.id]

            const isUpcoming = isBefore(now, startTime)
            const isActive = isAfter(now, startTime) && isBefore(now, endTime)
            const isExpired = isAfter(now, endTime)
            const isCompleted = attempt?.status === "submitted" || attempt?.status === "graded"

            let status = "upcoming"
            let statusColor = "secondary"
            let actionButton = null

            if (isCompleted) {
              status = "completed"
              statusColor = "default"
            } else if (isExpired) {
              status = "expired"
              statusColor = "destructive"
            } else if (isActive) {
              status = "active"
              statusColor = "default"
              actionButton = (
                <Link href={`/dashboard/assessments/${assessment.id}/take`}>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    {attempt?.status === "in_progress" ? "Continue Assessment" : "Start Assessment"}
                  </Button>
                </Link>
              )
            }

            return (
              <Card key={assessment.id} className="bg-white shadow-sm border hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs">
                      {assessment.units?.unit_code}
                    </Badge>
                    <Badge variant={statusColor as any} className="text-xs">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{assessment.title}</CardTitle>
                  <CardDescription className="text-sm">{assessment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Duration:</span>
                      <span className="font-medium flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {assessment.duration_minutes} mins
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total Marks:</span>
                      <span className="font-medium">{assessment.total_marks}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Available:</span>
                      <span className="font-medium">
                        {format(startTime, "MMM dd, HH:mm")} - {format(endTime, "MMM dd, HH:mm")}
                      </span>
                    </div>

                    {assessment.anti_cheat_enabled && (
                      <div className="flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        <Shield className="h-3 w-3 mr-1" />
                        Anti-cheat monitoring enabled
                      </div>
                    )}

                    {isCompleted && attempt?.score !== null && (
                      <div className="flex justify-between text-sm font-medium text-green-600">
                        <span>Score:</span>
                        <span>
                          {attempt.score}/{assessment.total_marks}
                        </span>
                      </div>
                    )}

                    {actionButton || (
                      <Button disabled className="w-full" variant={isCompleted ? "outline" : "secondary"}>
                        {isCompleted
                          ? "Completed"
                          : isExpired
                            ? "Expired"
                            : isUpcoming
                              ? `Available ${formatDistanceToNow(startTime, { addSuffix: true })}`
                              : "Not Available"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {assessments?.length === 0 && (
          <Card className="bg-white shadow-sm border">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessments Available</h3>
              <p className="text-gray-600">Assessments will appear here when your lecturers create them.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
