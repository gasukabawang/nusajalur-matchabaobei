from typing import Optional
from fastapi import Depends, Header, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.core.security import decode_access_token, hash_api_key, verify_api_key_hash
from app.domain.models import User, ApiKey
from app.infrastructure.database import get_db
from app.infrastructure.repositories.user_repo import UserRepository
from app.infrastructure.repositories.api_key_repo import ApiKeyRepository

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependency that authenticates mobile app users via JWT Bearer token."""
    if not credentials or not credentials.credentials:
        raise UnauthorizedException(
            code="MISSING_TOKEN",
            message="Header 'Authorization: Bearer <token>' diperlukan untuk mengakses resource ini.",
        )

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise UnauthorizedException(
            code="INVALID_TOKEN",
            message="Token JWT tidak valid atau telah kedaluwarsa.",
        )

    user_id = payload["sub"]
    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException(
            code="USER_NOT_FOUND",
            message="Pengguna pemilik token ini tidak ditemukan.",
        )

    return user


def verify_b2b_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> str:
    """Dependency for B2B server-to-server access requiring valid X-API-Key."""
    if not x_api_key:
        raise ForbiddenException(
            code="MISSING_API_KEY",
            message="Header 'X-API-Key' diperlukan untuk mengakses endpoint publik B2B ini.",
        )

    # 1. Check against default API key in environment
    if settings.DEFAULT_API_KEY and x_api_key.strip() == settings.DEFAULT_API_KEY.strip():
        return settings.DEFAULT_API_KEY_NAME

    # 2. Check against hashed API keys in database
    hashed = hash_api_key(x_api_key)
    api_key_repo = ApiKeyRepository(db)
    key_entry = api_key_repo.get_by_hash(hashed)
    if key_entry and key_entry.is_active:
        return f"{key_entry.name} ({key_entry.owner_group})"

    raise ForbiddenException(
        code="INVALID_API_KEY",
        message="X-API-Key tidak valid atau tidak memiliki izin akses.",
    )
