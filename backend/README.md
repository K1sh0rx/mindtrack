# MindTrack Backend

FastAPI backend for MindTrack - Intelligent Study Session Manager with emotion detection and LLM-based rescheduling.

## Features

- ✅ Single-session study timer management
- ✅ Topic-based study tracking
- ✅ Emotion detection integration
- ✅ LLM-based schedule rescheduling (Ollama + Qwen2.5 7B)
- ✅ In-memory session storage
- ✅ REST API with full error handling
- ✅ TypeScript-ready response models

## Tech Stack

- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation
- **Ollama** - Local LLM for rescheduling
- **uvicorn** - ASGI server

## Prerequisites

1. Python 3.9+
2. Ollama installed and running
3. Qwen2.5 7B model pulled in Ollama

### Install Ollama (if not installed)

```bash
# Linux/Mac
curl -fsSL https://ollama.com/install.sh | sh

# Windows - download from ollama.com
```

### Pull Qwen2.5 7B model

```bash
ollama pull qwen2.5:7b
```

## Installation

1. **Create virtual environment**

```bash
cd mindtrack-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**

```bash
pip install -r requirements.txt
```

3. **Configure environment**

```bash
cp .env.example .env
# Edit .env if needed
```

## Running the Server

### Development Mode

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

Server will start at: **http://localhost:8000**

## API Documentation

Once running, visit:
- Swagger UI: **http://localhost:8000/docs**
- ReDoc: **http://localhost:8000/redoc**

## API Endpoints

### Sessions
- `POST /api/sessions/create` - Create new session
- `GET /api/sessions/current` - Get current topic
- `POST /api/sessions/topic/complete` - Complete topic
- `POST /api/sessions/pause` - Pause session
- `POST /api/sessions/resume` - Resume session
- `GET /api/sessions/summary` - Get session summary
- `DELETE /api/sessions/delete` - Delete session

### Emotions
- `POST /api/emotions/update` - Update emotion
- `GET /api/emotions/status` - Get emotion status
- `GET /api/emotions/summary` - Get emotion summary

### Reschedule
- `POST /api/reschedule/trigger` - Trigger rescheduling
- `GET /api/reschedule/check-ollama` - Check Ollama status

### Health
- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /api/info` - API info

## Project Structure

```
mindtrack-backend/
├── config/
│   └── settings.py          # Configuration settings
├── models/
│   └── schemas.py           # Pydantic models
├── routes/
│   ├── sessions.py          # Session endpoints
│   ├── emotions.py          # Emotion endpoints
│   └── reschedule.py        # Reschedule endpoints
├── services/
│   ├── session_store.py     # In-memory storage
│   ├── timer_service.py     # Timer logic
│   ├── emotion_service.py   # Emotion logic
│   └── ollama_service.py    # LLM integration
├── utils/
│   └── exceptions.py        # Custom exceptions
├── main.py                  # FastAPI app
├── requirements.txt         # Dependencies
└── .env.example            # Environment template
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `OLLAMA_BASE_URL` - Ollama server URL (default: http://localhost:11434)
- `OLLAMA_MODEL` - Model to use (default: qwen2.5:7b)
- `EMOTION_BUFFER_SIZE` - Number of emotions to track (default: 3)
- `NEGATIVE_EMOTIONS` - Emotions that trigger reschedule (default: sad,tired)

## Testing Ollama Connection

```bash
curl http://localhost:8000/api/reschedule/check-ollama
```

## Error Handling

The API provides detailed error responses:

```json
{
  "error": "Error description",
  "detail": "Detailed information",
  "timestamp": "2024-01-01T00:00:00"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error
- `503` - Service Unavailable (Ollama)

## Development

### Adding New Routes

1. Create route file in `routes/`
2. Define endpoints
3. Import in `main.py`
4. Include router: `app.include_router(your_router)`

### Adding New Services

1. Create service file in `services/`
2. Implement logic
3. Import in routes as needed

## Troubleshooting

### Ollama Connection Issues

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve
```

### Port Already in Use

```bash
# Change port in command
uvicorn main:app --port 8001
```

## License

MIT
