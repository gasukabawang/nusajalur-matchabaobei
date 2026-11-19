import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.infrastructure.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    passes = relationship("Pass", back_populates="user", cascade="all, delete-orphan")
    checkins = relationship("Checkin", back_populates="user", cascade="all, delete-orphan")


class Curator(Base):
    __tablename__ = "curators"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    bio = Column(Text, nullable=False)
    avatar_url = Column(String(512), nullable=False)
    badge = Column(String(255), nullable=True)

    trails = relationship("Trail", back_populates="curator")


class Trail(Base):
    __tablename__ = "trails"

    id = Column(String(64), primary_key=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    theme = Column(String(64), index=True, nullable=False)  # heritage, kuliner, arsitektur, alam, sejarah
    description = Column(Text, nullable=False)
    city = Column(String(100), default="Bandung", nullable=False)
    distance_km = Column(Float, nullable=False)
    est_duration_min = Column(Integer, nullable=False)
    est_steps = Column(Integer, nullable=False)
    est_kcal = Column(Integer, nullable=False)
    price_idr = Column(Integer, nullable=False)
    difficulty = Column(String(50), default="Mudah", nullable=False)
    curator_id = Column(String(36), ForeignKey("curators.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    curator = relationship("Curator", back_populates="trails")
    waypoints = relationship(
        "Waypoint",
        back_populates="trail",
        cascade="all, delete-orphan",
        order_by="Waypoint.sequence",
    )
    passes = relationship("Pass", back_populates="trail")


class Waypoint(Base):
    __tablename__ = "waypoints"

    id = Column(String(64), primary_key=True)
    trail_id = Column(String(64), ForeignKey("trails.id"), nullable=False)
    sequence = Column(Integer, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False)  # heritage, kuliner, alam, edukasi
    description = Column(Text, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    radius_m = Column(Integer, default=50, nullable=False)  # Toleransi checkin GPS

    # Protected content: unlocked upon check-in
    story_text = Column(Text, nullable=False)
    umkm_name = Column(String(255), nullable=False)
    promo_teaser = Column(String(255), nullable=False)
    voucher_code = Column(String(64), nullable=False)
    voucher_desc = Column(Text, nullable=False)

    trail = relationship("Trail", back_populates="waypoints")
    checkins = relationship("Checkin", back_populates="waypoint", cascade="all, delete-orphan")


class Pass(Base):
    __tablename__ = "passes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    trail_id = Column(String(64), ForeignKey("trails.id"), nullable=False)
    purchase_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    visit_date = Column(DateTime, nullable=False)
    status = Column(String(32), default="ACTIVE", nullable=False)  # ACTIVE, COMPLETED, EXPIRED

    # Commission allocation breakdown
    total_price_idr = Column(Integer, nullable=False)
    umkm_allocation_idr = Column(Integer, nullable=False)
    curator_allocation_idr = Column(Integer, nullable=False)
    platform_fee_idr = Column(Integer, nullable=False)

    user = relationship("User", back_populates="passes")
    trail = relationship("Trail", back_populates="passes")
    checkins = relationship("Checkin", back_populates="pass_rel", cascade="all, delete-orphan")


class Checkin(Base):
    __tablename__ = "checkins"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    pass_id = Column(String(36), ForeignKey("passes.id"), nullable=False)
    waypoint_id = Column(String(64), ForeignKey("waypoints.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    checked_in_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    verified_lat = Column(Float, nullable=False)
    verified_lon = Column(Float, nullable=False)
    distance_m = Column(Float, nullable=False)

    pass_rel = relationship("Pass", back_populates="checkins")
    waypoint = relationship("Waypoint", back_populates="checkins")
    user = relationship("User", back_populates="checkins")


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    key_hash = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    owner_group = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
