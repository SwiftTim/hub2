"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Unit {
  id: string
  unit_code: string
  unit_name: string
}

interface CreateAssignmentFormProps {
  units: Unit[]
  user: any
}

export default function CreateAssignmentForm({ units, user }: CreateAssignmentFormProps) {
  const [formData, setFormData] = useState({
    unitId: "",
    title: "",
    description: "",
    dueDate: "",
    totalMarks: 100,
    submissionFormat: "both",
    maxFileSize: 10485760, // 10MB
    allowedFileTypes: ["pdf", "docx", "txt"],
    lateSubmissionPenalty: 5.0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      if (!formData.unitId || !formData.title || !formData.description || !formData.dueDate) {
        setError("Please fill in all required fields")
        return
      }

      const { error: insertError } = await supabase.from("assignments").insert({
        unit_id: formData.unitId,
        title: formData.title,
        description: formData.description,
        due_date: new Date(formData.dueDate).toISOString(),
        total_marks: formData.totalMarks,
        submission_format: formData.submissionFormat,
        max_file_size: formData.maxFileSize,
        allowed_file_types: formData.allowedFileTypes,
        late_submission_penalty: formData.lateSubmissionPenalty,
        created_by: user.id,
      })

      if (insertError) {
        throw insertError
      }

      router.push("/dashboard/assignments/manage")
    } catch (error: any) {
      console.error("Assignment creation error:", error)
      setError(error.message || "Failed to create assignment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const fileTypeOptions = [
    { value: "pdf", label: "PDF" },
    { value: "docx", label: "Word Document" },
    { value: "txt", label: "Text File" },
    { value: "py", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "zip", label: "ZIP Archive" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/assignments/manage">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Manage
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Create Assignment</h1>
                <p className="text-sm text-gray-600">Set up a new assignment for your students</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select
                    value={formData.unitId}
                    onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.unit_code} - {unit.unit_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalMarks">Total Marks *</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: Number.parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter assignment title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed instructions for the assignment"
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submissionFormat">Submission Format</Label>
                  <Select
                    value={formData.submissionFormat}
                    onValueChange={(value) => setFormData({ ...formData, submissionFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">File Only</SelectItem>
                      <SelectItem value="text">Text Only</SelectItem>
                      <SelectItem value="both">File + Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Select
                    value={formData.maxFileSize.toString()}
                    onValueChange={(value) => setFormData({ ...formData, maxFileSize: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5242880">5 MB</SelectItem>
                      <SelectItem value="10485760">10 MB</SelectItem>
                      <SelectItem value="20971520">20 MB</SelectItem>
                      <SelectItem value="52428800">50 MB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penalty">Late Penalty (% per day)</Label>
                  <Input
                    id="penalty"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.lateSubmissionPenalty}
                    onChange={(e) =>
                      setFormData({ ...formData, lateSubmissionPenalty: Number.parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Allowed File Types</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {fileTypeOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={formData.allowedFileTypes.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              allowedFileTypes: [...formData.allowedFileTypes, option.value],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              allowedFileTypes: formData.allowedFileTypes.filter((type) => type !== option.value),
                            })
                          }
                        }}
                      />
                      <Label htmlFor={option.value} className="text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link href="/dashboard/assignments/manage">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assignment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
