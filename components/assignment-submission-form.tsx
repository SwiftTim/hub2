"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, FileText, Calendar, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format, isAfter } from "date-fns"

interface AssignmentSubmissionFormProps {
  assignment: any
  user: any
}

export default function AssignmentSubmissionForm({ assignment, user }: AssignmentSubmissionFormProps) {
  const [submissionText, setSubmissionText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const now = new Date()
  const dueDate = new Date(assignment.due_date)
  const isOverdue = isAfter(now, dueDate)
  const daysLate = isOverdue ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size
    if (file.size > assignment.max_file_size) {
      setError(`File size exceeds ${Math.round(assignment.max_file_size / 1024 / 1024)}MB limit`)
      return
    }

    // Check file type
    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    if (fileExtension && !assignment.allowed_file_types.includes(fileExtension)) {
      setError(`File type .${fileExtension} is not allowed. Allowed types: ${assignment.allowed_file_types.join(", ")}`)
      return
    }

    setError("")
    setSelectedFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Validate submission based on format requirements
      if (assignment.submission_format === "file" && !selectedFile) {
        setError("Please select a file to upload")
        return
      }

      if (assignment.submission_format === "text" && !submissionText.trim()) {
        setError("Please enter your submission text")
        return
      }

      if (assignment.submission_format === "both" && (!selectedFile || !submissionText.trim())) {
        setError("Please provide both file and text submission")
        return
      }

      let fileUrl = null
      let fileName = null

      // Upload file if provided
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop()
        const fileName_upload = `${user.id}/${assignment.id}/${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("assignments")
          .upload(fileName_upload, selectedFile)

        if (uploadError) {
          throw new Error("Failed to upload file")
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("assignments").getPublicUrl(fileName_upload)

        fileUrl = publicUrl
        fileName = selectedFile.name
      }

      // Create submission record
      const { error: submissionError } = await supabase.from("assignment_submissions").insert({
        assignment_id: assignment.id,
        student_id: user.id,
        submission_text: submissionText.trim() || null,
        file_url: fileUrl,
        file_name: fileName,
        status: "submitted",
      })

      if (submissionError) {
        throw submissionError
      }

      router.push("/dashboard/assignments")
    } catch (error: any) {
      console.error("Submission error:", error)
      setError(error.message || "Failed to submit assignment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/assignments">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Assignments
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Submit Assignment</h1>
                <p className="text-sm text-gray-600">{assignment.units?.unit_code}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Assignment Details */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">{assignment.title}</CardTitle>
                <CardDescription>{assignment.units?.unit_name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Due Date:</span>
                  <span className={`font-medium flex items-center ${isOverdue ? "text-red-600" : ""}`}>
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(dueDate, "MMM dd, HH:mm")}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Marks:</span>
                  <span className="font-medium">{assignment.total_marks}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Format:</span>
                  <Badge variant="outline" className="text-xs">
                    {assignment.submission_format === "both" ? "File + Text" : assignment.submission_format}
                  </Badge>
                </div>

                {assignment.allowed_file_types && (
                  <div className="text-sm">
                    <span className="text-gray-600">Allowed Files:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {assignment.allowed_file_types.map((type: string) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          .{type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm">
                  <span className="text-gray-600">Max File Size:</span>
                  <span className="ml-2 font-medium">{Math.round(assignment.max_file_size / 1024 / 1024)}MB</span>
                </div>

                {isOverdue && assignment.late_submission_penalty > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Late Submission
                    </div>
                    <p className="text-red-600 text-xs mt-1">
                      {daysLate} day{daysLate > 1 ? "s" : ""} late - {assignment.late_submission_penalty}% penalty per
                      day
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Submission Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{assignment.description}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {(assignment.submission_format === "file" || assignment.submission_format === "both") && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Upload File {assignment.submission_format === "both" && "*"}
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <div className="text-sm text-gray-600 mb-2">Click to select a file or drag and drop</div>
                        <Input
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                          accept={assignment.allowed_file_types.map((type: string) => `.${type}`).join(",")}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span>Choose File</span>
                          </Button>
                        </label>
                        {selectedFile && (
                          <div className="mt-2 text-sm text-green-600">Selected: {selectedFile.name}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {(assignment.submission_format === "text" || assignment.submission_format === "both") && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Submission Text {assignment.submission_format === "both" && "*"}
                      </label>
                      <Textarea
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        placeholder="Enter your submission text here..."
                        className="min-h-[200px]"
                        required={assignment.submission_format === "text"}
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Link href="/dashboard/assignments">
                      <Button variant="outline">Cancel</Button>
                    </Link>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Submit Assignment
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
