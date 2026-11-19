from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.application.auth_service import AuthService
from app.domain.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
)
from app.infrastructure.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrasi Pengguna Baru",
)
def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """Mendaftarkan pengguna baru aplikasi mobile NusaJalur dan menerbitkan JWT."""
    service = AuthService(db)
    return service.register(req)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login Pengguna",
)
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    """Otentikasi email dan kata sandi pengguna, mengembalikan JWT Bearer Token."""
    service = AuthService(db)
    return service.login(req)
