from fastapi import HTTPException, status


class MindTrackException(HTTPException):
    """Base exception for MindTrack"""
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


class SessionNotFoundException(MindTrackException):
    """Raised when session is not found"""
    def __init__(self, session_id: str):
        super().__init__(
            detail=f"Session '{session_id}' not found",
            status_code=status.HTTP_404_NOT_FOUND
        )


class InvalidSessionStateException(MindTrackException):
    """Raised when operation is invalid for current session state"""
    def __init__(self, current_state: str, required_state: str = None):
        msg = f"Invalid operation for session state: {current_state}"
        if required_state:
            msg += f". Required state: {required_state}"
        super().__init__(detail=msg, status_code=status.HTTP_400_BAD_REQUEST)


class NoActiveTopicException(MindTrackException):
    """Raised when no active topic exists"""
    def __init__(self):
        super().__init__(
            detail="No active topic in session",
            status_code=status.HTTP_400_BAD_REQUEST
        )


class OllamaException(MindTrackException):
    """Raised when Ollama API fails"""
    def __init__(self, detail: str):
        super().__init__(
            detail=f"Ollama error: {detail}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


class RescheduleException(MindTrackException):
    """Raised when rescheduling fails"""
    def __init__(self, detail: str):
        super().__init__(
            detail=f"Rescheduling failed: {detail}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
