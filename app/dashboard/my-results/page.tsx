import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
// I will create this component later
import { DownloadResultsButton } from "./_components/download-results-button"

export default async function MyResultsPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // Fetch assessment results
  const { data: assessmentResults, error: assessmentError } = await supabase
    .from("assessment_attempts")
    .select(`
      id,
      score,
      submitted_at,
      status,
      assessments (
        title,
        total_marks
      )
    `)
    .eq("student_id", user.id)
    .in("status", ["submitted", "graded"])

  // Fetch assignment results
  const { data: assignmentResults, error: assignmentError } = await supabase
    .from("assignment_submissions")
    .select(`
      id,
      score,
      submitted_at,
      status,
      assignments (
        title,
        total_marks
      )
    `)
    .eq("student_id", user.id)
    .in("status", ["submitted", "graded"])

  const allResults = [
    ...(assessmentResults || []).map(r => ({
      id: r.id,
      title: r.assessments?.title || 'N/A',
      type: 'Assessment',
      score: r.score,
      total_marks: r.assessments?.total_marks,
      date: r.submitted_at,
      status: r.status
    })),
    ...(assignmentResults || []).map(r => ({
      id: r.id,
      title: r.assignments?.title || 'N/A',
      type: 'Assignment',
      score: r.score,
      total_marks: r.assignments?.total_marks,
      date: r.submitted_at,
      status: r.status
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Academic Results</h1>
          <p className="text-muted-foreground">
            A consolidated view of your performance in assessments and assignments.
          </p>
        </div>
        <DownloadResultsButton results={allResults} user={user} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Results Summary</CardTitle>
          <CardDescription>
            Here are your results from all completed assessments and assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allResults.length > 0 ? (
                allResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.title}</TableCell>
                    <TableCell>{result.type}</TableCell>
                    <TableCell>
                      {result.score !== null ? `${result.score} / ${result.total_marks}` : 'Not Graded'}
                    </TableCell>
                    <TableCell>
                      {result.date ? format(new Date(result.date), "PPP") : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={result.status === 'graded' ? 'success' : 'secondary'}>
                        {result.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
