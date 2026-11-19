from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class PassPurchaseRequest(BaseModel):
    trail_id: str = Field(..., example="trail-braga-heritage", description="ID rute jalan kaki budaya")
    visit_date: Optional[date] = Field(None, description="Tanggal kunjungan yang direncanakan (default: hari ini)")
    visit_time: Optional[str] = Field(None, example="07:00", description="Jam kunjungan (HH:MM) untuk kalkulasi diskon off-peak")


class PassAllocation(BaseModel):
    total_price_idr: int
    umkm_allocation_idr: int = Field(..., description="Alokasi 70% untuk dana voucher UMKM & kompensasi merchant")
    curator_allocation_idr: int = Field(..., description="Alokasi 15% untuk kurator lokal pembuat rute")
    platform_fee_idr: int = Field(..., description="Alokasi 15% untuk operasional platform NusaJalur")


class WaypointProgress(BaseModel):
    waypoint_id: str
    waypoint_name: str
    sequence: int
    category: str
    is_checked_in: bool
    checked_in_at: Optional[datetime] = None
    story_text: Optional[str] = None
    umkm_name: Optional[str] = None
    voucher_code: Optional[str] = None


class PassDetailItem(BaseModel):
    id: str
    trail_id: str
    trail_title: str
    purchase_date: datetime
    visit_date: datetime
    status: str
    total_price_idr: int
    allocation: PassAllocation
    total_waypoints: int
    checked_in_count: int
    completion_percentage: float
    est_steps: int
    est_kcal: int
    waypoints_progress: List[WaypointProgress] = []

    class Config:
        from_attributes = True


class UserTripHistoryResponse(BaseModel):
    user_id: str
    user_name: str
    total_passes_purchased: int
    total_completed_trips: int
    total_steps_achieved: int
    total_kcal_burned: int
    passes: List[PassDetailItem]
