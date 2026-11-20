# NusaJalur — Jelajahi Warisan Budaya Nusantara Sambil Berjalan Kaki

> **Tugas 2 — II3160 Teknologi Sistem Terintegrasi (TST)**  
> Kelas K01 · Subdomain: `matchabaobei` · Base URL Publik: `https://matchabaobei.stei.fun/api/v1`

---

## 📑 Daftar Isi

1. [Gambaran Proyek](#gambaran-proyek)
2. [Arsitektur Container & Infrastruktur STB](#arsitektur-container--infrastruktur-stb)
3. [Struktur Direktori](#struktur-direktori)
4. [Prasyarat](#prasyarat)
5. [Cara Menjalankan (Lokal)](#cara-menjalankan-lokal)
6. [Deploy ke STB Armbian (Produksi)](#deploy-ke-stb-armbian-produksi)
7. [Daftar Endpoint API](#daftar-endpoint-api)
8. [Contoh Request & Response (curl)](#contoh-request--response-curl)
9. [Cara Mendapatkan API Key (B2B)](#cara-mendapatkan-api-key-b2b)
10. [Panduan Aplikasi Mobile (Expo)](#panduan-aplikasi-mobile-expo)
11. [Kredensial Demo](#kredensial-demo)
12. [Daftar Lengkap Rute Budaya (Bandung & Jakarta)](#daftar-lengkap-rute-budaya-bandung--jakarta)
13. [Lisensi](#lisensi)

---

## Gambaran Proyek

**NusaJalur** adalah platform wisata jalan kaki budaya-kebugaran terintegrasi yang menghubungkan penjelajah urban dengan rute-rute bersejarah terkurasi di **Kota Bandung** dan **DKI Jakarta**. Dilengkapi dengan verifikasi GPS check-in (geofencing), pembukaan narasi cerita sejarah interaktif, voucher promo UMKM lokal, serta skema transparansi bagi hasil digital pass (70% voucher UMKM, 15% kurator lokal, 15% platform).

### Stack Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Backend API | FastAPI (Python 3.11 / Python 3.13) |
| Database | SQLite (WAL mode, Thread-Safe, Zero-Overhead) |
| Auth Mobile | JWT Bearer Token (bcrypt password hash) |
| Auth B2B Integrasi | X-API-Key (SHA-256 hash storage) |
| Reverse Proxy (Host) | Nginx Host (Port 80) di STB HG680P |
| Reverse Proxy (Docker) | Nginx 1.28-alpine (`gateway`, Port 8090:80) |
| Tunnel | Cloudflare Tunnel (`cloudflared` systemd service di host STB) |
| Storage Docker | `/mnt/usb/docker` (External USB Data-Root) |
| Mobile App | React Native / Expo SDK 58 (TypeScript, i18n ID/EN) |
| Target Arsitektur | `linux/arm64` (STB HG680P 2GB RAM Armbian) |

---

## Arsitektur Container & Infrastruktur STB

Infrastruktur NusaJalur dioptimalkan khusus untuk perangkat berdaya rendah **STB Fiberhome HG680P (Quad-Core ARM Cortex-A53, RAM 2GB, OS Armbian Linux)**.

```
 Internet (Pengguna Mobile / Integrasi B2B)
                      │
                      ▼ HTTPS (Port 443)
       Cloudflare Edge & CDN (SSL, DDoS Protection)
                      │
                      ▼ QUIC / HTTP2 Tunnel
 ┌────────────────────┼────────────────────────────────────────────────────────┐
 │ STB HG680P Armbian │                                                        │
 │                    ▼                                                        │
 │ ┌──────────────────────────────────────┐                                    │
 │ │ cloudflared.service (Host Service)   │ (TUNNEL_TOKEN systemd)             │
 │ └──────────────────┬───────────────────┘                                    │
 │                    ▼ HTTP (Port 80)                                         │
 │ ┌──────────────────────────────────────┐                                    │
 │ │ Nginx Host Reverse Proxy (Port 80)   │ (Meneruskan rute /api/*)           │
 │ └──────────────────┬───────────────────┘                                    │
 │                    ▼ HTTP (Port 8090)                                       │
 │ ┌──────────────────┴──────────────────────────────────────────────────────┐ │
 │ │ Docker Engine (data-root: /mnt/usb/docker pada Flashdisk/SSD Eksternal) │ │
 │ │                                                                         │ │
 │ │  ┌─────────────────────────┐               ┌──────────────────────────┐ │ │
 │ │  │ gateway                 │               │ core-service             │ │ │
 │ │  │ (nginx:1.28-alpine)     │──────────────▶│ (FastAPI + SQLite WAL)   │ │ │
 │ │  │ Port: 8090 -> 80        │   HTTP :8000  │ Port: 8000               │ │ │
 │ │  │ Mem Limit: 64M, CPU: 0.25│              │ Mem Limit: 256M, CPU: 0.5│ │ │
 │ │  │ - Rate Limit 60 req/min │               │ - 11 Rute Bandung & Jkt  │ │ │
 │ │  │ - Real-IP: CF-Connecting│               │ - JWT & X-API-Key Auth   │ │ │
 │ │  │ - JSON Access Log       │               │ - Haversine Geofencing   │ │ │
 │ │  └─────────────────────────┘               └─────────────┬────────────┘ │ │
 │ │                                                          │              │ │
 │ └──────────────────────────────────────────────────────────┼──────────────┘ │
 │                                                            ▼                │
 │                           SQLite DB (WAL Mode) : backend/data/nusajalur.db  │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### Penjelasan Komponen Produksi:

1. **Cloudflared Host Service:** Berjalan langsung di host Armbian (`/etc/systemd/system/cloudflared.service`). Meneruskan subdomain resmi `https://matchabaobei.stei.fun` secara spesifik pada path `/api/*` ke port `80` Nginx Host.
2. **Nginx Host Proxy:** Menerima trafik dari Cloudflare Tunnel pada port 80 dan melakukan proxy pass ke container `gateway` di port `8090`.
3. **Container `gateway` (Nginx 1.28-alpine):** Menangani CORS headers, proteksi rate-limiting 60 req/menit berbasis header asli `CF-Connecting-IP`, serta rotasi log JSON terstruktur.
4. **Container `core-service` (FastAPI Python 3.11):** Menjalankan aplikasi microservice, SQLite WAL mode, algoritma off-peak pricing, dan Haversine Geofencing.
5. **Penyimpanan Eksternal USB (`/mnt/usb/docker`):** Daemon Docker diatur menggunakan direktori `/mnt/usb/docker` via `/etc/docker/daemon.json` untuk menjaga stabilitas penyimpanan internal (eMMC) STB.

---

## Struktur Direktori

```
NusaJalur-matchabaobei/
├── backend/                    # Backend FastAPI microservice
│   ├── app/
│   │   ├── main.py             # Inisialisasi FastAPI & Router
│   │   ├── core/               # Konfigurasi Pydantic, Security, Haversine Utils
│   │   ├── domain/             # ORM Models (User, Trail, Waypoint, Pass) & DTO Schemas
│   │   ├── infrastructure/     # Database WAL & Repositories (Trail, Pass, User, ApiKey)
│   │   ├── application/        # Business Logic Services (Trail, Pricing, Pass, Public)
│   │   └── api/v1/endpoints/   # Route Controllers (Health, Auth, Trails, Passes, Public)
│   ├── docker/
│   │   ├── core/Dockerfile     # Image Python 3.11-slim kompatibel ARM64 & AMD64
│   │   └── gateway/nginx.conf  # Konfigurasi reverse proxy Nginx internal
│   ├── scripts/
│   │   ├── seed.py             # Seeding 11 Rute Bandung & Jakarta + Demo User + API Key
│   │   ├── export_openapi.py   # Eksportir otomatis skema openapi.yaml
│   │   └── test_api.py         # Test suite komprehensif (100% PASS)
│   ├── data/                   # Penyimpanan file nusajalur.db (SQLite)
│   ├── requirements.txt
│   ├── docker-compose.yml
│   └── README.md
├── mobile/                     # React Native / Expo Mobile App
│   ├── src/
│   │   ├── screens/            # AuthScreen, HomeScreen, TrailDetailScreen, CheckinScreen, dll.
│   │   ├── navigation/         # AppNavigator (Native Stack & Bottom Tabs)
│   │   ├── context/            # AuthContext & LanguageContext (i18n ID/EN)
│   │   ├── i18n/               # Kamus translasi dwibahasa
│   │   ├── api/                # API Client & Services
│   │   └── theme/              # Warna Sage Green + Warm Cream
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   └── README.md
├── docker-compose.yml          # Compose root STB
├── openapi.yaml                # Dokumentasi OpenAPI 3.0 statis
├── .env.example
├── .gitignore
└── README.md                   # Dokumentasi Utama
```

---

## Prasyarat

- **Python 3.11+** atau **Python 3.13**
- **Node.js 18+** & npm
- **Docker & Docker Compose** (dukungan arsitektur `linux/arm64` atau `linux/amd64`)
- Smartphone dengan aplikasi **Expo Go** (Android / iOS)

---

## Cara Menjalankan (Lokal)

### 1. Backend Service

```bash
# Clone repositori
git clone https://github.com/gasukabawang/nusajalur-matchabaobei.git
cd nusajalur-matchabaobei

# Install dependencies backend
pip install -r backend/requirements.txt

# Buat environment file
cp .env.example .env

# Isi data awal (11 rute Bandung & Jakarta, akun demo, API key)
python backend/scripts/seed.py

# Jalankan server FastAPI
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

* API Base URL Lokal: `http://localhost:8000/api/v1`
* Dokumentasi Interaktif Swagger UI (Lokal): `http://localhost:8000/docs`

### 2. Mobile App (Expo Go)

```bash
cd mobile
npm install
npx expo start
```
* Buka aplikasi **Expo Go** di HP dan scan QR Code yang tampil di terminal.

---

## Deploy ke STB Armbian (Produksi)

### 1. Konfigurasi Docker USB Storage di STB

Untuk menghemat penyimpanan eMMC STB, arahkan `data-root` Docker ke USB Flashdisk:
```bash
sudo mkdir -p /mnt/usb/docker
sudo nano /etc/docker/daemon.json
```
Isi konfigurasi berikut:
```json
{
  "data-root": "/mnt/usb/docker",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```
Restart daemon Docker:
```bash
sudo systemctl restart docker
```

### 2. Menjalankan Container NusaJalur

Di dalam folder proyek di STB:
```bash
# Buat file .env dari template
cp .env.example .env
nano .env

# Jalankan seeding data awal
docker compose run --rm core-service python /app/scripts/seed.py

# Ekspor skema OpenAPI terbaru
docker compose run --rm core-service python /app/scripts/export_openapi.py

# Jalankan seluruh container di background
docker compose up -d --build
```

### 3. Konfigurasi Nginx Host & Cloudflared di STB

Konfigurasi Nginx Host (`/etc/nginx/sites-available/matchabaobei`):
```nginx
server {
    listen 80;
    server_name matchabaobei.stei.fun;

    location /api/ {
        proxy_pass http://127.0.0.1:8090/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
    }

    location / {
        return 404 "Hanya rute /api/* yang diekspos ke publik.";
    }
}
```

Jalankan Cloudflared service sebagai systemd:
```bash
sudo systemctl enable cloudflared
sudo systemctl restart cloudflared
```

---

## Daftar Endpoint API

Semua endpoint berawalan prefix: `/api/v1`

### 1. Endpoint Publik

| Method | Endpoint | Deskripsi | Autentikasi |
|--------|----------|-----------|-------------|
| `GET` | `/health` | Memeriksa status kesehatan server | Tanpa Auth |
| `POST` | `/auth/register` | Mendaftarkan pengguna baru mobile | Tanpa Auth |
| `POST` | `/auth/login` | Autentikasi pengguna & penerbitan JWT | Tanpa Auth |

### 2. Endpoint Mobile Pengguna (JWT Bearer Token)

| Method | Endpoint | Deskripsi | Autentikasi |
|--------|----------|-----------|-------------|
| `GET` | `/trails` | Daftar rute jalan budaya (filter: `city`, `theme`, `max_duration_min`, `lat`, `lon`) | `Bearer <JWT>` |
| `GET` | `/trails/{trail_id}` | Detail rute beserta titik waypoints dan radius GPS | `Bearer <JWT>` |
| `GET` | `/trails/{trail_id}/pricing` | Perhitungan harga dinamis (diskon 20% off-peak pagi) | `Bearer <JWT>` |
| `POST` | `/passes` | Pembelian Digital Trail Pass (simulasi lunas & pembagian alokasi komisi) | `Bearer <JWT>` |
| `POST` | `/passes/{pass_id}/checkins` | Verifikasi GPS Check-in pos wisata, unlock cerita & voucher | `Bearer <JWT>` |
| `GET` | `/users/me/trips` | Riwayat pembelian tiket pass & statistik langkah/kalori pengguna | `Bearer <JWT>` |

### 3. Endpoint Integrasi B2B Server-to-Server (`X-API-Key`)

| Method | Endpoint | Deskripsi | Autentikasi |
|--------|----------|-----------|-------------|
| `GET` | `/public/destinations-nearby` | Titik wisata & UMKM terdekat berdasarkan radius meter (`lat`, `lon`, `radius_m`) | Header `X-API-Key` |
| `GET` | `/public/measured-trails` | Rute jalan budaya terukur untuk kelompok kesehatan (`min_kcal`, `max_kcal`) | Header `X-API-Key` |

---

## Contoh Request & Response (curl)

### 1. Health Check
```bash
curl -X GET https://matchabaobei.stei.fun/api/v1/health
```
```json
{
  "status": "ok"
}
```

### 2. Login Akun Demo
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
    "full_name": "Penjelajah Bandung (Demo Akun)"
  }
}
```

### 3. Mengambil Daftar Rute Jakarta (dengan Filter Kota & Koordinat)
```bash
curl -X GET "https://matchabaobei.stei.fun/api/v1/trails?city=Jakarta&lat=-6.1352&lon=106.8133" \
  -H "Authorization: Bearer <TOKEN_JWT>"
```
```json
{
  "total": 5,
  "trails": [
    {
      "id": "trail-jkt-kotatua-sundakelapa",
      "title": "Jejak Sejarah Kota Tua & Pelabuhan Sunda Kelapa",
      "slug": "kota-tua-sunda-kelapa-heritage",
      "theme": "heritage",
      "description": "Menyusuri jantung Oud Batavia dari Museum Fatahillah, Jembatan Kota Intan tertua, hingga pelabuhan kayu pinisi legendaris Sunda Kelapa.",
      "city": "Jakarta",
      "distance_km": 3.8,
      "est_duration_min": 65,
      "est_steps": 5100,
      "est_kcal": 245,
      "price_idr": 25000,
      "difficulty": "Sedang",
      "distance_from_user_km": 0.0,
      "curator": {
        "id": "cur-bambang-jakarta",
        "name": "Bang Bambang Batavia",
        "bio": "Peneliti sejarah maritim Sunda Kelapa dan cagar budaya Kota Tua Jakarta.",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        "badge": "Kurator Batavia Heritage Walk"
      }
    }
  ]
}
```

### 4. Mengambil Daftar Rute Bandung (Filter Tema Heritage)
```bash
curl -X GET "https://matchabaobei.stei.fun/api/v1/trails?city=Bandung&theme=heritage&lat=-6.921132&lon=107.609653" \
  -H "Authorization: Bearer <TOKEN_JWT>"
```
```json
{
  "total": 2,
  "trails": [
    {
      "id": "trail-braga-heritage",
      "title": "Jelajah Kolonial & Art Deco Braga - Asia Afrika",
      "slug": "braga-heritage-art-deco",
      "theme": "heritage",
      "city": "Bandung",
      "distance_km": 2.4,
      "est_duration_min": 45,
      "est_steps": 3200,
      "est_kcal": 160,
      "price_idr": 25000,
      "difficulty": "Mudah",
      "distance_from_user_km": 0.0,
      "curator": {
        "id": "cur-ridwan-heritage",
        "name": "Kang Ridwan Budaya",
        "badge": "Kurator Utama Bandung Heritage"
      }
    }
  ]
}
```

### 5. Simulasi Harga Dinamis (Off-Peak Pagi Diskon 20%)
```bash
curl -X GET "https://matchabaobei.stei.fun/api/v1/trails/trail-braga-heritage/pricing?visit_time=07:00" \
  -H "Authorization: Bearer <TOKEN_JWT>"
```
```json
{
  "trail_id": "trail-braga-heritage",
  "visit_time": "07:00",
  "base_trail_price_idr": 25000,
  "num_waypoints": 4,
  "waypoint_subtotal_idr": 20000,
  "is_off_peak": true,
  "discount_percent": 20,
  "discount_amount_idr": 9000,
  "final_price_idr": 36000
}
```

### 6. Pembelian Digital Trail Pass
```bash
curl -X POST https://matchabaobei.stei.fun/api/v1/passes \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "trail_id": "trail-braga-heritage",
    "visit_time": "07:00"
  }'
```
```json
{
  "id": "pass-768a4115-ff5d-4589-9ba7-7098e6c71c0a",
  "user_id": "usr-demo-nusajalur-2026",
  "trail_id": "trail-braga-heritage",
  "trail_title": "Jelajah Kolonial & Art Deco Braga - Asia Afrika",
  "status": "ACTIVE",
  "purchase_date": "2026-11-20T15:30:00Z",
  "visit_time": "07:00",
  "final_price_idr": 36000,
  "umkm_share_idr": 25200,
  "curator_royalty_idr": 5400,
  "platform_fee_idr": 5400
}
```

### 7. Verifikasi GPS Check-in Pos Wisata
```bash
curl -X POST https://matchabaobei.stei.fun/api/v1/passes/pass-768a4115-ff5d-4589-9ba7-7098e6c71c0a/checkins \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "waypoint_id": "wp-braga-01",
    "lat": -6.921132,
    "lon": 107.609653
  }'
```
```json
{
  "checkin_id": "chk-9c98544d-d79e-4df7-975f-25656bb0e0ab",
  "waypoint_id": "wp-braga-01",
  "waypoint_name": "Gedung Merdeka & Museum KAA",
  "distance_m": 0.0,
  "verified": true,
  "checked_in_at": "2026-11-20T15:35:00Z",
  "story_text": "Di gedung megah inilah pada April 1955, para pemimpin dari 29 negara Asia dan Afrika bersatu mengikrarkan Dasa Sila Bandung. Arsitektur neo-klasik berpadu art-deco ini dirancang oleh arsitek terkemuka Van Galen Last dan C.P. Wolff Schoemaker.",
  "umkm_name": "Toko Roti Sumber Hidangan (1929)",
  "voucher_code": "ROTIHERITAGE10",
  "voucher_description": "Potongan harga 10% untuk pembelian aneka kue kering dan es krim autentik era kolonial."
}
```

### 8. Integrasi B2B: Destinasi Terdekat di Jakarta (X-API-Key)
```bash
curl -X GET "https://matchabaobei.stei.fun/api/v1/public/destinations-nearby?lat=-6.1352&lon=106.8133&radius_m=1500" \
  -H "X-API-Key: nj_live_matchabaobei_tst2026_secret_key"
```
```json
{
  "total_found": 3,
  "query_lat": -6.1352,
  "query_lon": 106.8133,
  "search_radius_m": 1500.0,
  "destinations": [
    {
      "waypoint_id": "wp-jkt-kt-01",
      "name": "Taman Fatahillah & Museum Sejarah Jakarta",
      "category": "heritage",
      "lat": -6.1352,
      "lon": 106.8133,
      "distance_m": 0.0,
      "radius_m": 50,
      "trail_title": "Jejak Sejarah Kota Tua & Pelabuhan Sunda Kelapa",
      "umkm_name": "Cafe Batavia 1805",
      "promo_teaser": "Diskon 15% Menu Kopi Rempah Batavia & Poffertjes"
    }
  ]
}
```

### 9. Integrasi B2B: Rute Terukur untuk Kebugaran (X-API-Key)
```bash
curl -X GET "https://matchabaobei.stei.fun/api/v1/public/measured-trails?min_kcal=150&max_kcal=260" \
  -H "X-API-Key: nj_live_matchabaobei_tst2026_secret_key"
```
```json
{
  "total_trails": 8,
  "min_kcal_filter": 150,
  "max_kcal_filter": 260,
  "trails": [
    {
      "trail_id": "trail-jkt-kotatua-sundakelapa",
      "title": "Jejak Sejarah Kota Tua & Pelabuhan Sunda Kelapa",
      "distance_km": 3.8,
      "est_duration_min": 65,
      "est_steps": 5100,
      "est_kcal": 245,
      "num_waypoints": 3,
      "city": "Jakarta",
      "theme": "heritage"
    }
  ]
}
```

---

## Cara Mendapatkan API Key (B2B)

API Key ditujukan khusus untuk integrasi server-to-server antar kelompok (seperti Kelompok Health & Wellbeing / Belva).

* **Header Wajib:** `X-API-Key: <TOKEN_API_KEY>`
* **API Key Pengujian Resmi:**
  ```
  nj_live_matchabaobei_tst2026_secret_key
  ```
* Nilai hash SHA-256 yang tersimpan di database:
  ```
  cda4bf67fc84886d15572c76508d74ad5feffb6f56bfc2966bb837fa55375b19
  ```

---

## Panduan Aplikasi Mobile (Expo)

Aplikasi mobile NusaJalur dibangun menggunakan framework **Expo (React Native)** dengan tema modern *Nature Sage & Warm Cream*, dilengkapi navigasi cerdas, radar GPS simulasi, dan selector dwibahasa (ID/EN).

1. Masuk ke folder aplikasi mobile:
   ```bash
   cd mobile
   npm install
   ```
2. Jalankan Metro Bundler:
   ```bash
   npx expo start
   ```
3. Buka tab **Profil** di dalam aplikasi untuk mengatur target server backend:
   - **🌐 STB Resmi (Produksi):** `https://matchabaobei.stei.fun/api/v1`
   - **⚡ Cloudflare Tunnel (Pengembangan):** `https://interview-visits-retro-nec.trycloudflare.com/api/v1`
   - **🏠 WiFi LAN:** `http://192.168.1.13:8000/api/v1`

---

## Kredensial Demo

| Komponen | Nilai Kredensial |
|----------|-------------------|
| **Base URL API Produksi** | `https://matchabaobei.stei.fun/api/v1` |
| **Email Akun Demo** | `demo@nusajalur.id` |
| **Password Akun Demo** | `demo1234` |
| **B2B Test API Key** | `nj_live_matchabaobei_tst2026_secret_key` |
| **Swagger UI Interaktif** | `http://localhost:8000/docs` *(Hanya dapat diakses pada jaringan lokal server/pengembangan, rute Cloudflare publik membatasi akses pada prefix `/api/*`)* |

---

## Daftar Lengkap Rute Budaya (Bandung & Jakarta)

Saat ini tersedia **11 rute jalan kaki budaya terukur** yang siap dijelajahi:

### 🏛️ Kota Bandung (6 Rute)
1. **Jelajah Kolonial & Art Deco Braga - Asia Afrika** (`trail-braga-heritage`)
   * *2.4 km · 45 mnt · 3.200 langkah · 160 kcal · Rp 25.000*
   * Pos: Gedung Merdeka KAA, Titik Nol Kilometer, Gedung De Vries, Selasar Seni Gasmin.
2. **Kuliner Pagi & Pasar Tradisional Cihapit** (`trail-cihapit-culinary`)
   * *2.1 km · 40 mnt · 2.800 langkah · 140 kcal · Rp 20.000*
   * Pos: Pasar Cihapit 1947, Warung Kopi Djie Tjong, Taman Cibeunying & Sentra Bawean.
3. **Pusat Pemerintahan & Taman Kota Balai Kota - Gedung Sate** (`trail-arsitektur-balaikota-gedungsate`)
   * *3.2 km · 55 mnt · 4.300 langkah · 210 kcal · Rp 25.000*
   * Pos: Taman Sejarah Balai Kota, Taman Lansia Cisangkuy, Plaza Depan Gedung Sate.
4. **Jalur Hijau Intelektual Ganesha - Sabuga ITB** (`trail-ganesha-sabuga-itb`)
   * *2.8 km · 50 mnt · 3.700 langkah · 185 kcal · Rp 20.000*
   * Pos: Gerbang Utama Aula Barat ITB, Hutan Kota Babakan Siliwangi, Kolam Retensi Sasana Budaya Ganesha.
5. **Ekspedisi Rimba Alam & Goa Sejarah Dago Pakar** (`trail-alam-dago-pakar`)
   * *4.5 km · 75 mnt · 6.000 langkah · 310 kcal · Rp 30.000*
   * Pos: Plaza Pintu Utama Tahura Djuanda, Goa Jepang 1942, Goa Belanda & Terowongan PLTA Bengkok.
6. **Nostalgia Pecinan Kuno & Eksotisme Malam Cibadak** (`trail-pecinan-cibadak`)
   * *2.2 km · 40 mnt · 2.900 langkah · 150 kcal · Rp 20.000*
   * Pos: Klenteng Satya Budhi (1885), Pabrik Kopi Aroma Banceuy (1930), Koridor Kuliner Cibadak.

### 🏙️ DKI Jakarta (5 Rute Baru)
7. **Jejak Sejarah Kota Tua & Pelabuhan Sunda Kelapa** (`trail-jkt-kotatua-sundakelapa`)
   * *3.8 km · 65 mnt · 5.100 langkah · 245 kcal · Rp 25.000*
   * Pos: Taman Fatahillah & Museum Sejarah Jakarta, Jembatan Jungkit Kota Intan 1628, Pelabuhan Pinisi Sunda Kelapa.
8. **Wisata Budaya & Kuliner Legendaris Glodok Pecinan** (`trail-jkt-glodok-pecinan`)
   * *2.5 km · 45 mnt · 3.400 langkah · 170 kcal · Rp 20.000*
   * Pos: Pantjoran Tea House (Tradisi Patekoan), Gang Gloria (Kopi Es Tak Kie 1927), Vihara Dharma Bhakti (Kim Tek Ie 1650).
9. **Arsitektur Klasik Lapangan Banteng - Gedung Kesenian Jakarta** (`trail-jkt-lapangan-banteng`)
   * *3.0 km · 50 mnt · 4.000 langkah · 195 kcal · Rp 20.000*
   * Pos: Monumen Pembebasan Irian Barat, Katedral Jakarta & Masjid Istiqlal, Gedung Kesenian Jakarta (Schouwburg 1821).
10. **Jejak Proklamasi & Pesona Cagar Budaya Menteng - Cikini** (`trail-jkt-menteng-cikini`)
    * *3.6 km · 60 mnt · 4.800 langkah · 230 kcal · Rp 25.000*
    * Pos: Tugu Proklamasi (Pegangsaan Timur 56), Taman Suropati Kota Taman Menteng, Taman Ismail Marzuki & Rumah Raden Saleh.
11. **Harmoni & Kearifan Budaya Betawi Setu Babakan** (`trail-jkt-setu-babakan`)
    * *4.2 km · 55 mnt · 5.500 langkah · 260 kcal · Rp 20.000*
    * Pos: Gerbang Utama Danau Setu Babakan, Museum Rumah Adat Kebaya & Bapang, Dermaga Saung Kuliner Tradisional Betawi.

---

## Lisensi

Proyek ini dikembangkan untuk pemenuhan Tugas 2 Mata Kuliah II3160 Teknologi Sistem Terintegrasi (TST) Semester Genap 2025/2026.  
Hak Cipta © 2026 **Tim matchabaobei (Kelas K01)** — Sekolah Teknik Elektro dan Informatika, Institut Teknologi Bandung.
