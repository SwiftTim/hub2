import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, FileText, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, format, isAfter } from "date-fns"

export default async function AssignmentsPage() {
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

  // Get user's enrolled units
  const { data: enrollments } = await supabase
    .from("unit_enrollments")
    .select("unit_id")
    .eq("student_id", user.id)
    .eq("status", "active")

  const enrolledUnitIds = enrollments?.map((e) => e.unit_id) || []

  // Get assignments for enrolled units
  const { data: assignments } = await supabase
    .from("assignments")
    .select(`
      *,
      units(unit_code, unit_name)
    `)
    .in("unit_id", enrolledUnitIds)
    .order("due_date", { ascending: true })

  // Get user's submissions
  const { data: submissions } = await supabase
    .from("assignment_submissions")
    .select("assignment_id, status, score, submitted_at, feedback")
    .eq("student_id", user.id)

  const submissionsByAssignment =
    submissions?.reduce(
      (acc, submission) => {
        acc[submission.assignment_id] = submission
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
                <FileText className="h-6 w-6 text-purple-600" />
                <h1 className="text-lg font-semibold text-gray-900">Assignments</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Assignments</h1>
          <p className="text-gray-600">Submit assignments and track your progress</p>
        </div>

        {/* Assignments Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments?.map((assignment) => {
            const now = new Date()
            const dueDate = new Date(assignment.due_date)
            const submission = submissionsByAssignment[assignment.id]

            const isOverdue = isAfter(now, dueDate) && !submission
            const isSubmitted = !!submission
            const isGraded = submission?.status === "graded"
            const daysLate = isOverdue ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

            let statusColor = "secondary"
            let statusText = "Not Started"

            if (isGraded) {
              statusColor = "default"
              statusText = "Graded"
            } else if (isSubmitted) {
              statusColor = "outline"
              statusText = "Submitted"
            } else if (isOverdue) {
              statusColor = "destructive"
              statusText = `${daysLate} day${daysLate > 1 ? "s" : ""} late`
            } else {
              const timeUntilDue = formatDistanceToNow(dueDate, { addSuffix: true })
              statusText = `Due ${timeUntilDue}`
            }

            return (
              <Card key={assignment.id} className="bg-white shadow-sm border hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs">
                      {assignment.units?.unit_code}
                    </Badge>
                    <Badge variant={statusColor as any} className="text-xs">
                      {statusText}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <CardDescription className="text-sm line-clamp-2">{assignment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Due Date:</span>
                      <span className={`font-medium flex items-center ${isOverdue ? "text-red-600" : ""}`}>
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(dueDate, "MMM dd, HH:mm")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total Marks:</span>
                      <span className="font-medium">{assignment.total_marks}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Format:</span>
                      <span className="font-medium capitalize">
                        {assignment.submission_format === "both" ? "File + Text" : assignment.submission_format}
                      </span>
                    </div>

                    {isOverdue && !isSubmitted && assignment.late_submission_penalty > 0 && (
                      <div className="flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {assignment.late_submission_penalty}% penalty per day
                      </div>
                    )}

                    {isGraded && submission?.score !== null && (
                      <div className="flex justify-between text-sm font-medium text-green-600">
                        <span>Score:</span>
                        <span>
                          {submission.score}/{assignment.total_marks}
                        </span>
                      </div>
                    )}

                    <div className="pt-2">
                      {isSubmitted ? (
                        <Link href={`/dashboard/assignments/${assignment.id}/view`}>
                          <Button variant="outline" className="w-full bg-transparent">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            View Submission
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/dashboard/assignments/${assignment.id}/submit`}>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                            <FileText className="h-4 w-4 mr-2" />
                            {isOverdue ? "Submit Late" : "Submit Assignment"}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {assignments?.length === 0 && (
          <Card className="bg-white shadow-sm border">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Available</h3>
              <p className="text-gray-600">Assignments will appear here when your lecturers create them.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
