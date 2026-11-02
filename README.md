# FINORA — Personal Finance Tracker

> **Take Control of Your Money.**  
> Aplikasi pencatatan dan pengelolaan keuangan pribadi modern, akurat, dan aman.

![Finora](https://img.shields.io/badge/Finora-v1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg)
![SQLite](https://img.shields.io/badge/Database-SQLite%20Native%20WAL-003B57.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)

---

## 📌 Ringkasan Aplikasi

**Finora** adalah aplikasi web pencatatan keuangan pribadi yang dirancang untuk mahasiswa, pelajar, pekerja, dan profesional muda. Berbeda dengan dashboard statis atau template dummy, Finora dibangun dengan arsitektur **full-stack terintegrasi** (Frontend, Backend API, dan Database Relasional SQLite Native ACID) yang melakukan perhitungan matematika keuangan secara akurat tanpa perulangan atau double-counting.

---

## 🌟 Fitur Utama Finora

### 1. 📊 Dashboard Finansial Interaktif
- **4 Kartu Ringkasan Utama**:
  - **Total Saldo**: Akumulasi saldo riil dari seluruh akun keuangan aktif.
  - **Pemasukan Bulan Ini**: Total pemasukan bulan berjalan beserta persentase perbandingan dengan bulan lalu.
  - **Pengeluaran Bulan Ini**: Total pengeluaran aktual beserta persentase perbandingan dengan bulan lalu.
  - **Total Tabungan**: Akumulasi setoran dana ke target tabungan masa depan.
- **Grafik Arus Kas Dinamis (Recharts)**:
  - Pilihan rentang: 7 Hari Terakhir, Bulan Ini, 3 Bulan, 6 Bulan, dan 1 Tahun.
  - Tooltip interaktif dalam format Rupiah (IDR).
- **Distribusi Pengeluaran per Kategori**: Persentase belanja bulanan dengan progress bar interaktif.
- **Aksi Cepat (Quick Actions)**: Tambah pemasukan, tambah pengeluaran, kelola tabungan, dan telusuri transaksi dalam satu klik.

### 2. 💳 Manajemen Transaksi Lengkap
- **3 Jenis Transaksi**: Pemasukan (`income`), Pengeluaran (`expense`), dan Transfer Internal (`transfer`).
- **Pencegahan Double-Counting**: Transfer antar akun tidak pernah dihitung sebagai pemasukan atau pengeluaran baru.
- **Filter Fleksibel**: Berdasarkan rentang tanggal, kategori, jenis transaksi, dan akun keuangan.
- **Pencarian Real-Time**: Pencarian cepat berdasarkan nama transaksi atau catatan.
- **Pagination & Aksi**: Tambah, detail, edit, dan hapus transaksi dengan pembaruan saldo secara otomatis.

### 3. 📅 Pemantau Pengeluaran Harian (Daily Tracker)
- **Daily Spending Limit**: Pengguna dapat menetapkan batas belanja harian.
- **Indikator Visual 3 Status**:
  - 🟢 **Aman**: Pengeluaran masih di bawah 80% dari batas harian.
  - 🟡 **Mendekati Batas**: Pengeluaran mencapai 80% - 100%.
  - 🔴 **Melebihi Batas**: Pengeluaran melampaui batas harian dengan banner peringatan informatif.
- **Statistik Harian**: Pengeluaran hari ini vs kemarin, pengeluaran terbesar hari ini, dan rata-rata 7 hari terakhir.
- **Kalender Harian**: Filter tanggal untuk mengaudit transaksi pada hari tertentu.

### 4. 👛 Pengelolaan Uang Saku (Allowance Management)
- **Perencanaan Periode**: Harian, Mingguan, atau Bulanan.
- **Alokasi Cerdas**: Target uang saku, batas belanja, dan target alokasi tabungan.
- **Statistik Pemakaian**: Sisa uang saku aktual, persentase terpakai, rata-rata pengeluaran per hari, dan estimasi sisa hari.

### 5. 🎯 Perencanaan Anggaran Bulanan (Budget Management)
- **Batas Belanja per Kategori**: Atur kuota belanja untuk Makanan, Transportasi, Hiburan, Belanja, dll.
- **Status Kuota Real-Time**: Persentase pemakaian, sisa anggaran, dan indikator warna otomatis.
- **Filter Bulan & Tahun**: Navigasi riwayat anggaran lintas bulan dan tahun.

### 6. 🐷 Target Tabungan (Savings Goals)
- **Rencana Impian**: Dana Darurat, Beli Laptop, Liburan, Pendidikan, Gadget, dll.
- **Setoran Tabungan dari Akun**: Catat setoran dari akun keuangan ke target tabungan secara atomik.
- **Status & Progress Pencapaian**: Progress bar otomatis hingga 100% dan notifikasi perayaan saat target tercapai.
- **Riwayat Setoran**: Riwayat setoran lengkap dengan opsi hapus setoran yang mengoreksi kembali status tabungan.

### 7. 📑 Laporan Keuangan & Ekspor Dokumen
- **Filter Laporan**: Hari Ini, Minggu Ini, Bulan Ini, Tahun Ini, atau Rentang Tanggal Kustom.
- **Ekspor CSV**: Menggunakan standar sanitasi formula injection (`sanitizeCsvCell`) untuk mencegah eksploitasi saat file dibuka di Excel.
- **Ekspor PDF Resmi**: Menghasilkan dokumen PDF berformat kop Finora elegan lengkap dengan ringkasan keuangan dan tabel transaksi.

### 8. 🏦 Akun Keuangan Multi-Dompet
- Dukungan untuk: **Dompet Tunai**, **Rekening Bank (BCA, Mandiri, dll.)**, **E-Wallet (GoPay, OVO, DANA)**, dan **Rekening Tabungan**.
- Perhitungan saldo riil dinamis dari saldo awal dan mutasi transaksi.

### 9. 🏷️ Kategori Pemasukan & Pengeluaran
- Kategori default bawaan sistem (Gaji, Uang Saku, Makanan & Minuman, Transportasi, Tagihan, dll.).
- Tambah dan edit kategori kustom beserta pemilihan warna label.
- Perlindungan integritas: Kategori yang masih terikat transaksi tidak dapat dihapus sembarangan.

### 10. 💡 Financial Insights & Keamanan
- Analisis pola belanja berbasis data aktual (kategori terboros, perbandingan dengan bulan lalu, hari dengan pengeluaran puncak).
- Privasi 100% mandiri: Data diproses di server lokal tanpa mengirimkan informasi ke layanan AI pihak ketiga.

---

## 🛠️ Stack Teknologi

| Komponen | Teknologi |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router, Server Actions & Route Handlers) |
| **Bahasa** | TypeScript 5.8 |
| **Database** | Node.js Native SQLite (`DatabaseSync` di Node.js 26) dengan WAL Mode |
| **Styling** | Tailwind CSS 3.4 (Design System Fintech Finora) |
| **Ikonografi** | Lucide React |
| **Visualisasi Grafik** | Recharts (AreaChart, ResponsiveContainer) |
| **Autentikasi** | bcryptjs + Jose JWT Cookie Session (`httpOnly`, `sameSite: 'lax'`) |
| **Ekspor Dokumen** | jsPDF + Sanitasi CSV Anti-Formula Injection |

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat Sistem
- **Node.js**: Versi 22 atau versi 26 (rekomendasi: Node.js 26).
- **npm**: Versi 10 atau 11.

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment (`.env.local`)
File `.env.local` telah disiapkan:
```env
JWT_SECRET=finora-super-secret-jwt-key-2026-production-secure
NODE_ENV=development
```

### 4. Menjalankan Aplikasi

#### Mode Produksi (Kinerja Tinggi & Stabil):
```bash
npm run build
npm start
```
Buka browser di: **`http://localhost:3000`**

#### Mode Pengembangan (Live Reload):
```bash
npm run dev
```

---

## 👤 Akun Demo Siap Pakai

Untuk kemudahan pengujian instan, Finora menyediakan tombol **"Masuk dengan Akun Demo (1-Klik)"** di halaman login, atau gunakan kredensial berikut:

- **Email**: `demo@finora.id`
- **Kata Sandi**: `password123`

Akun demo telah dilengkapi dengan simulasi transaksi lengkap: gaji bulanan, freelance, top-up e-wallet, belanja harian, rencana uang saku, batas belanja harian, anggaran kategori, serta target tabungan dana darurat & laptop.

---

## 🧪 Hasil Pengujian Sistem (Automated Test Suite)

Finora dilengkapi dengan suite pengujian otomatis (`/api/test-suite`) yang memvalidasi integritas matematika dan keamanan data:

- ✅ **Test 1: User Registration & Auto Seeding** (Membuat akun & kategori/akun default otomatis).
- ✅ **Test 2: Data Isolation** (Isolasi data antar pengguna terpisah 100%).
- ✅ **Test 3: Balance & Core Transactions Calculation** (Perhitungan saldo & arus kas).
- ✅ **Test 4: Internal Transfer Invariant** (Transfer internal bernilai netral terhadap total kekayaan).
- ✅ **Test 5: Daily Spending Limit & Alert** (Deteksi status aman dan terlampaui).
- ✅ **Test 6: Budget Management** (Perhitungan kuota dan sisa anggaran).
- ✅ **Test 7: Savings Goals & Contributions** (Setoran tabungan & akumulasi persentase).
- ✅ **Test 8: Edge Cases Validation** (Penolakan nominal negatif, self-transfer, & proteksi hapus kategori terpakai).

