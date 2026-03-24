import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Absences() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [filterStudent, setFilterStudent] = useState("all");
  const [filterRange, setFilterRange] = useState("all");

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: absences, isLoading } = useQuery({
    queryKey: ["absences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("absences")
        .select("*, students(name)")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (absence: { student_id: string; date: string; note: string | null }) => {
      const { error } = await supabase.from("absences").insert(absence);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences"] });
      toast.success("Absence recorded");
      setOpen(false);
      setNote("");
    },
    onError: () => toast.error("Failed to record absence"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("absences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences"] });
      toast.success("Absence deleted");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !date) return;
    createMutation.mutate({ student_id: studentId, date, note: note.trim() || null });
  };

  // Filter logic
  const now = new Date();
  const rangeStart = (() => {
    if (filterRange === "week") return new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
    if (filterRange === "month") return new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
    if (filterRange === "year") return new Date(now.getTime() - 365 * 86400000).toISOString().split("T")[0];
    return null;
  })();

  const filtered = absences?.filter((a) => {
    if (filterStudent !== "all" && a.student_id !== filterStudent) return false;
    if (rangeStart && a.date < rangeStart) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Absences</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Absence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Absence</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for absence..." />
              </div>
              <Button type="submit" className="w-full">Record Absence</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-4">
        <Select value={filterStudent} onValueChange={setFilterStudent}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All students" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All students</SelectItem>
            {students?.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterRange} onValueChange={setFilterRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="year">Last 365 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No absences found</TableCell></TableRow>
              ) : (
                filtered?.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{(a.students as any)?.name ?? a.student_id}</TableCell>
                    <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{a.note || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
