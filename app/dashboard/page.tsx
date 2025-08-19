import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, BookOpen, Users, FileText, BarChart3, Microscope, User } from "lucide-react"
import { signOut } from "@/lib/actions"
import Link from "next/link"

export default async function Dashboard() {
  // If Supabase is not configured, show setup message directly
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Connect Supabase to get started</h1>
      </div>
    )
  }

  // Get the user from the server
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Academic Hub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/profile">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <span className="text-gray-700">Welcome, {profile?.full_name || user.email}</span>
              <form action={signOut}>
                <Button type="submit" variant="ghost" className="text-gray-700 hover:text-blue-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {profile?.full_name || "User"}!</h1>
          <p className="text-gray-600">
            {profile?.role === "student"
              ? `${profile.department} - Year ${profile.year_of_study}`
              : `${profile?.role} - ${profile?.department}`}
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Link href="/dashboard/units">
            <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Unit Groups</CardTitle>
                <CardDescription>Join and participate in unit discussions</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/assessments">
            <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">Assessments</CardTitle>
                <CardDescription>Take CATs and view results</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/assignments">
            <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Assignments</CardTitle>
                <CardDescription>Submit and track assignments</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/resources">
            <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Resources</CardTitle>
                <CardDescription>Access learning materials</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/research">
            <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
                  <Microscope className="h-5 w-5 text-indigo-600" />
                </div>
                <CardTitle className="text-lg">Research Hub</CardTitle>
                <CardDescription>Collaborate on research projects</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white shadow-sm border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest academic activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity to display.</p>
              <p className="text-sm mt-2">Start by joining unit groups or taking assessments.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
