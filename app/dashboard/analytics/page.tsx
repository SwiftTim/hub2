import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BarChart3, Users, Download, FileText, Target } from "lucide-react"
import Link from "next/link"
import { subDays, startOfWeek } from "date-fns"

export default async function AnalyticsDashboardPage() {
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

  // Get user profile to determine role
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!userProfile || userProfile.role !== "lecturer") {
    redirect("/dashboard")
  }

  // Get lecturer's units
  const { data: units } = await supabase.from("units").select("id, unit_code, unit_name").eq("lecturer_id", user.id)
  const unitIds = units?.map((u) => u.id) || []

  // Get comprehensive analytics data
  const [
    { data: enrollments },
    { data: assignments },
    { data: assessments },
    { data: resources },
    { data: submissions },
    { data: attempts },
    { data: downloads },
    { data: messages },
  ] = await Promise.all([
    supabase.from("unit_enrollments").select("*, units(unit_code), users(full_name)").in("unit_id", unitIds),
    supabase.from("assignments").select("*, assignment_submissions(*)").in("unit_id", unitIds),
    supabase.from("assessments").select("*, assessment_attempts(*)").in("unit_id", unitIds),
    supabase.from("learning_resources").select("*, resource_downloads(*)").in("unit_id", unitIds),
    supabase.from("assignment_submissions").select("*, assignments(unit_id, title)").in("assignments.unit_id", unitIds),
    supabase.from("assessment_attempts").select("*, assessments(unit_id, title)").in("assessments.unit_id", unitIds),
    supabase
      .from("resource_downloads")
      .select("*, learning_resources(unit_id)")
      .in("learning_resources.unit_id", unitIds),
    supabase
      .from("messages")
      .select("*, unit_groups(unit_id)")
      .in("unit_groups.unit_id", unitIds)
      .gte("created_at", subDays(new Date(), 7).toISOString()),
  ])

  // Calculate key metrics
  const totalStudents = enrollments?.length || 0
  const totalAssignments = assignments?.length || 0
  const totalAssessments = assessments?.length || 0
  const totalResources = resources?.length || 0

  const submissionRate =
    totalAssignments > 0 ? Math.round(((submissions?.length || 0) / (totalAssignments * totalStudents)) * 100) : 0
  const assessmentParticipation =
    totalAssessments > 0 ? Math.round(((attempts?.length || 0) / (totalAssessments * totalStudents)) * 100) : 0
  const resourceEngagement = Math.round(((downloads?.length || 0) / Math.max(totalResources * totalStudents, 1)) * 100)

  // Recent activity (last 7 days)
  const weekStart = startOfWeek(new Date())
  const recentSubmissions = submissions?.filter((s) => new Date(s.submitted_at) >= weekStart).length || 0
  const recentAttempts = attempts?.filter((a) => new Date(a.started_at) >= weekStart).length || 0
  const recentMessages = messages?.length || 0

  // Performance analytics
  const gradedSubmissions = submissions?.filter((s) => s.status === "graded" && s.score !== null) || []
  const averageScore =
    gradedSubmissions.length > 0
      ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length)
      : 0

  const gradedAttempts = attempts?.filter((a) => a.status === "graded" && a.score !== null) || []
  const averageAssessmentScore =
    gradedAttempts.length > 0
      ? Math.round(gradedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / gradedAttempts.length)
      : 0

  // Unit performance breakdown
  const unitPerformance =
    units?.map((unit) => {
      const unitEnrollments = enrollments?.filter((e) => e.unit_id === unit.id).length || 0
      const unitSubmissions = submissions?.filter((s) => s.assignments?.unit_id === unit.id).length || 0
      const unitAttempts = attempts?.filter((a) => a.assessments?.unit_id === unit.id).length || 0
      const unitDownloads = downloads?.filter((d) => d.learning_resources?.unit_id === unit.id).length || 0

      return {
        ...unit,
        enrollments: unitEnrollments,
        submissions: unitSubmissions,
        attempts: unitAttempts,
        downloads: unitDownloads,
        engagement: Math.round(
          ((unitSubmissions + unitAttempts + unitDownloads) / Math.max(unitEnrollments * 3, 1)) * 100,
        ),
      }
    }) || []

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
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <h1 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h1>
              </div>
            </div>
            <Link href="/dashboard/analytics/reports">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <FileText className="h-4 w-4 mr-2" />
                Generate Reports
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Overview</h1>
          <p className="text-gray-600">Comprehensive insights into student engagement and performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Across all units</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submission Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissionRate}%</div>
              <p className="text-xs text-muted-foreground">Assignment completion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessment Participation</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assessmentParticipation}%</div>
              <p className="text-xs text-muted-foreground">Students taking assessments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resource Engagement</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resourceEngagement}%</div>
              <p className="text-xs text-muted-foreground">Resource download rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
              <CardDescription>Student engagement across your units</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{recentSubmissions}</div>
                  <p className="text-sm text-gray-600">New Submissions</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{recentAttempts}</div>
                  <p className="text-sm text-gray-600">Assessment Attempts</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{recentMessages}</div>
                  <p className="text-sm text-gray-600">Group Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Average scores across assessments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Assignment Average</span>
                <span className="font-semibold text-blue-600">{averageScore}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Assessment Average</span>
                <span className="font-semibold text-green-600">{averageAssessmentScore}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Graded Items</span>
                <span className="font-semibold text-gray-900">{gradedSubmissions.length + gradedAttempts.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unit Performance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Unit Performance Breakdown</CardTitle>
            <CardDescription>Engagement and activity metrics by unit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unitPerformance.map((unit) => (
                <div key={unit.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{unit.unit_code}</h3>
                      <p className="text-sm text-gray-600">{unit.unit_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-blue-600">{unit.enrollments}</div>
                      <div className="text-gray-500">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-600">{unit.submissions}</div>
                      <div className="text-gray-500">Submissions</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-purple-600">{unit.attempts}</div>
                      <div className="text-gray-500">Attempts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-orange-600">{unit.downloads}</div>
                      <div className="text-gray-500">Downloads</div>
                    </div>
                    <Badge
                      variant={unit.engagement >= 70 ? "default" : unit.engagement >= 50 ? "secondary" : "destructive"}
                    >
                      {unit.engagement}% Engagement
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {totalStudents === 0 && (
          <Card className="mt-8">
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Available</h3>
              <p className="text-gray-600 mb-4">Start by creating units and enrolling students to see analytics.</p>
              <Link href="/dashboard/units">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Units
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
