from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundException
from app.core.utils import haversine_distance_km
from app.domain.schemas.trail import (
    TrailListItem,
    TrailDetailResponse,
    TrailsListResponse,
    CuratorProfile,
    WaypointSimpleResponse,
)
from app.infrastructure.repositories.trail_repo import TrailRepository


class TrailService:
    def __init__(self, db: Session):
        self.trail_repo = TrailRepository(db)

    def list_trails(
        self,
        theme: Optional[str] = None,
        max_duration_min: Optional[int] = None,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
    ) -> TrailsListResponse:
        trails = self.trail_repo.get_all(theme=theme, max_duration_min=max_duration_min)

        items: List[TrailListItem] = []
        for t in trails:
            dist_km: Optional[float] = None
            if user_lat is not None and user_lon is not None and t.waypoints:
                first_wp = t.waypoints[0]
                dist_km = haversine_distance_km(user_lat, user_lon, first_wp.lat, first_wp.lon)

            item = TrailListItem(
                id=t.id,
                title=t.title,
                slug=t.slug,
                theme=t.theme,
                description=t.description,
                city=t.city,
                distance_km=t.distance_km,
                est_duration_min=t.est_duration_min,
                est_steps=t.est_steps,
                est_kcal=t.est_kcal,
                price_idr=t.price_idr,
                difficulty=t.difficulty,
                distance_from_user_km=dist_km,
                curator=CuratorProfile.model_validate(t.curator),
            )
            items.append(item)

        # If user location provided, sort by nearest distance to start point
        if user_lat is not None and user_lon is not None:
            items.sort(key=lambda x: (x.distance_from_user_km is None, x.distance_from_user_km or 0))

        return TrailsListResponse(total=len(items), trails=items)

    def get_trail_detail(self, trail_id: str) -> TrailDetailResponse:
        trail = self.trail_repo.get_by_id(trail_id)
        if not trail:
            raise NotFoundException(
                code="TRAIL_NOT_FOUND",
                message=f"Rute jalan kaki dengan ID '{trail_id}' tidak ditemukan.",
            )

        waypoints_data = [
            WaypointSimpleResponse(
                id=wp.id,
                sequence=wp.sequence,
                name=wp.name,
                category=wp.category,
                description=wp.description,
                lat=wp.lat,
                lon=wp.lon,
                radius_m=wp.radius_m,
                umkm_name=wp.umkm_name,
                promo_teaser=wp.promo_teaser,
            )
            for wp in trail.waypoints
        ]

        return TrailDetailResponse(
            id=trail.id,
            title=trail.title,
            slug=trail.slug,
            theme=trail.theme,
            description=trail.description,
            city=trail.city,
            distance_km=trail.distance_km,
            est_duration_min=trail.est_duration_min,
            est_steps=trail.est_steps,
            est_kcal=trail.est_kcal,
            price_idr=trail.price_idr,
            difficulty=trail.difficulty,
            curator=CuratorProfile.model_validate(trail.curator),
            waypoints=waypoints_data,
        )
