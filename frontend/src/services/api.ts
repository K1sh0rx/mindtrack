import axios from "axios";
import type {
  SessionCreatePayload,
  CurrentTopicResponse,
  EmotionStatus,
  SessionSummary,
} from "@/types/session";

const api = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 15000,
});

export const sessionApi = {
  create: (payload: SessionCreatePayload) =>
    api.post("/api/sessions/create", payload),

  getCurrent: () =>
    api.get<CurrentTopicResponse>("/api/sessions/current"),

  pause: () => api.post("/api/sessions/pause"),

  resume: () => api.post("/api/sessions/resume"),

  completeTopic: (completed: boolean) =>
    api.post("/api/sessions/topic/complete", { completed }),

  getSummary: () =>
    api.get<SessionSummary>("/api/sessions/summary"),

  delete: () => api.delete("/api/sessions/delete"),
};

export const emotionApi = {
  detect: (imageBlob: Blob) => {
    const formData = new FormData();
    formData.append("file", imageBlob, "frame.jpg");

    return api.post("/api/emotions/detect", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getStatus: () =>
    api.get<EmotionStatus>("/api/emotions/status"),
};

export const rescheduleApi = {
  trigger: () =>
    api.post("/api/reschedule/trigger"),
};
