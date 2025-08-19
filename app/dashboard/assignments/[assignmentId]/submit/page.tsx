import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AssignmentSubmissionForm from "@/components/assignment-submission-form"

interface PageProps {
  params: {
    assignmentId: string
  }
}

export default async function SubmitAssignmentPage({ params }: PageProps) {
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

  // Get assignment details
  const { data: assignment } = await supabase
    .from("assignments")
    .select(`
      *,
      units(unit_code, unit_name)
    `)
    .eq("id", params.assignmentId)
    .single()

  if (!assignment) {
    redirect("/dashboard/assignments")
  }

  // Check if user is enrolled in the unit
  const { data: enrollment } = await supabase
    .from("unit_enrollments")
    .select("*")
    .eq("student_id", user.id)
    .eq("unit_id", assignment.unit_id)
    .eq("status", "active")
    .single()

  if (!enrollment) {
    redirect("/dashboard/assignments")
  }

  // Check if already submitted
  const { data: existingSubmission } = await supabase
    .from("assignment_submissions")
    .select("*")
    .eq("assignment_id", params.assignmentId)
    .eq("student_id", user.id)
    .single()

  if (existingSubmission) {
    redirect(`/dashboard/assignments/${params.assignmentId}/view`)
  }

  return <AssignmentSubmissionForm assignment={assignment} user={user} />
}
