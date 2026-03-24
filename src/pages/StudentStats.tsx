import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarX, TrendingUp } from "lucide-react";

function getAbsenceLevel(count: number): { label: string; variant: "default" | "secondary" | "destructive" } {
  if (count <= 3) return { label: "Low", variant: "secondary" };
  if (count <= 8) return { label: "Medium", variant: "default" };
  return { label: "High", variant: "destructive" };
}

export default function StudentStats() {
  const { id } = useParams<{ id: string }>();

  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: absences, isLoading: loadingAbsences } = useQuery({
    queryKey: ["student-absences", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("absences")
        .select("*")
        .eq("student_id", id!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loadingStudent || loadingAbsences) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">No student found with ID <code className="font-mono bg-muted px-2 py-0.5 rounded">{id}</code></p>
            <Link to="/student">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = absences?.length ?? 0;
  const now = new Date();
  const last7 = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
  const last30 = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
  const last365 = new Date(now.getTime() - 365 * 86400000).toISOString().split("T")[0];

  const weekly = absences?.filter((a) => a.date >= last7).length ?? 0;
  const monthly = absences?.filter((a) => a.date >= last30).length ?? 0;
  const yearly = absences?.filter((a) => a.date >= last365).length ?? 0;

  const level = getAbsenceLevel(monthly);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-2xl py-6">
        <Link to="/student">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">ID: {student.id}</p>
          </div>
          <Badge variant={level.variant} className="text-sm px-3 py-1">
            {level.label} Absence Rate
          </Badge>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">Last 7 days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weekly}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">Last 30 days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthly}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">Last 365 days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{yearly}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarX className="h-5 w-5" />
              Absence History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {total === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">No absences recorded 🎉</TableCell>
                  </TableRow>
                ) : (
                  absences?.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{a.note || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
