"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { uploadResource } from "@/lib/actions"
import { toast } from "sonner"
import { revalidatePath } from "next/cache"

const resourceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  file: z.custom<FileList>().refine((files) => files && files.length > 0, "File is required."),
})

export function UploadResourceDialog({ unitId }: { unitId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(resourceSchema),
  })

  const onSubmit = async (data: z.infer<typeof resourceSchema>) => {
    const formData = new FormData()
    formData.append("unitId", unitId)
    formData.append("title", data.title)
    formData.append("description", data.description || "")
    formData.append("file", data.file[0])

    const result = await uploadResource(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Resource uploaded successfully!")
      reset()
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload Resource
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a New Learning Resource</DialogTitle>
          <DialogDescription>
            Select a file and provide a title and description for the resource.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-red-500 text-sm">{errors.title.message as string}</p>}
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" {...register("description")} />
          </div>
          <div>
            <Label htmlFor="file">File</Label>
            <Input id="file" type="file" {...register("file")} />
            {errors.file && <p className="text-red-500 text-sm">{errors.file.message as string}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
