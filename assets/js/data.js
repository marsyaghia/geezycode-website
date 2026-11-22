/*
|--------------------------------------------------------------------------
| Data Cadangan
|--------------------------------------------------------------------------
|
| Dipakai saat Supabase belum diisi di config.js atau sedang gagal dimuat.
| Isinya sama persis dengan data awal di supabase/schema.sql.
| Kalau kamu sudah rutin mengedit data di Supabase, file ini cukup jadi
| cadangan dan tidak wajib ikut diperbarui.
|
*/

window.FALLBACK_DATA = {
    "settings": {
        "brand_name": "GeezyCode",
        "whatsapp_number": "6281234567890",
        "is_open": true
    },
    "categories": [
        {
            "id": "ai",
            "sort_order": 1,
            "index_label": "01",
            "label": "AI & Sistem Cerdas",
            "description": "Dari olah dataset sampai sistem cerdas yang siap didemokan."
        },
        {
            "id": "web",
            "sort_order": 2,
            "index_label": "02",
            "label": "Web, Dashboard & LMS",
            "description": "Website yang rapi di HP, jalan tanpa error, dan mudah dikembangkan."
        },
        {
            "id": "basic",
            "sort_order": 3,
            "index_label": "03",
            "label": "Tugas Dasar, Laporan & PPT",
            "description": "Tugas mingguan yang dikerjakan rapi, tepat format, dan tepat waktu."
        }
    ],
    "services": [
        {
            "id": "ai-eda",
            "category_id": "ai",
            "sort_order": 1,
            "name": "Cleaning Dataset & EDA",
            "description": "Rapikan dataset mentah lalu gali insight lewat visualisasi yang mudah dijelaskan.",
            "price": 100000,
            "duration": "1–3 hari",
            "is_popular": false,
            "includes": [
                "Handling missing value, duplikat & outlier",
                "Visualisasi distribusi dan korelasi",
                "Notebook .ipynb rapi dengan komentar"
            ]
        },
        {
            "id": "ai-ml",
            "category_id": "ai",
            "sort_order": 2,
            "name": "Model Machine Learning Klasifikasi / Prediksi",
            "description": "Bangun model dari preprocessing sampai evaluasi, lengkap dengan perbandingan algoritma.",
            "price": 250000,
            "duration": "3–5 hari",
            "is_popular": true,
            "includes": [
                "Preprocessing & feature engineering",
                "Perbandingan 2–3 algoritma + tuning",
                "Evaluasi: akurasi, F1-score, confusion matrix"
            ]
        },
        {
            "id": "ai-spk",
            "category_id": "ai",
            "sort_order": 3,
            "name": "Sistem Pakar / SPK atau Deep Learning + UI Web",
            "description": "Metode Fuzzy, AHP, SAW, TOPSIS, atau model Deep Learning yang dibungkus antarmuka web.",
            "price": 500000,
            "duration": "5–10 hari",
            "is_popular": false,
            "includes": [
                "Perhitungan metode ditampilkan step-by-step",
                "UI web input–hasil (Flask, Laravel, atau Streamlit)",
                "Siap didemokan saat presentasi atau sidang"
            ]
        },
        {
            "id": "web-landing",
            "category_id": "web",
            "sort_order": 1,
            "name": "Landing Page Statis",
            "description": "Halaman profil atau promosi yang bersih, cepat, dan responsif di semua ukuran layar.",
            "price": 150000,
            "duration": "1–3 hari",
            "is_popular": false,
            "includes": [
                "Responsif untuk mobile dan desktop",
                "HTML/CSS/JS atau Tailwind CSS",
                "1–5 section sesuai brief"
            ]
        },
        {
            "id": "web-crud",
            "category_id": "web",
            "sort_order": 2,
            "name": "Web Dinamis CRUD & Database",
            "description": "Aplikasi web dengan login, pengelolaan data, dan relasi database yang tertata.",
            "price": 350000,
            "duration": "4–7 hari",
            "is_popular": true,
            "includes": [
                "Login & manajemen pengguna",
                "CRUD lengkap dengan relasi database",
                "Laravel, PHP Native, atau CodeIgniter"
            ]
        },
        {
            "id": "web-lms",
            "category_id": "web",
            "sort_order": 3,
            "name": "Custom LMS / Dashboard Kompleks & Deployment",
            "description": "Sistem multi-role dengan grafik, laporan, dan deploy online sampai bisa diakses publik.",
            "price": 750000,
            "duration": "7–14 hari",
            "is_popular": false,
            "includes": [
                "Multi-role dan fitur sesuai brief",
                "Grafik, laporan & export data",
                "Deploy ke hosting/VPS beserta domain"
            ]
        },
        {
            "id": "basic-ppt",
            "category_id": "basic",
            "sort_order": 1,
            "name": "PPT Presentasi IT (10–15 Slide)",
            "description": "Slide presentasi yang bersih, konsisten, dan enak dijelaskan di depan kelas.",
            "price": 30000,
            "duration": "1 hari",
            "is_popular": false,
            "includes": [
                "Desain bersih dan konsisten",
                "Diagram atau alur sederhana",
                "Catatan pembicara singkat"
            ]
        },
        {
            "id": "basic-report",
            "category_id": "basic",
            "sort_order": 2,
            "name": "Laporan Praktikum / Resume Jurnal IT",
            "description": "Laporan terstruktur sesuai format kampus, lengkap dengan penjelasan setiap langkah.",
            "price": 40000,
            "duration": "1–2 hari",
            "is_popular": false,
            "includes": [
                "Format sesuai template kampus",
                "Screenshot dan penjelasan langkah",
                "Sitasi dan daftar pustaka rapi"
            ]
        },
        {
            "id": "basic-code",
            "category_id": "basic",
            "sort_order": 3,
            "name": "Tugas Koding Dasar (CLI / Algoritma / SQL)",
            "description": "Program dan query yang jalan, berkomentar, dan mudah kamu pahami logikanya.",
            "price": 50000,
            "duration": "1–2 hari",
            "is_popular": true,
            "includes": [
                "Python, C/C++, Java, atau SQL",
                "Kode berkomentar per bagian",
                "Contoh input–output yang sudah diuji"
            ]
        }
    ],
    "urgency_options": [
        {
            "id": "normal",
            "sort_order": 1,
            "label": "Normal",
            "hint": "Sesuai estimasi",
            "time_window": "Sesuai estimasi pengerjaan",
            "surcharge": 0
        },
        {
            "id": "express",
            "sort_order": 2,
            "label": "Express",
            "hint": "< 24–72 jam (+35%)",
            "time_window": "< 24–72 jam",
            "surcharge": 0.35
        }
    ],
    "addons": [
        {
            "id": "video-demo",
            "sort_order": 1,
            "name": "Video Demo & Penjelasan Alur Kode",
            "short_name": "Video Demo & Penjelasan",
            "description": "Rekaman layar yang menjelaskan cara menjalankan program dan alur kodenya.",
            "price": 35000
        }
    ],
    "portfolio_projects": [
        {
            "id": "executive-dashboard",
            "sort_order": 1,
            "category": "web",
            "preview": "dashboard",
            "title": "Executive Analytics Dashboard",
            "context": "Tugas Akhir · Sistem Informasi",
            "duration": "9 hari",
            "problem": "Data penjualan tersebar di belasan file Excel sehingga laporan mingguan harus direkap manual berjam-jam.",
            "solution": "Dibangun dashboard web dengan import Excel otomatis, ringkasan KPI, grafik tren, dan export laporan PDF sekali klik.",
            "stack": [
                "Laravel 11",
                "MySQL",
                "Chart.js",
                "Tailwind CSS"
            ],
            "features": [
                "Import data penjualan dari file Excel (.xlsx)",
                "Kartu KPI: omzet, jumlah transaksi, pertumbuhan",
                "Grafik tren harian, mingguan, dan bulanan",
                "Filter periode dan kategori produk",
                "Export laporan ke PDF"
            ],
            "deliverables": [
                "Source code lengkap + database (.sql)",
                "Data dummy untuk demo",
                "Panduan instalasi langkah demi langkah",
                "Video demo penggunaan dashboard"
            ]
        },
        {
            "id": "spk-topsis",
            "sort_order": 2,
            "category": "ai",
            "preview": "matrix",
            "title": "Sistem Pendukung Keputusan TOPSIS",
            "context": "Skripsi · Teknik Informatika",
            "duration": "7 hari",
            "problem": "Seleksi penerima beasiswa internal masih mengandalkan penilaian manual sehingga hasilnya sulit dipertanggungjawabkan.",
            "solution": "Dibuat sistem pendukung keputusan berbasis TOPSIS yang menampilkan setiap tahap perhitungan hingga ranking akhir secara transparan.",
            "stack": [
                "PHP 8",
                "Laravel",
                "MySQL",
                "Alpine.js"
            ],
            "features": [
                "Manajemen kriteria, bobot, dan sifat (benefit/cost)",
                "Input matriks keputusan per alternatif",
                "Normalisasi, matriks terbobot, solusi ideal positif & negatif",
                "Ranking otomatis berdasarkan nilai preferensi",
                "Export detail perhitungan ke PDF"
            ],
            "deliverables": [
                "Source code lengkap + database (.sql)",
                "File Excel validasi perhitungan manual",
                "Panduan instalasi",
                "Video penjelasan alur kode"
            ]
        },
        {
            "id": "lms-sederhana",
            "sort_order": 3,
            "category": "web",
            "preview": "lms",
            "title": "Platform LMS Sederhana",
            "context": "Proyek Mata Kuliah · Pemrograman Web",
            "duration": "12 hari",
            "problem": "Materi, tugas, dan nilai kelas masih dibagikan lewat grup chat dan tautan terpisah sehingga mudah tercecer.",
            "solution": "Dikembangkan LMS ringan dengan tiga role pengguna, kuis otomatis, pengumpulan tugas, dan rekap nilai dalam satu platform.",
            "stack": [
                "Laravel",
                "MySQL",
                "Tailwind CSS",
                "Alpine.js"
            ],
            "features": [
                "Role admin, dosen, dan mahasiswa",
                "Modul materi (PDF, video, tautan) per pertemuan",
                "Kuis pilihan ganda dengan penilaian otomatis",
                "Pengumpulan tugas dengan batas waktu",
                "Rekap nilai dan progres belajar per mahasiswa"
            ],
            "deliverables": [
                "Source code lengkap + seeder data dummy",
                "Deploy ke hosting beserta domain",
                "Dokumen ERD dan use case diagram",
                "Panduan penggunaan untuk setiap role"
            ]
        },
        {
            "id": "sentimen-nlp",
            "sort_order": 4,
            "category": "ai",
            "preview": "terminal",
            "title": "Analisis Sentimen NLP Bahasa Indonesia",
            "context": "Skripsi · Ilmu Komputer",
            "duration": "10 hari",
            "problem": "Ribuan ulasan aplikasi berbahasa Indonesia penuh slang dan singkatan sehingga sulit dianalisis secara manual.",
            "solution": "Disusun pipeline NLP dari normalisasi slang hingga klasifikasi sentimen, lalu beberapa model dibandingkan dan disajikan lewat antarmuka web.",
            "stack": [
                "Python",
                "Scikit-learn",
                "Sastrawi",
                "Pandas",
                "Flask"
            ],
            "features": [
                "Pengumpulan dan pelabelan dataset ulasan",
                "Preprocessing: case folding, normalisasi slang, stopword, stemming",
                "Ekstraksi fitur dengan TF-IDF",
                "Perbandingan Naive Bayes dan SVM + confusion matrix",
                "Halaman web untuk menguji kalimat baru"
            ],
            "deliverables": [
                "Notebook .ipynb lengkap dengan komentar",
                "Source code aplikasi Flask",
                "Dataset bersih (.csv) dan kamus slang",
                "Ringkasan hasil evaluasi model"
            ]
        }
    ],
    "order_steps": [
        {
            "id": 1,
            "number_label": "01",
            "title": "Kirim Detail Tugas / Brief via WhatsApp",
            "description": "Kirim soal, template, dan deadline. Bisa langsung lewat form estimasi supaya brief-nya rapi dan lengkap.",
            "meta": "Gratis"
        },
        {
            "id": 2,
            "number_label": "02",
            "title": "Diskusi Teknis, Deal Harga & DP Minimal 50%",
            "description": "Kebutuhan teknis dicek dulu, lalu kamu dapat harga final. Pengerjaan dimulai setelah DP minimal 50% masuk.",
            "meta": "DP ≥ 50%"
        },
        {
            "id": 3,
            "number_label": "03",
            "title": "Pengerjaan & Update Progress",
            "description": "Progres dikirim berkala lewat video demo atau link preview, jadi kamu bisa memantau tanpa harus menunggu selesai.",
            "meta": "Video Demo / Link Preview"
        },
        {
            "id": 4,
            "number_label": "04",
            "title": "Pelunasan & Serah Terima",
            "description": "Setelah pelunasan, source code dan file final dikirim lengkap beserta panduan cara menjalankannya.",
            "meta": "Source Code / File Final"
        }
    ],
    "rules": [
        {
            "id": 1,
            "label": "DP 50%",
            "title": "Pembayaran bertahap",
            "description": "Pengerjaan dimulai setelah DP minimal 50%. Source code dan file final dikirim setelah pelunasan."
        },
        {
            "id": 2,
            "label": "REVISI 2x",
            "title": "Revisi minor gratis",
            "description": "Perbaikan kecil sesuai brief awal gratis 2x. Fitur baru di luar brief dihitung terpisah."
        },
        {
            "id": 3,
            "label": "+35%",
            "title": "Biaya Express",
            "description": "Berlaku untuk deadline < 24–72 jam, dihitung dari harga layanan dan menyesuaikan ketersediaan slot."
        },
        {
            "id": 4,
            "label": "PRIVAT",
            "title": "Kerahasiaan klien",
            "description": "Identitas, kampus, dan file kamu tidak dibagikan ke pihak lain dan tidak dipakai ulang untuk klien lain."
        }
    ],
    "faqs": [
        {
            "id": 1,
            "question": "Apakah wajib bayar DP di awal?",
            "answer": "Ya. Pengerjaan dimulai setelah DP minimal 50% dari harga yang disepakati. Selama pengerjaan kamu tetap bisa memantau progres lewat video demo atau link preview, lalu source code dan file final dikirim setelah pelunasan."
        },
        {
            "id": 2,
            "question": "Revisinya gratis berapa kali?",
            "answer": "Kamu mendapat 2x revisi minor gratis, misalnya perbaikan teks, tampilan, atau penyesuaian kecil pada logika yang masih sesuai brief awal. Penambahan fitur baru atau perubahan besar di luar brief akan dihitung sebagai pekerjaan tambahan dengan harga yang dibicarakan dulu."
        },
        {
            "id": 3,
            "question": "Bagaimana aturan biaya Express?",
            "answer": "Deadline kurang dari 24–72 jam masuk kategori Express dengan tambahan 35% dari harga layanan. Express menyesuaikan ketersediaan slot, jadi kalau slot sedang penuh akan diinfokan sejak awal sebelum kamu membayar apa pun."
        },
        {
            "id": 4,
            "question": "Apakah identitas dan file saya aman?",
            "answer": "Aman. Nama, kampus, soal, dan seluruh file kamu tidak dibagikan ke pihak lain dan tidak dipakai ulang untuk klien lain. Proyek hanya ditampilkan di portofolio dalam bentuk anonim dan atas izin klien."
        },
        {
            "id": 5,
            "question": "Kenapa harga ditulis \"mulai dari\"?",
            "answer": "Harga final bergantung pada kompleksitas, jumlah fitur, dan deadline. Angka di pricelist adalah titik awal yang jujur, dan harga pasti selalu disepakati di tahap diskusi sebelum ada pembayaran."
        },
        {
            "id": 6,
            "question": "Apakah saya akan dijelaskan cara kerja kodenya?",
            "answer": "Setiap proyek koding disertai panduan singkat cara menjalankan program. Kalau kamu perlu memahami alur kode secara detail, misalnya untuk presentasi atau sidang, ambil add-on Video Demo & Penjelasan Alur Kode."
        },
        {
            "id": 7,
            "question": "Bagaimana kalau ada error setelah serah terima?",
            "answer": "Error yang berasal dari pengerjaan kami diperbaiki gratis dan tidak memotong jatah revisi, selama kode belum diubah dari sisi kamu dan dijalankan sesuai panduan."
        },
        {
            "id": 8,
            "question": "Metode pembayarannya apa saja?",
            "answer": "Pembayaran bisa melalui transfer bank atau e-wallet. Detail rekening dan bukti transaksi dikirim lewat WhatsApp setelah harga disepakati."
        }
    ]
};
