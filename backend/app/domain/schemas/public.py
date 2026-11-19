from typing import List, Optional
from pydantic import BaseModel, Field


class DestinationNearbyItem(BaseModel):
    waypoint_id: str
    name: str
    category: str
    description: str
    lat: float
    lon: float
    distance_m: float
    radius_m: int
    trail_id: str
    trail_title: str
    umkm_name: str
    promo_teaser: str


class DestinationsNearbyResponse(BaseModel):
    total_found: int
    query_lat: float
    query_lon: float
    search_radius_m: float
    destinations: List[DestinationNearbyItem]


class MeasuredTrailItem(BaseModel):
    trail_id: str
    title: str
    theme: str
    description: str
    city: str
    distance_km: float
    est_duration_min: int
    est_steps: int
    est_kcal: int
    difficulty: str
    waypoints_count: int
    target_health_metric: str = "Walking fitness & cultural heritage discovery"


class MeasuredTrailsResponse(BaseModel):
    total_trails: int
    filter_min_kcal: Optional[int] = None
    filter_max_kcal: Optional[int] = None
    trails: List[MeasuredTrailItem]
