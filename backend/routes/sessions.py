from fastapi import APIRouter, HTTPException, status
from datetime import datetime

from models.schemas import (
    SessionCreateRequest, SessionCreateResponse, CurrentTopicResponse,
    TopicCompletionRequest, SessionSummaryResponse, TopicResponse,
    Session, Topic, TopicStatus, SessionState
)
from services.session_store import session_store
from services.timer_service import TimerService
from services.ollama_service import ollama_service
from utils.exceptions import (
    SessionNotFoundException, InvalidSessionStateException, NoActiveTopicException
)

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])


@router.post("/create", response_model=SessionCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_session(request: SessionCreateRequest):
    try:
        active = session_store.get_active_session()
        if active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An active session already exists. Complete or delete it first."
            )

        # -------------------------
        # FLATTEN INPUT (NO TIME FROM USER)
        # -------------------------
        flat_topics = []

        for subject in request.subjects:
            for t in subject.topics:
                flat_topics.append({
                    "name": t.name,
                    "subject": subject.name,
                    "level": t.level
                })

        if not flat_topics:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one topic required"
            )

        # -------------------------
        # 🔥 INITIAL LLM TIME ALLOCATION
        # -------------------------
        allocated = ollama_service.allocate_initial_schedule(
            flat_topics,
            request.total_time_minutes
        )

        # -------------------------
        # CREATE TOPIC OBJECTS
        # -------------------------
        topics = []

        for item in allocated:
            topics.append(
                Topic(
                    name=item["name"],
                    subject=item["subject"],
                    level=item["level"],
                    time_minutes=item["time_minutes"]
                )
            )

        session = Session(
            session_id="",
            topics=topics,
            state=SessionState.ACTIVE
        )

        session_id = session_store.create_session(session)

        TimerService.start_topic_timer(session, 0)
        session_store.update_session(session_id, session)

        return SessionCreateResponse(
            session_id=session_id,
            message="Session created successfully",
            total_topics=len(topics),
            total_time_minutes=request.total_time_minutes
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}"
        )


@router.get("/current", response_model=CurrentTopicResponse)
async def get_current_topic():
    try:
        session = session_store.get_active_session()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_200_OK,
                detail="No active session found"
            )

        current_topic = TimerService.get_current_topic(session)
        if not current_topic:
            raise NoActiveTopicException()

        remaining_seconds = TimerService.get_remaining_seconds(session)

        topic_response = TopicResponse(
            name=current_topic.name,
            subject=current_topic.subject,
            level=current_topic.level,
            time_minutes=current_topic.time_minutes,
            status=current_topic.status,
            actual_time_spent=int(current_topic.actual_time_spent_seconds / 60),
            started_at=current_topic.started_at,
            completed_at=current_topic.completed_at
        )

        return CurrentTopicResponse(
            topic=topic_response,
            index=session.current_topic_index,
            total_topics=len(session.topics),
            timer_remaining_seconds=remaining_seconds,
            timer_started_at=session.timer_started_at
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get current topic: {str(e)}"
        )


@router.post("/topic/complete")
async def complete_topic(request: TopicCompletionRequest):
    try:
        session = session_store.get_active_session()
        if not session:
            raise SessionNotFoundException("active")

        current_topic = TimerService.get_current_topic(session)
        if not current_topic:
            raise NoActiveTopicException()

        TimerService.stop_timer(session)

        if request.completed:
            current_topic.status = TopicStatus.COMPLETED
            current_topic.completed_at = datetime.utcnow()
        else:
            current_topic.status = TopicStatus.BACKLOG
            session.backlog.append({
                "name": current_topic.name,
                "subject": current_topic.subject
            })

        session.current_topic_index += 1

        if session.current_topic_index >= len(session.topics):
            session.state = SessionState.COMPLETED
            session.completed_at = datetime.utcnow()
            session_store.update_session(session.session_id, session)

            return {
                "message": "Session completed",
                "session_complete": True
            }

        TimerService.start_topic_timer(session, session.current_topic_index)
        session_store.update_session(session.session_id, session)

        next_topic = session.topics[session.current_topic_index]

        return {
            "message": "Topic updated, moving to next",
            "session_complete": False,
            "next_topic": next_topic.name,
            "next_subject": next_topic.subject
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete topic: {str(e)}"
        )


@router.post("/pause")
async def pause_session():
    try:
        session = session_store.get_active_session()
        if not session:
            raise SessionNotFoundException("active")

        if session.state != SessionState.ACTIVE:
            raise InvalidSessionStateException(session.state.value, "active")

        TimerService.pause_timer(session)
        session.state = SessionState.PAUSED
        session_store.update_session(session.session_id, session)

        return {"message": "Session paused"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to pause session: {str(e)}"
        )


@router.post("/resume")
async def resume_session():
    try:
        session = session_store.get_active_session()
        if not session:
            raise SessionNotFoundException("active")

        if session.state != SessionState.PAUSED:
            raise InvalidSessionStateException(session.state.value, "paused")

        TimerService.resume_timer(session)
        session.state = SessionState.ACTIVE
        session_store.update_session(session.session_id, session)

        return {"message": "Session resumed"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resume session: {str(e)}"
        )


@router.get("/summary", response_model=SessionSummaryResponse)
async def get_session_summary():
    try:
        session = session_store.get_active_session()
        if not session:
            all_sessions = session_store.get_all_sessions()
            completed = [s for s in all_sessions.values() if s.state == SessionState.COMPLETED]
            if not completed:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No session found"
                )
            session = max(completed, key=lambda s: s.created_at)

        completed_count = sum(1 for t in session.topics if t.status == TopicStatus.COMPLETED)
        total_time = sum(t.time_minutes for t in session.topics)
        time_studied = TimerService.get_total_studied_time(session)

        return SessionSummaryResponse(
            session_id=session.session_id,
            state=session.state,
            total_topics=len(session.topics),
            completed_count=completed_count,
            backlog_count=len(session.backlog),
            total_time_minutes=total_time,
            time_studied_minutes=time_studied,
            reschedule_count=session.reschedule_count,
            emotions_timeline=session.emotions_buffer,
            backlog_topics=session.backlog,
            created_at=session.created_at,
            completed_at=session.completed_at
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get summary: {str(e)}"
        )


@router.delete("/delete")
async def delete_session():
    try:
        session = session_store.get_active_session()
        if not session:
            raise SessionNotFoundException("active")

        session_store.delete_session(session.session_id)
        return {"message": "Session deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete session: {str(e)}"
        )
