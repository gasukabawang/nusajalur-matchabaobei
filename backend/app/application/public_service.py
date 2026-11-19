from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.utils import haversine_distance_m
from app.domain.schemas.public import (
    DestinationNearbyItem,
    DestinationsNearbyResponse,
    MeasuredTrailItem,
    MeasuredTrailsResponse,
)
from app.infrastructure.repositories.trail_repo import TrailRepository


class PublicService:
    def __init__(self, db: Session):
        self.trail_repo = TrailRepository(db)

    def get_destinations_nearby(
        self,
        lat: float,
        lon: float,
        radius_m: float = 1000.0,
    ) -> DestinationsNearbyResponse:
        all_waypoints = self.trail_repo.get_all_waypoints()
        nearby_items: List[DestinationNearbyItem] = []

        for wp in all_waypoints:
            dist = haversine_distance_m(lat, lon, wp.lat, wp.lon)
            if dist <= radius_m:
                trail_title = wp.trail.title if wp.trail else "NusaJalur Route"
                nearby_items.append(
                    DestinationNearbyItem(
                        waypoint_id=wp.id,
                        name=wp.name,
                        category=wp.category,
                        description=wp.description,
                        lat=wp.lat,
                        lon=wp.lon,
                        distance_m=dist,
                        radius_m=wp.radius_m,
                        trail_id=wp.trail_id,
                        trail_title=trail_title,
                        umkm_name=wp.umkm_name,
                        promo_teaser=wp.promo_teaser,
                    )
                )

        nearby_items.sort(key=lambda x: x.distance_m)

        return DestinationsNearbyResponse(
            total_found=len(nearby_items),
            query_lat=lat,
            query_lon=lon,
            search_radius_m=radius_m,
            destinations=nearby_items,
        )

    def get_measured_trails(
        self,
        min_kcal: Optional[int] = None,
        max_kcal: Optional[int] = None,
    ) -> MeasuredTrailsResponse:
        trails = self.trail_repo.get_all(min_kcal=min_kcal, max_kcal=max_kcal)

        items = [
            MeasuredTrailItem(
                trail_id=t.id,
                title=t.title,
                theme=t.theme,
                description=t.description,
                city=t.city,
                distance_km=t.distance_km,
                est_duration_min=t.est_duration_min,
                est_steps=t.est_steps,
                est_kcal=t.est_kcal,
                difficulty=t.difficulty,
                waypoints_count=len(t.waypoints),
                target_health_metric="Walking fitness, calorie burn, and cultural discovery",
            )
            for t in trails
        ]

        return MeasuredTrailsResponse(
            total_trails=len(items),
            filter_min_kcal=min_kcal,
            filter_max_kcal=max_kcal,
            trails=items,
        )
