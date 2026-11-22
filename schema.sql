-- ==========================================================================
-- GeezyCode — Skema Database Supabase
-- ==========================================================================
--
-- CARA PAKAI
-- 1. Buka project Supabase kamu → menu "SQL Editor" → "New query".
-- 2. Copy SELURUH isi file ini, paste, lalu klik "Run".
-- 3. Selesai. Cek hasilnya di menu "Table Editor".
--
-- CATATAN
-- - File ini aman dijalankan ulang. Tabel KONTEN (layanan, portofolio, FAQ,
--   dll.) akan dihapus lalu diisi ulang dengan data awal di bawah.
--   Jadi kalau kamu sudah mengedit konten lewat Table Editor, menjalankan
--   ulang file ini akan MENGEMBALIKAN konten ke data awal.
-- - Tabel order_briefs (brief yang masuk dari pengunjung) TIDAK pernah
--   dihapus oleh file ini, datanya tetap aman.
-- - Keamanan: pengunjung website hanya bisa MEMBACA konten yang aktif dan
--   MENGIRIM brief baru. Mereka tidak bisa melihat, mengubah, atau menghapus
--   brief milik orang lain.
--
-- ==========================================================================

begin;

-- --------------------------------------------------------------------------
-- 1. Hapus tabel konten lama (kalau ada)
-- --------------------------------------------------------------------------
drop table if exists public.services cascade;
drop table if exists public.categories cascade;
drop table if exists public.urgency_options cascade;
drop table if exists public.addons cascade;
drop table if exists public.portfolio_projects cascade;
drop table if exists public.order_steps cascade;
drop table if exists public.rules cascade;
drop table if exists public.faqs cascade;
drop table if exists public.site_settings cascade;

-- --------------------------------------------------------------------------
-- 2. Tabel konten
-- --------------------------------------------------------------------------

-- Pengaturan umum (hanya 1 baris)
create table public.site_settings (
    id smallint primary key default 1 check (id = 1),
    brand_name text not null check (char_length(brand_name) between 1 and 60),
    whatsapp_number text not null check (whatsapp_number ~ '^[0-9]{9,15}$'),
    is_open boolean not null default true,
    updated_at timestamptz not null default now()
);
comment on table public.site_settings is 'Nama brand, nomor WhatsApp (format 628xxx), dan status slot (is_open). Hanya 1 baris.';

-- Kategori layanan (tampil sebagai tab)
create table public.categories (
    id text primary key,
    sort_order smallint not null default 0,
    index_label text not null default '',
    label text not null,
    description text not null default ''
);
comment on table public.categories is 'Tab pricelist. id dipakai sebagai category_id di tabel services.';

-- Layanan & harga
create table public.services (
    id text primary key,
    category_id text not null references public.categories (id) on update cascade on delete cascade,
    sort_order smallint not null default 0,
    name text not null,
    description text not null default '',
    price integer not null check (price >= 0),
    duration text not null default '',
    is_popular boolean not null default false,
    includes text[] not null default '{}',
    is_active boolean not null default true
);
comment on table public.services is 'Daftar layanan. price dalam Rupiah tanpa titik (contoh 250000). is_active = false untuk menyembunyikan.';
create index services_category_idx on public.services (category_id, sort_order);

-- Opsi deadline
create table public.urgency_options (
    id text primary key,
    sort_order smallint not null default 0,
    label text not null,
    hint text not null default '',
    time_window text not null default '',
    surcharge numeric(4, 2) not null default 0 check (surcharge >= 0 and surcharge <= 2)
);
comment on table public.urgency_options is 'Opsi deadline. surcharge = persentase tambahan (0.35 = 35%).';

-- Add-on
create table public.addons (
    id text primary key,
    sort_order smallint not null default 0,
    name text not null,
    short_name text not null default '',
    description text not null default '',
    price integer not null check (price >= 0),
    is_active boolean not null default true
);

-- Portofolio
create table public.portfolio_projects (
    id text primary key,
    sort_order smallint not null default 0,
    category text not null check (category in ('ai', 'web')),
    preview text not null default 'dashboard' check (preview in ('dashboard', 'matrix', 'lms', 'terminal')),
    title text not null,
    context text not null default '',
    duration text not null default '',
    problem text not null default '',
    solution text not null default '',
    stack text[] not null default '{}',
    features text[] not null default '{}',
    deliverables text[] not null default '{}',
    is_published boolean not null default true
);
comment on table public.portfolio_projects is 'Studi kasus. category: ai / web. preview: dashboard / matrix / lms / terminal.';

-- Cara order
create table public.order_steps (
    id smallint primary key,
    number_label text not null,
    title text not null,
    description text not null default '',
    meta text not null default ''
);

-- Aturan / S&K
create table public.rules (
    id smallint primary key,
    label text not null,
    title text not null,
    description text not null default ''
);

-- FAQ
create table public.faqs (
    id smallint primary key,
    question text not null,
    answer text not null,
    is_published boolean not null default true
);

-- --------------------------------------------------------------------------
-- 3. Tabel brief masuk (TIDAK dihapus saat file dijalankan ulang)
-- --------------------------------------------------------------------------
create table if not exists public.order_briefs (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    ref_code text not null check (char_length(ref_code) between 4 and 20),
    service_id text check (char_length(service_id) <= 60),
    service_name text not null check (char_length(service_name) between 1 and 200),
    category_label text check (char_length(category_label) <= 100),
    urgency_label text not null check (char_length(urgency_label) between 1 and 60),
    addons text[] not null default '{}' check (cardinality(addons) <= 10),
    tech_stack text check (char_length(tech_stack) <= 120),
    notes text check (char_length(notes) <= 400),
    estimated_total integer check (estimated_total between 0 and 100000000),
    status text not null default 'baru' check (status in ('baru', 'diproses', 'selesai', 'batal'))
);
comment on table public.order_briefs is 'Brief yang dikirim pengunjung. Cocokkan ref_code dengan kode di pesan WhatsApp. Ubah status untuk tracking.';
create index if not exists order_briefs_created_idx on public.order_briefs (created_at desc);

-- --------------------------------------------------------------------------
-- 4. Hak akses (pengunjung = role anon)
-- --------------------------------------------------------------------------
revoke all on table
    public.site_settings,
    public.categories,
    public.services,
    public.urgency_options,
    public.addons,
    public.portfolio_projects,
    public.order_steps,
    public.rules,
    public.faqs,
    public.order_briefs
from anon, authenticated;

grant select on table
    public.site_settings,
    public.categories,
    public.services,
    public.urgency_options,
    public.addons,
    public.portfolio_projects,
    public.order_steps,
    public.rules,
    public.faqs
to anon, authenticated;

grant insert on table public.order_briefs to anon, authenticated;

-- --------------------------------------------------------------------------
-- 5. Row Level Security
-- --------------------------------------------------------------------------
alter table public.site_settings enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.urgency_options enable row level security;
alter table public.addons enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.order_steps enable row level security;
alter table public.rules enable row level security;
alter table public.faqs enable row level security;
alter table public.order_briefs enable row level security;

create policy "Publik membaca pengaturan" on public.site_settings
    for select to anon, authenticated using (true);

create policy "Publik membaca kategori" on public.categories
    for select to anon, authenticated using (true);

create policy "Publik membaca layanan aktif" on public.services
    for select to anon, authenticated using (is_active);

create policy "Publik membaca opsi deadline" on public.urgency_options
    for select to anon, authenticated using (true);

create policy "Publik membaca add-on aktif" on public.addons
    for select to anon, authenticated using (is_active);

create policy "Publik membaca portofolio terbit" on public.portfolio_projects
    for select to anon, authenticated using (is_published);

create policy "Publik membaca cara order" on public.order_steps
    for select to anon, authenticated using (true);

create policy "Publik membaca aturan" on public.rules
    for select to anon, authenticated using (true);

create policy "Publik membaca FAQ terbit" on public.faqs
    for select to anon, authenticated using (is_published);

drop policy if exists "Publik mengirim brief baru" on public.order_briefs;
create policy "Publik mengirim brief baru" on public.order_briefs
    for insert to anon, authenticated with check (status = 'baru');

-- --------------------------------------------------------------------------
-- 6. Data awal
-- --------------------------------------------------------------------------
-- Pengaturan website
insert into public.site_settings (id, brand_name, whatsapp_number, is_open) values
    (1, 'GeezyCode', '6285607177540', true);

-- Kategori layanan (tab)
insert into public.categories (id, sort_order, index_label, label, description) values
    ('ai', 1, '01', 'AI & Sistem Cerdas', 'Dari olah dataset sampai sistem cerdas yang siap didemokan.'),
    ('web', 2, '02', 'Web, Dashboard & LMS', 'Website yang rapi di HP, jalan tanpa error, dan mudah dikembangkan.'),
    ('basic', 3, '03', 'Tugas Dasar, Laporan & PPT', 'Tugas mingguan yang dikerjakan rapi, tepat format, dan tepat waktu.');

-- Layanan & harga
insert into public.services (id, category_id, sort_order, name, description, price, duration, is_popular, includes) values
(
    'ai-eda',
    'ai',
    1,
    'Cleaning Dataset & EDA',
    'Rapikan dataset mentah lalu gali insight lewat visualisasi yang mudah dijelaskan.',
    100000,
    '1–3 hari',
    false,
    array[
        'Handling missing value, duplikat & outlier',
        'Visualisasi distribusi dan korelasi',
        'Notebook .ipynb rapi dengan komentar'
    ]
),
(
    'ai-ml',
    'ai',
    2,
    'Model Machine Learning Klasifikasi / Prediksi',
    'Bangun model dari preprocessing sampai evaluasi, lengkap dengan perbandingan algoritma.',
    250000,
    '3–5 hari',
    true,
    array[
        'Preprocessing & feature engineering',
        'Perbandingan 2–3 algoritma + tuning',
        'Evaluasi: akurasi, F1-score, confusion matrix'
    ]
),
(
    'ai-spk',
    'ai',
    3,
    'Sistem Pakar / SPK atau Deep Learning + UI Web',
    'Metode Fuzzy, AHP, SAW, TOPSIS, atau model Deep Learning yang dibungkus antarmuka web.',
    500000,
    '5–10 hari',
    false,
    array[
        'Perhitungan metode ditampilkan step-by-step',
        'UI web input–hasil (Flask, Laravel, atau Streamlit)',
        'Siap didemokan saat presentasi atau sidang'
    ]
),
(
    'web-landing',
    'web',
    1,
    'Landing Page Statis',
    'Halaman profil atau promosi yang bersih, cepat, dan responsif di semua ukuran layar.',
    150000,
    '1–3 hari',
    false,
    array[
        'Responsif untuk mobile dan desktop',
        'HTML/CSS/JS atau Tailwind CSS',
        '1–5 section sesuai brief'
    ]
),
(
    'web-crud',
    'web',
    2,
    'Web Dinamis CRUD & Database',
    'Aplikasi web dengan login, pengelolaan data, dan relasi database yang tertata.',
    350000,
    '4–7 hari',
    true,
    array[
        'Login & manajemen pengguna',
        'CRUD lengkap dengan relasi database',
        'Laravel, PHP Native, atau CodeIgniter'
    ]
),
(
    'web-lms',
    'web',
    3,
    'Custom LMS / Dashboard Kompleks & Deployment',
    'Sistem multi-role dengan grafik, laporan, dan deploy online sampai bisa diakses publik.',
    750000,
    '7–14 hari',
    false,
    array[
        'Multi-role dan fitur sesuai brief',
        'Grafik, laporan & export data',
        'Deploy ke hosting/VPS beserta domain'
    ]
),
(
    'basic-ppt',
    'basic',
    1,
    'PPT Presentasi IT (10–15 Slide)',
    'Slide presentasi yang bersih, konsisten, dan enak dijelaskan di depan kelas.',
    30000,
    '1 hari',
    false,
    array[
        'Desain bersih dan konsisten',
        'Diagram atau alur sederhana',
        'Catatan pembicara singkat'
    ]
),
(
    'basic-report',
    'basic',
    2,
    'Laporan Praktikum / Resume Jurnal IT',
    'Laporan terstruktur sesuai format kampus, lengkap dengan penjelasan setiap langkah.',
    40000,
    '1–2 hari',
    false,
    array[
        'Format sesuai template kampus',
        'Screenshot dan penjelasan langkah',
        'Sitasi dan daftar pustaka rapi'
    ]
),
(
    'basic-code',
    'basic',
    3,
    'Tugas Koding Dasar (CLI / Algoritma / SQL)',
    'Program dan query yang jalan, berkomentar, dan mudah kamu pahami logikanya.',
    50000,
    '1–2 hari',
    true,
    array[
        'Python, C/C++, Java, atau SQL',
        'Kode berkomentar per bagian',
        'Contoh input–output yang sudah diuji'
    ]
);

-- Opsi deadline
insert into public.urgency_options (id, sort_order, label, hint, time_window, surcharge) values
    ('normal', 1, 'Normal', 'Sesuai estimasi', 'Sesuai estimasi pengerjaan', 0),
    ('express', 2, 'Express', '< 24–72 jam (+35%)', '< 24–72 jam', 0.35);

-- Add-on
insert into public.addons (id, sort_order, name, short_name, description, price) values
    ('video-demo', 1, 'Video Demo & Penjelasan Alur Kode', 'Video Demo & Penjelasan', 'Rekaman layar yang menjelaskan cara menjalankan program dan alur kodenya.', 35000);

-- Portofolio
insert into public.portfolio_projects (id, sort_order, category, preview, title, context, duration, problem, solution, stack, features, deliverables) values
(
    'executive-dashboard',
    1,
    'web',
    'dashboard',
    'Executive Analytics Dashboard',
    'Tugas Akhir · Sistem Informasi',
    '9 hari',
    'Data penjualan tersebar di belasan file Excel sehingga laporan mingguan harus direkap manual berjam-jam.',
    'Dibangun dashboard web dengan import Excel otomatis, ringkasan KPI, grafik tren, dan export laporan PDF sekali klik.',
    array[
        'Laravel 11',
        'MySQL',
        'Chart.js',
        'Tailwind CSS'
    ],
    array[
        'Import data penjualan dari file Excel (.xlsx)',
        'Kartu KPI: omzet, jumlah transaksi, pertumbuhan',
        'Grafik tren harian, mingguan, dan bulanan',
        'Filter periode dan kategori produk',
        'Export laporan ke PDF'
    ],
    array[
        'Source code lengkap + database (.sql)',
        'Data dummy untuk demo',
        'Panduan instalasi langkah demi langkah',
        'Video demo penggunaan dashboard'
    ]
),
(
    'spk-topsis',
    2,
    'ai',
    'matrix',
    'Sistem Pendukung Keputusan TOPSIS',
    'Skripsi · Teknik Informatika',
    '7 hari',
    'Seleksi penerima beasiswa internal masih mengandalkan penilaian manual sehingga hasilnya sulit dipertanggungjawabkan.',
    'Dibuat sistem pendukung keputusan berbasis TOPSIS yang menampilkan setiap tahap perhitungan hingga ranking akhir secara transparan.',
    array[
        'PHP 8',
        'Laravel',
        'MySQL',
        'Alpine.js'
    ],
    array[
        'Manajemen kriteria, bobot, dan sifat (benefit/cost)',
        'Input matriks keputusan per alternatif',
        'Normalisasi, matriks terbobot, solusi ideal positif & negatif',
        'Ranking otomatis berdasarkan nilai preferensi',
        'Export detail perhitungan ke PDF'
    ],
    array[
        'Source code lengkap + database (.sql)',
        'File Excel validasi perhitungan manual',
        'Panduan instalasi',
        'Video penjelasan alur kode'
    ]
),
(
    'lms-sederhana',
    3,
    'web',
    'lms',
    'Platform LMS Sederhana',
    'Proyek Mata Kuliah · Pemrograman Web',
    '12 hari',
    'Materi, tugas, dan nilai kelas masih dibagikan lewat grup chat dan tautan terpisah sehingga mudah tercecer.',
    'Dikembangkan LMS ringan dengan tiga role pengguna, kuis otomatis, pengumpulan tugas, dan rekap nilai dalam satu platform.',
    array[
        'Laravel',
        'MySQL',
        'Tailwind CSS',
        'Alpine.js'
    ],
    array[
        'Role admin, dosen, dan mahasiswa',
        'Modul materi (PDF, video, tautan) per pertemuan',
        'Kuis pilihan ganda dengan penilaian otomatis',
        'Pengumpulan tugas dengan batas waktu',
        'Rekap nilai dan progres belajar per mahasiswa'
    ],
    array[
        'Source code lengkap + seeder data dummy',
        'Deploy ke hosting beserta domain',
        'Dokumen ERD dan use case diagram',
        'Panduan penggunaan untuk setiap role'
    ]
),
(
    'sentimen-nlp',
    4,
    'ai',
    'terminal',
    'Analisis Sentimen NLP Bahasa Indonesia',
    'Skripsi · Ilmu Komputer',
    '10 hari',
    'Ribuan ulasan aplikasi berbahasa Indonesia penuh slang dan singkatan sehingga sulit dianalisis secara manual.',
    'Disusun pipeline NLP dari normalisasi slang hingga klasifikasi sentimen, lalu beberapa model dibandingkan dan disajikan lewat antarmuka web.',
    array[
        'Python',
        'Scikit-learn',
        'Sastrawi',
        'Pandas',
        'Flask'
    ],
    array[
        'Pengumpulan dan pelabelan dataset ulasan',
        'Preprocessing: case folding, normalisasi slang, stopword, stemming',
        'Ekstraksi fitur dengan TF-IDF',
        'Perbandingan Naive Bayes dan SVM + confusion matrix',
        'Halaman web untuk menguji kalimat baru'
    ],
    array[
        'Notebook .ipynb lengkap dengan komentar',
        'Source code aplikasi Flask',
        'Dataset bersih (.csv) dan kamus slang',
        'Ringkasan hasil evaluasi model'
    ]
);

-- Cara order
insert into public.order_steps (id, number_label, title, description, meta) values
    (1, '01', 'Kirim Detail Tugas / Brief via WhatsApp', 'Kirim soal, template, dan deadline. Bisa langsung lewat form estimasi supaya brief-nya rapi dan lengkap.', 'Gratis'),
    (2, '02', 'Diskusi Teknis, Deal Harga & DP Minimal 50%', 'Kebutuhan teknis dicek dulu, lalu kamu dapat harga final. Pengerjaan dimulai setelah DP minimal 50% masuk.', 'DP ≥ 50%'),
    (3, '03', 'Pengerjaan & Update Progress', 'Progres dikirim berkala lewat video demo atau link preview, jadi kamu bisa memantau tanpa harus menunggu selesai.', 'Video Demo / Link Preview'),
    (4, '04', 'Pelunasan & Serah Terima', 'Setelah pelunasan, source code dan file final dikirim lengkap beserta panduan cara menjalankannya.', 'Source Code / File Final');

-- Aturan / S&K
insert into public.rules (id, label, title, description) values
    (1, 'DP 50%', 'Pembayaran bertahap', 'Pengerjaan dimulai setelah DP minimal 50%. Source code dan file final dikirim setelah pelunasan.'),
    (2, 'REVISI 2x', 'Revisi minor gratis', 'Perbaikan kecil sesuai brief awal gratis 2x. Fitur baru di luar brief dihitung terpisah.'),
    (3, '+35%', 'Biaya Express', 'Berlaku untuk deadline < 24–72 jam, dihitung dari harga layanan dan menyesuaikan ketersediaan slot.'),
    (4, 'PRIVAT', 'Kerahasiaan klien', 'Identitas, kampus, dan file kamu tidak dibagikan ke pihak lain dan tidak dipakai ulang untuk klien lain.');

-- FAQ
insert into public.faqs (id, question, answer) values
    (1, 'Apakah wajib bayar DP di awal?', 'Ya. Pengerjaan dimulai setelah DP minimal 50% dari harga yang disepakati. Selama pengerjaan kamu tetap bisa memantau progres lewat video demo atau link preview, lalu source code dan file final dikirim setelah pelunasan.'),
    (2, 'Revisinya gratis berapa kali?', 'Kamu mendapat 2x revisi minor gratis, misalnya perbaikan teks, tampilan, atau penyesuaian kecil pada logika yang masih sesuai brief awal. Penambahan fitur baru atau perubahan besar di luar brief akan dihitung sebagai pekerjaan tambahan dengan harga yang dibicarakan dulu.'),
    (3, 'Bagaimana aturan biaya Express?', 'Deadline kurang dari 24–72 jam masuk kategori Express dengan tambahan 35% dari harga layanan. Express menyesuaikan ketersediaan slot, jadi kalau slot sedang penuh akan diinfokan sejak awal sebelum kamu membayar apa pun.'),
    (4, 'Apakah identitas dan file saya aman?', 'Aman. Nama, kampus, soal, dan seluruh file kamu tidak dibagikan ke pihak lain dan tidak dipakai ulang untuk klien lain. Proyek hanya ditampilkan di portofolio dalam bentuk anonim dan atas izin klien.'),
    (5, 'Kenapa harga ditulis "mulai dari"?', 'Harga final bergantung pada kompleksitas, jumlah fitur, dan deadline. Angka di pricelist adalah titik awal yang jujur, dan harga pasti selalu disepakati di tahap diskusi sebelum ada pembayaran.'),
    (6, 'Apakah saya akan dijelaskan cara kerja kodenya?', 'Setiap proyek koding disertai panduan singkat cara menjalankan program. Kalau kamu perlu memahami alur kode secara detail, misalnya untuk presentasi atau sidang, ambil add-on Video Demo & Penjelasan Alur Kode.'),
    (7, 'Bagaimana kalau ada error setelah serah terima?', 'Error yang berasal dari pengerjaan kami diperbaiki gratis dan tidak memotong jatah revisi, selama kode belum diubah dari sisi kamu dan dijalankan sesuai panduan.'),
    (8, 'Metode pembayarannya apa saja?', 'Pembayaran bisa melalui transfer bank atau e-wallet. Detail rekening dan bukti transaksi dikirim lewat WhatsApp setelah harga disepakati.');

commit;

-- ==========================================================================
-- CONTOH PERINTAH BERGUNA (jalankan terpisah kalau perlu, satu per satu)
-- ==========================================================================
--
-- Ganti nomor WhatsApp & nama brand:
--   update public.site_settings set whatsapp_number = '6281xxxxxxxxx', brand_name = 'Nama Brand Kamu', updated_at = now() where id = 1;
--
-- Slot penuh (badge "Open Slot" berubah jadi "Slot Penuh"):
--   update public.site_settings set is_open = false, updated_at = now() where id = 1;
--
-- Buka slot lagi:
--   update public.site_settings set is_open = true, updated_at = now() where id = 1;
--
-- Ubah harga satu layanan:
--   update public.services set price = 275000 where id = 'ai-ml';
--
-- Sembunyikan satu proyek portofolio:
--   update public.portfolio_projects set is_published = false where id = 'sentimen-nlp';
--
-- Lihat 20 brief terbaru:
--   select created_at, ref_code, service_name, urgency_label, estimated_total, status
--   from public.order_briefs order by created_at desc limit 20;
--
-- Tandai brief sedang diproses:
--   update public.order_briefs set status = 'diproses' where ref_code = 'BR-XXXXX';
-- ==========================================================================
