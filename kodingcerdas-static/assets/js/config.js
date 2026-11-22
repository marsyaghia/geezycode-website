/*
|--------------------------------------------------------------------------
| Konfigurasi Website
|--------------------------------------------------------------------------
|
| 1. supabaseUrl & supabaseKey
|    Ambil dari Supabase: Project Settings → API (atau menu "Connect").
|    - supabaseUrl  : Project URL, contoh https://abcdxyz.supabase.co
|    - supabaseKey  : kunci "anon public" ATAU "publishable" (sb_publishable_...)
|    JANGAN pernah isi dengan "service_role" / "secret" key.
|
|    Kalau dua kolom ini dikosongkan, website tetap jalan memakai data
|    cadangan di assets/js/data.js.
|
| 2. brandName & whatsappNumber
|    Dipakai kalau tabel site_settings di Supabase belum diisi / gagal dimuat.
|    Kalau Supabase aktif, nilai dari tabel site_settings yang dipakai.
|
| 3. saveBriefs
|    true  = setiap klik "Kirim Brief ke WhatsApp" juga dicatat ke tabel
|            order_briefs di Supabase (bisa dicek di Table Editor).
|    false = tidak dicatat.
|
*/

window.SITE_CONFIG = {
    supabaseUrl: '',
    supabaseKey: '',

    brandName: 'GeezyCode',
    whatsappNumber: '6285607177540',

    saveBriefs: true,
};
