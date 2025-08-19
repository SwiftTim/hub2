"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shield, Upload, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function PlagiarismCheckerPage() {
  const [text, setText] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [results, setResults] = useState<any>(null)

  const checkPlagiarism = async () => {
    if (!text.trim()) return

    setIsChecking(true)

    // Simulate plagiarism check
    setTimeout(() => {
      const mockResults = {
        overallScore: Math.floor(Math.random() * 30) + 5, // 5-35% similarity
        sources: [
          {
            id: 1,
            title: "Machine Learning Applications in Healthcare",
            url: "https://example.com/paper1",
            similarity: 15,
            matchedText: "Machine learning algorithms have shown significant promise in medical diagnosis",
          },
          {
            id: 2,
            title: "AI in Medical Imaging",
            url: "https://example.com/paper2",
            similarity: 8,
            matchedText: "Deep learning models can analyze medical images with high accuracy",
          },
          {
            id: 3,
            title: "Healthcare Technology Trends",
            url: "https://example.com/paper3",
            similarity: 5,
            matchedText: "The integration of artificial intelligence in healthcare systems",
          },
        ],
        wordCount: text.split(" ").length,
        checkedAt: new Date().toISOString(),
      }

      setResults(mockResults)
      setIsChecking(false)
    }, 3000)
  }

  const getSimilarityColor = (score: number) => {
    if (score < 10) return "text-green-600 bg-green-100"
    if (score < 25) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const getOverallStatus = (score: number) => {
    if (score < 10) return { status: "Excellent", icon: CheckCircle, color: "green" }
    if (score < 25) return { status: "Moderate", icon: AlertTriangle, color: "yellow" }
    return { status: "High Risk", icon: AlertTriangle, color: "red" }
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
                <Shield className="h-6 w-6 text-red-600" />
                <h1 className="text-lg font-semibold text-gray-900">Plagiarism Checker</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Check Your Text</CardTitle>
                <CardDescription>Paste your text below to check for potential plagiarism</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your text here to check for plagiarism..."
                  className="min-h-[300px]"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {text.split(" ").filter((word) => word.length > 0).length} words
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" className="bg-transparent">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                    <Button
                      onClick={checkPlagiarism}
                      disabled={!text.trim() || isChecking}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isChecking ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Checking...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Check Plagiarism
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {results && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Plagiarism Report</CardTitle>
                  <CardDescription>Detailed analysis of potential matches</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Overall Score */}
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div
                      className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${getSimilarityColor(results.overallScore)}`}
                    >
                      {React.createElement(getOverallStatus(results.overallScore).icon, { className: "h-5 w-5 mr-2" })}
                      {results.overallScore}% Similarity
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Status: {getOverallStatus(results.overallScore).status}
                    </p>
                  </div>

                  {/* Sources */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Potential Sources ({results.sources.length})</h3>
                    {results.sources.map((source: any) => (
                      <div key={source.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{source.title}</h4>
                            <p className="text-sm text-blue-600 hover:underline cursor-pointer">{source.url}</p>
                          </div>
                          <Badge className={getSimilarityColor(source.similarity)}>{source.similarity}% match</Badge>
                        </div>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                          <p className="text-sm text-gray-700">"{source.matchedText}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Text Analysis</h4>
                    <p className="text-sm text-gray-600">We analyze your text for unique phrases and sentences</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Database Search</h4>
                    <p className="text-sm text-gray-600">Compare against millions of academic papers and web sources</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Similarity Report</h4>
                    <p className="text-sm text-gray-600">Get detailed results with source identification</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interpretation Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-100 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">0-10% Similarity</p>
                    <p className="text-xs text-gray-600">Excellent - Minimal overlap</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-100 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">10-25% Similarity</p>
                    <p className="text-xs text-gray-600">Moderate - Review sources</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-100 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">25%+ Similarity</p>
                    <p className="text-xs text-gray-600">High - Requires revision</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isChecking && (
              <Card>
                <CardHeader>
                  <CardTitle>Checking Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Analyzing text...</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} />
                    <div className="flex items-center justify-between text-sm">
                      <span>Searching databases...</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} />
                    <div className="flex items-center justify-between text-sm">
                      <span>Generating report...</span>
                      <span>25%</span>
                    </div>
                    <Progress value={25} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
