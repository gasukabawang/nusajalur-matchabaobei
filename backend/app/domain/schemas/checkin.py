from datetime import datetime
from pydantic import BaseModel, Field


class CheckinRequest(BaseModel):
    waypoint_id: str = Field(..., example="wp-braga-01", description="ID Waypoint yang dikunjungi")
    user_lat: float = Field(..., example=-6.917464, description="Koordinat Latitude pengguna")
    user_lon: float = Field(..., example=107.609072, description="Koordinat Longitude pengguna")


class CheckinResponse(BaseModel):
    checkin_id: str
    pass_id: str
    waypoint_id: str
    waypoint_name: str
    checked_in_at: datetime
    user_lat: float
    user_lon: float
    waypoint_lat: float
    waypoint_lon: float
    distance_m: float
    radius_m: int
    is_valid: bool = True
    message: str = "Check-in GPS berhasil! Narasi sejarah & voucher UMKM telah terbuka."

    # Unlocked rewards
    story_text: str
    umkm_name: str
    voucher_code: str
    voucher_desc: str
