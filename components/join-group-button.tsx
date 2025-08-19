"use client"

import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface JoinGroupButtonProps {
  groupId: string
  groupName: string
}

export default function JoinGroupButton({ groupId, groupName }: JoinGroupButtonProps) {
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()

  const handleJoin = async () => {
    setIsJoining(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { error } = await supabase.from("group_memberships").insert({
        group_id: groupId,
        user_id: user.id,
        role: "member",
      })

      if (error) {
        console.error("Join group error:", error)
        alert("Failed to join group. Please try again.")
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Join group error:", error)
      alert("Failed to join group. Please try again.")
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <Button onClick={handleJoin} disabled={isJoining} className="w-full bg-green-600 hover:bg-green-700 text-white">
      {isJoining ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Joining...
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          Join Group
        </>
      )}
    </Button>
  )
}
