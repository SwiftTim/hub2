import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileText, Calendar, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface PageProps {
  params: {
    assignmentId: string
  }
}

export default async function ViewSubmissionPage({ params }: PageProps) {
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

  // Get assignment details
  const { data: assignment } = await supabase
    .from("assignments")
    .select(`
      *,
      units(unit_code, unit_name)
    `)
    .eq("id", params.assignmentId)
    .single()

  if (!assignment) {
    redirect("/dashboard/assignments")
  }

  // Get submission
  const { data: submission } = await supabase
    .from("assignment_submissions")
    .select("*")
    .eq("assignment_id", params.assignmentId)
    .eq("student_id", user.id)
    .single()

  if (!submission) {
    redirect("/dashboard/assignments")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/assignments">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Assignments
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Assignment Submission</h1>
                <p className="text-sm text-gray-600">{assignment.units?.unit_code}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Assignment Details */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">{assignment.title}</CardTitle>
                <CardDescription>{assignment.units?.unit_name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-medium flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(assignment.due_date), "MMM dd, HH:mm")}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-medium flex items-center text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {format(new Date(submission.submitted_at), "MMM dd, HH:mm")}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={submission.status === "graded" ? "default" : "outline"} className="text-xs">
                    {submission.status === "graded" ? "Graded" : "Submitted"}
                  </Badge>
                </div>

                {submission.status === "graded" && submission.score !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Score:</span>
                    <span className="font-medium text-green-600">
                      {submission.score}/{assignment.total_marks}
                    </span>
                  </div>
                )}

                {submission.graded_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Graded:</span>
                    <span className="font-medium">{format(new Date(submission.graded_at), "MMM dd, HH:mm")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Submission Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Submission */}
            {submission.file_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    File Submission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{submission.file_name}</p>
                        <p className="text-sm text-gray-600">Uploaded file</p>
                      </div>
                    </div>
                    <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Text Submission */}
            {submission.submission_text && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Text Submission</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-900">
                      {submission.submission_text}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feedback */}
            {submission.feedback && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-blue-600">Lecturer Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 whitespace-pre-wrap text-gray-900">
                      {submission.feedback}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {submission.status === "submitted" && !submission.feedback && (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Awaiting Review</h3>
                  <p className="text-gray-600">Your submission is being reviewed by your lecturer.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
