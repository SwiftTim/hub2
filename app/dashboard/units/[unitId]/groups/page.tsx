import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, MessageCircle, BookOpen } from "lucide-react"
import Link from "next/link"
import JoinGroupButton from "@/components/join-group-button"

interface PageProps {
  params: {
    unitId: string
  }
}

export default async function UnitGroupsPage({ params }: PageProps) {
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

  // Get unit details
  const { data: unit } = await supabase.from("units").select("*").eq("id", params.unitId).single()

  if (!unit) {
    redirect("/dashboard/units")
  }

  // Check if user is enrolled
  const { data: enrollment } = await supabase
    .from("unit_enrollments")
    .select("*")
    .eq("student_id", user.id)
    .eq("unit_id", params.unitId)
    .eq("status", "active")
    .single()

  if (!enrollment) {
    redirect("/dashboard/units")
  }

  // Get unit groups
  const { data: groups } = await supabase
    .from("unit_groups")
    .select(`
      *,
      group_memberships!inner(user_id),
      _count:group_memberships(count)
    `)
    .eq("unit_id", params.unitId)
    .order("group_type")

  // Get user's group memberships
  const { data: userMemberships } = await supabase.from("group_memberships").select("group_id").eq("user_id", user.id)

  const userGroupIds = userMemberships?.map((m) => m.group_id) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/units">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Units
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{unit.unit_code}</h1>
                  <p className="text-sm text-gray-600">{unit.unit_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Unit Groups</h1>
          <p className="text-gray-600">Join groups to collaborate with classmates and access discussions</p>
        </div>

        {/* Groups Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups?.map((group) => {
            const isMember = userGroupIds.includes(group.id)
            const memberCount = group._count || 0

            return (
              <Card key={group.id} className="bg-white shadow-sm border hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      variant={
                        group.group_type === "main" ? "default" : group.group_type === "study" ? "secondary" : "outline"
                      }
                      className="text-xs"
                    >
                      {group.group_type === "main"
                        ? "Main Group"
                        : group.group_type === "study"
                          ? "Study Group"
                          : "Project Group"}
                    </Badge>
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-3 w-3 mr-1" />
                      {memberCount}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{group.group_name}</CardTitle>
                  <CardDescription className="text-sm">{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isMember ? (
                    <Link href={`/dashboard/units/${params.unitId}/groups/${group.id}/chat`}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Open Chat
                      </Button>
                    </Link>
                  ) : (
                    <JoinGroupButton groupId={group.id} groupName={group.group_name} />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {groups?.length === 0 && (
          <Card className="bg-white shadow-sm border">
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Available</h3>
              <p className="text-gray-600">Groups will be created by your lecturer.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
