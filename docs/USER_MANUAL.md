# Manual Pengguna OpenSID Next.js

## Daftar Isi

1. [Pengenalan](#pengenalan)
2. [Memulai](#memulai)
3. [Dashboard](#dashboard)
4. [Manajemen Kependudukan](#manajemen-kependudukan)
5. [Layanan Surat](#layanan-surat)
6. [Manajemen Keuangan](#manajemen-keuangan)
7. [Website Publik](#website-publik)
8. [Sistem Pengaduan](#sistem-pengaduan)
9. [Peta dan GIS](#peta-dan-gis)
10. [Manajemen Pengguna](#manajemen-pengguna)
11. [Pengaturan Sistem](#pengaturan-sistem)
12. [FAQ dan Troubleshooting](#faq-dan-troubleshooting)

---

## Pengenalan

### Tentang OpenSID Next.js

OpenSID Next.js adalah sistem informasi desa modern yang dikembangkan menggunakan teknologi terkini. Sistem ini dirancang untuk memudahkan administrasi desa dan meningkatkan pelayanan kepada masyarakat.

### Fitur Utama

- **Manajemen Kependudukan**: Kelola data penduduk dan keluarga
- **Layanan Surat**: Proses permohonan surat keterangan
- **Keuangan Desa**: Kelola anggaran dan keuangan desa
- **Website Publik**: Portal informasi untuk masyarakat
- **Sistem Pengaduan**: Terima dan kelola pengaduan masyarakat
- **Peta Digital**: Visualisasi data geografis desa
- **Manajemen Pengguna**: Kelola akses dan hak pengguna

### Persyaratan Sistem

- **Browser**: Chrome, Firefox, Safari, atau Edge versi terbaru
- **Koneksi Internet**: Stabil untuk akses optimal
- **Resolusi Layar**: Minimal 1024x768 (mendukung mobile)
- **JavaScript**: Harus diaktifkan

---

## Memulai

### Login ke Sistem

1. **Buka Browser** dan akses alamat sistem OpenSID
2. **Masukkan Kredensial**:
   - Username atau Email
   - Password
3. **Klik "Masuk"** untuk mengakses dashboard

![Login Screen](images/login-screen.png)

### Lupa Password

1. Klik **"Lupa Password?"** di halaman login
2. Masukkan **email** yang terdaftar
3. Cek **email** untuk link reset password
4. Ikuti instruksi untuk membuat password baru

### Navigasi Dasar

#### Sidebar Menu
- **Dashboard**: Halaman utama dengan ringkasan data
- **Kependudukan**: Manajemen data penduduk dan keluarga
- **Layanan Surat**: Proses permohonan surat
- **Keuangan**: Manajemen anggaran dan keuangan
- **Website Publik**: Kelola konten website
- **Pengaduan**: Kelola pengaduan masyarakat
- **Peta**: Visualisasi data geografis
- **Pengguna**: Manajemen akses pengguna
- **Pengaturan**: Konfigurasi sistem

#### Header
- **Profil Pengguna**: Akses pengaturan profil
- **Notifikasi**: Lihat pemberitahuan sistem
- **Logout**: Keluar dari sistem

---

## Dashboard

### Tampilan Utama

Dashboard menampilkan ringkasan informasi penting:

#### Widget Statistik
- **Total Penduduk**: Jumlah penduduk terdaftar
- **Total Keluarga**: Jumlah kepala keluarga
- **RT/RW**: Jumlah RT dan RW
- **Luas Wilayah**: Luas desa dalam hektar

#### Grafik dan Chart
- **Demografi Penduduk**: Distribusi berdasarkan usia dan jenis kelamin
- **Statistik Bulanan**: Trend data kependudukan
- **Status Permohonan**: Grafik status surat yang diproses

#### Aktivitas Terbaru
- **Permohonan Surat**: Daftar permohonan terbaru
- **Penduduk Baru**: Registrasi penduduk terbaru
- **Pengaduan**: Pengaduan yang perlu ditindaklanjuti

### Kustomisasi Dashboard

1. **Klik ikon pengaturan** di pojok kanan atas widget
2. **Pilih data** yang ingin ditampilkan
3. **Atur urutan** widget dengan drag & drop
4. **Simpan pengaturan** untuk menyimpan preferensi

---

## Manajemen Kependudukan

### Data Penduduk

#### Melihat Daftar Penduduk

1. **Klik menu "Kependudukan"** → **"Data Penduduk"**
2. **Gunakan filter** untuk mencari penduduk:
   - Nama
   - NIK
   - RT/RW
   - Status
3. **Klik nama penduduk** untuk melihat detail

#### Menambah Penduduk Baru

1. **Klik tombol "+ Tambah Penduduk"**
2. **Isi form** dengan data lengkap:
   - **Data Pribadi**: NIK, Nama, Tempat/Tanggal Lahir
   - **Alamat**: RT, RW, Dusun
   - **Keluarga**: Pilih keluarga atau buat baru
   - **Kontak**: Nomor telepon, email (opsional)
3. **Upload dokumen** pendukung jika ada
4. **Klik "Simpan"** untuk menyimpan data

#### Mengedit Data Penduduk

1. **Cari penduduk** yang akan diedit
2. **Klik ikon edit** (pensil) di samping nama
3. **Ubah data** yang diperlukan
4. **Klik "Simpan Perubahan"**

#### Menghapus Data Penduduk

1. **Pilih penduduk** yang akan dihapus
2. **Klik ikon hapus** (tong sampah)
3. **Konfirmasi penghapusan** dengan mengetik "HAPUS"
4. **Klik "Ya, Hapus"** untuk konfirmasi

### Data Keluarga

#### Melihat Daftar Keluarga

1. **Klik menu "Kependudukan"** → **"Data Keluarga"**
2. **Lihat informasi**:
   - Nomor Kartu Keluarga
   - Kepala Keluarga
   - Jumlah Anggota
   - Alamat

#### Menambah Keluarga Baru

1. **Klik "+ Tambah Keluarga"**
2. **Isi data keluarga**:
   - Nomor KK
   - Kepala Keluarga
   - Alamat lengkap
   - Status sosial ekonomi
3. **Tambah anggota keluarga**
4. **Simpan data keluarga**

#### Mengelola Anggota Keluarga

1. **Klik nama keluarga** untuk melihat detail
2. **Tab "Anggota Keluarga"**:
   - Lihat daftar anggota
   - Tambah anggota baru
   - Ubah status anggota
   - Pindah anggota ke keluarga lain

### Import/Export Data

#### Import Data dari Excel

1. **Klik "Import Data"** di halaman penduduk
2. **Download template** Excel yang disediakan
3. **Isi data** sesuai format template
4. **Upload file** Excel yang sudah diisi
5. **Review data** yang akan diimport
6. **Konfirmasi import** untuk menyimpan data

#### Export Data ke Excel

1. **Pilih data** yang akan diexport (gunakan filter)
2. **Klik "Export"** → **"Excel"**
3. **Pilih kolom** yang akan diexport
4. **Download file** hasil export

---

## Layanan Surat

### Jenis Surat yang Tersedia

- **Surat Keterangan Domisili**
- **Surat Keterangan Usaha**
- **Surat Keterangan Tidak Mampu**
- **Surat Pengantar**
- **Surat Keterangan Kelahiran**
- **Surat Keterangan Kematian**

### Memproses Permohonan Surat

#### Melihat Daftar Permohonan

1. **Klik menu "Layanan Surat"** → **"Permohonan Surat"**
2. **Lihat status permohonan**:
   - 🟡 **Pending**: Menunggu diproses
   - 🔵 **Diproses**: Sedang dikerjakan
   - 🟢 **Selesai**: Surat sudah jadi
   - 🔴 **Ditolak**: Permohonan ditolak

#### Memproses Permohonan

1. **Klik permohonan** yang akan diproses
2. **Review data pemohon** dan dokumen pendukung
3. **Pilih tindakan**:
   - **Setujui**: Lanjut ke pembuatan surat
   - **Minta Dokumen Tambahan**: Kirim notifikasi ke pemohon
   - **Tolak**: Berikan alasan penolakan
4. **Tambah catatan** jika diperlukan
5. **Klik "Simpan"**

#### Membuat Surat

1. **Pilih template surat** yang sesuai
2. **Isi data surat**:
   - Nomor surat (otomatis)
   - Tanggal surat
   - Data pemohon (otomatis dari database)
   - Keperluan/tujuan
3. **Preview surat** sebelum mencetak
4. **Generate PDF** untuk dicetak
5. **Tandai sebagai selesai**

### Template Surat

#### Mengelola Template

1. **Klik "Template Surat"** di menu layanan surat
2. **Lihat daftar template** yang tersedia
3. **Edit template** dengan klik ikon edit
4. **Tambah template baru** dengan klik "+ Tambah Template"

#### Membuat Template Baru

1. **Klik "+ Tambah Template"**
2. **Isi informasi template**:
   - Nama template
   - Jenis surat
   - Kop surat
   - Isi template dengan variabel
3. **Gunakan variabel** seperti:
   - `{nama}` - Nama pemohon
   - `{nik}` - NIK pemohon
   - `{alamat}` - Alamat pemohon
   - `{tanggal}` - Tanggal surat
4. **Preview template**
5. **Simpan template**

---

## Manajemen Keuangan

### Anggaran Desa

#### Melihat Anggaran

1. **Klik menu "Keuangan"** → **"Anggaran"**
2. **Pilih tahun anggaran** yang ingin dilihat
3. **Lihat breakdown anggaran**:
   - Pendapatan
   - Belanja
   - Sisa anggaran

#### Menambah Item Anggaran

1. **Klik "+ Tambah Anggaran"**
2. **Isi detail anggaran**:
   - Kategori (Pendapatan/Belanja)
   - Sub kategori
   - Deskripsi
   - Jumlah anggaran
3. **Simpan anggaran**

### Realisasi Pengeluaran

#### Mencatat Pengeluaran

1. **Klik "Realisasi"** → **"+ Tambah Pengeluaran"**
2. **Isi data pengeluaran**:
   - Tanggal pengeluaran
   - Kategori anggaran
   - Deskripsi
   - Jumlah
   - Upload bukti (kwitansi/nota)
3. **Submit untuk persetujuan**

#### Menyetujui Pengeluaran

1. **Klik tab "Menunggu Persetujuan"**
2. **Review pengeluaran**:
   - Cek kesesuaian dengan anggaran
   - Verifikasi dokumen pendukung
   - Pastikan jumlah sesuai
3. **Pilih tindakan**:
   - **Setujui**: Pengeluaran disetujui
   - **Tolak**: Berikan alasan penolakan
   - **Minta Revisi**: Minta perbaikan data

### Program Bantuan

#### Mengelola Program Bantuan

1. **Klik "Program Bantuan"**
2. **Lihat daftar program** yang aktif
3. **Tambah program baru**:
   - Nama program
   - Deskripsi
   - Anggaran
   - Kriteria penerima
   - Periode program

#### Mengelola Penerima Bantuan

1. **Klik nama program** untuk melihat detail
2. **Tab "Penerima"**:
   - Lihat daftar penerima
   - Tambah penerima baru
   - Ubah status penerima
   - Catat penyaluran bantuan

### Laporan Keuangan

#### Membuat Laporan

1. **Klik "Laporan Keuangan"**
2. **Pilih jenis laporan**:
   - Laporan Realisasi Anggaran
   - Laporan Kas
   - Laporan Program Bantuan
3. **Set periode laporan**
4. **Generate laporan**
5. **Export ke PDF/Excel**

---

## Website Publik

### Mengelola Konten

#### Artikel dan Berita

1. **Klik menu "Website Publik"** → **"Artikel & Berita"**
2. **Tambah artikel baru**:
   - Judul artikel
   - Kategori
   - Isi artikel (dengan editor rich text)
   - Gambar featured
   - Status publikasi
3. **Atur SEO**:
   - Meta description
   - Keywords
   - URL slug
4. **Publikasikan artikel**

#### Galeri Foto

1. **Klik "Galeri Foto"**
2. **Buat album baru** atau pilih album existing
3. **Upload foto**:
   - Drag & drop multiple files
   - Tambah caption untuk setiap foto
   - Atur urutan foto
4. **Publikasikan galeri**

#### Pengumuman

1. **Klik "Pengumuman"**
2. **Buat pengumuman baru**:
   - Judul pengumuman
   - Isi pengumuman
   - Tanggal berlaku
   - Prioritas (Normal/Penting/Mendesak)
3. **Set visibility**:
   - Publik: Semua orang bisa lihat
   - Terdaftar: Hanya user terdaftar
4. **Publikasikan**

### Mengelola Halaman Statis

#### Edit Halaman Profil Desa

1. **Klik "Halaman"** → **"Profil Desa"**
2. **Edit konten**:
   - Sejarah desa
   - Visi dan misi
   - Struktur organisasi
   - Data geografis
3. **Upload gambar** pendukung
4. **Simpan perubahan**

#### Mengelola Menu Navigasi

1. **Klik "Pengaturan"** → **"Menu Navigasi"**
2. **Tambah item menu**:
   - Label menu
   - Link tujuan
   - Urutan menu
   - Sub menu (jika ada)
3. **Drag & drop** untuk mengatur urutan
4. **Simpan struktur menu**

---

## Sistem Pengaduan

### Melihat Pengaduan Masuk

1. **Klik menu "Pengaduan"**
2. **Lihat daftar pengaduan** dengan status:
   - 🟡 **Baru**: Belum ditangani
   - 🔵 **Diproses**: Sedang ditangani
   - 🟢 **Selesai**: Sudah diselesaikan
   - 🔴 **Ditutup**: Pengaduan ditutup

### Memproses Pengaduan

#### Menangani Pengaduan Baru

1. **Klik pengaduan** yang akan ditangani
2. **Baca detail pengaduan**:
   - Judul dan deskripsi
   - Kategori pengaduan
   - Data pelapor
   - Lampiran (jika ada)
3. **Tentukan tindakan**:
   - **Terima**: Mulai proses penanganan
   - **Tolak**: Berikan alasan penolakan
   - **Butuh Info Tambahan**: Minta klarifikasi

#### Memberikan Respon

1. **Klik tab "Respon"**
2. **Tulis respon** untuk pelapor:
   - Jelaskan tindakan yang akan diambil
   - Berikan estimasi waktu penyelesaian
   - Minta informasi tambahan jika perlu
3. **Kirim respon** (otomatis notifikasi ke pelapor)

#### Menyelesaikan Pengaduan

1. **Update status** menjadi "Selesai"
2. **Tulis laporan penyelesaian**:
   - Tindakan yang telah diambil
   - Hasil penyelesaian
   - Dokumentasi (foto/dokumen)
3. **Kirim notifikasi** ke pelapor
4. **Tutup pengaduan**

### Laporan Pengaduan

#### Membuat Laporan

1. **Klik "Laporan Pengaduan"**
2. **Set filter laporan**:
   - Periode waktu
   - Kategori pengaduan
   - Status pengaduan
   - Petugas penanganan
3. **Generate laporan**
4. **Export hasil** ke PDF/Excel

---

## Peta dan GIS

### Melihat Peta Desa

1. **Klik menu "Peta"** → **"Peta Desa"**
2. **Navigasi peta**:
   - Zoom in/out dengan scroll mouse
   - Pan dengan drag mouse
   - Klik marker untuk info detail

### Layer Peta

#### Mengatur Layer

1. **Klik ikon layer** di pojok kanan peta
2. **Pilih layer** yang ingin ditampilkan:
   - **Penduduk**: Lokasi rumah penduduk
   - **Fasilitas**: Sekolah, puskesmas, dll
   - **Batas Wilayah**: RT, RW, dusun
   - **Infrastruktur**: Jalan, jembatan, dll
3. **Atur transparansi** layer jika perlu

#### Menambah Marker

1. **Klik tombol "+ Tambah Marker"**
2. **Klik lokasi** di peta untuk menempatkan marker
3. **Isi informasi marker**:
   - Nama/label
   - Kategori (penduduk/fasilitas/dll)
   - Deskripsi
   - Foto (opsional)
4. **Simpan marker**

### Pencarian Lokasi

#### Cari Berdasarkan Nama

1. **Gunakan search box** di atas peta
2. **Ketik nama** yang dicari:
   - Nama penduduk
   - Nama jalan
   - Nama fasilitas
3. **Pilih hasil** dari dropdown
4. **Peta otomatis** zoom ke lokasi

#### Filter Berdasarkan Kriteria

1. **Klik "Filter"** di toolbar peta
2. **Set kriteria filter**:
   - RT/RW tertentu
   - Usia penduduk
   - Jenis kelamin
   - Status perkawinan
3. **Apply filter**
4. **Lihat hasil** di peta

---

## Manajemen Pengguna

### Melihat Daftar Pengguna

1. **Klik menu "Sistem"** → **"Manajemen Pengguna"**
2. **Lihat informasi pengguna**:
   - Nama dan username
   - Role/peran
   - Status aktif
   - Last login

### Menambah Pengguna Baru

1. **Klik "+ Tambah Pengguna"**
2. **Isi data pengguna**:
   - **Data Pribadi**: Nama lengkap, email
   - **Akun**: Username, password
   - **Role**: Pilih peran pengguna
   - **Status**: Aktif/Non-aktif
3. **Set permissions** jika perlu custom
4. **Simpan pengguna**

### Mengelola Role dan Permissions

#### Melihat Role

1. **Klik "Peran & Hak Akses"**
2. **Lihat daftar role**:
   - **Super Admin**: Akses penuh sistem
   - **Admin Desa**: Akses administrasi desa
   - **Operator**: Akses input data
   - **Viewer**: Akses baca saja

#### Membuat Role Baru

1. **Klik "+ Tambah Role"**
2. **Isi detail role**:
   - Nama role
   - Deskripsi role
3. **Set permissions**:
   - Pilih modul yang bisa diakses
   - Set level akses (Read/Write/Delete)
4. **Simpan role**

#### Edit Permissions

1. **Klik nama role** untuk edit
2. **Tab "Permissions"**:
   - Centang/uncentang permissions
   - Atur level akses per modul
3. **Simpan perubahan**

### Reset Password Pengguna

1. **Cari pengguna** yang akan direset
2. **Klik "Reset Password"**
3. **Pilih metode reset**:
   - Generate password baru
   - Kirim link reset via email
4. **Konfirmasi reset**
5. **Berikan password baru** ke pengguna

---

## Pengaturan Sistem

### Konfigurasi Desa

#### Data Desa

1. **Klik menu "Sistem"** → **"Konfigurasi Desa"**
2. **Edit informasi desa**:
   - Nama desa
   - Alamat lengkap
   - Kode desa
   - Kepala desa
   - Kontak (telepon, email, website)
3. **Upload logo desa**
4. **Simpan perubahan**

#### Pengaturan Geografis

1. **Tab "Geografis"**
2. **Set koordinat desa**:
   - Latitude dan longitude
   - Luas wilayah
   - Ketinggian
   - Batas wilayah
3. **Upload peta wilayah** (opsional)
4. **Simpan koordinat**

### Pengaturan Aplikasi

#### Pengaturan Umum

1. **Klik "Pengaturan Sistem"**
2. **Tab "Umum"**:
   - Nama aplikasi
   - Timezone
   - Format tanggal
   - Bahasa default
3. **Pengaturan Email**:
   - SMTP server
   - Email pengirim
   - Template email
4. **Simpan pengaturan**

#### Backup dan Restore

1. **Tab "Backup"**
2. **Buat backup manual**:
   - Pilih data yang akan dibackup
   - Set lokasi penyimpanan
   - Jalankan backup
3. **Jadwal backup otomatis**:
   - Set frekuensi backup
   - Waktu backup
   - Retention policy
4. **Restore dari backup**:
   - Pilih file backup
   - Konfirmasi restore
   - Monitor proses restore

### Log Aktivitas

#### Melihat Log

1. **Klik "Log Aktivitas"**
2. **Filter log**:
   - Tanggal
   - Pengguna
   - Jenis aktivitas
   - Modul
3. **Export log** untuk audit

#### Monitoring Sistem

1. **Tab "Monitoring"**
2. **Lihat metrik sistem**:
   - CPU usage
   - Memory usage
   - Disk space
   - Database performance
3. **Set alert** untuk metrik tertentu

---

## FAQ dan Troubleshooting

### Pertanyaan Umum

#### Q: Bagaimana cara mengubah password?
**A:** 
1. Klik profil di pojok kanan atas
2. Pilih "Ubah Password"
3. Masukkan password lama dan password baru
4. Klik "Simpan"

#### Q: Mengapa data tidak tersimpan?
**A:** 
- Pastikan semua field wajib sudah diisi
- Cek koneksi internet
- Pastikan format data sudah benar (NIK 16 digit, email valid, dll)
- Refresh halaman dan coba lagi

#### Q: Bagaimana cara backup data?
**A:**
1. Masuk ke menu "Pengaturan Sistem"
2. Tab "Backup"
3. Klik "Buat Backup Manual"
4. Tunggu proses selesai
5. Download file backup

#### Q: Lupa username atau password?
**A:**
- Hubungi administrator sistem
- Atau gunakan fitur "Lupa Password" di halaman login

### Troubleshooting

#### Masalah Login

**Gejala**: Tidak bisa login ke sistem
**Solusi**:
1. Pastikan username/password benar
2. Cek caps lock
3. Clear browser cache dan cookies
4. Coba browser lain
5. Hubungi administrator jika masih bermasalah

#### Halaman Lambat Loading

**Gejala**: Halaman lama loading atau tidak responsif
**Solusi**:
1. Cek koneksi internet
2. Refresh halaman (F5)
3. Clear browser cache
4. Tutup tab browser lain
5. Restart browser

#### Error Saat Upload File

**Gejala**: Gagal upload dokumen atau gambar
**Solusi**:
1. Cek ukuran file (maksimal 5MB)
2. Pastikan format file didukung (JPG, PNG, PDF)
3. Coba compress file jika terlalu besar
4. Gunakan nama file tanpa karakter khusus

#### Data Tidak Muncul

**Gejala**: Data yang sudah diinput tidak muncul di list
**Solusi**:
1. Refresh halaman
2. Cek filter yang aktif
3. Pastikan data tersimpan dengan benar
4. Cek permission akses data

### Kontak Support

Jika mengalami masalah yang tidak bisa diselesaikan:

- **Email**: support@opensid.go.id
- **Telepon**: (021) 1234-5678
- **WhatsApp**: 0812-3456-7890
- **Jam Kerja**: Senin-Jumat, 08:00-17:00 WIB

### Tips Penggunaan

1. **Backup Rutin**: Lakukan backup data secara berkala
2. **Update Browser**: Gunakan browser versi terbaru
3. **Password Kuat**: Gunakan password yang kuat dan unik
4. **Logout**: Selalu logout setelah selesai menggunakan
5. **Training**: Ikuti pelatihan penggunaan sistem secara berkala

---

*Manual ini akan terus diperbarui seiring dengan pengembangan fitur baru. Untuk versi terbaru, silakan cek dokumentasi online.*