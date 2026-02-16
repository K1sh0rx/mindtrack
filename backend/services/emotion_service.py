from typing import List, Tuple
from models.schemas import Session, EmotionType
from config.settings import settings
import cv2
import numpy as np
from deepface import DeepFace


class EmotionService:
    """Backend emotion detection using webcam frames"""

    @staticmethod
    def detect_emotion_from_frame(frame_bytes: bytes) -> EmotionType:
        try:
            np_arr = np.frombuffer(frame_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if img is None:
                return EmotionType.NEUTRAL

            result = DeepFace.analyze(
                img,
                actions=['emotion'],
                enforce_detection=False
            )

            if isinstance(result, list):
                result = result[0]

            dominant = result.get("dominant_emotion", "neutral").lower()

            if dominant == "sad":
                return EmotionType.SAD
            elif dominant == "angry":
                return EmotionType.TIRED
            elif dominant == "fear":
                return EmotionType.TIRED
            elif dominant == "happy":
                return EmotionType.HAPPY
            else:
                return EmotionType.NEUTRAL

        except Exception:
            return EmotionType.NEUTRAL

    @staticmethod
    def add_emotion(session: Session, emotion: EmotionType) -> None:
        session.emotions_buffer.append(emotion)

        if len(session.emotions_buffer) > settings.EMOTION_BUFFER_SIZE:
            session.emotions_buffer = session.emotions_buffer[-settings.EMOTION_BUFFER_SIZE:]

    @staticmethod
    def check_trigger(session: Session) -> Tuple[bool, str]:
        if len(session.emotions_buffer) < settings.EMOTION_BUFFER_SIZE:
            return False, "Not enough emotion data yet"

        recent_emotions = session.emotions_buffer[-settings.EMOTION_BUFFER_SIZE:]

        all_negative = all(
            emotion.value in settings.negative_emotions_list
            for emotion in recent_emotions
        )

        if all_negative:
            return True, "Detected consistent negative emotions. Reschedule recommended."

        return False, "Emotions are stable"

    @staticmethod
    def process_frame(session: Session, frame_bytes: bytes) -> Tuple[bool, str, EmotionType]:
        emotion = EmotionService.detect_emotion_from_frame(frame_bytes)
        EmotionService.add_emotion(session, emotion)
        trigger, msg = EmotionService.check_trigger(session)
        return trigger, msg, emotion

    @staticmethod
    def get_recent_emotions(session: Session, count: int = 3) -> List[EmotionType]:
        return session.emotions_buffer[-count:] if session.emotions_buffer else []

    @staticmethod
    def clear_buffer(session: Session) -> None:
        session.emotions_buffer.clear()

    @staticmethod
    def get_emotion_summary(session: Session) -> dict:
        if not session.emotions_buffer:
            return {"total": 0, "distribution": {}}

        distribution = {}
        for emotion in session.emotions_buffer:
            emotion_str = emotion.value
            distribution[emotion_str] = distribution.get(emotion_str, 0) + 1

        return {
            "total": len(session.emotions_buffer),
            "distribution": distribution
        }


emotion_service = EmotionService()
