from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import verify_b2b_api_key
from app.application.public_service import PublicService
from app.domain.schemas.public import (
    DestinationsNearbyResponse,
    MeasuredTrailsResponse,
)
from app.infrastructure.database import get_db

router = APIRouter(prefix="/public", tags=["B2B Public Integration (X-API-Key)"])


@router.get(
    "/destinations-nearby",
    response_model=DestinationsNearbyResponse,
    summary="Daftar Destinasi & UMKM Terdekat (B2B)",
)
def get_destinations_nearby(
    lat: float = Query(..., description="Latitude koordinat pencarian (contoh: -6.917464)"),
    lon: float = Query(..., description="Longitude koordinat pencarian (contoh: 107.609072)"),
    radius_m: float = Query(1000.0, description="Radius pencarian dalam meter (default: 1000.0)"),
    api_key_client: str = Depends(verify_b2b_api_key),
    db: Session = Depends(get_db),
):
    """
    Endpoint integrasi B2B untuk kelompok partner lain mencari titik pos wisata & UMKM
    terdekat berdasarkan koordinat GPS dan radius (formula Haversine).
    Memerlukan autentikasi header X-API-Key.
    """
    service = PublicService(db)
    return service.get_destinations_nearby(lat=lat, lon=lon, radius_m=radius_m)


@router.get(
    "/measured-trails",
    response_model=MeasuredTrailsResponse,
    summary="Daftar Rute Wisata Terukur untuk Integrasi Kesehatan (B2B)",
)
def get_measured_trails(
    min_kcal: Optional[int] = Query(None, description="Kalori minimum yang dibakar (contoh: 150)"),
    max_kcal: Optional[int] = Query(None, description="Kalori maksimum yang dibakar (contoh: 500)"),
    api_key_client: str = Depends(verify_b2b_api_key),
    db: Session = Depends(get_db),
):
    """
    Endpoint integrasi B2B khusus kelompok Health & Wellbeing (Belva) untuk mengambil data
    rute jalan kaki budaya terukur lengkap dengan estimasi kalori, langkah, dan durasi.
    Memerlukan autentikasi header X-API-Key.
    """
    service = PublicService(db)
    return service.get_measured_trails(min_kcal=min_kcal, max_kcal=max_kcal)
