"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bot, Send, FileText, Search, Lightbulb, BookOpen, Zap } from "lucide-react"

export default function AIAssistantPage({ params }: { params: { projectId: string } }) {
  const [query, setQuery] = useState("")
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI research assistant. I can help you with literature reviews, data analysis, citation formatting, and research methodology. How can I assist you today?",
    },
  ])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    const userMessage = { role: "user", content: query }
    setChatMessages((prev) => [...prev, userMessage])
    setQuery("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        role: "assistant",
        content: `I understand you're asking about "${query}". Based on your research project, I can help you explore this topic further. Would you like me to suggest relevant literature, help with methodology, or analyze data patterns?`,
      }
      setChatMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }

  const aiTools = [
    {
      icon: Search,
      title: "Literature Search",
      description: "Find relevant academic papers and sources",
      action: "Search Literature",
    },
    {
      icon: FileText,
      title: "Document Analysis",
      description: "Analyze and summarize research documents",
      action: "Analyze Documents",
    },
    {
      icon: Lightbulb,
      title: "Research Ideas",
      description: "Generate research questions and hypotheses",
      action: "Generate Ideas",
    },
    {
      icon: BookOpen,
      title: "Citation Helper",
      description: "Format citations and manage references",
      action: "Format Citations",
    },
  ]

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Research Assistant</h1>
        <p className="text-gray-600">Enhance your research with AI-powered tools and insights</p>
      </div>

      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="tools">Research Tools</TabsTrigger>
          <TabsTrigger value="analysis">Document Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Bot className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Research Assistant</CardTitle>
                      <CardDescription>Ask questions about your research</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            <span className="text-sm text-gray-600">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask about research methodology, literature, or data analysis..."
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        disabled={isLoading}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isLoading || !query.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setQuery("Help me find recent papers on machine learning in healthcare")}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Find Literature
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setQuery("Suggest research questions for my project")}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Generate Ideas
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setQuery("Help me format APA citations")}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Format Citations
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setQuery("Analyze the methodology in my research proposal")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Review Methodology
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Research Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-900">💡 Pro Tip</p>
                      <p className="text-blue-700">
                        Use specific keywords when searching for literature to get more relevant results.
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="font-medium text-green-900">📊 Data Analysis</p>
                      <p className="text-green-700">Always validate your data before drawing conclusions.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiTools.map((tool, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <tool.icon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Zap className="h-4 w-4 mr-2" />
                    {tool.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Analysis</CardTitle>
              <CardDescription>Upload documents for AI-powered analysis and insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Research Documents</h3>
                <p className="text-gray-600 mb-4">Drag and drop files or click to browse</p>
                <Button variant="outline">Choose Files</Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Analysis Options:</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start bg-transparent">
                    <Search className="h-4 w-4 mr-2" />
                    Extract Key Themes
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Summarize Content
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Generate Questions
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Find Citations
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
