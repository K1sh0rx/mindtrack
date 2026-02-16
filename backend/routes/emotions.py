from fastapi import APIRouter, HTTPException, status, UploadFile, File

from models.schemas import EmotionStatusResponse
from services.session_store import session_store
from services.emotion_service import emotion_service
from utils.exceptions import SessionNotFoundException

router = APIRouter(prefix="/api/emotions", tags=["Emotions"])


@router.post("/detect")
async def detect_emotion(file: UploadFile = File(...)):
    """
    Backend emotion detection from uploaded webcam frame
    """
    try:
        session = session_store.get_active_session()
        if not session:
            raise SessionNotFoundException("active")

        image_bytes = await file.read()

        trigger, msg, emotion = emotion_service.process_frame(session, image_bytes)

        session_store.update_session(session.session_id, session)

        return {
            "emotion": emotion,
            "trigger_ready": trigger,
            "message": msg,
            "buffer": [e.value for e in session.emotions_buffer]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to detect emotion: {str(e)}"
        )


@router.get("/status", response_model=EmotionStatusResponse)
async def get_emotion_status():
    """
    Check if break trigger condition is met
    """
    try:
        session = session_store.get_active_session()
        if not session:
            raise SessionNotFoundException("active")

        trigger_ready, message = emotion_service.check_trigger(session)

        return EmotionStatusResponse(
            recent_emotions=emotion_service.get_recent_emotions(session),
            trigger_ready=trigger_ready,
            message=message if trigger_ready else None
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get emotion status: {str(e)}"
        )
