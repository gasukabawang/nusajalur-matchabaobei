from typing import Optional
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str = Field(..., description="Kode error sistem, e.g. NOT_FOUND, UNAUTHORIZED")
    message: str = Field(..., description="Pesan deskriptif mengenai error yang terjadi")


class ErrorResponse(BaseModel):
    error: ErrorDetail


class HealthResponse(BaseModel):
    status: str = Field("ok", example="ok")
