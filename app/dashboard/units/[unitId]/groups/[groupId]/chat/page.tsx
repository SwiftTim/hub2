import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import ChatInterface from "@/components/chat-interface"

interface PageProps {
  params: {
    unitId: string
    groupId: string
  }
}

export default async function GroupChatPage({ params }: PageProps) {
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

  // Get group details with unit info
  const { data: group } = await supabase
    .from("unit_groups")
    .select(`
      *,
      units(unit_code, unit_name)
    `)
    .eq("id", params.groupId)
    .single()

  if (!group) {
    redirect("/dashboard/units")
  }

  // Check if user is a member of this group
  const { data: membership } = await supabase
    .from("group_memberships")
    .select("*")
    .eq("group_id", params.groupId)
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    redirect(`/dashboard/units/${params.unitId}/groups`)
  }

  // Get recent messages
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      users(full_name, role)
    `)
    .eq("group_id", params.groupId)
    .order("created_at", { ascending: true })
    .limit(50)

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/dashboard/units/${params.unitId}/groups`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{group.group_name}</h1>
              <p className="text-sm text-gray-600">
                {group.units?.unit_code} - {group.units?.unit_name}
              </p>
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-1" />
            Group Chat
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <ChatInterface groupId={params.groupId} initialMessages={messages || []} currentUser={user} />
    </div>
  )
}
