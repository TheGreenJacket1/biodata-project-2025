# Aplikasi Pencarian Biodata Mahasiswa IF 2025

Aplikasi web modern dan profesional untuk mencari biodata mahasiswa berdasarkan 3 digit terakhir NIM.

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

## Fitur Utama

### 🔍 Pencarian

- ✅ Pencarian berdasarkan 3 digit terakhir NIM
- ✅ Auto-search dengan debounce (400ms)
- ✅ Validasi input ketat (hanya angka 3 digit)
- ✅ Loading states yang jelas

### 🎨 UI/UX Modern

- ✅ Animasi background gradasi bergerak yang elegan
- ✅ Smooth animations untuk semua elemen
- ✅ Responsif untuk semua device (HP, Tablet, Laptop, PC)
- ✅ Optimasi untuk Android, iOS, Mac, Windows
- ✅ Dark theme yang nyaman untuk mata

### 🔔 Notifikasi Profesional

- ✅ Toast notifications untuk feedback
- ✅ Notifikasi sukses, error, warning, dan info
- ✅ Auto-dismiss dengan animasi smooth
- ✅ Dapat ditutup manual

### ⌨️ Keyboard Shortcuts

- ✅ Tekan `/` untuk fokus ke input pencarian
- ✅ Tekan `Ctrl/Cmd + K` untuk fokus ke input
- ✅ Tekan `Escape` untuk reset/reset input
- ✅ Tekan `Enter` untuk melakukan pencarian

### 🔒 Security & Accessibility

- ✅ Content Security Policy (CSP)
- ✅ XSS protection (menggunakan textContent, bukan innerHTML)
- ✅ Validasi input dengan regex ketat
- ✅ WCAG-compliant accessibility
- ✅ ARIA labels dan roles
- ✅ Skip link untuk keyboard navigation
- ✅ Screen reader support

### 📱 Responsive Design

- ✅ Mobile-first approach
- ✅ Optimasi untuk touch devices
- ✅ Tablet layout
- ✅ Desktop layout
- ✅ Cross-platform compatibility

### ⚡ Performance

- ✅ Lazy loading
- ✅ Debounced search
- ✅ Efficient DOM manipulation
- ✅ Smooth animations dengan CSS
- ✅ Error handling yang baik

### 📊 Data Management

- ✅ Support upload file CSV
- ✅ Auto-detect data load status
- ✅ Menampilkan jumlah data dan waktu load
- ✅ Error handling untuk parsing CSV

## File yang Diperlukan

- `index.html` - File utama aplikasi
- `style.css` - Styling aplikasi dengan animasi
- `app.js` - Logika aplikasi dengan notifikasi dan shortcuts
- `Biodata_IF_2025 - MAIN.csv` - File data (opsional, bisa di-upload)

## Keyboard Shortcuts

| Shortcut       | Aksi                     |
| -------------- | ------------------------ |
| `/`            | Fokus ke input pencarian |
| `Ctrl/Cmd + K` | Fokus ke input pencarian |
| `Enter`        | Lakukan pencarian        |
| `Escape`       | Reset/reset input        |

## Catatan

- Jika membuka `index.html` langsung (file://), browser akan memblokir fetch file lokal
- Gunakan local server atau fitur upload file untuk mengatasi masalah ini
- File CSV harus memiliki format yang benar dengan header: No, NIM, Nama Mahasiswa, dll
- Aplikasi otomatis mendeteksi platform (Android, iOS, Mac, Windows) dan menyesuaikan UI

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Opera (latest)
- ✅ Mobile browsers (Chrome Mobile, Safari iOS)

## Troubleshooting

**File CSV tidak ditemukan:**

- Gunakan local server (Opsi 1)
- Atau upload file CSV menggunakan fitur upload (Opsi 2)

**Data tidak muncul:**

- Pastikan file CSV memiliki format yang benar
- Pastikan kolom NIM ada dan berisi data
- Cek console browser untuk error messages
- Periksa notifikasi toast untuk pesan error

**Animasi tidak berjalan:**

- Pastikan browser mendukung CSS animations
- Cek apakah JavaScript diaktifkan
- Refresh halaman

**Keyboard shortcuts tidak bekerja:**

- Pastikan tidak sedang mengetik di input field
- Cek apakah browser mendukung keyboard events
- Pastikan tidak ada extension yang memblokir shortcuts
