# Nomina — Platform Media Online (Astro.js + PostgreSQL)

Situs media online lengkap dengan **panel backend** untuk mengelola seluruh konten:
artikel/berita, video, foto, halaman statis, kategori, tag, menu, pustaka media,
komentar, pengguna, serta pengaturan situs (permalink, SEO, tampilan, media).

## Stack

| Bagian      | Teknologi                                                  |
| ----------- | ---------------------------------------------------------- |
| Framework   | Astro.js 5 (SSR, `@astrojs/node` adapter)                  |
| Database    | PostgreSQL 16+                                            |
| ORM         | Drizzle ORM + drizzle-kit (migrasi SQL ter-versioning)      |
| Styling     | Tailwind CSS v4                                            |
| Auth        | Sesi cookie httpOnly + bcrypt, tabel `sessions`             |
| Editor      | HTML (atau Markdown)                                       |
| Media       | Unggahan lokal ke `public/uploads/<tahun>/<bulan>`          |

## Menjalankan

```bash
npm install
cp .env.example .env      # sesuaikan DATABASE_URL & SESSION_SECRET
npm run db:migrate        # membuat tabel
npm run db:seed           # data awal (admin, kategori, tag, menu, halaman, post contoh)
npm run dev               # http://localhost:4321
```

Build produksi:

```bash
npm run build
node ./dist/server/entry.mjs   # standalone server
```

### Akun bawaan (seed)

| Peran  | Email               | Kata sandi |
| ------ | ------------------- | ---------- |
| Admin  | admin@nomina.id     | admin123   |
| Editor | editor@nomina.id    | editor123  |
| Penulis| penulis@nomina.id  | penulis123 |

> Ganti kata sandi dan `SESSION_SECRET` sebelum dipakai di produksi.

## Fitur Utama

| Fitur                | Keterangan                                                                   |
| -------------------- | ---------------------------------------------------------------------------- |
| Panel Redaksi        | CRUD post, halaman, kategori, tag, menu, media, komentar, pengguna, pengaturan |
| Area Member          | Pendaftaran, login, profil, ubah kata sandi (`/daftar`, `/masuk`, `/akun`)     |
| Mode Gelap/Terang    | Tombol tema di header (terang → gelap → sistem), tersimpan di localStorage   |
| SEO                  | Meta tag, Open Graph, Twitter Card, canonical, JSON-LD, sitemap, RSS, robots  |
| Permalink fleksibel  | Struktur URL diatur dari panel, redirect 301 otomatis ke URL kanonis         |
| Komentar             | Moderasi, balasan, anti-spam, moderasi opsional                              |

### Tema & Tipografi

Semua tampilan dapat diatur dari panel tanpa menyentuh kode:

| Pengaturan (Tampilan & Konten) | Fungsi                                                             |
| -------------------------------- | ------------------------------------------------------------------ |
| Warna Tema                      | Warna aksen utama: tombol, tautan, badge, sorotan, gradasi        |
| Font Teks                       | Font paragraf/navigasi (7 pilihan + font sistem)                  |
| Font Judul                      | Font judul artikel & seksi (6 pilihan + font sistem)              |
| Ukuran Font                     | Ukuran teks dasar 15/16/18/20 px, memperbesar seluruh skala rem        |

`src/lib/theme.ts` membangkitkan skala warna 50–900 dari satu hex (terang & gelap),
`src/lib/fonts.ts` membangun CSS + link Google Fonts sesuai pilihan pengguna.
Keduanya di-inject sebagai CSS variable di semua halaman.

### Mode Gelap
Tema gelap bekerja dengan **membalik token warna CSS** (bukan class `dark:` manual),
sehingga seluruh komponen publik dan admin ikut gelap secara otomatis.
Preferensi tersimpan di `localStorage` dengan key `nomina-theme` (`light` / `dark` / `system`).
Script kecil di `<head>` menerapkannya sebelum halaman digambar agar tidak ada kedipan (FOUC).

Token kunci:

| Token              | Terang   | Gelap    | Dipakai untuk                    |
| ------------------ | -------- | -------- | -------------------------------- |
| `--color-surface`  | `#ffffff`| `#141417`| Kartu, panel, form                |
| `--color-ink-*`    | hitam    | terbalik | Teks, border, garis pemisah       |
| `--color-brand-*`  | kuning   | gelap+emas| Aksen kuning & teks               |
| `--color-night-*`  | `#0a0a0a`| `#1b1b1f`| Blok gelap (footer, sidebar admin) |
| `--color-night-fg` | terang   | terang   | Teks di atas blok gelap           |

Audit kontras otomatis (membandingkan rasio warna teks vs latar pada mode gelap):

```bash
npm run check:contrast   # menampilkan pasangan teks/latar dengan rasio < 3
```

### Editor Konten (Classic Editor)

Form artikel & halaman memakai **TinyMCE** — editor klasik bergaya WordPress, bukan textarea HTML polos.

- Toolbar 2 baris: undo/redo, dropdown format paragraf & heading, bold, italic, underline, coret, perataan, daftar berurutan/berbutir, indent, outdent, tautan, gambar, tabel, format pilihan, kode HTML, dan penghitung kata
- **Tombol "Sisipkan gambar"** membuka pustaka media (dengan pencarian) dan menyisipkan gambar langsung ke isi artikel
- Konten disimpan sebagai HTML; isi artikel yang sudah ada dimuat kembali ke editor
- Seluruh aset TinyMCE (ikon, tema, model, plugin) dibundel lokal — **tanpa CDN**, bisa dipakai offline
- `npm run dev` → buka `/admin/posts/new`

### Sistem Iklan

Panel **Admin → Iklan** untuk mengelola iklan, dengan tiga jenis:

| Jenis                | Isi                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| **Gambar (Banner)**  | Gambar dari pustaka media + URL tujuan + teks alt. Ukuran ideal 728×90 (leaderboard), 300×250 (sidebar), 970×250 (billboard) |
| **Kode Custom**      | HTML/JS arbitrer (iframe, banner pihak ketiga, dsb)                 |
| **Google AdSense**   | Kode unit `<ins class="adsbygoogle">` + skrip loader               |

**Penempatan yang tersedia** (dipilih saat membuat iklan):

| Penempatan            | Posisi                                        | Format ideal      |
| --------------------- | --------------------------------------------- | ------------------ |
| `below_hero`          | Bawah hero di beranda                         | 970×250 / responsif |
| `sidebar_top`         | Atas sidebar                                  | 300×250            |
| `sidebar_bottom`      | Bawah sidebar                                 | 300×250            |
| `in_article`          | Di tengah isi artikel (setelah paragraf ke-3) | responsif          |
| `after_content`       | Setelah isi artikel, sebelum post terkait     | responsif          |
| `between_posts`       | Antar kartu artikel di daftar/arsip            | 336×280            |
| `footer`              | Melintang lebar di atas footer                 | 970×90             |

Fitur lain:
- **Satu slot = satu iklan** — jika ada beberapa iklan pada penempatan yang sama, yang tampil adalah iklan **Aktif terbaru** (untuk mengganti tampilan, jeda yang lama)
- **Targeting per kategori** — iklan bisa dibatasi hanya untuk kategori tertentu
- **Jadwal** — mulai/berhenti tayang, plus status Aktif / Jeda / Terjadwal
- **Pelacakan** — impression & klik dihitung otomatis (klik lewat `/go/:id`), plus CTR di dashboard
- **Pengaturan global** — `Admin → Pengaturan → Iklan`: aktifkan/matikan semua slot, ubah label, Client ID AdSense, dan Auto Ads

### Kode Custom (CSS & JS)

Menu **Admin → Kode Custom** untuk menambahkan gaya dan skrip tanpa menyentuh file proyek:

| Field                   | Fungsi                                                             |
| ----------------------- | ------------------------------------------------------------------ |
| Custom CSS — Publik     | CSS bebas untuk seluruh halaman situs publik                        |
| Custom JS — Publik      | JavaScript bebas untuk situs publik (chat widget, analitik, animasi) |
| Posisi CSS / JS         | `Akhir body` (default) atau `Dalam <head>`                          |
| Custom CSS/JS — Admin   | Hanya berlaku untuk halaman panel admin (`/admin`)                  |

Tersedia juga di `Admin → Pengaturan → Kode Custom (CSS & JS)`.
Kode disisipkan apa adanya (`<style>` / `<script>`), dengan posisi yang bisa dipilih.
Halaman editor memakai tema gelap monospace + tombol "Kosongkan Semua" + contoh kode.

### Akun Member (Google Account)

Pendaftaran & login member memakai **Google Account** (OAuth 2.0, OpenID Connect).
Tabel `members` + `member_sessions` menyimpan data member terpisah dari akun redaksi.
Sesi member memakai cookie `nomina_member` (httpOnly, berlaku 30 hari).

**Konfigurasi lewat panel admin:** `Admin → Pengaturan → Login Member (Google)`

| Field                  | Keterangan                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| Aktifkan Login dengan Google | Menyalakan/mematikan login member                              |
| Google Client ID       | Dari Google Cloud Console → Credentials → OAuth client ID (Web)   |
| Google Client Secret   | Disembunyikan di form (aman), isi sekali saja                     |
| Redirect URI           | Wajib sama dengan *Authorized redirect URI* di Google Cloud Console |

Kalau Redirect URI dikosongkan, sistem memakai `{SITE_URL}/api/member/google/callback`.
Variabel `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` di `.env`
dipakai sebagai **cadangan** bila form panel masih kosong.

Alur: `/api/member/google` → layar persetujuan Google → callback `/api/member/google/callback`
(validasi `state` anti-CSRF) → profil diambil dari userinfo → member dibuat/ditautkan otomatis
(jika email sudah terdaftar, akun lama otomatis terhubung ke Google tersebut) → sesi dibuat.

> Tanpa kredensial, tombol Google tetap tampil; saat diklik muncul pesan konfigurasi.

## Perintah

| Perintah             | Fungsi                                  |
| -------------------- | --------------------------------------- |
| `npm run dev`        | Server pengembangan                      |
| `npm run build`      | Build produksi                           |
| `npm run db:generate`| Membuat file migrasi dari perubahan skema |
| `npm run db:migrate` | Menjalankan migrasi                      |
| `npm run db:seed`    | Mengisi data awal (aman diulang)         |
| `npm run db:studio`  | GUI untuk melihat data                  |
| `npx astro check`    | Pemeriksaan tipe                         |

## Struktur

```
src/
  db/schema.ts          Definisi tabel (users, posts, pages, categories, tags,
                        menus, media, comments, settings, sessions, subscribers)
  lib/
    auth.ts             Sesi, hash kata sandi, kontrol akses
    settings.ts         Pemuat + penyimpanan pengaturan situs
    settings-def.ts     Definisi & label seluruh pengaturan
    permalink.ts        Pembentuk URL mengikuti struktur permalink
    content.ts          Query konten (post, kategori, tag, menu, statistik)
    content-render.ts   Render HTML/Markdown
    admin/save.ts       Logika simpan/hapus untuk semua entitas
  middleware.ts         Proteksi /admin, pembacaan sesi
  components/           Komponen publik (Header, Footer, PostCard, Sidebar…)
  components/admin/     Komponen panel (Field, Icon, PostForm, PageForm…)
  layouts/              PublicLayout, AdminLayout
  pages/                Rute publik + rute /admin
scripts/                migrate.ts, seed.ts
```

## Panel Admin (`/admin`)

| Modul     | Fitur                                                                     |
| --------- | ------------------------------------------------------------------------- |
| Dashboard | Statistik, post terbaru, komentar menunggu, aksi cepat                    |
| Post      | CRUD, pencarian, filter status/kategori/tipe, aksi massal, artikel unggulan, galeri video |
| Halaman   | CRUD halaman statis + SEO + status                                        |
| Kategori  | CRUD, kategori induk, posisi, SEO                                         |
| Tag       | Tambah/ubah/hapus, jumlah pemakaian                                       |
| Menu      | Multi-menu (primary, footer, legal, sidebar) + item dengan anak/induk      |
| Media     | Unggah multi-format, salin URL, hapus, filter folder, batas ukuran        |
| Komentar  | Moderasi: setujui / tandai spam / hapus                                   |
| Pengguna  | CRUD, peran (admin/editor/penulis), status aktif                          |
| Pengaturan| Identitas situs, media sosial, SEO & analitik, permalink, tampilan, media  |

## Permalink

Struktur URL diatur di **Pengaturan → Permalink & URL** dengan placeholder:

- `{category}` — slug kategori
- `{slug}` — slug artikel
- `{id}` — ID artikel
- `{y} {m} {d}` — tanggal publikasi
- `{title}` — judul ter-slug

Contoh: `/{category}/{slug}` → `/ekonomi/program-ekonomi-digital-umkm`.
URL lama dialihkan otomatis ke URL kanonis (301) bila struktur berubah.
Halaman statis memakai basis `halaman`, kategori `kategori`, tag `tag`, penulis `penulis`.

## SEO

Judul, deskripsi, keywords, Open Graph, Twitter Card, canonical, robots.txt,
sitemap.xml, RSS (rss.xml), JSON-LD `NewsMediaOrganization` + `NewsArticle` +
`BreadcrumbList`, Google Analytics/GTM, dan Google Site Verification — semuanya
diatur dari panel dan dapat diganti tanpa menyentuh kode.

## Catatan produksi

1. Ganti `SESSION_SECRET` dengan string acak ≥ 32 karakter.
2. Set `SITE_URL` ke domain produksi (dipakai sitemap, RSS, canonical, OG).
3. Sajikan `public/uploads` lewat CDN/Nginx untuk file besar.
4. Gunakan `pg_dump` terjadwal untuk backup database.
5. Pada Astro, `output: 'server'` + adapter Node; tambahkan reverse proxy (Nginx/Caddy).
