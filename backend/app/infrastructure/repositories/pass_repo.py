from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.domain.models import Pass, Checkin, Waypoint, Trail


class PassRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_pass(
        self,
        user_id: str,
        trail_id: str,
        visit_date: datetime,
        total_price_idr: int,
        umkm_allocation_idr: int,
        curator_allocation_idr: int,
        platform_fee_idr: int,
    ) -> Pass:
        new_pass = Pass(
            user_id=user_id,
            trail_id=trail_id,
            visit_date=visit_date,
            total_price_idr=total_price_idr,
            umkm_allocation_idr=umkm_allocation_idr,
            curator_allocation_idr=curator_allocation_idr,
            platform_fee_idr=platform_fee_idr,
            status="ACTIVE",
        )
        self.db.add(new_pass)
        self.db.commit()
        self.db.refresh(new_pass)
        return new_pass

    def get_by_id(self, pass_id: str) -> Optional[Pass]:
        return (
            self.db.query(Pass)
            .options(
                joinedload(Pass.trail).joinedload(Trail.waypoints),
                joinedload(Pass.checkins),
            )
            .filter(Pass.id == pass_id)
            .first()
        )

    def get_by_user(self, user_id: str) -> List[Pass]:
        return (
            self.db.query(Pass)
            .options(
                joinedload(Pass.trail).joinedload(Trail.waypoints),
                joinedload(Pass.checkins),
            )
            .filter(Pass.user_id == user_id)
            .order_by(Pass.purchase_date.desc())
            .all()
        )

    def get_checkin(self, pass_id: str, waypoint_id: str) -> Optional[Checkin]:
        return (
            self.db.query(Checkin)
            .filter(Checkin.pass_id == pass_id, Checkin.waypoint_id == waypoint_id)
            .first()
        )

    def create_checkin(
        self,
        pass_id: str,
        waypoint_id: str,
        user_id: str,
        verified_lat: float,
        verified_lon: float,
        distance_m: float,
    ) -> Checkin:
        checkin = Checkin(
            pass_id=pass_id,
            waypoint_id=waypoint_id,
            user_id=user_id,
            verified_lat=verified_lat,
            verified_lon=verified_lon,
            distance_m=distance_m,
            checked_in_at=datetime.now(timezone.utc),
        )
        self.db.add(checkin)
        self.db.commit()
        self.db.refresh(checkin)
        return checkin

    def update_pass_status(self, pass_id: str, status: str) -> None:
        p = self.db.query(Pass).filter(Pass.id == pass_id).first()
        if p:
            p.status = status
            self.db.commit()
