export const settingsDefaults = {
  /* ---- umum ---- */
  siteName: 'Nomina',
  siteTagline: 'Informasi Tepat, Tpercayaan Ter instantiation',
  siteDescription:
    'Portal berita dan media online Indonesia — berita terkini, multimedia, dan analisis mendalam.',
  siteEmail: 'redaksi@nomina.id',
  sitePhone: '+62 812-0000-0000',
  siteAddress: 'Jl. Merdeka No. 1, Jakarta',
  siteLogo: '',
  favicon: '',
  footerText: '© {year} Nomina. Seluruh hak cipta dilindungi.',
  footerCredit: 'Dik powering oleh Astro.js & PostgreSQL',


  /* ---- sosial ---- */
  socialFacebook: 'https://facebook.com/',
  socialInstagram: 'https://instagram.com/',
  socialX: 'https://x.com/',
  socialYoutube: 'https://youtube.com/',
  socialTiktok: 'https://tiktok.com/',
  socialLinkedin: 'https://linkedin.com/',
  socialTelegram: 'https://t.me/',

  /* ---- seo ---- */
  seoTitleFormat: '{siteName} — {title} | {category}',
  seoSeparator: '—',
  metaDescription: '',
  metaKeywords: 'berita, media online, indonesia, terkini',
  ogImage: '',
  twitterSite: '',
  robots: 'index, follow',
  googleAnalyticsId: '',
  googleSiteVerification: '',
  googleTagManagerId: '',
  canonicalUrl: '',
  schemaOrganization: '',
  showBreadcrumbSchema: 'true',

  /* ---- permalink ---- */
  permalinkStructure: '/{category}/{slug}',
  permalinkCategoryBase: 'kategori',
  permalinkTagBase: 'tag',
  permalinkPageBase: 'halaman',
  permalinkAuthorBase: 'penulis',
  trailingSlash: 'false',
  redirectOldUrls: 'true',

  /* ---- tampilan ---- */
  postsPerPage: '10',
  themeColor: '#e11d48',
  fontFamily: 'jakarta',
  fontHeading: 'sora',
  fontSize: 'sedang',
  showReadingTime: 'true',
  showAuthorBox: 'true',
  showShareButtons: 'true',
  showRelatedPosts: 'true',
  sidebarPopularRange: 'all',
  commentEnabled: 'true',
  commentRequireModeration: 'true',
  dateFormat: 'long',
  timeFormat: '24',

  /* ---- member / login google ---- */
  memberLoginGoogle: 'true',
  adsEnabled: 'true',
  adsLabel: 'Iklan',
  adsenseClientId: '',
  adsenseAutoAds: 'false',
  customCss: '',
  customJs: '',
  customCssPosition: 'footer',
  customJsPosition: 'footer',
  customAdminCss: '',
  customAdminJs: '',
  googleClientId: '',
  googleClientSecret: '',
  googleRedirectUri: '',

  /* ---- media ---- */
  uploadMaxSizeMb: '10',
  mediaAllowedTypes: 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4',
  mediaAutoWebp: 'false',
  mediaFolderPrefix: 'yyyy/mm',
} as const;

export type SettingKey = keyof typeof settingsDefaults;
export type Settings = Record<SettingKey, string> & Record<string, string>;

export const settingGroups: { key: string; label: string; description: string; fields: SettingKey[] }[] = [
  {
    key: 'umum',
    label: 'Identitas Situs',
    description: 'Nama, kontak, dan identitas dasar situs Anda.',
    fields: [
      'siteName',
      'siteTagline',
      'siteDescription',
      'siteEmail',
      'sitePhone',
      'siteAddress',
      'siteLogo',
      'favicon',
      'footerText',
      'footerCredit',
    ],
  },
  {
    key: 'sosial',
    label: 'Media Sosial',
    description: 'Tautan profil media sosial yang ditampilkan di header & footer.',
    fields: [
      'socialFacebook',
      'socialInstagram',
      'socialX',
      'socialYoutube',
      'socialTiktok',
      'socialLinkedin',
      'socialTelegram',
    ],
  },
  {
    key: 'seo',
    label: 'SEO & Analytics',
    description: 'Meta tag default, Open Graph, robots.txt, dan analitik.',
    fields: [
      'seoTitleFormat',
      'seoSeparator',
      'metaDescription',
      'metaKeywords',
      'ogImage',
      'twitterSite',
      'robots',
      'googleAnalyticsId',
      'googleSiteVerification',
      'googleTagManagerId',
      'canonicalUrl',
      'schemaOrganization',
      'showBreadcrumbSchema',
    ],
  },
  {
    key: 'permalink',
    label: 'Permalink & URL',
    description: 'Struktur URL untuk artikel, kategori, tag, dan halaman statis.',
    fields: [
      'permalinkStructure',
      'permalinkCategoryBase',
      'permalinkTagBase',
      'permalinkPageBase',
      'permalinkAuthorBase',
      'trailingSlash',
      'redirectOldUrls',
    ],
  },
  {
    key: 'tampilan',
    label: 'Tampilan & Konten',
    description: 'Pengaturan tampilan beranda, komentar, dan jumlah post per halaman.',
    fields: [
      'postsPerPage',
      'themeColor',
      'fontFamily',
      'fontHeading',
      'fontSize',
      'showReadingTime',
      'showAuthorBox',
      'showShareButtons',
      'showRelatedPosts',
      'sidebarPopularRange',
      'commentEnabled',
      'commentRequireModeration',
      'dateFormat',
      'timeFormat',
    ],
  },
  {
    key: 'media',
    label: 'Media & Unggahan',
    description: 'Batas ukuran, format yang diizinkan, dan perilaku penyimpanan berkas.',
    fields: [
      'uploadMaxSizeMb',
      'mediaAllowedTypes',
      'mediaAutoWebp',
      'mediaFolderPrefix',
    ],
  },
  {
    key: 'ads',
    label: 'Iklan',
    description: 'Kelola iklan (gambar, kode custom, Google AdSense) dan penempatannya.',
    fields: ['adsEnabled', 'adsLabel', 'adsenseClientId', 'adsenseAutoAds'],
  },
  {
    key: 'custom',
    label: 'Kode Custom (CSS & JS)',
    description: 'Tambahkan gaya dan skrip khusus untuk situs ini.',
    fields: [
      'customCss',
      'customJs',
      'customCssPosition',
      'customJsPosition',
      'customAdminCss',
      'customAdminJs',
    ],
  },
  {
    key: 'member',
    label: 'Login Member (Google)',
    description:
      'Pendaftaran & login member memakai Google Account. Isi kredensial OAuth dari Google Cloud Console.',
    fields: [
      'memberLoginGoogle',
      'googleClientId',
      'googleClientSecret',
      'googleRedirectUri',
    ],
  },
];

export const settingLabels: Record<string, string> = {
  siteName: 'Nama Situs',
  siteTagline: 'Tagline',
  siteDescription: 'Deskripsi Situs',
  siteEmail: 'Email Redaksi',
  sitePhone: 'Telepon',
  siteAddress: 'Alamat',
  siteLogo: 'URL Logo',
  favicon: 'URL Favicon',
  footerText: 'Teks Footer',
  footerCredit: 'Kredit Footer (Kaki Kanan)',
  socialFacebook: 'Facebook',
  socialInstagram: 'Instagram',
  socialX: 'X (Twitter)',
  socialYoutube: 'YouTube',
  socialTiktok: 'TikTok',
  socialLinkedin: 'LinkedIn',
  socialTelegram: 'Telegram',
  seoTitleFormat: 'Format Judul SEO',
  seoSeparator: 'Pemisah Judul',
  metaDescription: 'Meta Description Default',
  metaKeywords: 'Meta Keywords Default',
  ogImage: 'URL Gambar OG Default',
  twitterSite: 'Akun Twitter (@)',
  robots: 'Directive Robots',
  googleAnalyticsId: 'Google Analytics ID',
  googleSiteVerification: 'Google Site Verification',
  googleTagManagerId: 'Google Tag Manager ID',
  canonicalUrl: 'Canonical URL',
  schemaOrganization: 'Schema.org Organization JSON-LD',
  showBreadcrumbSchema: 'Schema Breadcrumb',
  permalinkStructure: 'Struktur Permalink Artikel',
  permalinkCategoryBase: 'Basis URL Kategori',
  permalinkTagBase: 'Basis URL Tag',
  permalinkPageBase: 'Basis URL Halaman',
  permalinkAuthorBase: 'Basis URL Penulis',
  trailingSlash: 'Gunakan Trailing Slash',
  redirectOldUrls: 'Redirect URL Lama (301)',
  postsPerPage: 'Jumlah Post per Halaman',
  themeColor: 'Warna Tema',
  fontFamily: 'Font Teks',
  fontHeading: 'Font Judul',
  fontSize: 'Ukuran Font',
  showReadingTime: 'Tampilkan Waktu Baca',
  showAuthorBox: 'Tampilkan Kotak Penulis',
  showShareButtons: 'Tampilkan Tombol Bagikan',
  showRelatedPosts: 'Tampilkan Post Terkait',
  sidebarPopularRange: 'Periode Widget Populer',
  commentEnabled: 'Aktifkan Komentar',
  commentRequireModeration: 'Komentar Perlu Moderasi',
  dateFormat: 'Format Tanggal',
  timeFormat: 'Format Waktu',
  uploadMaxSizeMb: 'Maks Upload (MB)',
  mediaAllowedTypes: 'Tipe File Diizinkan',
  mediaAutoWebp: 'Konversi Otomatis ke WebP',
  mediaFolderPrefix: 'Format Folder Media',

  adsEnabled: 'Aktifkan Iklan',
  adsLabel: 'Label Iklan',
  adsenseClientId: 'Google AdSense Client ID (ca-pub-...)',
  adsenseAutoAds: 'Aktifkan Auto Ads (AdSense)',
  customCss: 'Custom CSS (Situs Publik)',
  customJs: 'Custom JS (Situs Publik)',
  customCssPosition: 'Posisi Custom CSS',
  customJsPosition: 'Posisi Custom JS',
  customAdminCss: 'Custom CSS (Panel Admin)',
  customAdminJs: 'Custom JS (Panel Admin)',
  memberLoginGoogle: 'Aktifkan Login dengan Google',
  googleClientId: 'Google Client ID',
  googleClientSecret: 'Google Client Secret',
  googleRedirectUri: 'Redirect URI (Authorized)',
};

export const settingHelp: Record<string, string> = {
  /* ---- Identitas situs ---- */
  siteName:
    'Nama yang muncul di logo, header, footer, dan judul tab browser. Contoh: Nomina',
  siteTagline:
    'Kalimat singkat di bawah nama situs (header & footer). Maksimal sekitar 60 karakter.',
  siteDescription:
    'Deskripsi umum situs. Dipakai sebagai meta description bawaan dan deskripsi di footer. Tulis 2–3 kalimat.',
  siteEmail: 'Email redaksi. Dipakai untuk kontak pembaca dan pemberitahuan internal.',
  sitePhone: 'Nomor telepon atau WhatsApp redaksi. Format bebas, contoh: +62 812-0000-0000.',
  siteAddress: 'Alamat kantor redaksi. Ditampilkan pada kolom "Redaksi" di footer.',
  siteLogo:
    'URL logo (SVG/PNG) — disarankan 200×60 px dengan latar transparan. Kosongkan untuk memakai huruf awal.',
  favicon:
    'URL favicon (32×32 atau 64×64 px, format .ico/.png/.svg). Kosongkan untuk memakai ikon bawaan.',
  footerCredit:
    'Teks kecil di kaki kanan footer. Kosongkan untuk menyembunyikannya.',
  footerText:
    'Teks paling bawah footer. {year} diganti tahun berjalan, {siteName} diganti nama situs.',

  /* ---- Media sosial ---- */
  socialFacebook:
    'URL halaman atau profil Facebook. Kosongkan untuk menyembunyikan ikonnya di footer.',
  socialInstagram: 'URL profil Instagram. Kosongkan untuk menyembunyikan ikonnya.',
  socialX: 'URL profil X (Twitter). Kosongkan untuk menyembunyikan ikonnya.',
  socialYoutube: 'URL kanal YouTube. Kosongkan untuk menyembunyikan ikonnya.',
  socialTiktok: 'URL profil TikTok. Kosongkan untuk menyembunyikan ikonnya.',
  socialLinkedin: 'URL profil atau perusahaan di LinkedIn. Kosongkan untuk menyembunyikan ikonnya.',
  socialTelegram: 'URL kanal Telegram. Kosongkan untuk menyembunyikan ikonnya.',

  /* ---- SEO ---- */
  seoTitleFormat:
    'Pola judul halaman. Placeholder: {siteName} nama situs, {title} judul artikel, {category} kategori, {tag} tag, {page} nomor halaman.',
  seoSeparator: 'Pemisah antara judul artikel dan nama situs, contoh: "—" atau "|".',
  metaDescription:
    'Deskripsi bawaan untuk halaman yang tidak punya deskripsi khusus. Maksimal 160 karakter agar tidak terpotong di Google.',
  metaKeywords:
    'Kata kunci bawaan situs, pisahkan dengan koma. Jangan terlalu banyak (maksimal 10 keyword).',
  ogImage:
    'URL gambar bawaan saat tautan dibagikan di media sosial. Disarankan 1200×630 px.',
  twitterSite: 'Akun X/Twitter untuk Twitter Card, contoh: @namasitus.',
  robots:
    'Arahan untuk mesin pencari. "index, follow" = boleh diindeks dan followed (default media).',
  googleAnalyticsId:
    'ID pengukuran Google Analytics, format G-XXXXXXXXXX. Kosongkan untuk mematikan analitik.',
  googleSiteVerification:
    'Kode verifikasi dari Google Search Console (meta tag).',
  googleTagManagerId: 'ID container Google Tag Manager, format GTM-XXXXXXX.',
  canonicalUrl:
    'URL kanonik untuk seluruh situs. Kosongkan untuk memakai domain yang sedang diakses.',
  schemaOrganization:
    'JSON-LD schema Organization (bisa disalin dari schema.org). Kosongkan untuk memakai default bawaan situs.',
  showBreadcrumbSchema:
    'Sertakan schema BreadcrumbList agar breadcrumb tampil kaya di hasil pencarian Google.',

  /* ---- Permalink ---- */
  permalinkStructure:
    'Struktur URL artikel. Placeholder: {category}, {slug}, {id}, {y}/{m}/{d}. Contoh: /{category}/{slug}',
  permalinkCategoryBase:
    'Kosongkan untuk menghapus prefix — kategori diakses langsung, contoh /ekonomi. Link di menu otomatis disesuaikan.',
  permalinkTagBase:
    'Kosongkan untuk menghapus prefix — tag diakses langsung, contoh /analisis.',
  permalinkPageBase:
    'Kosongkan untuk menghapus prefix — halaman diakses langsung, contoh /tentang-kami.',
  permalinkAuthorBase:
    'Kosongkan untuk menghapus prefix — profil penulis diakses langsung, contoh /penulis/budi.',
  trailingSlash:
    'Tentukan URL diakhiri garis miring atau tidak. Pilih satu dan konsisten agar tidak ada URL ganda.',
  redirectOldUrls:
    'Alihkan URL lama ke URL kanonis dengan status 301 (disarankan untuk menjaga SEO).',

  /* ---- Tampilan ---- */
  fontFamily:
    'Font untuk isi artikel, paragraf, dan navigasi.',
  fontHeading:
    'Font untuk judul artikel, judul seksi, dan nama situs.',
  fontSize:
    'Ukuran teks dasar. Memperbesar juga memperbesar seluruh spasi dan judul.',
  postsPerPage:
    'Jumlah artikel per halaman pada beranda dan arsip. Semakin besar, halaman semakin berat dimuat.',
  themeColor:
    'Warna aksen utama seluruh situs: tombol utama, tautan, badge, sorotan, dan gradasi. Skala terang & gelap dibangkitkan otomatis. Contoh: #e11d48',
  showReadingTime:
    'Tampilkan estimasi waktu baca di bawah judul artikel.',
  showAuthorBox:
    'Tampilkan kotak profil penulis (nama, foto, bio) di akhir artikel.',
  showShareButtons:
    'Tampilkan tombol bagikan artikel ke Facebook, X, WhatsApp, LinkedIn, dan Telegram.',
  showRelatedPosts:
    'Tampilkan artikel terkait (berdasarkan kategori) di akhir artikel.',
  sidebarPopularRange:
    'Periode default widget Populer di sidebar. Semua = akumulasi, 24 Jam = 1 hari, 7 Hari = 1 minggu, 30 Hari = 1 bulan.',
  commentEnabled: 'Aktifkan kolom komentar pada artikel.',
  commentRequireModeration:
    'Komentar baru menunggu persetujuan redaksi sebelum ditampilkan di situs.',
  dateFormat: 'Format tanggal yang dipakai di seluruh situs.',
  timeFormat: 'Format jam 24 atau 12 jam (AM/PM).',

  /* ---- Media ---- */
  uploadMaxSizeMb:
    'Batas ukuran berkas unggahan dalam MB. 10 MB cukup untuk gambar dan video pendek.',
  mediaAllowedTypes:
    'Tipe MIME yang boleh diunggah, pisahkan dengan koma. Contoh: image/jpeg,image/png,video/mp4',
  mediaAutoWebp:
    'Konversi gambar ke WebP otomatis saat diunggah (file lebih ringan, dukungan browser sudah luas).',
  mediaFolderPrefix:
    'Format folder penyimpanan berkas. "yyyy/mm" menghasilkan 2026/10, "umum" memakai satu folder.',

  /* ---- Login member ---- */
  adsEnabled:
    'Bila dimatikan, semua slot iklan kosong di situs publik.',
  adsLabel:
    'Teks kecil di atas iklan, contoh: Iklan / Sponsored / Mitra.',
  adsenseClientId:
    'Format ca-pub-xxxxxxxx-xxxxxxxx. Dipakai untuk Auto Ads dan sebagai acuan.',
  adsenseAutoAds:
    'Mengaktifkan skrip Auto Ads AdSense di seluruh halaman.',
  customCss:
    'CSS bebas yang disisipkan ke situs publik. Gunakan untuk merapikan tampilan, mengganti font, atau menata khusus halaman tertentu.',
  customJs:
    'JavaScript bebas yang dijalankan di situs publik. Contoh: analytics, chat widget, atau animasi tambahan.',
  customCssPosition:
    'Letakkan CSS di dalam <head> (diterapkan lebih awal) atau di akhir body.',
  customJsPosition:
    'Letakkan JS di dalam <head> atau di akhir body (disarankan akhir body agar halaman sudah ter-render).',
  customAdminCss:
    'CSS bebas khusus untuk halaman panel admin.',
  customAdminJs:
    'JavaScript bebas khusus untuk halaman panel admin.',
  memberLoginGoogle:
    'Bila dimatikan, tombol Google disembunyikan dan login member dinonaktifkan.',
  googleClientId:
    'Dari Google Cloud Console → Credentials → OAuth client ID (Web application).',
  googleClientSecret:
    'Disembunyikan demi keamanan. Kosongkan berarti tidak diubah.',
  googleRedirectUri:
    'Wajib sama persis dengan Authorized redirect URI di Google Cloud Console. Kosongkan untuk memakai {SITE_URL}/api/member/google/callback',
};
