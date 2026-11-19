# NusaJalur — Backend Microservice

> FastAPI + SQLite WAL + Docker ARM64  
> Base URL: `https://matchabaobei.stei.fun/api/v1`

Dokumentasi lengkap ada di **[README root](../README.md)**.

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Setup .env
cp ../.env.example ../.env

# 3. Seed database
cd ..
python backend/scripts/seed.py

# 4. Jalankan server
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

**Swagger UI:** `http://localhost:8000/docs`  
**OpenAPI Schema:** `http://localhost:8000/openapi.json`

---

## Struktur Aplikasi (DDD)

```
app/
├── core/
│   ├── config.py          # Pydantic Settings (.env reader)
│   ├── security.py        # bcrypt hash, JWT encode/decode, SHA-256 API key
│   ├── utils.py           # Haversine formula, off-peak pricing, commission split
│   └── exceptions.py      # AppException hierarchy (400/401/403/404/429)
├── domain/
│   ├── models.py          # SQLAlchemy ORM: User, Curator, Trail, Waypoint, Pass, Checkin, ApiKey
│   └── schemas/           # Pydantic DTOs (request/response)
├── infrastructure/
│   ├── database.py        # SQLite WAL setup, session factory
│   └── repositories/      # Data access: user, trail, pass, api_key
├── application/
│   ├── auth_service.py    # Register, login logic
│   ├── trail_service.py   # Trails listing + detail + Haversine sort
│   ├── pricing_service.py # Dynamic pricing (off-peak 20% discount)
│   ├── pass_service.py    # Pass purchase + GPS check-in + commission
│   └── public_service.py  # B2B: nearby destinations + measured trails
└── api/
    └── v1/
        ├── api.py         # Router aggregator
        ├── deps.py        # JWT + X-API-Key dependency injection
        └── endpoints/
            ├── health.py
            ├── auth.py
            ├── trails.py
            ├── passes.py
            ├── users.py
            └── public.py
```

---

## Environment Variables

```env
SECRET_KEY=your-very-long-random-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
TUNNEL_TOKEN=eyJhIjoiXXXXX...
API_KEY_HASH=sha256-of-your-b2b-api-key
```

---

## Docker Compose (ARM64 STB)

```bash
# Build & jalankan
docker compose up -d --build

# Seed data (pertama kali)
docker compose run --rm core-service python /app/scripts/seed.py

# Generate openapi.yaml
docker compose run --rm core-service python /app/scripts/export_openapi.py

# Lihat log
docker compose logs -f core-service
```

---

## Scripts

| Script | Perintah | Fungsi |
|--------|----------|--------|
| seed.py | `python backend/scripts/seed.py` | Isi 6 trail + demo user + API key |
| test_api.py | `python backend/scripts/test_api.py` | 11 automated tests (semua harus PASS) |
| export_openapi.py | `python backend/scripts/export_openapi.py` | Generate `openapi.yaml` |

---

## Komisi & Pricing

| Parameter | Nilai |
|-----------|-------|
| Off-peak window | 05:00–08:30 WIB |
| Off-peak discount | 20% |
| Komisi UMKM | 70% |
| Komisi Kurator | 15% |
| Komisi Platform | 15% |
