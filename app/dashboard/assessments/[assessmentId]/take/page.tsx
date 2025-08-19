import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isAfter, isBefore } from "date-fns"
import AssessmentInterface from "@/components/assessment-interface"

interface PageProps {
  params: {
    assessmentId: string
  }
}

export default async function TakeAssessmentPage({ params }: PageProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get assessment details
  const { data: assessment } = await supabase
    .from("assessments")
    .select(`
      *,
      units(unit_code, unit_name)
    `)
    .eq("id", params.assessmentId)
    .single()

  if (!assessment) {
    redirect("/dashboard/assessments")
  }

  // Check if assessment is active
  const now = new Date()
  const startTime = new Date(assessment.start_time)
  const endTime = new Date(assessment.end_time)

  if (isBefore(now, startTime) || isAfter(now, endTime)) {
    redirect("/dashboard/assessments")
  }

  // Check if user is enrolled in the unit
  const { data: enrollment } = await supabase
    .from("unit_enrollments")
    .select("*")
    .eq("student_id", user.id)
    .eq("unit_id", assessment.unit_id)
    .eq("status", "active")
    .single()

  if (!enrollment) {
    redirect("/dashboard/assessments")
  }

  // Get or create assessment attempt
  let { data: attempt } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("assessment_id", params.assessmentId)
    .eq("student_id", user.id)
    .single()

  if (!attempt) {
    // Create new attempt
    const { data: newAttempt, error } = await supabase
      .from("assessment_attempts")
      .insert({
        assessment_id: params.assessmentId,
        student_id: user.id,
        status: "in_progress",
        answers: {},
        ip_address: "127.0.0.1", // In real app, get actual IP
        user_agent: "Browser", // In real app, get actual user agent
      })
      .select()
      .single()

    if (error || !newAttempt) {
      redirect("/dashboard/assessments")
    }

    attempt = newAttempt
  }

  // If already submitted, redirect
  if (attempt.status === "submitted" || attempt.status === "graded") {
    redirect("/dashboard/assessments")
  }

  // Get questions
  const { data: questions } = await supabase
    .from("assessment_questions")
    .select("*")
    .eq("assessment_id", params.assessmentId)
    .order("order_index")

  return <AssessmentInterface assessment={assessment} attempt={attempt} questions={questions || []} user={user} />
}
