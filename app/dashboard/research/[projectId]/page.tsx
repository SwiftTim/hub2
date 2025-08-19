import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, FileText, MessageSquare, Bot, Download, Calendar, Plus } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ResearchProjectPage({ params }: { params: { projectId: string } }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get project details
  const { data: project } = await supabase
    .from("research_projects")
    .select(`
      *,
      profiles!research_projects_created_by_fkey(full_name, avatar_url),
      units(name, code)
    `)
    .eq("id", params.projectId)
    .single()

  if (!project) {
    notFound()
  }

  // Get collaborators
  const { data: collaborators } = await supabase
    .from("research_collaborators")
    .select(`
      *,
      profiles(full_name, avatar_url, email)
    `)
    .eq("research_project_id", params.projectId)

  // Get documents
  const { data: documents } = await supabase
    .from("research_documents")
    .select(`
      *,
      profiles!research_documents_uploaded_by_fkey(full_name)
    `)
    .eq("research_project_id", params.projectId)
    .order("created_at", { ascending: false })

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
      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
              <span>Unit: {project.units?.code}</span>
              <span>Created by: {project.profiles?.full_name}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/research/${project.id}/ai-assistant`}>
              <Button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
                <Bot className="h-4 w-4" />
                AI Assistant
              </Button>
            </Link>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Add Document
            </Button>
          </div>
        </div>
        <p className="text-gray-700">{project.description}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="collaborators">Team</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{documents?.length || 0}</p>
                    <p className="text-gray-600">Documents</p>
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
                    <p className="text-2xl font-bold text-gray-900">{collaborators?.length || 0}</p>
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
                    <p className="text-2xl font-bold text-gray-900">5</p>
                    <p className="text-gray-600">Days Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">John Doe uploaded a new document</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AS</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Alice Smith joined the project</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Research Documents</h3>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Upload Document
            </Button>
          </div>

          {documents && documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.title}</h4>
                          <p className="text-sm text-gray-500">
                            Uploaded by {doc.profiles?.full_name} • {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{doc.document_type}</Badge>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Yet</h3>
                <p className="text-gray-600 mb-6">Upload research documents to share with your team.</p>
                <Button>Upload First Document</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collaborators" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Team Members</h3>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Invite Collaborator
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collaborators?.map((collab) => (
              <Card key={collab.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={collab.profiles?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {collab.profiles?.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{collab.profiles?.full_name}</h4>
                      <p className="text-sm text-gray-500">{collab.profiles?.email}</p>
                    </div>
                    <Badge variant="outline">{collab.role}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discussions" className="space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Discussion Forum</h3>
              <p className="text-gray-600 mb-6">Collaborate with your team through threaded discussions.</p>
              <Button>Start First Discussion</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
