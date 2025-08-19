"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft, Copy, Download, Plus, BookOpen, Globe, FileText } from "lucide-react"
import Link from "next/link"

export default function CitationGeneratorPage() {
  const [citationStyle, setCitationStyle] = useState("apa")
  const [sourceType, setSourceType] = useState("journal")
  const [citations, setCitations] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: "",
    authors: "",
    journal: "",
    year: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    url: "",
    publisher: "",
    location: "",
  })

  const citationStyles = [
    { value: "apa", label: "APA 7th Edition" },
    { value: "mla", label: "MLA 9th Edition" },
    { value: "chicago", label: "Chicago 17th Edition" },
    { value: "harvard", label: "Harvard Style" },
    { value: "ieee", label: "IEEE Style" },
  ]

  const sourceTypes = [
    { value: "journal", label: "Journal Article", icon: <FileText className="h-4 w-4" /> },
    { value: "book", label: "Book", icon: <BookOpen className="h-4 w-4" /> },
    { value: "website", label: "Website", icon: <Globe className="h-4 w-4" /> },
    { value: "conference", label: "Conference Paper", icon: <FileText className="h-4 w-4" /> },
  ]

  const generateCitation = () => {
    let citation = ""
    const authors = formData.authors
      .split(",")
      .map((a) => a.trim())
      .join(", ")

    switch (citationStyle) {
      case "apa":
        if (sourceType === "journal") {
          citation = `${authors} (${formData.year}). ${formData.title}. *${formData.journal}*, *${formData.volume}*(${formData.issue}), ${formData.pages}. ${formData.doi ? `https://doi.org/${formData.doi}` : formData.url}`
        } else if (sourceType === "book") {
          citation = `${authors} (${formData.year}). *${formData.title}*. ${formData.publisher}.`
        } else if (sourceType === "website") {
          citation = `${authors} (${formData.year}). ${formData.title}. Retrieved from ${formData.url}`
        }
        break
      case "mla":
        if (sourceType === "journal") {
          citation = `${authors}. "${formData.title}." *${formData.journal}*, vol. ${formData.volume}, no. ${formData.issue}, ${formData.year}, pp. ${formData.pages}.`
        }
        break
      // Add other citation styles...
    }

    const newCitation = {
      id: Date.now(),
      citation,
      style: citationStyle,
      type: sourceType,
      data: { ...formData },
    }

    setCitations([...citations, newCitation])

    // Reset form
    setFormData({
      title: "",
      authors: "",
      journal: "",
      year: "",
      volume: "",
      issue: "",
      pages: "",
      doi: "",
      url: "",
      publisher: "",
      location: "",
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportBibliography = () => {
    const bibliography = citations.map((c) => c.citation).join("\n\n")
    const blob = new Blob([bibliography], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bibliography-${citationStyle}.txt`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/research/tools">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tools
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <h1 className="text-lg font-semibold text-gray-900">Citation Generator</h1>
              </div>
            </div>
            {citations.length > 0 && (
              <Button onClick={exportBibliography} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Export Bibliography
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Citation Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Generate Citation</CardTitle>
                <CardDescription>Create properly formatted citations for your research</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Style and Type Selection */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Citation Style</Label>
                    <Select value={citationStyle} onValueChange={setCitationStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {citationStyles.map((style) => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Source Type</Label>
                    <Select value={sourceType} onValueChange={setSourceType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center space-x-2">
                              {type.icon}
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Form Fields */}
                <Tabs value={sourceType} className="space-y-4">
                  <TabsContent value="journal" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Article title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Authors</Label>
                        <Input
                          value={formData.authors}
                          onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                          placeholder="Last, First, Last, First"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Journal Name</Label>
                        <Input
                          value={formData.journal}
                          onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                          placeholder="Journal name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                          placeholder="2024"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Volume</Label>
                        <Input
                          value={formData.volume}
                          onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                          placeholder="Volume number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Issue</Label>
                        <Input
                          value={formData.issue}
                          onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                          placeholder="Issue number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pages</Label>
                        <Input
                          value={formData.pages}
                          onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                          placeholder="1-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>DOI</Label>
                        <Input
                          value={formData.doi}
                          onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                          placeholder="10.1000/182"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="book" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Book title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Authors</Label>
                        <Input
                          value={formData.authors}
                          onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                          placeholder="Last, First, Last, First"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Publisher</Label>
                        <Input
                          value={formData.publisher}
                          onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                          placeholder="Publisher name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                          placeholder="2024"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="website" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Page title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Authors</Label>
                        <Input
                          value={formData.authors}
                          onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                          placeholder="Author name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          value={formData.url}
                          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                          placeholder="2024"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button onClick={generateCitation} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Citation
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bibliography */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Bibliography ({citations.length})</CardTitle>
                <CardDescription>Your generated citations</CardDescription>
              </CardHeader>
              <CardContent>
                {citations.length > 0 ? (
                  <div className="space-y-4">
                    {citations.map((citation) => (
                      <div key={citation.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-900 mb-2">{citation.citation}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 uppercase">{citation.style}</span>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(citation.citation)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No citations generated yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
