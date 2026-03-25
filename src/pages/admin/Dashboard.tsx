import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, CalendarX, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Dashboard() {
  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: absences } = useQuery({
    queryKey: ["absences"],
    queryFn: async () => {
      const { data, error } = await supabase.from("absences").select("*, students(name)");
      if (error) throw error;
      return data;
    },
  });

  const now = new Date();
  const last7 = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
  const last30 = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
  const prev7Start = new Date(now.getTime() - 14 * 86400000).toISOString().split("T")[0];

  const totalStudents = students?.length ?? 0;
  const totalAbsences = absences?.length ?? 0;

  const absencesLast7 = absences?.filter((a) => a.date >= last7).length ?? 0;
  const absencesLast30 = absences?.filter((a) => a.date >= last30).length ?? 0;
  const absencesPrev7 = absences?.filter((a) => a.date >= prev7Start && a.date < last7).length ?? 0;

  const affectedLast30 = new Set((absences ?? []).filter((a) => a.date >= last30).map((a) => a.student_id)).size;
  const affectedLast7 = new Set((absences ?? []).filter((a) => a.date >= last7).map((a) => a.student_id)).size;

  const affectedLast30Pct = totalStudents > 0 ? (affectedLast30 / totalStudents) * 100 : 0;
  const affectedLast7Pct = totalStudents > 0 ? (affectedLast7 / totalStudents) * 100 : 0;

  const notesWithContent = (absences ?? []).filter((a) => !!a.note && a.note.trim().length > 0);
  const absencesWithNotes = notesWithContent.length;
  const absencesWithNotesPct = totalAbsences > 0 ? (absencesWithNotes / totalAbsences) * 100 : 0;

  const shareLast7OfLast30 = absencesLast30 > 0 ? (absencesLast7 / absencesLast30) * 100 : 0;
  const shareLast30OfAll = totalAbsences > 0 ? (absencesLast30 / totalAbsences) * 100 : 0;

  const avgAbsencesPerStudentLast30 = totalStudents > 0 ? absencesLast30 / totalStudents : 0;
  const avgAbsencesPerAffectedStudentLast30 = affectedLast30 > 0 ? absencesLast30 / affectedLast30 : 0;

  const trendVsPrev7 =
    absencesPrev7 > 0 ? ((absencesLast7 - absencesPrev7) / absencesPrev7) * 100 : null;

  // Top absentees
  const studentAbsenceCounts = new Map<string, { id: string; name: string; count: number }>();
  absences?.forEach((a) => {
    const name = (a.students as unknown as { name?: string | null })?.name ?? a.student_id;
    const existing = studentAbsenceCounts.get(a.student_id);
    if (existing) existing.count++;
    else studentAbsenceCounts.set(a.student_id, { id: a.student_id, name, count: 1 });
  });
  const topAbsentees = [...studentAbsenceCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalStudents}</div>
            <div className="mt-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground leading-tight">Affected in last 30d</p>
                  <p className="text-sm font-medium mt-0.5">
                    {affectedLast30} / {totalStudents} ({Math.round(affectedLast30Pct)}%)
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {Math.round(affectedLast30Pct)}%
                </Badge>
              </div>
              <Progress value={Math.min(100, Math.max(0, affectedLast30Pct))} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absences (7 days)</CardTitle>
            <CalendarX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-3xl font-bold">{absencesLast7}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Share of last 30d: {Math.round(shareLast7OfLast30)}%
                </p>
              </div>
              {trendVsPrev7 === null ? (
                <Badge variant="secondary">No baseline</Badge>
              ) : trendVsPrev7 >= 0 ? (
                <Badge variant="destructive" className="inline-flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {Math.round(trendVsPrev7)}%
                </Badge>
              ) : (
                <Badge variant="secondary" className="inline-flex items-center gap-1">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  {Math.round(trendVsPrev7)}%
                </Badge>
              )}
            </div>
            <div className="mt-4 space-y-3">
              <Progress value={Math.min(100, Math.max(0, shareLast7OfLast30))} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absences (30 days)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-3xl font-bold">{absencesLast30}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Avg per student: {avgAbsencesPerStudentLast30.toFixed(2)}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {Math.round(shareLast30OfAll)}% of all
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground leading-tight">Intensity (per affected)</p>
                  <p className="text-sm font-medium mt-0.5">
                    {avgAbsencesPerAffectedStudentLast30.toFixed(1)} absences / student
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {affectedLast30} students
                </Badge>
              </div>
              <Progress value={Math.min(100, Math.max(0, shareLast30OfAll))} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notes Coverage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-3xl font-bold">{absencesWithNotes}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  With note: {Math.round(absencesWithNotesPct)}%
                </p>
              </div>
              <Badge variant={absencesWithNotesPct >= 75 ? "default" : absencesWithNotesPct >= 40 ? "secondary" : "destructive"}>
                {Math.round(absencesWithNotesPct)}%
              </Badge>
            </div>
            <div className="mt-4">
              <Progress value={Math.min(100, Math.max(0, absencesWithNotesPct))} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Students Affected (7d)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-3xl font-bold">{affectedLast7}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Of all students: {Math.round(affectedLast7Pct)}%
                </p>
              </div>
              <Badge variant="secondary">{Math.round(affectedLast7Pct)}%</Badge>
            </div>
            <div className="mt-4">
              <Progress value={Math.min(100, Math.max(0, affectedLast7Pct))} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absence Mix</CardTitle>
            <CalendarX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground leading-tight">Last 7 days</p>
                  <p className="text-sm font-medium mt-0.5">{absencesLast7} absences</p>
                </div>
                <Badge variant="secondary">{Math.round(shareLast7OfLast30)}% of last 30d</Badge>
              </div>
              <Progress value={Math.min(100, Math.max(0, shareLast7OfLast30))} />

              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  <p className="text-sm text-muted-foreground leading-tight">Last 30 days</p>
                  <p className="text-sm font-medium mt-0.5">{absencesLast30} absences</p>
                </div>
                <Badge variant="outline">{Math.round(shareLast30OfAll)}% of all time</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Absentees</CardTitle>
        </CardHeader>
        <CardContent>
          {topAbsentees.length === 0 ? (
            <p className="text-muted-foreground text-sm">No absences recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {topAbsentees.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {s.count} absence{s.count !== 1 ? "s" : ""}{" "}
                    {totalAbsences > 0 ? `(${Math.round((s.count / totalAbsences) * 100)}%)` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
