# Deploy NOMINA ke Fly.io

Panduan lengkap untuk deploy NOMINA CMS ke Fly.io secara gratis (dengan database eksternal) atau berbayar (dengan Fly Postgres).

## 📋 Prasyarat

1. **Akun Fly.io** — Daftar di [fly.io](https://fly.io)
2. **flyctl terinstall** — Ikuti [petunjuk](https://fly.io/docs/hands-on/install-flyctl/)
3. **PostgreSQL database** — Gunakan [Neon](https://neon.tech) (gratis) atau [Fly Postgres](https://fly.io/docs/postgres/) (berbayar)

## 🚀 Langkah 1: Persiapan Database

### Opsi A: Neon (Gratis 30MB-5GB)
1. Daftar di [neon.tech](https://neon.tech)
2. Buat project → Create database
3. Dapatkan connection string: `postgresql://user:pass@endpoint:5432/dbname`

### Opsi B: Fly Postgres (Berbayar $5/bulan)
```bash
flyctl postgres create --name nomina-db --region sin --initial-cluster-size shared-1x
flyctl postgres attach nomina-db --app nomina
```
Ini otomatis inject `DATABASE_URL` ke app kamu.

## 🚀 Langkah 2: Login & Buat App

```bash
flyctl auth login
flyctl apps create nomina
flyctl volumes create nomina_uploads --region sin --size 1
```

## 🚀 Langkah 3: Set Secrets

```bash
flyctl secrets set \
  DATABASE_URL="postgresql://user:pass@endpoint:5432/nomina" \
  SESSION_SECRET="isi_dengan_64_random_hex_chars" \
  CSRF_SECRET="isi_dengan_64_random_hex_chars_lain" \
  SITE_URL="https://nomina.fly.dev" \
  --app nomina
```

Generate secret:
```bash
openssl rand -hex 32
```

## 🚀 Langkah 4: Deploy

```bash
# Dari direktori project
npm run build
flyctl deploy
```

## 🚀 Langkah 5: Database Migration

```bash
# Jalankan migrasi (hanya pertama kali)
flyctl ssh console -C "npx tsx scripts/migrate.ts"
flyctl ssh console -C "npx tsx scripts/seed.ts"
```

Atau gunakan fly.toml `release_command` otomatis:
```toml
[deploy]
  release_command = "npx tsx scripts/migrate.ts && npx tsx scripts/seed.ts"
```

## 🚀 Langkah 6: Akses

Buka `https://nomina.fly.dev` — aplikasi sudah live!
Panel admin: `https://nomina.fly.dev/admin`

## 🛠️ Troubleshooting

| Masalah | Solusi |
|--------|--------|
| "Permission denied" pada uploads | `flyctl ssh console -C "chmod -R 777 /app/public/uploads"` |
| Database connection error | Cek DATABASE_URL dengan `flyctl ssh console -C "echo $DATABASE_URL"` |
| Health check gagal | Pastikan PostgreSQL bisa diakses, cek `flyctl logs` |
| sharp error | Sudah termasuk di Docker image (Alpine Linux) |

## 💰 Estimasi Biaya (Free Tier)

- **Fly.io Free Tier**: 3 Shared VMs (256MB RAM each), 160GB outbound
- **Neon Free**: 30MB storage (cukup untuk testing)
- **Estimasi**: **Gratis** untuk testing, $5/bulan untuk Fly Postgres jika butuh DB dedicated
