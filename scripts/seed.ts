import { loadEnv } from './load-env';

loadEnv();

async function main() {
  const { db } = await import('../src/db');
  const schema = await import('../src/db/schema');
  const { hashPassword } = await import('../src/lib/auth');
  const { eq } = await import('drizzle-orm');

  const { users, categories, tags, posts, postTags, pages, menus, menuItems, settings } =
    schema;

  console.log('→ Menyiapkan data awal…');

  /* ---------- pengguna ---------- */
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@nomina.id').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
  const adminName = process.env.ADMIN_NAME ?? 'Administrator';

  const existingAdmins = await db.select().from(users).where(eq(users.email, adminEmail));
  let adminId = existingAdmins[0]?.id;

  if (!adminId) {
    const inserted = await db
      .insert(users)
      .values({
        name: adminName,
        email: adminEmail,
        passwordHash: await hashPassword(adminPassword),
        role: 'admin',
        bio: 'Jektif redaksi Nomina.',
      })
      .returning({ id: users.id });
    adminId = inserted[0].id;
    console.log(`  + Admin dibuat: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`  - Admin sudah ada: ${adminEmail}`);
  }

  const editorEmail = 'editor@nomina.id';
  const existingEditor = await db.select().from(users).where(eq(users.email, editorEmail));
  if (existingEditor.length === 0) {
    await db.insert(users).values({
      name: 'Sari Andriani',
      email: editorEmail,
      passwordHash: await hashPassword('editor123'),
      role: 'editor',
      bio: 'Editor berita nasional dan deskripsi.',
    });
    console.log('  + Editor dibuat: editor@nomina.id / editor123');
  }

  const authorEmail = 'penulis@nomina.id';
  const existingAuthor = await db.select().from(users).where(eq(users.email, authorEmail));
  let authorId = existingAuthor[0]?.id;
  if (!authorId) {
    const inserted = await db
      .insert(users)
      .values({
        name: 'Budi Santoso',
        email: authorEmail,
        passwordHash: await hashPassword('penulis123'),
        role: 'author',
        bio: 'Jurnalis desk ekonomi dan teknologi.',
      })
      .returning({ id: users.id });
    authorId = inserted[0].id;
    console.log('  + Penulis dibuat: penulis@nomina.id / penulis123');
  }

  /* ---------- kategori ---------- */
  const categorySeed = [
    { name: 'Nasional', slug: 'nasional', description: 'Berita terkini dan peristiwa nasional.' },
    { name: 'Ekonomi', slug: 'ekonomi', description: 'Ekonomi, bisnis, dan pasar modal.' },
    { name: 'Teknologi', slug: 'teknologi', description: 'Inovasi teknologi dan digital.' },
    { name: 'Internasional', slug: 'internasional', description: 'Peristiwa dan diplomasi global.' },
    { name: 'Olahraga', slug: 'olahraga', description: 'Sepak bola, bulu tangkis, dan olahraga lainnya.' },
    { name: 'Gaya Hidup', slug: 'gaya-hidup', description: 'Kesehatan, kuliner, dan perjalanan.' },
  ];

  const categoryIds: Record<string, number> = {};
  for (const c of categorySeed) {
    const existing = await db.select().from(categories).where(eq(categories.slug, c.slug));
    if (existing.length > 0) {
      categoryIds[c.slug] = existing[0].id;
    } else {
      const inserted = await db.insert(categories).values(c).returning({ id: categories.id });
      categoryIds[c.slug] = inserted[0].id;
    }
  }
  console.log(`  + Kategori: ${categorySeed.length}`);

  /* ---------- tag ---------- */
  const tagSeed = ['Analisis', 'Wawancara', 'Eksklusif', 'Infografis', 'Video'];
  const tagIds: Record<string, number> = {};
  for (const name of tagSeed) {
    const slug = name.toLowerCase();
    const existing = await db.select().from(tags).where(eq(tags.slug, slug));
    if (existing.length > 0) {
      tagIds[slug] = existing[0].id;
    } else {
      const inserted = await db
        .insert(tags)
        .values({ name, slug })
        .returning({ id: tags.id });
      tagIds[slug] = inserted[0].id;
    }
  }
  console.log(`  + Tag: ${tagSeed.length}`);

  /* ---------- menu ---------- */
  const menuSeed = [
    {
      name: 'Menu Utama',
      location: 'primary',
      items: [
        { label: 'Nasional', url: '/kategori/nasional' },
        { label: 'Ekonomi', url: '/kategori/ekonomi' },
        { label: 'Teknologi', url: '/kategori/teknologi' },
        { label: 'Internasional', url: '/kategori/internasional' },
        { label: 'Olahraga', url: '/kategori/olahraga' },
      ],
    },
    {
      name: 'Menu Footer',
      location: 'footer',
      items: [
        { label: 'Tentang Kami', url: '/halaman/tentang-kami' },
        { label: 'Redaksi', url: '/halaman/redaksi' },
        { label: 'Kontak', url: '/halaman/kontak' },
        { label: 'Karier', url: '/halaman/karier' },
      ],
    },
    {
      name: 'Menu Legal',
      location: 'legal',
      items: [
        { label: 'Kebijakan Privasi', url: '/halaman/kebijakan-privasi' },
        { label: 'Disclaimer', url: '/halaman/disclaimer' },
        { label: 'Pedoman Media Siber', url: '/halaman/pedoman-media-siber' },
      ],
    },
  ];

  for (const m of menuSeed) {
    const existing = await db.select().from(menus).where(eq(menus.location, m.location));
    let menuId = existing[0]?.id;
    if (!menuId) {
      const inserted = await db
        .insert(menus)
        .values({ name: m.name, location: m.location })
        .returning({ id: menus.id });
      menuId = inserted[0].id;
    }
    const currentItems = await db.select().from(menuItems).where(eq(menuItems.menuId, menuId));
    if (currentItems.length === 0) {
      await db.insert(menuItems).values(
        m.items.map((i, idx) => ({ ...i, menuId, position: idx + 1, isVisible: true })),
      );
    }
  }
  console.log(`  + Menu: ${menuSeed.length}`);

  /* ---------- halaman ---------- */
  const pageSeed = [
    {
      title: 'Tentang Kami',
      slug: 'tentang-kami',
      content:
        '<p>Nomina adalah media online independen yang presenting berita, analisis, dan multimedia kepada publik Indonesia.</p><h2>Misi Kami</h2><p>Menyajikan informasi yang terverifikasi, berimbang, dan dapat dipercaya oleh publik.</p>',
    },
    {
      title: 'Redaksi',
      slug: 'redaksi',
      content:
        '<p>Redaksi Nomina terdiri dari jurnalis yang tersebar di berbagai kota. Setiap berita melalui proses verifikasi sebelum tayang.</p>',
    },
    {
      title: 'Kontak',
      slug: 'kontak',
      content:
        '<p>Alamat redaksi: Jl. Merdeka No. 1, Jakarta<br/>Surel: redaksi@nomina.id<br/>Telepon: +62 812-0000-0000</p>',
    },
    {
      title: 'Kebijakan Privasi',
      slug: 'kebijakan-privasi',
      content:
        '<p>Kami menghormati privasi pembaca. Data yang dikumpulkan hanya digunakan untuk keperluan layanan dan tidak dibagikan kepada pihak ketiga.</p>',
    },
    {
      title: 'Disclaimer',
      slug: 'disclaimer',
      content:
        '<p>Seluruh isi situs ini dibuat untuk keperluan informasi. Redaksi tidak bertanggung jawab atas keputusan pengguna berdasarkan berita yang dimuat.</p>',
    },
    {
      title: 'Pedoman Media Siber',
      slug: 'pedoman-media-siber',
      content:
        '<p>Nomina tunduk pada Pedoman Pemberitaan Media Siber dan Kode Etik Jurnalistik.</p>',
    },
    {
      title: 'Karier',
      slug: 'karier',
      content:
        '<p>Lowongan untuk reporter, editor, dan posisi teknis tersedia secara berkala.</p>',
    },
  ];

  for (const p of pageSeed) {
    const existing = await db.select().from(pages).where(eq(pages.slug, p.slug));
    if (existing.length === 0) {
      await db.insert(pages).values({ ...p, status: 'published', publishedAt: new Date() });
    }
  }
  console.log(`  + Halaman: ${pageSeed.length}`);

  /* ---------- post contoh ---------- */
  const existingPosts = await db.select({ id: posts.id }).from(posts);
  if (existingPosts.length === 0) {
    const postSeed = [
      {
        title: 'Pemerintah Luncurkan Program Ekonomi Digital Baru untuk UMKM',
        slug: 'pemerintah-luncurkan-program-ekonomi-digital-baru-untuk-umkm',
        excerpt:
          'Program baru difokuskan untuk memperluas akses digital pelaku usaha kecil dan menengah di seluruh Indonesia.',
        category: 'ekonomi',
        type: 'article' as const,
        tags: ['Analisis', 'Eksklusif'],
        featured: true,
        content: `<p>Pemerintah resmi meluncurkan program ekonomi digital baru yang dirancang untuk membantu pelaku usaha mikro, kecil, dan menengah (UMKM) beralih ke transaksi digital.</p>
<h2>Target Satu Juta UMKM</h2>
<p>Dalam paparannya, pemerintah menyatakan program ini menargetkan keterlibatan satu juta UMKM pada akhir tahun. Fokus program mencakup pelatihan, pendampingan, dan akses pembiayaan.</p>
<blockquote>Pendampingan adalah kunci. Pelaku usaha tidak cukup sekadar diberi perangkat, tetapi harus ada yang mendampingi.</blockquote>
<h3>Skema Pendanaan</h3>
<p>Skema pembiayaan akan difasilitasi melalui perbankan dan lembaga keuangan mikro. Ruang lingkup program mencakup subsidi bunga serta pelatihan bersertifikat.</p>
<ul><li>Pelatihan digital gratis</li><li>Subsidi bunga prioritas</li><li>Akses marketplace</li></ul>
<p>Implementasi secara bertahap dimulai di sepuluh provinsi dengan tingkat digitalisasi tertinggi.</p>`,
      },
      {
        title: 'Inovasi AI Lokal Mulai Mengubah Peta Industri Teknologi',
        slug: 'inovasi-ai-lokal-mulai-mengubah-peta-industri-teknologi',
        excerpt:
          'Sejumlah startup AI Indonesia menunjukkan pencapaian menarik dalam tiga tahun terakhir, dari pemrosesan bahasa hingga diagnosis medis.',
        category: 'teknologi',
        type: 'article' as const,
        tags: ['Analisis', 'Eksklusif'],
        content: `<p>Industri kecerdasan buatan di Indonesia memasuki fase yang lebih matang. Model bahasa yang dilatih dengan korpus lokal kini mulai bersaing dengan standar global.</p>
<h2>Keunggulan Data Lokal</h2>
<p>Ketersediaan data berbahasa Indonesia yang melimpah menjadi modal utama. Banyak model sebelumnya kesulitan menangkap konteks dan budaya lokal.</p>
<p>Sejumlah perusahaan telah mengintegrasikan kecerdasan buatan ke alur kerja di sektor logistik, pertanian, dan layanan kesehatan.</p>`,
      },
      {
        title: 'Tim Volunter PSSI U-23 Tersingkir di Babak Awal Turnamen',
        slug: 'tim-volunter-pssi-u-23-tersingkir-di-babak-awal-turnamen',
        excerpt: 'Performa yang mengecewakkan pada laga pembuka menjadi sorotan utama.',
        category: 'olahraga',
        type: 'article' as const,
        tags: ['Analisis'],
        content: `<p>Timnas U-23 Indonesia harus menanggung defeat di laga pembuka turnamen setelah tertinggal dua gol pada akhir babak pertama.</p>
<p>Pelatih menyatakan evaluasi menyeluruh akan dilakukan terhadap seluruh pemain di skuad.</p>`,
      },
      {
        title: 'Wawancara: Peluang bagi UMKM Lokal di Tengah Persaingan Platform',
        slug: 'wawancara-peluang-bagi-umkm-lokal-di-tengah-persaingan-platform',
        excerpt: 'Kolaborasi platform dan merchant kecil membuka pasar baru bagi usaha rumahan.',
        category: 'nasional',
        type: 'video' as const,
        tags: ['Wawancara', 'Video'],
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        content: `<p>Dalam wawancara eksklusif ini, pemilik usaha makanan rumahan menjelaskan bagaimana aplikasi pengiriman yang mendominasi pasar justru membuka peluang baru bagi pelaku usaha kecil.</p>
<p>Dulu Pesanan hanya dari lingkungan sekitar, kini pesanan datang dari tiga kota berbeda.</p>`,
      },
      {
        title: 'Menjaga Warisan Kuliner Nusantara di Era Digital',
        slug: 'menjaga-warisan-kuliner-nusantara-di-era-digital',
        excerpt: 'Generasi muda mengemas ulang makanan tradisional agar relevan dengan pasar modern.',
        category: 'gaya-hidup',
        type: 'article' as const,
        tags: ['Infografis'],
        content: `<p>Kolaborasi antara koki muda dan pendekar warisan sedangOutro-Presenten bringing Annotated cuisine ke dalam sorotan.</p>
<p>Sejumlah usaha baru yang memadukan bumbu tradisional dengan konsep modern berhasil menarik pelanggan usia muda.</p>`,
      },
      {
        title: 'ASEAN Perkuat Koordinasi Ekonomi Regional',
        slug: 'asean-perkuat-koordinasi-ekonomi-regional',
        excerpt:
          'Negara anggota ASEAN_launch_negosiasi mendalam untuk mempercepat integrasi perdagangan antar anggota.',
        category: 'internasional',
        type: 'article' as const,
        tags: ['Analisis'],
        content: `<p>Negara-negara anggota ASEAN mengumumkan_negosiasi mendalam untuk mempercepat integrasi perdagangan antar anggota.</p>
<p>Negosiasi akan berlanjut sepanjang tahun dengan fokus pada logistik dan layanan digital.</p>`,
      },
    ];

    for (const [index, p] of postSeed.entries()) {
      const publishedAt = new Date(Date.now() - index * 3600_000 * 9);
      const inserted = await db
        .insert(posts)
        .values({
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          content: p.content,
          format: 'html',
          type: p.type,
          status: 'published',
          categoryId: categoryIds[p.category],
          authorId: index % 2 === 0 ? adminId : authorId,
          isFeatured: p.featured ?? false,
          videoUrl: (p as any).videoUrl ?? null,
          views: 120 + index * 87,
          publishedAt,
          createdAt: publishedAt,
        })
        .returning({ id: posts.id });

      for (const tagName of p.tags) {
        const slug = tagName.toLowerCase();
        if (tagIds[slug]) {
          await db.insert(postTags).values({ postId: inserted[0].id, tagId: tagIds[slug] });
        }
      }
    }
    console.log(`  + Post contoh: ${postSeed.length}`);
  } else {
    console.log(`  - Post sudah ada (${existingPosts.length})`);
  }

  /* ---------- pengaturan ---------- */
  const settingSeed: Record<string, string> = {
    siteName: 'Nomina',
    siteTagline: 'Informasi Tepat, Dipercaya',
    siteDescription:
      'Portal berita dan media online Indonesia - berita terkini, multimedia, dan analisis mendalam.',
    siteEmail: 'redaksi@nomina.id',
    sitePhone: '+62 812-0000-0000',
    siteAddress: 'Jl. Merdeka No. 1, Jakarta',
    footerText: '(c) {year} Nomina. Seluruh hak cipta dilindungi.',
    permalinkStructure: '/{category}/{slug}',
    permalinkCategoryBase: 'kategori',
    permalinkTagBase: 'tag',
    permalinkPageBase: 'halaman',
    permalinkAuthorBase: 'penulis',
    postsPerPage: '10',
    commentEnabled: 'true',
    commentRequireModeration: 'true',
  };

  for (const [key, value] of Object.entries(settingSeed)) {
    const existing = await db.select().from(settings).where(eq(settings.key, key));
    if (existing.length === 0) {
      await db.insert(settings).values({ key, value, group: 'umum' });
    }
  }
  console.log(`  + Pengaturan: ${Object.keys(settingSeed).length}`);

  console.log('\n+ Seeding selesai. Silakan masuk ke /admin');
  process.exit(0);
}

main().catch((err) => {
  console.error('x Seeding gagal:', err);
  process.exit(1);
});
