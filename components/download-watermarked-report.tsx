"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Shield, FileText, BarChart3, ClipboardList } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DownloadWatermarkedReportProps {
  userId: string
  userRole: string
}

export default function DownloadWatermarkedReport({ userId, userRole }: DownloadWatermarkedReportProps) {
  const [selectedReport, setSelectedReport] = useState<string>("")
  const [downloading, setDownloading] = useState(false)

  const reportTypes = [
    {
      value: "marks",
      label: "Academic Transcript",
      description: "Official marks and grades report",
      icon: FileText,
    },
    {
      value: "assignments",
      label: "Assignment Report",
      description: "Submission history and feedback",
      icon: ClipboardList,
    },
    {
      value: "analytics",
      label: "Analytics Report",
      description: "Engagement and performance metrics",
      icon: BarChart3,
    },
  ]

  const handleDownload = async () => {
    if (!selectedReport) return

    setDownloading(true)

    try {
      const response = await fetch(`/api/reports/${selectedReport}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to generate report")
      }

      // Get document metadata from headers
      const documentId = response.headers.get("X-Document-ID")
      const watermarkVersion = response.headers.get("X-Watermark-Version")

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${selectedReport}_report_${documentId?.substring(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Show success message with verification info
      alert(
        `Report downloaded successfully!\n\nDocument ID: ${documentId}\nWatermark Version: ${watermarkVersion}\n\nThis document is digitally watermarked and tamper-proof.`,
      )
    } catch (error) {
      console.error("Download error:", error)
      alert("Failed to download report. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  const selectedReportInfo = reportTypes.find((type) => type.value === selectedReport)

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Download Watermarked Reports
        </CardTitle>
        <CardDescription>
          Generate official, tamper-proof reports with digital watermarking for security and verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Report Type</label>
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a report type" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Report Info */}
        {selectedReportInfo && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <selectedReportInfo.icon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">{selectedReportInfo.label}</h4>
                  <p className="text-sm text-blue-700 mt-1">{selectedReportInfo.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Watermarked
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Tamper-Proof
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Verifiable
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Features */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Security Features</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-green-600" />
              Digital watermarking with unique signatures
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-green-600" />
              Tamper detection and verification
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-green-600" />
              Embedded user and timestamp information
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-green-600" />
              Cryptographic integrity protection
            </li>
          </ul>
        </div>

        {/* Download Button */}
        <Button
          onClick={handleDownload}
          disabled={!selectedReport || downloading}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {downloading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generating Report...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Watermarked Report
            </div>
          )}
        </Button>

        {/* Verification Info */}
        <div className="text-xs text-gray-500 text-center">
          All reports are digitally signed and can be verified for authenticity.
          <br />
          Document verification available at /verify/[document-id]
        </div>
      </CardContent>
    </Card>
  )
}
