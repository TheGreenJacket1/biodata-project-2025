# Aplikasi Pencarian Biodata Mahasiswa IF 2025

Aplikasi web untuk mencari biodata mahasiswa berdasarkan 3 digit terakhir NIM.

## Cara Menggunakan

### Opsi 1: Menggunakan Local Server (Recommended)

1. Install Python (jika belum ada)
2. Buka terminal/command prompt di folder ini
3. Jalankan salah satu perintah berikut:

**Python 3:**
```bash
python -m http.server 8000
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

4. Buka browser dan akses: `http://localhost:8000`

### Opsi 2: Upload File CSV

1. Buka `index.html` langsung di browser (double-click)
2. Jika file CSV tidak ditemukan, akan muncul opsi untuk upload file
3. Klik "Pilih File CSV" dan pilih file `Biodata_IF_2025 - MAIN.csv`
4. Aplikasi akan memuat data secara otomatis

### Opsi 3: Menggunakan Live Server (VS Code)

Jika menggunakan VS Code:
1. Install extension "Live Server"
2. Klik kanan pada `index.html`
3. Pilih "Open with Live Server"

## Fitur

- ✅ Pencarian berdasarkan 3 digit terakhir NIM
- ✅ UI/UX modern dan responsif
- ✅ Aman dari XSS attacks
- ✅ Validasi input yang ketat
- ✅ Error handling yang baik
- ✅ Loading states
- ✅ Support upload file CSV

## File yang Diperlukan

- `index.html` - File utama aplikasi
- `style.css` - Styling aplikasi
- `app.js` - Logika aplikasi
- `Biodata_IF_2025 - MAIN.csv` - File data (opsional, bisa di-upload)

## Catatan

- Jika membuka `index.html` langsung (file://), browser akan memblokir fetch file lokal
- Gunakan local server atau fitur upload file untuk mengatasi masalah ini
- File CSV harus memiliki format yang benar dengan header: No, NIM, Nama Mahasiswa, dll

## Troubleshooting

**File CSV tidak ditemukan:**
- Gunakan local server (Opsi 1)
- Atau upload file CSV menggunakan fitur upload (Opsi 2)

**Data tidak muncul:**
- Pastikan file CSV memiliki format yang benar
- Pastikan kolom NIM ada dan berisi data
- Cek console browser untuk error messages

