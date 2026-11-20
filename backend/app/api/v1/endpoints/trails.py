from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.application.trail_service import TrailService
from app.application.pricing_service import PricingService
from app.domain.models import User
from app.domain.schemas.trail import (
    TrailsListResponse,
    TrailDetailResponse,
)
from app.domain.schemas.pricing import TrailPricingResponse
from app.infrastructure.database import get_db

router = APIRouter(prefix="/trails", tags=["Trails & Routes"])


@router.get(
    "",
    response_model=TrailsListResponse,
    summary="Daftar Rute Jalan Kaki Budaya & Kebugaran",
)
def get_trails(
    theme: Optional[str] = Query(None, description="Filter tema (e.g. heritage, kuliner, arsitektur, alam)"),
    city: Optional[str] = Query(None, description="Filter kota (e.g. Bandung, Jakarta)"),
    max_duration_min: Optional[int] = Query(None, description="Durasi maksimum dalam menit"),
    lat: Optional[float] = Query(None, description="Latitude posisi pengguna untuk kalkulasi jarak terdekat (Haversine)"),
    lon: Optional[float] = Query(None, description="Longitude posisi pengguna untuk kalkulasi jarak terdekat (Haversine)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mengambil daftar rute wisata jalan kaki budaya terukur.
    Mendukung filter tema, kota, durasi, dan kalkulasi jarak GPS Haversine dari titik awal pengguna.
    """
    service = TrailService(db)
    return service.list_trails(
        theme=theme,
        city=city,
        max_duration_min=max_duration_min,
        user_lat=lat,
        user_lon=lon,
    )


@router.get(
    "/{trail_id}",
    response_model=TrailDetailResponse,
    summary="Detail Rute & Daftar Titik Pos (Waypoints)",
)
def get_trail_detail(
    trail_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mengambil informasi lengkap rute beserta daftar waypoints (koordinat GPS dan radius toleransi).
    """
    service = TrailService(db)
    return service.get_trail_detail(trail_id)


@router.get(
    "/{trail_id}/pricing",
    response_model=TrailPricingResponse,
    summary="Kalkulasi Harga Tiket Dinamis",
)
def get_trail_pricing(
    trail_id: str,
    visit_time: Optional[str] = Query(
        None,
        description="Format waktu HH:MM (contoh: '06:30'). Jam pagi (05:00 - 08:30) mendapatkan diskon off-peak 20%",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Menghitung harga tiket dinamis berdasarkan jumlah pos wisata dan jam kunjungan.
    Kunjungan off-peak pagi hari mendapatkan diskon 20%.
    """
    service = PricingService(db)
    return service.calculate_price_for_trail(trail_id=trail_id, visit_time=visit_time)
