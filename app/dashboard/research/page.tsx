import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, FileText, Calendar, Search } from "lucide-react"
import Link from "next/link"

export default async function ResearchPage() {
  const supabase = createClient()

  // After createClient, supabase can be a dummy client. We need to check for user.
  // However, the dummy client will return a null user, so the page will render the "No Research Projects" state.
  // This is acceptable for now. A more robust solution might involve a dedicated check.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user's research projects (as creator or collaborator)
  const { data: projects } = await supabase
    .from("research_projects")
    .select(`
      *,
      research_collaborators(count),
      research_documents(count)
    `)
    .or(`created_by.eq.${user?.id},research_collaborators.user_id.eq.${user?.id}`)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "planning":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Research Hub</h1>
          <p className="text-gray-600 mt-2">Collaborate on research projects with AI-powered tools</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Search className="h-4 w-4" />
            Browse Projects
          </Button>
          <Link href="/dashboard/research/new">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{projects?.length || 0}</p>
                <p className="text-gray-600">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-gray-600">Collaborators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-gray-600">Due This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Research Projects */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Research Projects</h2>

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-2">{project.title}</CardTitle>
                      <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                    </div>
                  </div>
                  <CardDescription className="text-gray-600 mt-3">{project.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {project.research_collaborators?.[0]?.count || 0} collaborators
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {project.research_documents?.[0]?.count || 0} documents
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/dashboard/research/${project.id}`} className="flex-1">
                      <Button variant="outline" className="w-full bg-transparent">
                        View Project
                      </Button>
                    </Link>
                    <Link href={`/dashboard/research/${project.id}/ai-assistant`}>
                      <Button className="bg-purple-600 hover:bg-purple-700">AI Assistant</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Research Projects</h3>
              <p className="text-gray-600 mb-6">
                Start your first research project to collaborate with peers and access AI tools.
              </p>
              <Link href="/dashboard/research/new">
                <Button className="bg-blue-600 hover:bg-blue-700">Create Your First Project</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
