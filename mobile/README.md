# NusaJalur — Aplikasi Mobile (React Native / Expo)

> Expo SDK 58 · React Native 0.88 · TypeScript  
> Mendukung iOS & Android via Expo Go

Dokumentasi lengkap ada di **[README root](../README.md)**.

---

## Quick Start

```bash
# 1. Install dependencies
cd mobile
npm install

# 2. Jalankan bundler
npx expo start

# 3. Scan QR Code
#    - Android: Expo Go → Scan
#    - iOS: Kamera → Open in Expo Go
```

---

## Struktur Layar

| Screen | File | Deskripsi |
|--------|------|-----------|
| Login/Register | `AuthScreen.tsx` | JWT auth, demo 1-klik, pilih server & bahasa |
| Jelajahi Trail | `HomeScreen.tsx` | Katalog + filter tema + GPS terdekat |
| Detail Trail | `TrailDetailScreen.tsx` | Waypoints, harga dinamis, beli pass |
| Check-in GPS | `CheckinScreen.tsx` | Radar GPS, simulasi mode, unlock cerita |
| Pass Saya | `MyPassesScreen.tsx` | Progress bar, checklist waypoint, voucher |
| Profil | `ProfileScreen.tsx` | Statistik, ganti bahasa, konfigurasi server |

---

## Konfigurasi Server

Aplikasi menyimpan URL server di AsyncStorage. Default saat install:

```
Cloudflare Dev: https://boats-similarly-compaq-riverside.trycloudflare.com/api/v1
LAN:            http://172.22.33.148:8000/api/v1
Produksi (STB): https://matchabaobei.stei.fun/api/v1
```

> ⚠️ URL `trycloudflare.com` **berubah setiap sesi**. Gunakan URL **Produksi** untuk demo yang stabil.

Untuk ganti server: **Profil → Konfigurasi Server → pilih preset / masukkan URL custom**

---

## Multi-Bahasa

| Bahasa | Kode | Tersedia |
|--------|------|----------|
| Bahasa Indonesia | `id` | ✅ Default |
| English | `en` | ✅ |

Ganti bahasa: **Profil → Bahasa → pilih**

---

## Fitur GPS & Simulasi

- **GPS Check-in**: Valid jika jarak pengguna ≤ `radius_m` pos (default 100 m)
- **Simulasi Mode**: Test dari mana saja dengan koordinat simulasi (Gedung Merdeka, Bandung)
- **Haversine**: Kalkulasi jarak dilakukan di client maupun server

---

## Paleta Warna

| Nama | Hex | Digunakan |
|------|-----|-----------|
| Primary (Forest Sage) | `#3D7A5F` | Tombol utama, aksen |
| Primary Mid | `#5B9E7B` | Gradient, chip aktif |
| Background (Warm Cream) | `#F5F0E8` | Background layar |
| Surface (White) | `#FFFFFF` | Card, modal |
| Amber | `#D97706` | Kalori, harga diskon |
| Sky | `#2E86AB` | Jarak, navigasi |

---

## Navigasi

```
AppNavigator (Stack)
├── Auth (Stack.Screen) ← jika belum login
└── MainTabs (Stack.Screen)
    ├── ExploreTab (HomeScreen)
    ├── PassesTab (MyPassesScreen)
    └── ProfileTab (ProfileScreen)
    ⬇ dari mana saja:
    ├── TrailDetail (Stack.Screen)
    └── Checkin (Stack.Screen)
```

---

## Kredensial Demo

| Field | Value |
|-------|-------|
| Email | `demo@nusajalur.id` |
| Password | `demo1234` |

> Di AuthScreen: klik **"⚡ Masuk Akun Demo (1-Klik)"**
