from typing import Optional
from pydantic import BaseModel, Field


class TrailPricingResponse(BaseModel):
    trail_id: str
    trail_title: str
    num_waypoints: int
    base_trail_price_idr: int
    waypoint_subtotal_idr: int
    subtotal_idr: int
    visit_time_evaluated: Optional[str]
    is_off_peak: bool
    discount_percentage: int
    discount_amount_idr: int
    final_price_idr: int
    pricing_rule: str
