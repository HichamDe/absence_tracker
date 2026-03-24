import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarX, TrendingUp } from "lucide-react";

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

  const absencesLast7 = absences?.filter((a) => a.date >= last7).length ?? 0;
  const absencesLast30 = absences?.filter((a) => a.date >= last30).length ?? 0;

  // Top absentees
  const studentAbsenceCounts = new Map<string, { name: string; count: number }>();
  absences?.forEach((a) => {
    const name = (a.students as any)?.name ?? a.student_id;
    const existing = studentAbsenceCounts.get(a.student_id);
    if (existing) existing.count++;
    else studentAbsenceCounts.set(a.student_id, { name, count: 1 });
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
            <div className="text-3xl font-bold">{students?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absences (7 days)</CardTitle>
            <CalendarX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{absencesLast7}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absences (30 days)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{absencesLast30}</div>
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
                <div key={s.name} className="flex items-center justify-between">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-sm text-muted-foreground">{s.count} absence{s.count !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
