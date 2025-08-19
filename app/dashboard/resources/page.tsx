import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Download, Eye, TrendingUp } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function ResourcesHubPage() {
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

  // Get user's enrolled units for students or taught units for lecturers
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

  let unitIds: string[] = []
  if (userProfile?.role === "student") {
    const { data: enrollments } = await supabase
      .from("unit_enrollments")
      .select("unit_id")
      .eq("student_id", user.id)
      .eq("status", "active")
    unitIds = enrollments?.map((e) => e.unit_id) || []
  } else if (userProfile?.role === "lecturer") {
    const { data: units } = await supabase.from("units").select("id").eq("lecturer_id", user.id)
    unitIds = units?.map((u) => u.id) || []
  }

  // Get all resources for user's units
  const { data: resources } = await supabase
    .from("learning_resources")
    .select(`
      *,
      units(unit_code, unit_name),
      uploaded_by:users(full_name),
      resource_downloads(id)
    `)
    .in("unit_id", unitIds)
    .order("created_at", { ascending: false })

  // Get resource analytics
  const { data: analytics } = await supabase
    .from("resource_downloads")
    .select(`
      resource_id,
      downloaded_at,
      learning_resources(title, units(unit_code))
    `)
    .in("resource_id", resources?.map((r) => r.id) || [])

  const resourceStats = resources?.map((resource) => ({
    ...resource,
    downloadCount: resource.resource_downloads?.length || 0,
  }))

  const totalResources = resources?.length || 0
  const totalDownloads = analytics?.length || 0
  const recentResources = resources?.slice(0, 5) || []

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
                <BookOpen className="h-6 w-6 text-blue-600" />
                <h1 className="text-lg font-semibold text-gray-900">Learning Resources Hub</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Resources</h1>
          <p className="text-gray-600">Access and manage learning materials across all your units</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResources}</div>
              <p className="text-xs text-muted-foreground">Across all your units</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDownloads}</div>
              <p className="text-xs text-muted-foreground">All time downloads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resourceStats?.sort((a, b) => b.downloadCount - a.downloadCount)[0]?.downloadCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">Downloads on top resource</p>
            </CardContent>
          </Card>
        </div>

        {/* Resources by Category */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Resources */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Resources</CardTitle>
                <CardDescription>Latest learning materials uploaded to your units</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentResources.map((resource) => (
                    <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <BookOpen className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{resource.title}</p>
                          <p className="text-sm text-gray-500">
                            {resource.units?.unit_code} • {resource.uploaded_by?.full_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(resource.created_at), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {resource.resource_downloads?.length || 0} downloads
                        </Badge>
                        <Link href={`/dashboard/units/${resource.unit_id}/resources`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resource Categories */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resource Types</CardTitle>
                <CardDescription>Distribution by file type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["document", "video", "presentation", "link"].map((type) => {
                    const count = resources?.filter((r) => r.resource_type === type).length || 0
                    const percentage = totalResources > 0 ? Math.round((count / totalResources) * 100) : 0

                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          <span className="text-sm capitalize">{type}s</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{count}</span>
                          <span className="text-xs text-gray-500">({percentage}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/units" className="block">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse by Unit
                  </Button>
                </Link>
                {userProfile?.role === "lecturer" && (
                  <Link href="/dashboard/resources/analytics" className="block">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {totalResources === 0 && (
          <Card className="mt-8">
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Resources Available</h3>
              <p className="text-gray-600 mb-4">
                {userProfile?.role === "student"
                  ? "Your lecturers haven't uploaded any resources yet."
                  : "Start by uploading resources to your units."}
              </p>
              <Link href="/dashboard/units">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Units
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
