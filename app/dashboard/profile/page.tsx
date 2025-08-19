import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, User, Mail, Building, Calendar, BadgeIcon as IdCard } from "lucide-react"
import { signOut } from "@/lib/actions"
import Link from "next/link"

export default async function ProfilePage() {
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

  // Get user profile with additional stats
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Get user statistics based on role
  let stats = null
  if (profile?.role === "student") {
    const [enrollments, submissions, attempts] = await Promise.all([
      supabase.from("unit_enrollments").select("*").eq("student_id", user.id),
      supabase.from("assignment_submissions").select("*").eq("student_id", user.id),
      supabase.from("assessment_attempts").select("*").eq("student_id", user.id),
    ])

    stats = {
      enrolledUnits: enrollments.data?.length || 0,
      assignmentSubmissions: submissions.data?.length || 0,
      assessmentAttempts: attempts.data?.length || 0,
    }
  } else if (profile?.role === "lecturer") {
    const [units, resources, assessments] = await Promise.all([
      supabase.from("units").select("*").eq("lecturer_id", user.id),
      supabase.from("learning_resources").select("*").eq("uploaded_by", user.id),
      supabase.from("assessments").select("*").eq("created_by", user.id),
    ])

    stats = {
      unitsTeaching: units.data?.length || 0,
      resourcesUploaded: resources.data?.length || 0,
      assessmentsCreated: assessments.data?.length || 0,
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Academic Hub</h1>
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Profile</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {profile?.full_name || user.email}</span>
              <form action={signOut}>
                <Button type="submit" variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-sm border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>Your account details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Full Name</span>
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900">{profile?.full_name || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Address</span>
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>Department</span>
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900 capitalize">
                        {profile?.department?.replace("-", " ") || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <IdCard className="h-4 w-4" />
                      <span>Role</span>
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900 capitalize">{profile?.role || "Not provided"}</p>
                    </div>
                  </div>

                  {profile?.role === "student" && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Student ID</label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-gray-900">{profile?.student_id || "Not provided"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Year of Study</label>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-gray-900">Year {profile?.year_of_study || "Not provided"}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {(profile?.role === "lecturer" || profile?.role === "admin") && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Staff ID</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-gray-900">{profile?.staff_id || "Not provided"}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Member Since</span>
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {stats && (
              <Card className="bg-white shadow-sm border">
                <CardHeader>
                  <CardTitle>Activity Statistics</CardTitle>
                  <CardDescription>Your academic activity overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile?.role === "student" && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Enrolled Units</span>
                        <span className="font-semibold text-blue-600">{stats.enrolledUnits}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Assignment Submissions</span>
                        <span className="font-semibold text-green-600">{stats.assignmentSubmissions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Assessment Attempts</span>
                        <span className="font-semibold text-purple-600">{stats.assessmentAttempts}</span>
                      </div>
                    </>
                  )}

                  {profile?.role === "lecturer" && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Units Teaching</span>
                        <span className="font-semibold text-blue-600">{stats.unitsTeaching}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Resources Uploaded</span>
                        <span className="font-semibold text-green-600">{stats.resourcesUploaded}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Assessments Created</span>
                        <span className="font-semibold text-purple-600">{stats.assessmentsCreated}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="bg-white shadow-sm border">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Back to Dashboard
                  </Button>
                </Link>
                <Link href="/dashboard/my-results">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    View My Results
                  </Button>
                </Link>
                {profile?.role === "lecturer" && (
                  <Link href="/dashboard/analytics">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      View Analytics
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
