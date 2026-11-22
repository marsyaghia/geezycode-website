# KodingCerdas Studio — Website Statis (HTML, CSS, JS + Supabase)

Website portofolio, pricelist, dan order WhatsApp. Tanpa framework dan tanpa proses build, jadi bisa langsung di-online-kan di GitHub Pages.

## Struktur file

```
index.html              → halaman utama
assets/css/style.css    → semua tampilan
assets/js/config.js     → ISI DI SINI: URL & key Supabase, nomor WA cadangan
assets/js/data.js       → data cadangan (dipakai kalau Supabase belum diisi/gagal)
assets/js/app.js        → logika website (tidak perlu diedit)
supabase/schema.sql     → perintah SQL untuk membuat tabel + isi data awal
```

## 1. Coba di laptop

Klik dua kali `index.html`, website akan terbuka di browser. Tanpa Supabase pun website sudah jalan memakai data cadangan dari `data.js`.

## 2. Siapkan database Supabase

1. Buka supabase.com, buat project baru (catat password database-nya).
2. Di project, buka menu **SQL Editor** → **New query**.
3. Buka file `supabase/schema.sql`, copy **seluruh** isinya, paste di SQL Editor, lalu klik **Run**.
4. Cek menu **Table Editor**: seharusnya ada tabel `services`, `portfolio_projects`, `faqs`, `order_briefs`, dan lainnya.
5. Ganti nomor WhatsApp dan nama brand. Di SQL Editor, jalankan (ganti angkanya dengan nomormu, format 628xxx):

   ```sql
   update public.site_settings
   set whatsapp_number = '6281xxxxxxxxx', brand_name = 'KodingCerdas Studio', updated_at = now()
   where id = 1;
   ```

## 3. Sambungkan website ke Supabase

1. Di Supabase, buka **Project Settings** → **API Keys** (atau klik tombol **Connect** di atas dashboard).
2. Salin **Project URL** dan key **anon public** atau **publishable** (`sb_publishable_...`).
3. Buka `assets/js/config.js`, isi:

   ```js
   supabaseUrl: 'https://abcdxyz.supabase.co',
   supabaseKey: 'isi-key-anon-atau-publishable-di-sini',
   ```

4. Simpan, lalu refresh `index.html`.

Key ini memang aman ditaruh di website. Tabel sudah dikunci dengan Row Level Security: pengunjung hanya bisa **membaca** konten dan **mengirim** brief baru, tidak bisa mengubah atau melihat data lain. **Jangan pernah** memakai key `service_role` atau `secret`.

Cara memastikan sudah tersambung: tekan `F12` → tab **Console**. Harus muncul tulisan `[Data] Sumber data: supabase`. Kalau tertulis `fallback`, baca pesan di atasnya untuk tahu penyebabnya.

## 4. Online-kan di GitHub Pages

1. Buat repo baru di GitHub, set **Public**.
2. Upload semua file ini ke repo, dengan `index.html` berada di **halaman utama repo** (bukan di dalam subfolder).
3. Di repo, buka **Settings** → **Pages**.
4. **Source**: Deploy from a branch → Branch **main**, folder **/ (root)** → **Save**.
5. Tunggu 1–2 menit. Alamatnya muncul di halaman yang sama: `https://username.github.io/nama-repo/`.

Setiap kali kamu push perubahan file ke GitHub, website otomatis ter-update dalam 1–2 menit.

## 5. Mengubah konten sehari-hari

Setelah Supabase tersambung, **tidak perlu** edit file atau push ke GitHub lagi untuk mengganti konten. Cukup edit di Supabase → **Table Editor**, lalu refresh website.

| Mau mengubah | Tabel | Kolom |
|---|---|---|
| Harga / nama layanan | `services` | `price`, `name`, `description` |
| Sembunyikan layanan | `services` | `is_active` = false |
| Slot penuh / buka lagi | `site_settings` | `is_open` |
| Nomor WA / nama brand | `site_settings` | `whatsapp_number`, `brand_name` |
| Proyek portofolio | `portfolio_projects` | semua kolom; `is_published` = false untuk menyembunyikan |
| FAQ | `faqs` | `question`, `answer` |
| Biaya Express | `urgency_options` | `surcharge` (0.35 = 35%) |

Kolom daftar seperti `includes`, `stack`, `features`, dan `deliverables` ditulis dalam format: `["Item satu", "Item dua"]`.

**Penting:** studi kasus portofolio di data awal hanyalah **contoh**. Ganti dengan proyek yang benar-benar pernah kamu kerjakan, atau sembunyikan (`is_published` = false), sebelum website dibagikan.

## 6. Melihat brief yang masuk

Setiap pengunjung menekan **Kirim Brief ke WhatsApp**, brief-nya juga tercatat di tabel `order_briefs`. Pesan WhatsApp-nya memuat **kode brief** (contoh `BR-7K3QX`) yang sama dengan kolom `ref_code`, jadi kamu bisa mencocokkan chat dengan datanya. Ubah kolom `status` (`baru`, `diproses`, `selesai`, `batal`) untuk tracking.

Kalau tidak ingin brief dicatat, ubah `saveBriefs: false` di `config.js`.

## Catatan

- Menjalankan ulang `schema.sql` akan **mengembalikan konten ke data awal**, tapi data di `order_briefs` tetap aman.
- Kalau Supabase sedang lambat atau error, website otomatis memakai `data.js`, jadi tidak pernah tampil kosong.
