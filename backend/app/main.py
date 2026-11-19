from contextlib import asynccontextmanager
from typing import Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.exceptions import AppException
from app.infrastructure.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="NusaJalur API (matchabaobei)",
    description=(
        "Backend Microservice NusaJalur untuk Tugas 2 II3160 Teknologi Sistem Terintegrasi.\n\n"
        "- **Kelas**: K01\n"
        "- **Subdomain / Slug**: `matchabaobei`\n"
        "- **Base URL Publik**: `https://matchabaobei.stei.fun/api/v1`\n"
        "- **Fitur Utama**: Wisata Jalan Kaki Budaya Terukur (Fitness & Heritage), Tiket Digital Trail Pass, "
        "Verifikasi GPS Check-in, Pembagian Komisi UMKM & Kurator, dan Integrasi B2B (X-API-Key)."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    servers=[
        {"url": "https://matchabaobei.stei.fun", "description": "Production Gateway (Cloudflare Tunnel)"},
        {"url": "http://localhost:8000", "description": "Local Development Core Service"},
    ],
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standard Error Format Handler: {"error": {"code": "...", "message": "..."}}
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        422: "UNPROCESSABLE_ENTITY",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_SERVER_ERROR",
    }
    code = code_map.get(exc.status_code, "HTTP_ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={
            "error": {
                "code": code,
                "message": str(exc.detail),
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Build clean human-friendly validation message
    errors = exc.errors()
    error_messages = []
    for err in errors:
        loc = " -> ".join([str(l) for l in err.get("loc", []) if l != "body"])
        msg = err.get("msg", "Input tidak valid")
        error_messages.append(f"{loc}: {msg}" if loc else msg)

    detail_message = "; ".join(error_messages) if error_messages else "Validasi input gagal."

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": detail_message,
            }
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Terjadi kesalahan internal pada server NusaJalur.",
            }
        },
    )


# Mount API V1 routes under /api/v1
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Root redirect or greeting
@app.get("/", include_in_schema=False)
def root():
    return {
        "service": "NusaJalur Backend Microservice",
        "subdomain": settings.PROJECT_SLUG,
        "docs": "/docs",
        "api_v1": f"{settings.API_V1_PREFIX}/health",
    }
