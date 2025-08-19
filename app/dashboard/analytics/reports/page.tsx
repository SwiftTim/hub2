import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, FileText, BarChart3, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import { GenerateReportButton } from "../_components/generate-report-button"

export default async function ReportsPage() {
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
    redirect("/dashboard/analytics")
  }

  // Get lecturer's units for report generation
  const { data: units } = await supabase.from("units").select("id, unit_code, unit_name").eq("lecturer_id", user.id)

  const reportTypes = [
    {
      id: "student-performance",
      title: "Student Performance Report",
      description: "Comprehensive analysis of student grades, submission rates, and engagement metrics",
      icon: <Users className="h-8 w-8 text-blue-600" />,
      color: "blue",
    },
    {
      id: "unit-analytics",
      title: "Unit Analytics Report",
      description: "Detailed breakdown of unit-specific metrics including enrollment and activity data",
      icon: <BarChart3 className="h-8 w-8 text-green-600" />,
      color: "green",
    },
    {
      id: "engagement-summary",
      title: "Engagement Summary Report",
      description: "Student participation in discussions, resource downloads, and assessment attempts",
      icon: <TrendingUp className="h-8 w-8 text-purple-600" />,
      color: "purple",
    },
    {
      id: "assessment-analysis",
      title: "Assessment Analysis Report",
      description: "Security metrics, completion rates, and performance analysis for all assessments",
      icon: <FileText className="h-8 w-8 text-orange-600" />,
      color: "orange",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/analytics">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Analytics
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <h1 className="text-lg font-semibold text-gray-900">Generate Reports</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Reports</h1>
          <p className="text-gray-600">Generate comprehensive reports with digital watermarks for official use</p>
        </div>

        {/* Report Types Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {reportTypes.map((report) => (
            <Card key={report.id} className="bg-white shadow-sm border hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className={`p-3 bg-${report.color}-100 rounded-lg`}>{report.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription className="mt-1">{report.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <p>Includes digital watermark</p>
                    <p>PDF format with tamper protection</p>
                  </div>
                  <GenerateReportButton reportType={report.id} units={units || []} user={user} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Features */}
        <Card>
          <CardHeader>
            <CardTitle>Report Features</CardTitle>
            <CardDescription>All generated reports include the following security and quality features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Digital Watermark</h3>
                <p className="text-sm text-gray-600">
                  Hidden watermarks for authenticity verification and tamper detection
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Comprehensive Data</h3>
                <p className="text-sm text-gray-600">
                  Complete analytics with charts, tables, and statistical summaries
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Instant Download</h3>
                <p className="text-sm text-gray-600">
                  Generate and download reports instantly in high-quality PDF format
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(!units || units.length === 0) && (
          <Card className="mt-8">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Units Available</h3>
              <p className="text-gray-600 mb-4">Create units and enroll students to generate meaningful reports.</p>
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
