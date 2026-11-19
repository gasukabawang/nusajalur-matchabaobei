from typing import Optional
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundException
from app.core.utils import calculate_dynamic_pricing
from app.domain.schemas.pricing import TrailPricingResponse
from app.infrastructure.repositories.trail_repo import TrailRepository


class PricingService:
    def __init__(self, db: Session):
        self.trail_repo = TrailRepository(db)

    def calculate_price_for_trail(
        self,
        trail_id: str,
        visit_time: Optional[str] = None,
    ) -> TrailPricingResponse:
        trail = self.trail_repo.get_by_id(trail_id)
        if not trail:
            raise NotFoundException(
                code="TRAIL_NOT_FOUND",
                message=f"Rute jalan kaki dengan ID '{trail_id}' tidak ditemukan.",
            )

        num_waypoints = len(trail.waypoints)
        calc = calculate_dynamic_pricing(
            base_trail_price=trail.price_idr,
            waypoint_count=num_waypoints,
            visit_hour_str=visit_time,
        )

        return TrailPricingResponse(
            trail_id=trail.id,
            trail_title=trail.title,
            num_waypoints=num_waypoints,
            base_trail_price_idr=calc["base_trail_price"],
            waypoint_subtotal_idr=calc["waypoint_subtotal"],
            subtotal_idr=calc["base_subtotal"],
            visit_time_evaluated=visit_time or "Waktu Saat Ini",
            is_off_peak=calc["is_off_peak"],
            discount_percentage=calc["discount_percent"],
            discount_amount_idr=calc["discount_amount"],
            final_price_idr=calc["final_price_idr"],
            pricing_rule=calc["pricing_rule"],
        )
