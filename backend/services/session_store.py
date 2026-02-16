from typing import Dict, Optional
from models.schemas import Session, SessionState
from utils.exceptions import SessionNotFoundException
import uuid


class SessionStore:
    """In-memory session storage"""

    def __init__(self):
        self._sessions: Dict[str, Session] = {}

    def create_session(self, session: Session) -> str:
        """Create a new session and return its ID"""
        session_id = str(uuid.uuid4())
        session.session_id = session_id

        # Ensure backlog is initialized as list of dicts
        if session.backlog is None:
            session.backlog = []

        # Ensure all topics have subject and level
        for topic in session.topics:
            if not hasattr(topic, "subject") or topic.subject is None:
                topic.subject = "General"
            if not hasattr(topic, "level") or topic.level is None:
                topic.level = "partial"

        self._sessions[session_id] = session
        return session_id

    def get_session(self, session_id: str) -> Session:
        """Get session by ID, raise exception if not found"""
        session = self._sessions.get(session_id)
        if not session:
            raise SessionNotFoundException(session_id)
        return session

    def update_session(self, session_id: str, session: Session) -> None:
        """Update existing session"""
        if session_id not in self._sessions:
            raise SessionNotFoundException(session_id)

        # Ensure backlog structure remains valid
        if session.backlog is None:
            session.backlog = []

        self._sessions[session_id] = session

    def delete_session(self, session_id: str) -> None:
        """Delete a session"""
        if session_id not in self._sessions:
            raise SessionNotFoundException(session_id)
        del self._sessions[session_id]

    def get_all_sessions(self) -> Dict[str, Session]:
        """Get all sessions"""
        return self._sessions

    def session_exists(self, session_id: str) -> bool:
        """Check if session exists"""
        return session_id in self._sessions

    def get_active_session(self) -> Optional[Session]:
        """Get the first active session (for MVP - single session)"""
        for session in self._sessions.values():
            if session.state in [SessionState.ACTIVE, SessionState.PAUSED]:
                return session
        return None

    def clear_all(self) -> None:
        """Clear all sessions (for testing)"""
        self._sessions.clear()


# Global session store instance
session_store = SessionStore()
