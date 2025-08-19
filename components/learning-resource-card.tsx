"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, File, User, Calendar, FileText, Video, LinkIcon, Presentation } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { trackDownload } from "@/lib/actions"

export function LearningResourceCard({ resource }: { resource: any }) {
  const handleDownload = async () => {
    // Track the download
    await trackDownload(resource.id)

    // Start the download
    window.open(resource.file_url, "_blank")
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-5 h-5 text-red-500" />
      case "presentation":
        return <Presentation className="w-5 h-5 text-orange-500" />
      case "link":
        return <LinkIcon className="w-5 h-5 text-blue-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return ""
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getResourceIcon(resource.resource_type)}
            {resource.title}
          </CardTitle>
          <Badge variant="outline" className="text-xs capitalize">
            {resource.resource_type}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>Uploaded by {resource.uploaded_by?.full_name || "N/A"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}</span>
        </div>
        {resource.file_size && (
          <div className="flex items-center gap-2">
            <File className="w-4 h-4" />
            <span>{formatFileSize(resource.file_size)}</span>
          </div>
        )}
        {resource.resource_downloads && (
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>{resource.resource_downloads.length} downloads</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleDownload} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          <Download className="mr-2 h-4 w-4" />
          Download Resource
        </Button>
      </CardFooter>
    </Card>
  )
}
