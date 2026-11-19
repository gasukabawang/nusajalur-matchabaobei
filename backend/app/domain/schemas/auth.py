from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(..., example="traveler@nusajalur.id")
    password: str = Field(..., min_length=6, example="password123")
    full_name: str = Field(..., min_length=2, example="Budi Santoso")


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., example="demo@nusajalur.id")
    password: str = Field(..., example="demo1234")


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
