"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, File, User, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { trackDownload } from "@/lib/actions"

export function LearningResourceCard({ resource }: { resource: any }) {

  const handleDownload = async () => {
    // Track the download
    await trackDownload(resource.id)

    // Start the download
    window.open(resource.file_url, "_blank")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="w-5 h-5" />
          {resource.title}
        </CardTitle>
        <CardDescription>{resource.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>Uploaded by {resource.uploaded_by?.full_name || "N/A"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleDownload} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </CardFooter>
    </Card>
  )
}
