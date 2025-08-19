import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CreateAssignmentForm from "@/components/create-assignment-form"

export default async function CreateAssignmentPage() {
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

  // Get lecturer's units
  const { data: units } = await supabase.from("units").select("id, unit_code, unit_name").eq("lecturer_id", user.id)

  return <CreateAssignmentForm units={units || []} user={user} />
}
