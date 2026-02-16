from datetime import datetime
from typing import Optional
from models.schemas import Session, Topic, TopicStatus
from utils.exceptions import NoActiveTopicException


class TimerService:

    @staticmethod
    def start_topic_timer(session: Session, topic_index: int) -> None:
        if topic_index >= len(session.topics):
            raise NoActiveTopicException()

        topic = session.topics[topic_index]
        topic.status = TopicStatus.ACTIVE

        if topic.started_at is None:
            topic.started_at = datetime.utcnow()

        session.timer_started_at = datetime.utcnow()

    @staticmethod
    def get_remaining_seconds(session: Session) -> Optional[int]:
        current_topic = TimerService.get_current_topic(session)
        if not current_topic:
            return None

        total_seconds = current_topic.time_minutes * 60
        spent_seconds = current_topic.actual_time_spent_seconds

        if session.timer_started_at:
            elapsed = (datetime.utcnow() - session.timer_started_at).total_seconds()
            spent_seconds += int(elapsed)

        remaining = int(total_seconds - spent_seconds)
        return max(0, remaining)

    @staticmethod
    def get_current_topic(session: Session) -> Optional[Topic]:
        if session.current_topic_index >= len(session.topics):
            return None
        return session.topics[session.current_topic_index]

    @staticmethod
    def pause_timer(session: Session) -> None:
        if not session.timer_started_at:
            return

        current_topic = TimerService.get_current_topic(session)
        if current_topic:
            elapsed = (datetime.utcnow() - session.timer_started_at).total_seconds()
            current_topic.actual_time_spent_seconds += int(elapsed)

        session.timer_started_at = None

    @staticmethod
    def resume_timer(session: Session) -> None:
        session.timer_started_at = datetime.utcnow()

    @staticmethod
    def stop_timer(session: Session) -> int:
        if not session.timer_started_at:
            return 0

        current_topic = TimerService.get_current_topic(session)
        if current_topic:
            elapsed = (datetime.utcnow() - session.timer_started_at).total_seconds()
            current_topic.actual_time_spent_seconds += int(elapsed)
            session.timer_started_at = None
            return int(elapsed / 60)

        return 0

    @staticmethod
    def get_total_studied_time(session: Session) -> int:
        total_seconds = sum(topic.actual_time_spent_seconds for topic in session.topics)

        if session.timer_started_at:
            elapsed = (datetime.utcnow() - session.timer_started_at).total_seconds()
            total_seconds += int(elapsed)

        return int(total_seconds / 60)
