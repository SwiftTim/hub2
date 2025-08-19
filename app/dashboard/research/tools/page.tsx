import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, BookOpen, Search, FileText, Shield, Zap, Quote } from "lucide-react"
import Link from "next/link"

export default async function ResearchToolsPage() {
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

  const researchTools = [
    {
      id: "citation-generator",
      title: "Citation Generator",
      description: "Generate accurate citations in APA, MLA, Chicago, and Harvard formats",
      icon: <Quote className="h-8 w-8 text-blue-600" />,
      color: "blue",
      href: "/dashboard/research/tools/citation-generator",
      features: [
        "Multiple citation styles",
        "Auto-format from DOI/URL",
        "Bibliography management",
        "Export to Word/LaTeX",
      ],
    },
    {
      id: "plagiarism-checker",
      title: "Plagiarism Detector",
      description: "Advanced plagiarism detection with similarity analysis and source identification",
      icon: <Shield className="h-8 w-8 text-red-600" />,
      color: "red",
      href: "/dashboard/research/tools/plagiarism-checker",
      features: ["Real-time scanning", "Source identification", "Similarity reports", "Academic integrity scoring"],
    },
    {
      id: "literature-search",
      title: "Literature Search Engine",
      description: "AI-powered academic search across millions of research papers and journals",
      icon: <Search className="h-8 w-8 text-green-600" />,
      color: "green",
      href: "/dashboard/research/tools/literature-search",
      features: ["Semantic search", "Filter by impact factor", "Related papers", "Citation analysis"],
    },
    {
      id: "reference-manager",
      title: "Reference Manager",
      description: "Organize, annotate, and manage your research references and PDFs",
      icon: <BookOpen className="h-8 w-8 text-purple-600" />,
      color: "purple",
      href: "/dashboard/research/tools/reference-manager",
      features: ["PDF annotation", "Tag organization", "Collaboration", "Cloud sync"],
    },
    {
      id: "writing-assistant",
      title: "Academic Writing Assistant",
      description: "AI-powered writing help for academic papers, theses, and research proposals",
      icon: <FileText className="h-8 w-8 text-orange-600" />,
      color: "orange",
      href: "/dashboard/research/tools/writing-assistant",
      features: ["Grammar checking", "Style suggestions", "Structure analysis", "Readability scoring"],
    },
    {
      id: "data-analyzer",
      title: "Research Data Analyzer",
      description: "Statistical analysis tools and data visualization for research data",
      icon: <Zap className="h-8 w-8 text-indigo-600" />,
      color: "indigo",
      href: "/dashboard/research/tools/data-analyzer",
      features: ["Statistical tests", "Data visualization", "Export charts", "Collaboration tools"],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/research">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Research Hub
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Zap className="h-6 w-6 text-blue-600" />
                <h1 className="text-lg font-semibold text-gray-900">Research Tools</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Research Tools</h1>
          <p className="text-gray-600">Comprehensive suite of AI-powered tools for academic research and writing</p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {researchTools.map((tool) => (
            <Card key={tool.id} className="bg-white shadow-sm border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className={`p-3 bg-${tool.color}-100 rounded-lg`}>{tool.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                    <CardDescription className="mt-1">{tool.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Key Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {tool.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href={tool.href}>
                    <Button className={`w-full bg-${tool.color}-600 hover:bg-${tool.color}-700 text-white`}>
                      Launch Tool
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Getting Started Section */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started with Research Tools</CardTitle>
            <CardDescription>Tips and best practices for using our academic research suite</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Quote className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Start with Citations</h3>
                <p className="text-sm text-gray-600">
                  Begin by organizing your sources with our citation generator to maintain proper academic formatting
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Discover Literature</h3>
                <p className="text-sm text-gray-600">
                  Use our AI-powered search to find relevant papers and build comprehensive literature reviews
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Ensure Integrity</h3>
                <p className="text-sm text-gray-600">
                  Check your work with our plagiarism detector to maintain academic integrity and originality
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
