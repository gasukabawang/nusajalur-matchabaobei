from typing import Any, Optional
from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception returning standard NusaJalur error schema."""
    def __init__(
        self,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        code: str = "BAD_REQUEST",
        message: str = "Permintaan tidak dapat diproses",
        headers: Optional[dict[str, str]] = None,
    ):
        super().__init__(status_code=status_code, detail=message, headers=headers)
        self.code = code
        self.message = message


class BadRequestException(AppException):
    def __init__(self, message: str = "Permintaan tidak valid", code: str = "BAD_REQUEST"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, code=code, message=message)


class UnauthorizedException(AppException):
    def __init__(
        self,
        message: str = "Token otentikasi tidak valid atau telah kedaluwarsa",
        code: str = "UNAUTHORIZED",
    ):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code=code,
            message=message,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(AppException):
    def __init__(
        self,
        message: str = "Akses ditolak: X-API-Key tidak valid atau Anda tidak memiliki izin",
        code: str = "FORBIDDEN",
    ):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, code=code, message=message)


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource yang diminta tidak ditemukan", code: str = "NOT_FOUND"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, code=code, message=message)


class RateLimitException(AppException):
    def __init__(
        self,
        message: str = "Batas permintaan terlampaui. Silakan coba beberapa saat lagi.",
        code: str = "RATE_LIMIT_EXCEEDED",
    ):
        super().__init__(status_code=status.HTTP_429_TOO_MANY_REQUESTS, code=code, message=message)
