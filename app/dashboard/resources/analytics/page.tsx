import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Eye, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function ResourceAnalyticsPage() {
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
    redirect("/dashboard/resources")
  }

  // Get lecturer's resources with download analytics
  const { data: resources } = await supabase
    .from("learning_resources")
    .select(`
      *,
      units(unit_code, unit_name),
      resource_downloads(id, downloaded_at, user_id, users(full_name, student_id))
    `)
    .eq("uploaded_by", user.id)
    .order("created_at", { ascending: false })

  // Calculate analytics
  const totalResources = resources?.length || 0
  const totalDownloads = resources?.reduce((sum, r) => sum + (r.resource_downloads?.length || 0), 0) || 0
  const uniqueDownloaders = new Set(resources?.flatMap((r) => r.resource_downloads?.map((d: any) => d.user_id) || []))
    .size

  // Most popular resources
  const popularResources = resources
    ?.map((resource) => ({
      ...resource,
      downloadCount: resource.resource_downloads?.length || 0,
    }))
    .sort((a, b) => b.downloadCount - a.downloadCount)
    .slice(0, 10)

  // Recent downloads
  const recentDownloads = resources
    ?.flatMap((resource) =>
      (resource.resource_downloads || []).map((download: any) => ({
        ...download,
        resource_title: resource.title,
        unit_code: resource.units?.unit_code,
      })),
    )
    .sort((a, b) => new Date(b.downloaded_at).getTime() - new Date(a.downloaded_at).getTime())
    .slice(0, 10)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/resources">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Resources
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <h1 className="text-lg font-semibold text-gray-900">Resource Analytics</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resource Analytics</h1>
          <p className="text-gray-600">Track engagement and usage of your learning resources</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResources}</div>
              <p className="text-xs text-muted-foreground">Resources uploaded</p>
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
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueDownloaders}</div>
              <p className="text-xs text-muted-foreground">Students engaged</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Downloads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalResources > 0 ? Math.round(totalDownloads / totalResources) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Per resource</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Most Popular Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Resources</CardTitle>
              <CardDescription>Resources with the most downloads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularResources?.slice(0, 8).map((resource, index) => (
                  <div key={resource.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{resource.title}</p>
                        <p className="text-xs text-gray-500">{resource.units?.unit_code}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {resource.downloadCount} downloads
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Downloads */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Downloads</CardTitle>
              <CardDescription>Latest resource downloads by students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDownloads?.map((download: any, index) => (
                  <div
                    key={`${download.resource_id}-${download.user_id}-${index}`}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{download.resource_title}</p>
                      <p className="text-xs text-gray-500">
                        {download.users?.full_name} ({download.users?.student_id}) • {download.unit_code}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(download.downloaded_at), "MMM dd, HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {totalResources === 0 && (
          <Card className="mt-8">
            <CardContent className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Available</h3>
              <p className="text-gray-600 mb-4">Upload some resources to start tracking engagement analytics.</p>
              <Link href="/dashboard/units">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Eye className="h-4 w-4 mr-2" />
                  Go to Units
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
