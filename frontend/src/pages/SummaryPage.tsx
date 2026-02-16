import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sessionApi } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import type { SessionSummary } from "@/types/session";
import { CheckCircle, XCircle, Clock, BarChart3, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const SummaryPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  useEffect(() => {
    sessionApi
      .getSummary()
      .then(({ data }) => setSummary(data))
      .catch(() => {
        toast({ title: "Error", description: "Could not load summary", variant: "destructive" });
        navigate("/setup");
      });
  }, [navigate]);

  if (!summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse-slow font-mono">Loading summary...</div>
      </div>
    );
  }


  const stats = [
  { label: "Total Topics", value: summary.total_topics, icon: BarChart3 },
  { label: "Completed", value: summary.completed_count, icon: CheckCircle },
  { label: "Backlog", value: summary.backlog_count, icon: XCircle },
  { label: "Time Studied", value: `${summary.time_studied_minutes}m`, icon: Clock },
  { label: "Allocated Time", value: `${summary.total_time_minutes}m`, icon: Clock },
  { label: "Reschedules", value: summary.reschedule_count, icon: RefreshCw },
];



  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Session <span className="text-primary">Complete</span>
          </h1>
          <p className="text-muted-foreground">Here's how your study session went.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <stat.icon className="w-4 h-4 text-primary" />
                <span className="text-xs">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Backlog */}
        {summary.backlog_topics.length > 0 && (
          <div className="glass rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Backlog Topics
            </h3>
            <div className="space-y-2">
              {summary.backlog_topics.map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-foreground font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.subject}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={() => navigate("/setup")}
          className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
        >
          Start New Session <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default SummaryPage;
