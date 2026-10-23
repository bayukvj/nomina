# NOMINA CMS — Getting Started (Development)

## Prasyarat
- Node.js 20+
- npm 10+
- PostgreSQL 14+

## Setup (5 menit)

```bash
# 1. Install dependencies
npm install

# 2. Copy & edit environment
cp .env.example .env.local

# Edit .env.local:
#   DATABASE_URL=postgresql://postgres:password@localhost:5432/nomina
#   SESSION_SECRET=<isi random hex 64 karakter>
#   CSRF_SECRET=<isi random hex 64 karakter>
#   SITE_URL=http://localhost:4321

# 3. Buat database PostgreSQL
#    psql -c "CREATE DATABASE nomina;"

# 4. Migrasi & seed
npm run setup

# 5. Jalankan development server
npm run dev
```

Buka: http://localhost:4321
Panel admin: http://localhost:4321/admin (login: admin@nomina.id / admin123)

## Generate Secret
```bash
# Linux/Mac:
openssl rand -hex 32
# Windows PowerShell:
[System.BitConverter]::ToString((New-Object Byte[] 32) | ForEach-Object { (Get-Random -Minimum 0 -Maximum 256) }) -replace '-', ''
```

## Struktur Project
- `src/pages/` — Astro pages (frontend + admin + API)
- `src/components/` — UI components
- `src/lib/` — Business logic (content, auth, CSRF, rate-limit, etc.)
- `src/db/schema.ts` — Drizzle ORM schema (PostgreSQL)
- `drizzle/*.sql` — Migration files
- `scripts/` — CLI scripts (migrate, seed)
- `installer/` — Web-based installer (hapus setelah pakai)

## Troubleshooting
| Error | Solusi |
|-------|--------|
| `ECONNREFUSED` database | Pastikan PostgreSQL running, cek DATABASE_URL di .env |
| `Cannot find module` | Jalankan `npm install` |
| `sharp` build error | `npm rebuild sharp` atau reinstall Node.js versi 20 |
| Migrasi gagal | Cek PostgreSQL tabel belum ada, hapus DB & recreate |
