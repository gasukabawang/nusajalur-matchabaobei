from fastapi import APIRouter
from app.domain.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Health Check")
def health_check():
    """Mengembalikan status kesehatan sistem backend NusaJalur."""
    return HealthResponse(status="ok")
