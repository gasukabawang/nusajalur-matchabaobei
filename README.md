# NusaJalur — Jelajahi Warisan Budaya Nusantara Sambil Berjalan Kaki

> **Tugas 2 — II3160 Teknologi Sistem Terintegrasi (TST)**  
> Kelas K01 · Subdomain: `matchabaobei` · Base URL Publik: `https://matchabaobei.stei.fun/api/v1`

---

## 📑 Daftar Isi

1. [Gambaran Proyek](#gambaran-proyek)
2. [Arsitektur Container](#arsitektur-container)
3. [Struktur Direktori](#struktur-direktori)
4. [Prasyarat](#prasyarat)
5. [Cara Menjalankan (Lokal)](#cara-menjalankan-lokal)
6. [Deploy ke STB Armbian (Produksi)](#deploy-ke-stb-armbian-produksi)
7. [Daftar Endpoint API](#daftar-endpoint-api)
8. [Contoh Request & Response (curl)](#contoh-request--response-curl)
9. [Cara Mendapatkan API Key (B2B)](#cara-mendapatkan-api-key-b2b)
10. [Panduan Aplikasi Mobile (Expo)](#panduan-aplikasi-mobile-expo)
11. [Kredensial Demo](#kredensial-demo)
12. [Lisensi](#lisensi)

---

## Gambaran Proyek

**NusaJalur** adalah platform wisata jalan kaki budaya-kebugaran yang menghubungkan wisatawan dengan rute-rute bersejarah di Kota Bandung, dilengkapi fitur GPS check-in, cerita sejarah interaktif, dan komisi UMKM lokal.

### Stack Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Backend API | FastAPI (Python 3.11) |
| Database | SQLite (WAL mode) |
| Auth Mobile | JWT Bearer Token (bcrypt) |
| Auth B2B | X-API-Key (SHA-256 hash) |
| Reverse Proxy | Nginx 1.28-alpine |
| Tunnel | Cloudflare Tunnel |
| Mobile App | React Native / Expo SDK 58 |
| Container | Docker Compose (linux/arm64) |

---

## Arsitektur Container

```
┌─────────────────────────────────────────────────────────────────┐
│                    STB HG680P (Armbian ARM64)                   │
│                                                                 │
│  ┌─────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │   tunnel    │    │     gateway       │    │ core-service  │  │
│  │ cloudflared │───▶│  nginx:1.28-alp  │───▶│  FastAPI +    │  │
│  │  mem: 64m   │    │   mem: 64m        │    │  SQLite WAL   │  │
│  │  cpus: 0.25 │    │   cpus: 0.25      │    │  mem: 256m    │  │
│  └─────────────┘    └──────────────────┘    │  cpus: 0.5    │  │
│         │                   │               └───────────────┘  │
│         │                   │                       │           │
│         ▼                   ▼                       ▼           │
│  TUNNEL_TOKEN         CF-Connecting-IP         nusajalur.db    │
│  (Cloudflare)         Rate: 60 req/min         (WAL mode)      │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
  https://matchabaobei.stei.fun  (Cloudflare CDN)
         │
         ▼
  📱 Mobile App (Expo Go / APK)
```

### Detail Container

| Container | Image | mem_limit | cpus | Fungsi |
|-----------|-------|-----------|------|--------|
| `core-service` | python:3.11-slim | 256m | 0.5 | FastAPI + SQLite + Uvicorn |
| `gateway` | nginx:1.28-alpine | 64m | 0.25 | Reverse proxy, CORS, Rate limit 60/min, JSON log |
| `tunnel` | cloudflare/cloudflared | 64m | 0.25 | Ekspos ke internet via Cloudflare |

### Network Flow

```
Internet
  │
  ▼
Cloudflare CDN (DDoS Protection)
  │  HTTPS
  ▼
cloudflared tunnel  ──(QUIC)──▶  gateway:80 (Nginx)
                                     │
                              Rate limit 60 req/min
                              Real IP: CF-Connecting-IP
                              CORS: * (dev) / domain tertentu (prod)
                                     │
                                     ▼
                              core-service:8000 (Uvicorn)
                                     │
                                     ▼
                              SQLite WAL (nusajalur.db)
```

---

## Struktur Direktori

```
NusaJalur-matchabaobei/
├── backend/                    # Backend FastAPI microservice
│   ├── app/
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── core/               # Config, security, utils, exceptions
│   │   ├── domain/             # ORM models + Pydantic schemas
│   │   ├── infrastructure/     # Database + repositories
│   │   ├── application/        # Business logic services
│   │   └── api/v1/endpoints/   # Route handlers
│   ├── docker/
│   │   ├── core/Dockerfile     # ARM64-compatible Python image
│   │   └── gateway/nginx.conf  # Nginx reverse proxy config
│   ├── scripts/
│   │   ├── seed.py             # Seed 6 trail data + demo user + API key
│   │   ├── export_openapi.py   # Generate openapi.yaml
│   │   └── test_api.py         # 11 automated API tests
│   ├── data/                   # SQLite database storage
│   ├── requirements.txt
│   ├── docker-compose.yml
│   ├── .env.example
│   └── README.md
├── mobile/                     # React Native / Expo app
│   ├── src/
│   │   ├── screens/            # AuthScreen, HomeScreen, TrailDetailScreen, ...
│   │   ├── navigation/         # AppNavigator (Stack + Bottom Tab)
│   │   ├── context/            # AuthContext, LanguageContext
│   │   ├── i18n/               # translations.ts (ID + EN)
│   │   ├── api/                # client.ts + apiService.ts
│   │   ├── theme/              # colors.ts (Sage Green + Warm Cream)
│   │   └── types/              # TypeScript interfaces
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   └── README.md
├── docker-compose.yml          # Root docker-compose (alias untuk STB)
├── openapi.yaml                # OpenAPI 3.0 schema (auto-generated)
├── .env.example                # Template environment variables
├── .gitignore
└── README.md                   # File ini
```

---

## Prasyarat

### Backend
- Python 3.11+ (atau 3.13)
- pip
- Docker + Docker Compose (untuk deployment container)
- cloudflared (untuk tunnel lokal)

### Mobile
- Node.js 18+ dan npm
- Expo CLI: `npm install -g expo-cli`
- Expo Go app di smartphone (Android/iOS)

---

## Cara Menjalankan (Lokal)

### 1. Clone & Setup

```bash
git clone https://github.com/gasukabawang/nusajalur-matchabaobei.git
cd nusajalur-matchabaobei
```

### 2. Setup Backend

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Buat .env dari template
cp .env.example .env
# Edit .env: atur SECRET_KEY dan TUNNEL_TOKEN

# Seed database (6 trail + demo user + API key)
python backend/scripts/seed.py

# Jalankan server
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

Server aktif di: `http://localhost:8000`  
Swagger UI: `http://localhost:8000/docs`

### 3. Tunnel ke Internet (Opsional, untuk test dari HP)

```bash
cloudflared tunnel --url http://localhost:8000
# Catat URL trycloudflare.com yang muncul
```

### 4. Jalankan Mobile App

```bash
cd mobile
npm install
npx expo start
# Scan QR code dengan Expo Go
```

---

## Deploy ke STB Armbian (Produksi)

### 1. Persiapan STB

```bash
# SSH ke STB
ssh root@<IP_STB>

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
apt-get install -y docker-compose-plugin
```

### 2. Upload Project

```bash
# Di laptop lokal
scp -r . root@<IP_STB>:/opt/nusajalur/
```

### 3. Setup Environment

```bash
# Di STB
cd /opt/nusajalur
cp .env.example .env
nano .env
```

Isi `.env`:
```env
SECRET_KEY=your-very-long-random-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
TUNNEL_TOKEN=eyJhIjoiXXXXX...  # Token dari Cloudflare Zero Trust
API_KEY_HASH=sha256-hash-dari-api-key-anda
```

> **Cara dapat TUNNEL_TOKEN:**
> 1. Login ke [dash.cloudflare.com](https://dash.cloudflare.com)
> 2. Zero Trust → Networks → Tunnels → Create Tunnel
> 3. Pilih Cloudflared, copy token yang diberikan
> 4. Set public hostname: `matchabaobei.stei.fun` → `http://gateway:80`

### 4. Seed Database & Build

```bash
# Seed data pertama kali
docker compose run --rm core-service python /app/scripts/seed.py

# Build & jalankan semua container
docker compose up -d --build

# Cek status
docker compose ps
docker compose logs -f
```

### 5. Verifikasi

```bash
# Health check
curl https://matchabaobei.stei.fun/api/v1/health

# Expected response:
# {"status":"ok","version":"1.0.0","timestamp":"..."}
```

### 6. Perintah Maintenance

```bash
# Restart layanan
docker compose restart

# Lihat log real-time
docker compose logs -f core-service

# Update kode
git pull origin main
docker compose up -d --build core-service

# Backup database
cp backend/data/nusajalur.db backup/nusajalur_$(date +%Y%m%d).db
```

---

## Daftar Endpoint API

### Publik (tanpa auth)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/v1/health` | Health check |
| `POST` | `/api/v1/auth/register` | Registrasi user baru |
| `POST` | `/api/v1/auth/login` | Login, mendapat JWT |

### Butuh JWT Bearer Token

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/v1/trails` | Daftar rute (filter: theme, max_duration_min, lat, lon) |
| `GET` | `/api/v1/trails/{trail_id}` | Detail rute + waypoints |
| `GET` | `/api/v1/trails/{trail_id}/pricing` | Harga dinamis (off-peak discount) |
| `POST` | `/api/v1/passes` | Beli Trail Pass |
| `POST` | `/api/v1/passes/{pass_id}/checkins` | GPS Check-in |
| `GET` | `/api/v1/users/me/trips` | Riwayat perjalanan user |

### B2B — Butuh X-API-Key Header

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/v1/public/destinations-nearby` | Pos wisata terdekat (lat, lon, radius_m) |
| `GET` | `/api/v1/public/measured-trails` | Rute budaya terukur (min_kcal, max_kcal) |

---

## Contoh Request & Response (curl)

### Health Check

```bash
curl https://matchabaobei.stei.fun/api/v1/health
```
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-11-19T08:00:00.000Z"
}
```

### Registrasi

```bash
curl -X POST https://matchabaobei.stei.fun/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "mypassword123",
    "full_name": "Budi Santoso"
  }'
```
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "usr-xxxxxxxx",
    "email": "user@example.com",
    "full_name": "Budi Santoso"
  }
}
```

### Login

```bash
curl -X POST https://matchabaobei.stei.fun/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@nusajalur.id",
    "password": "demo1234"
  }'
```
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "usr-demo-nusajalur-2026",
    "email": "demo@nusajalur.id",
    "full_name": "Demo NusaJalur"
  }
}
```

### Daftar Trail (dengan filter)

```bash
# Set token dulu
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Semua trail
curl https://matchabaobei.stei.fun/api/v1/trails \
  -H "Authorization: Bearer $TOKEN"

# Filter tema heritage, urutkan berdasarkan jarak dari Alun-Alun Bandung
curl "https://matchabaobei.stei.fun/api/v1/trails?theme=heritage&lat=-6.9218&lon=107.6070" \
  -H "Authorization: Bearer $TOKEN"
```
```json
{
  "trails": [
    {
      "id": "trail-001",
      "title": "Rute Braga Heritage Walk",
      "theme": "heritage",
      "description": "Telusuri kejayaan arsitektur kolonial Belanda...",
      "distance_km": 2.4,
      "est_duration_min": 55,
      "est_steps": 3200,
      "est_kcal": 112,
      "price_idr": 25000,
      "distance_from_user_km": 0.8,
      "curator": {
        "name": "Pak Hendra Gunawan",
        "badge": "Sejarawan Kota Bandung",
        "avatar_url": "https://i.pravatar.cc/150?u=hendra"
      }
    }
  ],
  "total": 6
}
```

### Detail Trail + Waypoints

```bash
curl https://matchabaobei.stei.fun/api/v1/trails/trail-001 \
  -H "Authorization: Bearer $TOKEN"
```
```json
{
  "id": "trail-001",
  "title": "Rute Braga Heritage Walk",
  "waypoints": [
    {
      "id": "wp-001-01",
      "sequence": 1,
      "name": "Gedung Merdeka",
      "description": "Lokasi Konferensi Asia-Afrika 1955...",
      "lat": -6.9211,
      "lon": 107.6097,
      "radius_m": 100,
      "story_text": null,
      "voucher_code": null
    }
  ]
}
```

### Pricing Dinamis

```bash
curl https://matchabaobei.stei.fun/api/v1/trails/trail-001/pricing \
  -H "Authorization: Bearer $TOKEN"
```
```json
{
  "trail_id": "trail-001",
  "base_price_idr": 25000,
  "is_off_peak": true,
  "discount_percent": 20,
  "final_price_idr": 20000,
  "off_peak_window": "05:00-08:30 WIB",
  "waypoint_count": 3
}
```

### Beli Trail Pass

```bash
curl -X POST https://matchabaobei.stei.fun/api/v1/passes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"trail_id": "trail-001"}'
```
```json
{
  "id": "pass-xxxxxxxx",
  "trail_id": "trail-001",
  "trail_title": "Rute Braga Heritage Walk",
  "status": "ACTIVE",
  "amount_paid_idr": 20000,
  "commission": {
    "umkm_idr": 14000,
    "curator_idr": 3000,
    "platform_idr": 3000
  },
  "purchase_date": "2026-11-19T05:30:00Z"
}
```

### GPS Check-in

```bash
curl -X POST https://matchabaobei.stei.fun/api/v1/passes/pass-xxxxxxxx/checkins \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "waypoint_id": "wp-001-01",
    "lat": -6.9211,
    "lon": 107.6097
  }'
```
```json
{
  "success": true,
  "distance_m": 12.5,
  "waypoint": {
    "name": "Gedung Merdeka",
    "story_text": "Gedung ini dibangun pada 1879 oleh arsitek Belanda Van Galen Last...",
    "voucher_code": "BRAGA-GM-2026",
    "voucher_description": "Diskon 15% di Toko Batik Braga"
  }
}
```

### Riwayat Perjalanan

```bash
curl https://matchabaobei.stei.fun/api/v1/users/me/trips \
  -H "Authorization: Bearer $TOKEN"
```
```json
{
  "total_passes_purchased": 2,
  "total_completed_trips": 1,
  "total_steps_achieved": 7400,
  "total_kcal_burned": 338,
  "passes": [
    {
      "id": "pass-xxxxxxxx",
      "trail_title": "Rute Braga Heritage Walk",
      "status": "ACTIVE",
      "checked_in_count": 1,
      "total_waypoints": 3,
      "completion_percentage": 33
    }
  ]
}
```

### B2B — Destinasi Terdekat

```bash
curl "https://matchabaobei.stei.fun/api/v1/public/destinations-nearby?lat=-6.9218&lon=107.6070&radius_m=1500" \
  -H "X-API-Key: nj_live_matchabaobei_tst2026_secret_key"
```
```json
{
  "destinations": [
    {
      "waypoint_id": "wp-001-01",
      "name": "Gedung Merdeka",
      "trail_title": "Rute Braga Heritage Walk",
      "lat": -6.9211,
      "lon": 107.6097,
      "distance_km": 0.08,
      "has_umkm": true,
      "voucher_description": "Diskon 15% di Toko Batik Braga"
    }
  ],
  "count": 5
}
```

### B2B — Trail Budaya Terukur

```bash
curl "https://matchabaobei.stei.fun/api/v1/public/measured-trails?min_kcal=100&max_kcal=300" \
  -H "X-API-Key: nj_live_matchabaobei_tst2026_secret_key"
```
```json
{
  "trails": [
    {
      "id": "trail-001",
      "title": "Rute Braga Heritage Walk",
      "distance_km": 2.4,
      "est_kcal": 112,
      "est_steps": 3200,
      "est_duration_min": 55,
      "theme": "heritage"
    }
  ],
  "count": 4
}
```

### Format Error Standar

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email atau password tidak valid."
  }
}
```

---

## Cara Mendapatkan API Key (B2B)

API Key untuk akses server-ke-server (`/api/v1/public/*`) digunakan oleh kelompok lain (TST Integration).

### API Key Demo (Langsung Pakai)

```
X-API-Key: nj_live_matchabaobei_tst2026_secret_key
```

> ⚠️ Hanya untuk testing. Untuk produksi, hubungi tim NusaJalur untuk mendapat key khusus.

### Cara Request API Key Baru

1. Hubungi tim NusaJalur via email/Discord kelompok
2. Sertakan: nama kelompok, subdomain, endpoint yang dibutuhkan
3. API Key akan di-hash SHA-256 dan disimpan di database server
4. Gunakan plain-text key di header `X-API-Key`

### Contoh Integrasi (kelompok lain)

```python
import requests

API_KEY = "nj_live_matchabaobei_tst2026_secret_key"
BASE_URL = "https://matchabaobei.stei.fun/api/v1"

# Ambil trail budaya terukur untuk integrasi Health & Wellbeing
response = requests.get(
    f"{BASE_URL}/public/measured-trails",
    params={"min_kcal": 100, "max_kcal": 400},
    headers={"X-API-Key": API_KEY}
)
trails = response.json()["trails"]
```

---

## Panduan Aplikasi Mobile (Expo)

### Instalasi & Jalankan

```bash
# 1. Clone repo
git clone https://github.com/gasukabawang/nusajalur-matchabaobei.git
cd nusajalur-matchabaobei/mobile

# 2. Install dependencies
npm install

# 3. Jalankan Metro bundler
npx expo start

# 4. Scan QR Code dengan Expo Go
#    - Android: Expo Go app → Scan QR
#    - iOS: Camera app → Scan QR → Open in Expo Go
```

### Konfigurasi Server di Aplikasi

Saat pertama buka, aplikasi default menggunakan:
- **Cloudflare Tunnel** (Dev): URL `trycloudflare.com` yang bisa berubah
- **Produksi (STB)**: `https://matchabaobei.stei.fun/api/v1` ← **Gunakan ini untuk demo**

Untuk ganti server:
1. Buka tab **Profil** di aplikasi
2. Ketuk **Konfigurasi Server** → **expand**
3. Pilih preset (Dev/LAN/Prod) atau masukkan URL custom
4. Ketuk **Terapkan**

### Fitur Aplikasi

| Screen | Fitur |
|--------|-------|
| **Auth** | Login/Register JWT, Demo 1-klik, pilih server |
| **Jelajahi** | Katalog 6 trail Bandung, filter tema, GPS terdekat |
| **Detail Trail** | Waypoints GPS, harga dinamis, beli Trail Pass |
| **Check-in** | Radar GPS, simulasi mode, unlock cerita & voucher |
| **Pass Saya** | Progres per-trail, checklist waypoint, voucher UMKM |
| **Profil** | Statistik perjalanan, ganti bahasa (ID/EN), ganti server |

### Multi-Bahasa

Aplikasi mendukung **Bahasa Indonesia** dan **English**:
- Buka tab **Profil** → **Bahasa** → pilih bahasa

---

## Kredensial Demo

| Field | Value |
|-------|-------|
| **Email** | `demo@nusajalur.id` |
| **Password** | `demo1234` |
| **API Key (B2B)** | `nj_live_matchabaobei_tst2026_secret_key` |
| **Base URL** | `https://matchabaobei.stei.fun/api/v1` |
| **Swagger UI** | `https://matchabaobei.stei.fun/docs` |

> 💡 Di aplikasi mobile, klik tombol **"⚡ Masuk Akun Demo (1-Klik)"** untuk login otomatis.

---

## Trail Data (6 Rute Bandung)

| # | Judul | Tema | Jarak | Kalori | Harga |
|---|-------|------|-------|--------|-------|
| 1 | Braga Heritage Walk | heritage | 2.4 km | 112 kcal | Rp 25.000 |
| 2 | Dago Culinary & Culture | kuliner | 3.1 km | 148 kcal | Rp 30.000 |
| 3 | Hutan Kota Babakan Siliwangi | alam | 4.5 km | 220 kcal | Rp 20.000 |
| 4 | Bandung Art Deco Walk | arsitektur | 2.8 km | 130 kcal | Rp 28.000 |
| 5 | Rute Sejarah BLA 1946 | sejarah | 5.2 km | 268 kcal | Rp 35.000 |
| 6 | Pasar Baru Textile Heritage | heritage | 2.0 km | 95 kcal | Rp 22.000 |

---

## Lisensi

Proyek ini dibuat untuk keperluan akademik Tugas 2 II3160 TST 2026.  
Tim: **matchabaobei** · Kelas K01 · Institut Teknologi Bandung

---

*Dokumentasi lengkap per-komponen: lihat [`backend/README.md`](backend/README.md) dan [`mobile/README.md`](mobile/README.md)*
