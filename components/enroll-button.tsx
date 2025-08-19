"use client"

import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface EnrollButtonProps {
  unitId: string
  unitName: string
}

export default function EnrollButton({ unitId, unitName }: EnrollButtonProps) {
  const [isEnrolling, setIsEnrolling] = useState(false)
  const router = useRouter()

  const handleEnroll = async () => {
    setIsEnrolling(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { error } = await supabase.from("unit_enrollments").insert({
        student_id: user.id,
        unit_id: unitId,
        status: "active",
      })

      if (error) {
        console.error("Enrollment error:", error)
        alert("Failed to enroll. Please try again.")
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Enrollment error:", error)
      alert("Failed to enroll. Please try again.")
    } finally {
      setIsEnrolling(false)
    }
  }

  return (
    <Button onClick={handleEnroll} disabled={isEnrolling} className="w-full bg-green-600 hover:bg-green-700 text-white">
      {isEnrolling ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Enrolling...
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          Enroll Now
        </>
      )}
    </Button>
  )
}
