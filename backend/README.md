# NusaJalur — Backend Microservice

> FastAPI + SQLite WAL + Docker ARM64  
> Base URL Produksi: `https://matchabaobei.stei.fun/api/v1`

Dokumentasi lengkap arsitektur dan panduan menyeluruh ada di **[README Utama](../README.md)**.

---

## Quick Start (Lokal)

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Setup environment
cp ../.env.example ../.env

# 3. Seed database (11 rute Bandung & Jakarta + Akun Demo + API Key)
python scripts/seed.py

# 4. Jalankan server FastAPI
python -m uvicorn app.main:app --app-dir . --host 0.0.0.0 --port 8000 --reload
```

* **Swagger UI (Lokal):** `http://localhost:8000/docs`  
* **OpenAPI Schema (Lokal):** `http://localhost:8000/openapi.json`
* **Catatan Rute Cloudflare:** Subdomain publik `https://matchabaobei.stei.fun` hanya mengekspos endpoint API (`/api/*`), Swagger UI diakses secara privat di jaringan lokal `http://localhost:8000/docs`.

---

## Struktur Aplikasi (Domain-Driven Design)

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
│   ├── trail_service.py   # Trails listing + filter city/theme + Haversine sort
│   ├── pricing_service.py # Dynamic pricing (off-peak 20% discount)
│   ├── pass_service.py    # Pass purchase + GPS check-in + 70/15/15 commission
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
API_KEY_HASH=cda4bf67fc84886d15572c76508d74ad5feffb6f56bfc2966bb837fa55375b19
```

---

## Docker & Infrastruktur STB Armbian

Pada STB HG680P (Armbian):
* `cloudflared` berjalan sebagai service systemd host.
* Nginx host (port 80) meneruskan trafik `/api/*` ke container `gateway` (port 8090 -> 80).
* Direktori docker `data-root` diarahkan ke flashdisk eksternal `/mnt/usb/docker`.

```bash
# Build & jalankan di STB
docker compose up -d --build

# Seed data (11 rute Bandung & Jakarta)
docker compose run --rm core-service python /app/scripts/seed.py

# Generate openapi.yaml
docker compose run --rm core-service python /app/scripts/export_openapi.py

# Cek log service
docker compose logs -f core-service
```

---

## Scripts

| Script | Perintah | Fungsi |
|--------|----------|--------|
| `seed.py` | `python backend/scripts/seed.py` | Mengisi idempoten 11 rute (Bandung & Jakarta), kurator, akun demo, dan API key |
| `test_api.py` | `python backend/scripts/test_api.py` | Test suite komprehensif 11 pengujian endpoint |
| `export_openapi.py` | `python backend/scripts/export_openapi.py` | Generate file statis `openapi.yaml` |

---

## Komisi & Pricing

| Parameter | Nilai |
|-----------|-------|
| Off-peak window | 05:00–08:30 WIB |
| Off-peak discount | 20% |
| Alokasi Voucher UMKM | 70% |
| Royalti Kurator Lokal | 15% |
| Pemeliharaan Platform | 15% |
