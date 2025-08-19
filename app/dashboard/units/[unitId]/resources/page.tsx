import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { LearningResourceCard } from "./_components/learning-resource-card"
import { UploadResourceDialog } from "./_components/upload-resource-dialog"

export default async function UnitResourcesPage({ params }: { params: { unitId: string } }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  const { data: unit, error: unitError } = await supabase
    .from("units")
    .select("*, lecturer:users(*)")
    .eq("id", params.unitId)
    .single()

  if (unitError || !unit) {
    notFound()
  }

  const { data: resources, error: resourcesError } = await supabase
    .from("learning_resources")
    .select("*, uploaded_by:users(full_name)")
    .eq("unit_id", params.unitId)
    .order("created_at", { ascending: false })

  const isLecturer = unit.lecturer_id === user.id

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{unit.unit_name} - Learning Resources</h1>
          <p className="text-muted-foreground">
            View and download learning materials for this unit.
          </p>
        </div>
        {isLecturer && (
          <UploadResourceDialog unitId={unit.id} />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resources && resources.length > 0 ? (
          resources.map((resource) => (
            <LearningResourceCard key={resource.id} resource={resource} />
          ))
        ) : (
          <div className="col-span-full text-center text-muted-foreground py-12">
            <p>No learning resources have been uploaded for this unit yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
