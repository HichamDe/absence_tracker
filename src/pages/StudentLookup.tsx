import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function StudentLookup() {
  const [studentId, setStudentId] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = studentId.trim().toUpperCase();
    if (trimmed) {
      navigate(`/student/${trimmed}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Check Absences</CardTitle>
          <CardDescription>Enter your student ID to view your absence history</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. A3F2B1"
              className="text-center text-lg font-mono tracking-widest uppercase"
              maxLength={10}
              required
            />
            <Button type="submit" className="w-full">
              <Search className="mr-2 h-4 w-4" />
              View My Absences
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
