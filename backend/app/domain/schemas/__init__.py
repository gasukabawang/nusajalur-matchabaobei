from app.domain.schemas.common import ErrorDetail, ErrorResponse, HealthResponse
from app.domain.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
)
from app.domain.schemas.trail import (
    CuratorProfile,
    WaypointSimpleResponse,
    TrailListItem,
    TrailDetailResponse,
    TrailsListResponse,
)
from app.domain.schemas.pricing import TrailPricingResponse
from app.domain.schemas.checkin import CheckinRequest, CheckinResponse
from app.domain.schemas.pass_ticket import (
    PassPurchaseRequest,
    PassAllocation,
    PassDetailItem,
    UserTripHistoryResponse,
    WaypointProgress,
)
from app.domain.schemas.public import (
    DestinationNearbyItem,
    DestinationsNearbyResponse,
    MeasuredTrailItem,
    MeasuredTrailsResponse,
)
