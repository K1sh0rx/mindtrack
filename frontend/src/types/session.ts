export type FamiliarityLevel = "known" | "partial" | "unknown";

export interface TopicInput {
  name: string;
  level: FamiliarityLevel;
}

export interface SubjectInput {
  name: string;
  topics: TopicInput[];
}

export interface SessionCreatePayload {
  total_time_minutes: number;
  subjects: SubjectInput[];
}

// ---------- BACKEND RESPONSE TYPES ----------

export interface TopicResponse {
  name: string;
  subject: string;
  level: FamiliarityLevel;
  time_minutes: number;
  status: "pending" | "active" | "completed" | "backlog";
  actual_time_spent: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface CurrentTopicResponse {
  topic: TopicResponse;
  index: number;
  total_topics: number;
  timer_remaining_seconds: number;
  timer_started_at: string | null;
}

export interface EmotionStatus {
  recent_emotions: string[];
  trigger_ready: boolean;
  message?: string;
}

export interface SessionSummary {
  total_topics: number;
  completed_count: number;
  backlog_count: number;
  total_time_minutes: number;
  time_studied_minutes: number;
  reschedule_count: number;
  backlog_topics: { name: string; subject: string }[];
}

export type SessionState = "active" | "paused" | "completed" | "idle";
