from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.application.pass_service import PassService
from app.domain.models import User
from app.domain.schemas.checkin import CheckinRequest, CheckinResponse
from app.domain.schemas.pass_ticket import PassPurchaseRequest, PassDetailItem
from app.infrastructure.database import get_db

router = APIRouter(prefix="/passes", tags=["Digital Passes & GPS Check-ins"])


@router.post(
    "",
    response_model=PassDetailItem,
    status_code=status.HTTP_201_CREATED,
    summary="Pembelian Digital Trail Pass",
)
def purchase_pass(
    req: PassPurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Menerbitkan Digital Trail Pass (simulasi lunas instan).
    Menghitung alokasi pendapatan secara otomatis: 70% voucher UMKM, 15% kurator lokal, 15% platform.
    """
    service = PassService(db)
    return service.purchase_pass(user=current_user, req=req)


@router.post(
    "/{pass_id}/checkins",
    response_model=CheckinResponse,
    status_code=status.HTTP_200_OK,
    summary="Verifikasi GPS Check-in di Titik Pos",
)
def verify_checkin(
    pass_id: str,
    req: CheckinRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Memverifikasi posisi GPS pengguna terhadap titik pos (waypoint).
    Jika jarak <= radius_m pos, check-in berhasil dan membuka kunci cerita sejarah serta kode voucher promo UMKM.
    Jika jarak > radius_m, mengembalikan kode error CHECKIN_OUT_OF_RANGE dengan detail jarak.
    """
    service = PassService(db)
    return service.verify_checkin(user=current_user, pass_id=pass_id, req=req)
