import type { TopicResponse } from "@/types/session";
import { BookOpen, Brain } from "lucide-react";

const levelBadge: Record<string, string> = {
  known: "bg-primary/20 text-primary",
  partial: "bg-warning/20 text-warning",
  unknown: "bg-destructive/20 text-destructive",
};

const TopicInfo = ({ topic }: { topic: TopicResponse }) => (
  <div className="glass rounded-xl p-6 space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <BookOpen className="w-4 h-4" />
        {topic.subject}
      </div>
      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${levelBadge[topic.level] || ""}`}>
        {topic.level}
      </span>
    </div>

    <h2 className="text-2xl font-bold text-foreground">
      {topic.name}
    </h2>

    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Brain className="w-4 h-4 text-primary" />
      <span>{topic.time_minutes} min allocated</span>
    </div>
  </div>
);

export default TopicInfo;
