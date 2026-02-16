import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, BookOpen, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sessionApi } from "@/services/api";
import type { SubjectInput, FamiliarityLevel } from "@/types/session";
import { toast } from "@/hooks/use-toast";

const LEVELS: FamiliarityLevel[] = ["known", "partial", "unknown"];

const levelColors: Record<FamiliarityLevel, string> = {
  known: "bg-primary/20 text-primary border-primary/30",
  partial: "bg-warning/20 text-warning border-warning/30",
  unknown: "bg-destructive/20 text-destructive border-destructive/30",
};

const SetupPage = () => {
  const navigate = useNavigate();
  const [totalTime, setTotalTime] = useState(60);
  const [subjects, setSubjects] = useState<SubjectInput[]>([
    { name: "", topics: [{ name: "", level: "unknown" }] },
  ]);
  const [loading, setLoading] = useState(false);

  const addSubject = () => {
    setSubjects([...subjects, { name: "", topics: [{ name: "", level: "unknown" }] }]);
  };

  const removeSubject = (si: number) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter((_, i) => i !== si));
  };

  const updateSubjectName = (si: number, name: string) => {
    const copy = [...subjects];
    copy[si] = { ...copy[si], name };
    setSubjects(copy);
  };

  const addTopic = (si: number) => {
    const copy = [...subjects];
    copy[si] = { ...copy[si], topics: [...copy[si].topics, { name: "", level: "unknown" }] };
    setSubjects(copy);
  };

  const removeTopic = (si: number, ti: number) => {
    const copy = [...subjects];
    if (copy[si].topics.length <= 1) return;
    copy[si] = { ...copy[si], topics: copy[si].topics.filter((_, i) => i !== ti) };
    setSubjects(copy);
  };

  const updateTopic = (si: number, ti: number, field: "name" | "level", value: string) => {
    const copy = [...subjects];
    const topics = [...copy[si].topics];
    topics[ti] = { ...topics[ti], [field]: value };
    copy[si] = { ...copy[si], topics };
    setSubjects(copy);
  };

  const handleSubmit = async () => {
    if (totalTime <= 0) {
      toast({ title: "Invalid time", description: "Enter a positive study time.", variant: "destructive" });
      return;
    }
    const valid = subjects.every(
      (s) => s.name.trim() && s.topics.every((t) => t.name.trim())
    );
    if (!valid) {
      toast({ title: "Missing fields", description: "Fill in all subject and topic names.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await sessionApi.create({ total_time_minutes: totalTime, subjects });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to create session", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Study Planner
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Mind<span className="text-primary">Track</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Set up your study session and let AI optimize your time.
          </p>
        </div>

        {/* Total Time */}
        <div className="glass rounded-xl p-6 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            Total Study Time (minutes)
          </label>
          <Input
            type="number"
            min={1}
            value={totalTime}
            onChange={(e) => setTotalTime(Number(e.target.value))}
            className="bg-muted border-border text-foreground text-lg font-mono"
          />
        </div>

        {/* Subjects */}
        <div className="space-y-4">
          {subjects.map((subject, si) => (
            <div key={si} className="glass rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary shrink-0" />
                <Input
                  placeholder="Subject name"
                  value={subject.name}
                  onChange={(e) => updateSubjectName(si, e.target.value)}
                  className="bg-muted border-border text-foreground font-medium"
                />
                {subjects.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSubject(si)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Topics */}
              <div className="pl-8 space-y-3">
                {subject.topics.map((topic, ti) => (
                  <div key={ti} className="flex items-center gap-2">
                    <Input
                      placeholder="Topic name"
                      value={topic.name}
                      onChange={(e) => updateTopic(si, ti, "name", e.target.value)}
                      className="bg-muted border-border text-foreground flex-1"
                    />
                    <div className="flex gap-1">
                      {LEVELS.map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => updateTopic(si, ti, "level", lvl)}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                            topic.level === lvl
                              ? levelColors[lvl]
                              : "border-border text-muted-foreground hover:border-muted-foreground/50"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                    {subject.topics.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTopic(si, ti)}
                        className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addTopic(si)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Topic
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addSubject}
            className="w-full border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Subject
          </Button>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 glow-primary transition-all"
        >
          {loading ? "Creating Session..." : "Start Study Session"}
        </Button>
      </div>
    </div>
  );
};

export default SetupPage;
