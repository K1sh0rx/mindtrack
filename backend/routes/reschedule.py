from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any

from models.schemas import (
    RescheduleResponse, SessionState, TopicStatus, Topic
)
from services.session_store import session_store
from services.ollama_service import ollama_service
from services.timer_service import TimerService
from services.emotion_service import emotion_service
from utils.exceptions import SessionNotFoundException, InvalidSessionStateException, OllamaException

router = APIRouter(prefix="/api/reschedule", tags=["Reschedule"])


@router.post("/trigger", response_model=RescheduleResponse)
async def trigger_reschedule():
    try:
        session = session_store.get_active_session()
        if not session:
            raise SessionNotFoundException("active")

        TimerService.pause_timer(session)
        session.state = SessionState.RESCHEDULING
        session_store.update_session(session.session_id, session)

        remaining_topics: List[Topic] = []
        current_index = session.current_topic_index

        for i, topic in enumerate(session.topics):
            if i >= current_index and topic.status in [TopicStatus.PENDING, TopicStatus.ACTIVE]:
                remaining_topics.append(topic)

        if not remaining_topics:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No remaining topics to reschedule"
            )

        total_allocated = sum(t.time_minutes for t in session.topics)
        time_used = TimerService.get_total_studied_time(session)
        remaining_time = max(0, total_allocated - time_used)

        if remaining_time < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not enough time remaining for rescheduling (minimum 5 minutes required)"
            )

        old_schedule = [
            {
                "name": t.name,
                "subject": t.subject,
                "level": t.level,
                "time_minutes": t.time_minutes
            }
            for t in remaining_topics
        ]

        if not ollama_service.check_connection():
            raise OllamaException("Ollama is not running or not accessible")

        new_schedule = ollama_service.reschedule_topics(remaining_topics, remaining_time)

        topic_name_to_new_time = {
            item["name"]: item["time_minutes"]
            for item in new_schedule
        }

        for topic in remaining_topics:
            if topic.name in topic_name_to_new_time:
                topic.time_minutes = topic_name_to_new_time[topic.name]

        emotion_service.clear_buffer(session)

        session.reschedule_count += 1

        session.state = SessionState.ACTIVE
        TimerService.resume_timer(session)
        session_store.update_session(session.session_id, session)

        return RescheduleResponse(
            message="Schedule updated successfully",
            old_schedule=old_schedule,
            new_schedule=new_schedule,
            topics_affected=len(new_schedule)
        )

    except HTTPException:
        raise
    except OllamaException as e:
        try:
            session = session_store.get_active_session()
            if session:
                session.state = SessionState.ACTIVE
                TimerService.resume_timer(session)
                session_store.update_session(session.session_id, session)
        except:
            pass
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except Exception as e:
        try:
            session = session_store.get_active_session()
            if session:
                session.state = SessionState.ACTIVE
                TimerService.resume_timer(session)
                session_store.update_session(session.session_id, session)
        except:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reschedule: {str(e)}"
        )


@router.get("/check-ollama")
async def check_ollama_status():
    try:
        is_running = ollama_service.check_connection()

        if is_running:
            return {
                "status": "connected",
                "message": "Ollama is running",
                "model": ollama_service.model
            }
        else:
            return {
                "status": "disconnected",
                "message": "Ollama is not running or not accessible"
            }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check Ollama: {str(e)}"
        )
