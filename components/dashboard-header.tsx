import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { BookOpen, LogOut, User } from "lucide-react"
import { signOut } from "@/lib/actions"
import Link from "next/link"

interface DashboardHeaderProps {
  title?: string
  breadcrumb?: string
}

export default async function DashboardHeader({ title = "Academic Hub", breadcrumb }: DashboardHeaderProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from("users").select("*").eq("id", user?.id).single()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            </Link>
            {breadcrumb && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">{breadcrumb}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/profile">
              <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </Link>
            <span className="text-gray-700">Welcome, {profile?.full_name || user?.email}</span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" className="text-gray-700 hover:text-blue-600">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
