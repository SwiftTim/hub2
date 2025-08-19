import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Users, FileText, Calendar, Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function ManageAssignmentsPage() {
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

  // Check if user is a lecturer
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!userProfile || userProfile.role !== "lecturer") {
    redirect("/dashboard")
  }

  // Get lecturer's assignments with submission counts
  const { data: assignments } = await supabase
    .from("assignments")
    .select(`
      *,
      units(unit_code, unit_name),
      assignment_submissions(id, status)
    `)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })

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
                <h1 className="text-lg font-semibold text-gray-900">Manage Assignments</h1>
              </div>
            </div>
            <Link href="/dashboard/assignments/create">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignment Management</h1>
          <p className="text-gray-600">Create, manage, and grade assignments for your units</p>
        </div>

        {/* Assignments Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments?.map((assignment) => {
            const totalSubmissions = assignment.assignment_submissions?.length || 0
            const gradedSubmissions =
              assignment.assignment_submissions?.filter((s: any) => s.status === "graded").length || 0
            const pendingSubmissions = totalSubmissions - gradedSubmissions

            const now = new Date()
            const dueDate = new Date(assignment.due_date)
            const isOverdue = now > dueDate

            return (
              <Card key={assignment.id} className="bg-white shadow-sm border hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs">
                      {assignment.units?.unit_code}
                    </Badge>
                    <Badge variant={isOverdue ? "destructive" : "secondary"} className="text-xs">
                      {isOverdue ? "Overdue" : "Active"}
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
                      <span>Submissions:</span>
                      <span className="font-medium flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {totalSubmissions}
                      </span>
                    </div>

                    {pendingSubmissions > 0 && (
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>Pending Grading:</span>
                        <span className="font-medium">{pendingSubmissions}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <Link href={`/dashboard/assignments/${assignment.id}/grade`}>
                        <Button variant="outline" className="w-full bg-transparent">
                          <Eye className="h-4 w-4 mr-2" />
                          View Submissions ({totalSubmissions})
                        </Button>
                      </Link>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Created</h3>
              <p className="text-gray-600 mb-4">Create your first assignment to get started.</p>
              <Link href="/dashboard/assignments/create">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
