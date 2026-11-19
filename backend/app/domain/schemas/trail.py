from typing import List, Optional
from pydantic import BaseModel, Field


class CuratorProfile(BaseModel):
    id: str
    name: str
    bio: str
    avatar_url: str
    badge: Optional[str] = None

    class Config:
        from_attributes = True


class WaypointSimpleResponse(BaseModel):
    id: str
    sequence: int
    name: str
    category: str
    description: str
    lat: float
    lon: float
    radius_m: int
    umkm_name: str
    promo_teaser: str

    class Config:
        from_attributes = True


class TrailListItem(BaseModel):
    id: str
    title: str
    slug: str
    theme: str
    description: str
    city: str
    distance_km: float
    est_duration_min: int
    est_steps: int
    est_kcal: int
    price_idr: int
    difficulty: str
    distance_from_user_km: Optional[float] = Field(
        None, description="Jarak dari posisi pengguna ke titik awal rute (Haversine)"
    )
    curator: CuratorProfile

    class Config:
        from_attributes = True


class TrailDetailResponse(TrailListItem):
    waypoints: List[WaypointSimpleResponse] = []


class TrailsListResponse(BaseModel):
    total: int
    trails: List[TrailListItem]
