from datetime import date, datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, NotFoundException, ForbiddenException
from app.core.utils import (
    calculate_dynamic_pricing,
    calculate_commission_split,
    haversine_distance_m,
)
from app.domain.models import User, Pass, Trail, Waypoint, Checkin
from app.domain.schemas.checkin import CheckinRequest, CheckinResponse
from app.domain.schemas.pass_ticket import (
    PassPurchaseRequest,
    PassAllocation,
    PassDetailItem,
    UserTripHistoryResponse,
    WaypointProgress,
)
from app.infrastructure.repositories.pass_repo import PassRepository
from app.infrastructure.repositories.trail_repo import TrailRepository


class PassService:
    def __init__(self, db: Session):
        self.db = db
        self.pass_repo = PassRepository(db)
        self.trail_repo = TrailRepository(db)

    def purchase_pass(self, user: User, req: PassPurchaseRequest) -> PassDetailItem:
        trail = self.trail_repo.get_by_id(req.trail_id)
        if not trail:
            raise NotFoundException(
                code="TRAIL_NOT_FOUND",
                message=f"Rute dengan ID '{req.trail_id}' tidak ditemukan.",
            )

        num_waypoints = len(trail.waypoints)
        pricing = calculate_dynamic_pricing(
            base_trail_price=trail.price_idr,
            waypoint_count=num_waypoints,
            visit_hour_str=req.visit_time,
        )
        total_price = pricing["final_price_idr"]

        umkm_alloc, curator_alloc, platform_fee = calculate_commission_split(total_price)

        visit_dt = datetime.now(timezone.utc)
        if req.visit_date:
            visit_dt = datetime.combine(req.visit_date, datetime.min.time(), tzinfo=timezone.utc)

        new_pass = self.pass_repo.create_pass(
            user_id=user.id,
            trail_id=trail.id,
            visit_date=visit_dt,
            total_price_idr=total_price,
            umkm_allocation_idr=umkm_alloc,
            curator_allocation_idr=curator_alloc,
            platform_fee_idr=platform_fee,
        )

        return self._format_pass_detail(new_pass, trail, [])

    def verify_checkin(self, user: User, pass_id: str, req: CheckinRequest) -> CheckinResponse:
        pass_obj = self.pass_repo.get_by_id(pass_id)
        if not pass_obj:
            raise NotFoundException(
                code="PASS_NOT_FOUND",
                message=f"Digital Pass dengan ID '{pass_id}' tidak ditemukan.",
            )

        if pass_obj.user_id != user.id:
            raise ForbiddenException(
                code="PASS_ACCESS_DENIED",
                message="Anda tidak memiliki akses ke Digital Pass ini.",
            )

        waypoint = self.trail_repo.get_waypoint_by_id(req.waypoint_id)
        if not waypoint or waypoint.trail_id != pass_obj.trail_id:
            raise BadRequestException(
                code="INVALID_WAYPOINT",
                message="Titik pos tidak valid atau bukan bagian dari rute tiket ini.",
            )

        # Check if already checked in
        existing_checkin = self.pass_repo.get_checkin(pass_id, req.waypoint_id)
        if existing_checkin:
            return CheckinResponse(
                checkin_id=existing_checkin.id,
                pass_id=pass_obj.id,
                waypoint_id=waypoint.id,
                waypoint_name=waypoint.name,
                checked_in_at=existing_checkin.checked_in_at,
                user_lat=existing_checkin.verified_lat,
                user_lon=existing_checkin.verified_lon,
                waypoint_lat=waypoint.lat,
                waypoint_lon=waypoint.lon,
                distance_m=existing_checkin.distance_m,
                radius_m=waypoint.radius_m,
                is_valid=True,
                message="Pos ini sudah pernah di-checkin sebelumnya.",
                story_text=waypoint.story_text,
                umkm_name=waypoint.umkm_name,
                voucher_code=waypoint.voucher_code,
                voucher_desc=waypoint.voucher_desc,
            )

        # Compute Haversine distance
        dist_m = haversine_distance_m(req.user_lat, req.user_lon, waypoint.lat, waypoint.lon)

        if dist_m > waypoint.radius_m:
            raise BadRequestException(
                code="CHECKIN_OUT_OF_RANGE",
                message=(
                    f"Check-in gagal: Anda berada {int(dist_m)} meter dari titik pos '{waypoint.name}'. "
                    f"Radius toleransi maksimum adalah {waypoint.radius_m} meter."
                ),
            )

        # Record checkin
        checkin = self.pass_repo.create_checkin(
            pass_id=pass_obj.id,
            waypoint_id=waypoint.id,
            user_id=user.id,
            verified_lat=req.user_lat,
            verified_lon=req.user_lon,
            distance_m=dist_m,
        )

        # Check if all waypoints are checked in -> update status to COMPLETED
        trail = pass_obj.trail
        all_checkins = pass_obj.checkins
        checked_wp_ids = {c.waypoint_id for c in all_checkins}
        checked_wp_ids.add(waypoint.id)
        if len(checked_wp_ids) >= len(trail.waypoints):
            self.pass_repo.update_pass_status(pass_obj.id, "COMPLETED")

        return CheckinResponse(
            checkin_id=checkin.id,
            pass_id=pass_obj.id,
            waypoint_id=waypoint.id,
            waypoint_name=waypoint.name,
            checked_in_at=checkin.checked_in_at,
            user_lat=req.user_lat,
            user_lon=req.user_lon,
            waypoint_lat=waypoint.lat,
            waypoint_lon=waypoint.lon,
            distance_m=dist_m,
            radius_m=waypoint.radius_m,
            is_valid=True,
            message="Check-in GPS berhasil! Narasi sejarah & promo UMKM telah terbuka.",
            story_text=waypoint.story_text,
            umkm_name=waypoint.umkm_name,
            voucher_code=waypoint.voucher_code,
            voucher_desc=waypoint.voucher_desc,
        )

    def get_user_trip_history(self, user: User) -> UserTripHistoryResponse:
        passes = self.pass_repo.get_by_user(user.id)

        pass_items: List[PassDetailItem] = []
        total_steps = 0
        total_kcal = 0
        completed_count = 0

        for p in passes:
            trail = p.trail
            checkins_map = {c.waypoint_id: c for c in p.checkins}
            detail = self._format_pass_detail(p, trail, p.checkins)
            pass_items.append(detail)

            if p.status == "COMPLETED" or len(p.checkins) == len(trail.waypoints):
                completed_count += 1
                total_steps += trail.est_steps
                total_kcal += trail.est_kcal
            elif len(p.checkins) > 0:
                # Pro-rate steps and kcal based on checkin progress
                fraction = len(p.checkins) / max(1, len(trail.waypoints))
                total_steps += int(trail.est_steps * fraction)
                total_kcal += int(trail.est_kcal * fraction)

        return UserTripHistoryResponse(
            user_id=user.id,
            user_name=user.full_name,
            total_passes_purchased=len(passes),
            total_completed_trips=completed_count,
            total_steps_achieved=total_steps,
            total_kcal_burned=total_kcal,
            passes=pass_items,
        )

    def _format_pass_detail(self, p: Pass, trail: Trail, checkins: List[Checkin]) -> PassDetailItem:
        checkins_map = {c.waypoint_id: c for c in checkins}
        waypoints_progress: List[WaypointProgress] = []

        for wp in trail.waypoints:
            chk = checkins_map.get(wp.id)
            is_chk = chk is not None
            waypoints_progress.append(
                WaypointProgress(
                    waypoint_id=wp.id,
                    waypoint_name=wp.name,
                    sequence=wp.sequence,
                    category=wp.category,
                    is_checked_in=is_chk,
                    checked_in_at=chk.checked_in_at if chk else None,
                    story_text=wp.story_text if is_chk else None,
                    umkm_name=wp.umkm_name if is_chk else None,
                    voucher_code=wp.voucher_code if is_chk else None,
                )
            )

        checked_count = len(checkins)
        total_wp = len(trail.waypoints)
        completion_pct = round((checked_count / max(1, total_wp)) * 100.0, 1)

        return PassDetailItem(
            id=p.id,
            trail_id=trail.id,
            trail_title=trail.title,
            purchase_date=p.purchase_date,
            visit_date=p.visit_date,
            status=p.status,
            total_price_idr=p.total_price_idr,
            allocation=PassAllocation(
                total_price_idr=p.total_price_idr,
                umkm_allocation_idr=p.umkm_allocation_idr,
                curator_allocation_idr=p.curator_allocation_idr,
                platform_fee_idr=p.platform_fee_idr,
            ),
            total_waypoints=total_wp,
            checked_in_count=checked_count,
            completion_percentage=completion_pct,
            est_steps=trail.est_steps,
            est_kcal=trail.est_kcal,
            waypoints_progress=waypoints_progress,
        )
