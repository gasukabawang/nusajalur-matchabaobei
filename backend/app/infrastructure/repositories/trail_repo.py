from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.domain.models import Trail, Waypoint, Curator


class TrailRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        theme: Optional[str] = None,
        city: Optional[str] = None,
        max_duration_min: Optional[int] = None,
        min_kcal: Optional[int] = None,
        max_kcal: Optional[int] = None,
    ) -> List[Trail]:
        query = self.db.query(Trail).options(
            joinedload(Trail.curator),
            joinedload(Trail.waypoints),
        )
        if theme:
            query = query.filter(Trail.theme.ilike(f"%{theme}%"))
        if city:
            query = query.filter(Trail.city.ilike(f"%{city}%"))
        if max_duration_min:
            query = query.filter(Trail.est_duration_min <= max_duration_min)
        if min_kcal:
            query = query.filter(Trail.est_kcal >= min_kcal)
        if max_kcal:
            query = query.filter(Trail.est_kcal <= max_kcal)

        return query.order_by(Trail.created_at.desc()).all()

    def get_by_id(self, trail_id: str) -> Optional[Trail]:
        return (
            self.db.query(Trail)
            .options(
                joinedload(Trail.curator),
                joinedload(Trail.waypoints),
            )
            .filter(Trail.id == trail_id)
            .first()
        )

    def get_waypoint_by_id(self, waypoint_id: str) -> Optional[Waypoint]:
        return (
            self.db.query(Waypoint)
            .options(joinedload(Waypoint.trail))
            .filter(Waypoint.id == waypoint_id)
            .first()
        )

    def get_all_waypoints(self) -> List[Waypoint]:
        return (
            self.db.query(Waypoint)
            .options(joinedload(Waypoint.trail))
            .all()
        )
