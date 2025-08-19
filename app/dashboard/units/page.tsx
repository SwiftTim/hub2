import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import EnrollButton from "@/components/enroll-button"

export default async function UnitsPage() {
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

  // Get all available units
  const { data: units } = await supabase.from("units").select("*").order("unit_code")

  // Get user's enrolled units
  const { data: enrollments } = await supabase
    .from("unit_enrollments")
    .select("unit_id")
    .eq("student_id", user.id)
    .eq("status", "active")

  const enrolledUnitIds = enrollments?.map((e) => e.unit_id) || []

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
                <h1 className="text-lg font-semibold text-gray-900">Available Units</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Units</h1>
          <p className="text-gray-600">Browse and enroll in available units for your program</p>
        </div>

        {/* Units Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units?.map((unit) => {
            const isEnrolled = enrolledUnitIds.includes(unit.id)
            return (
              <Card key={unit.id} className="bg-white shadow-sm border hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {unit.unit_code}
                    </Badge>
                    <Badge variant={isEnrolled ? "default" : "outline"} className="text-xs">
                      {isEnrolled ? "Enrolled" : `Year ${unit.year_level}`}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{unit.unit_name}</CardTitle>
                  <CardDescription className="text-sm">{unit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Department:</span>
                      <span className="font-medium">{unit.department}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Semester:</span>
                      <span className="font-medium">{unit.semester}</span>
                    </div>

                    {isEnrolled ? (
                      <Link href={`/dashboard/units/${unit.id}/groups`}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          <Users className="h-4 w-4 mr-2" />
                          View Groups
                        </Button>
                      </Link>
                    ) : (
                      profile?.role === "student" && <EnrollButton unitId={unit.id} unitName={unit.unit_name} />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {units?.length === 0 && (
          <Card className="bg-white shadow-sm border">
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Units Available</h3>
              <p className="text-gray-600">Check back later for available course units.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
