from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.application.pass_service import PassService
from app.domain.models import User
from app.domain.schemas.pass_ticket import UserTripHistoryResponse
from app.infrastructure.database import get_db

router = APIRouter(prefix="/users", tags=["User Profile & Trips"])


@router.get(
    "/me/trips",
    response_model=UserTripHistoryResponse,
    summary="Riwayat Perjalanan & Agregasi Kebugaran Pengguna",
)
def get_my_trips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mengambil riwayat tiket/pass yang dibeli, progres check-in tiap titik pos,
    serta total akumulasi langkah kaki dan kalori yang telah dicapai pengguna.
    """
    service = PassService(db)
    return service.get_user_trip_history(user=current_user)
