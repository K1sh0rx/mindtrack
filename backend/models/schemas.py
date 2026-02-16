from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# ===== ENUMS =====
class TopicStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    BACKLOG = "backlog"


class SessionState(str, Enum):
    IDLE = "idle"
    ACTIVE = "active"
    PAUSED = "paused"
    RESCHEDULING = "rescheduling"
    COMPLETED = "completed"


class EmotionType(str, Enum):
    NEUTRAL = "neutral"
    HAPPY = "happy"
    SAD = "sad"
    TIRED = "tired"
    ANGRY = "angry"
    SURPRISED = "surprised"


class TopicLevel(str, Enum):
    KNOWN = "known"
    PARTIAL = "partial"
    UNKNOWN = "unknown"


# ===== REQUEST MODELS =====
class TopicInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    level: TopicLevel = TopicLevel.PARTIAL   # time removed

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Topic name cannot be empty')
        return v.strip()


class SubjectInput(BaseModel):
    name: str
    topics: List[TopicInput]

    @validator('name')
    def subject_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Subject name cannot be empty')
        return v.strip()


class SessionCreateRequest(BaseModel):
    total_time_minutes: int = Field(..., gt=0, le=600)
    subjects: List[SubjectInput]


class TopicCompletionRequest(BaseModel):
    completed: bool


class EmotionUpdateRequest(BaseModel):
    emotion: EmotionType


# ===== RESPONSE MODELS =====
class TopicResponse(BaseModel):
    name: str
    subject: str
    level: TopicLevel
    time_minutes: int
    status: TopicStatus
    actual_time_spent: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class CurrentTopicResponse(BaseModel):
    topic: Optional[TopicResponse]
    index: int
    total_topics: int
    timer_remaining_seconds: Optional[int]
    timer_started_at: Optional[datetime]


class SessionSummaryResponse(BaseModel):
    session_id: str
    state: SessionState
    total_topics: int
    completed_count: int
    backlog_count: int
    total_time_minutes: int
    time_studied_minutes: int
    reschedule_count: int
    emotions_timeline: List[EmotionType]
    backlog_topics: List[Dict[str, str]]
    created_at: datetime
    completed_at: Optional[datetime]


class SessionCreateResponse(BaseModel):
    session_id: str
    message: str
    total_topics: int
    total_time_minutes: int


class RescheduleResponse(BaseModel):
    message: str
    old_schedule: List[Dict[str, Any]]
    new_schedule: List[Dict[str, Any]]
    topics_affected: int


class EmotionStatusResponse(BaseModel):
    recent_emotions: List[EmotionType]
    trigger_ready: bool
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ===== INTERNAL DATA MODELS =====
class Topic(BaseModel):
    name: str
    subject: str
    level: TopicLevel
    time_minutes: int
    status: TopicStatus = TopicStatus.PENDING
    actual_time_spent_seconds: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class Session(BaseModel):
    session_id: str
    topics: List[Topic]
    current_topic_index: int = 0
    state: SessionState = SessionState.IDLE
    timer_started_at: Optional[datetime] = None
    emotions_buffer: List[EmotionType] = []
    backlog: List[Dict[str, str]] = []
    reschedule_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
