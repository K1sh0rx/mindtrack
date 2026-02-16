# MindTrack API Testing Examples

Base URL: `http://localhost:8000`

## 1. Create Session

```bash
curl -X POST http://localhost:8000/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{
    "topics": [
      {"name": "Mathematics", "time_minutes": 30},
      {"name": "Physics", "time_minutes": 25},
      {"name": "Chemistry", "time_minutes": 20}
    ]
  }'
```

**Response:**
```json
{
  "session_id": "uuid-here",
  "message": "Session created successfully",
  "total_topics": 3,
  "total_time_minutes": 75
}
```

## 2. Get Current Topic

```bash
curl http://localhost:8000/api/sessions/current
```

**Response:**
```json
{
  "topic": {
    "name": "Mathematics",
    "time_minutes": 30,
    "status": "active",
    "actual_time_spent": 0,
    "started_at": "2024-01-01T10:00:00",
    "completed_at": null
  },
  "index": 0,
  "total_topics": 3,
  "timer_remaining_seconds": 1800,
  "timer_started_at": "2024-01-01T10:00:00"
}
```

## 3. Update Emotion

```bash
curl -X POST http://localhost:8000/api/emotions/update \
  -H "Content-Type: application/json" \
  -d '{
    "emotion": "tired"
  }'
```

**Response:**
```json
{
  "message": "Emotion updated",
  "trigger_ready": false,
  "trigger_message": null
}
```

## 4. Check Emotion Status

```bash
curl http://localhost:8000/api/emotions/status
```

**Response:**
```json
{
  "recent_emotions": ["neutral", "tired", "sad"],
  "trigger_ready": true,
  "message": "Detected consistent negative emotions. Reschedule recommended."
}
```

## 5. Trigger Reschedule

```bash
curl -X POST http://localhost:8000/api/reschedule/trigger
```

**Response:**
```json
{
  "message": "Schedule updated successfully",
  "old_schedule": [
    {"name": "Physics", "time_minutes": 25},
    {"name": "Chemistry", "time_minutes": 20}
  ],
  "new_schedule": [
    {"name": "Physics", "time_minutes": 30},
    {"name": "Chemistry", "time_minutes": 15}
  ],
  "topics_affected": 2
}
```

## 6. Complete Topic

```bash
# Mark as completed
curl -X POST http://localhost:8000/api/sessions/topic/complete \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'

# Move to backlog
curl -X POST http://localhost:8000/api/sessions/topic/complete \
  -H "Content-Type: application/json" \
  -d '{
    "completed": false
  }'
```

**Response:**
```json
{
  "message": "Topic updated, moving to next",
  "session_complete": false,
  "next_topic": "Physics"
}
```

## 7. Pause Session

```bash
curl -X POST http://localhost:8000/api/sessions/pause
```

**Response:**
```json
{
  "message": "Session paused"
}
```

## 8. Resume Session

```bash
curl -X POST http://localhost:8000/api/sessions/resume
```

**Response:**
```json
{
  "message": "Session resumed"
}
```

## 9. Get Session Summary

```bash
curl http://localhost:8000/api/sessions/summary
```

**Response:**
```json
{
  "session_id": "uuid-here",
  "state": "active",
  "total_topics": 3,
  "completed_count": 1,
  "backlog_count": 0,
  "total_time_minutes": 75,
  "time_studied_minutes": 30,
  "reschedule_count": 1,
  "emotions_timeline": ["neutral", "happy", "tired"],
  "backlog_topics": [],
  "created_at": "2024-01-01T10:00:00",
  "completed_at": null
}
```

## 10. Check Ollama Status

```bash
curl http://localhost:8000/api/reschedule/check-ollama
```

**Response:**
```json
{
  "status": "connected",
  "message": "Ollama is running",
  "model": "qwen2.5:7b"
}
```

## 11. Delete Session

```bash
curl -X DELETE http://localhost:8000/api/sessions/delete
```

**Response:**
```json
{
  "message": "Session deleted successfully"
}
```

## Error Examples

### Session Not Found
```json
{
  "error": "Session 'active' not found",
  "timestamp": "2024-01-01T10:00:00"
}
```

### Validation Error
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "topics -> 0 -> time_minutes",
      "message": "ensure this value is greater than 0",
      "type": "value_error.number.not_gt"
    }
  ],
  "timestamp": "2024-01-01T10:00:00"
}
```

### Ollama Connection Error
```json
{
  "error": "Ollama error: Cannot connect to Ollama. Make sure it's running.",
  "timestamp": "2024-01-01T10:00:00"
}
```
