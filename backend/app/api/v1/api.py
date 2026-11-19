from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    trails,
    passes,
    users,
    public,
)

api_router = APIRouter()

# Register endpoint sub-routers
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(trails.router)
api_router.include_router(passes.router)
api_router.include_router(users.router)
api_router.include_router(public.router)
