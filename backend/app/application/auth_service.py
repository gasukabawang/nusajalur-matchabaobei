from sqlalchemy.orm import Session
from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.security import hash_password, verify_password, create_access_token
from app.domain.models import User
from app.domain.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
)
from app.infrastructure.repositories.user_repo import UserRepository


class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def register(self, req: UserRegisterRequest) -> TokenResponse:
        existing = self.user_repo.get_by_email(req.email)
        if existing:
            raise BadRequestException(
                code="EMAIL_ALREADY_REGISTERED",
                message=f"Email '{req.email}' sudah terdaftar. Silakan login.",
            )

        hashed = hash_password(req.password)
        user = self.user_repo.create(
            email=req.email,
            hashed_password=hashed,
            full_name=req.full_name,
        )

        token = create_access_token(
            subject=user.id,
            extra_claims={"email": user.email, "name": user.full_name},
        )

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )

    def login(self, req: UserLoginRequest) -> TokenResponse:
        user = self.user_repo.get_by_email(req.email)
        if not user or not verify_password(req.password, user.hashed_password):
            raise UnauthorizedException(
                code="INVALID_CREDENTIALS",
                message="Kombinasi email dan kata sandi salah.",
            )

        token = create_access_token(
            subject=user.id,
            extra_claims={"email": user.email, "name": user.full_name},
        )

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )
