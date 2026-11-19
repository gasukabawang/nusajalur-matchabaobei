import math
from datetime import datetime, time
from typing import Optional, Tuple


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two GPS points in meters
    using the Haversine formula.
    """
    R = 6371000.0  # Earth's radius in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    distance = R * c
    return round(distance, 2)


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance in kilometers."""
    return round(haversine_distance_m(lat1, lon1, lat2, lon2) / 1000.0, 2)


def is_off_peak_time(check_time: Optional[time] = None) -> bool:
    """
    Off-peak morning window: 05:00 - 08:30 (WIB/local).
    Ideal for morning cultural walks and walking workouts, rewarded with discount.
    """
    if check_time is None:
        check_time = datetime.now().time()

    morning_start = time(5, 0)
    morning_end = time(8, 30)

    return morning_start <= check_time <= morning_end


def calculate_dynamic_pricing(
    base_trail_price: int,
    waypoint_count: int,
    visit_hour_str: Optional[str] = None,
) -> dict:
    """
    Calculates dynamic pass pricing:
    - Base calculation = base_trail_price + (waypoint_count * 5000 IDR)
    - Off-peak morning discount = 20% off
    """
    off_peak = False
    if visit_hour_str:
        try:
            # Format expected: "HH:MM" e.g. "06:30"
            parts = visit_hour_str.split(":")
            t = time(int(parts[0]), int(parts[1]))
            off_peak = is_off_peak_time(t)
        except Exception:
            off_peak = False
    else:
        off_peak = is_off_peak_time()

    # Per-waypoint facility and merchant coupon fee
    waypoint_subtotal = waypoint_count * 5000
    base_subtotal = base_trail_price + waypoint_subtotal

    discount_percent = 20 if off_peak else 0
    discount_amount = int(base_subtotal * (discount_percent / 100)) if off_peak else 0
    final_price = base_subtotal - discount_amount

    return {
        "base_trail_price": base_trail_price,
        "waypoint_count": waypoint_count,
        "waypoint_subtotal": waypoint_subtotal,
        "base_subtotal": base_subtotal,
        "is_off_peak": off_peak,
        "discount_percent": discount_percent,
        "discount_amount": discount_amount,
        "final_price_idr": final_price,
        "pricing_rule": "Off-peak morning (05:00 - 08:30) discount 20%",
    }


def calculate_commission_split(total_price_idr: int) -> Tuple[int, int, int]:
    """
    Allocates ticket revenue:
    - 70% UMKM vouchers & merchant fund
    - 15% Local cultural curator
    - 15% NusaJalur platform operations
    """
    umkm_allocation = int(total_price_idr * 0.70)
    curator_allocation = int(total_price_idr * 0.15)
    platform_fee = total_price_idr - umkm_allocation - curator_allocation
    return umkm_allocation, curator_allocation, platform_fee
