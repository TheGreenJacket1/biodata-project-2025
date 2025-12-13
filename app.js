// Global variables
let parsedData = [];
let isDataLoaded = false;

// DOM elements
const nimInput = document.getElementById('nimInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const error = document.getElementById('error');
const searchAgainBtn = document.getElementById('searchAgainBtn');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const updateCsvBtn = document.getElementById('updateCsvBtn');

// Parse CSV line dengan dukungan tanda kutip (sama seperti C++)
function parseCSVLine(line) {
    const result = [];
    let field = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        
        if (c === '"') {
            insideQuotes = !insideQuotes;
        } else if (c === ',' && !insideQuotes) {
            result.push(field.trim());
            field = '';
        } else {
            field += c;
        }
    }
    result.push(field.trim());
    return result;
}

// Sanitize text untuk mencegah XSS
function sanitizeText(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.textContent;
}

// Parse CSV text menjadi data
function parseCSVText(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
        throw new Error('File CSV tidak valid atau kosong');
    }
    
    parsedData = [];
    // Skip header (baris pertama)
    for (let i = 1; i < lines.length; i++) {
        try {
            const row = parseCSVLine(lines[i]);
            if (row.length >= 2 && row[1] && row[1].trim() !== '') { // Pastikan ada NIM
                parsedData.push({
                    no: sanitizeText(row[0] || ''),
                    nim: sanitizeText(row[1] || ''),
                    nama: sanitizeText(row[2] || ''),
                    kelompok: sanitizeText(row[3] || ''),
                    ttl: sanitizeText(row[4] || ''),
                    instagram: sanitizeText(row[5] || ''),
                    hobi: sanitizeText(row[6] || ''),
                    golonganDarah: sanitizeText(row[7] || ''),
                    alamat: sanitizeText(row[8] || '')
                });
            }
        } catch (parseError) {
            console.warn(`Error parsing line ${i + 1}:`, parseError);
            // Continue dengan baris berikutnya
        }
    }
    
    if (parsedData.length === 0) {
        throw new Error('Tidak ada data yang valid dalam file CSV');
    }
    
    isDataLoaded = true;
    
    // Tampilkan tombol update CSV setelah data berhasil dimuat
    if (updateCsvBtn) {
        updateCsvBtn.classList.remove('hidden');
    }
}

// Load CSV file
async function loadCSV() {
    try {
        showLoading();
        
        // Coba load dari fetch (untuk server/http)
        try {
            const response = await fetch('Biodata_IF_2025 - MAIN.csv');
            if (response.ok) {
                const text = await response.text();
                parseCSVText(text);
                hideLoading();
                return;
            }
        } catch (fetchError) {
            // Jika fetch gagal (file:// protocol), gunakan data embedded
            console.log('Fetch gagal, menggunakan data embedded atau upload file');
        }
        
        // Jika fetch gagal, coba load dari data embedded
        if (typeof embeddedCSVData !== 'undefined' && embeddedCSVData) {
            parseCSVText(embeddedCSVData);
            hideLoading();
            return;
        }
        
        // Jika tidak ada data embedded, minta user upload file
        throw new Error('FILE_NOT_FOUND');
        
    } catch (err) {
        console.error('Error loading CSV:', err);
        hideLoading();
        
        if (err.message === 'FILE_NOT_FOUND') {
            // Tampilkan opsi upload file
            showFileUploadOption();
        } else {
            displayError('Gagal memuat data. Silakan upload file CSV atau pastikan file tersedia.');
            isDataLoaded = false;
        }
    }
}

// Show file upload option
function showFileUploadOption() {
    // Cek apakah upload section sudah ada, jika ya jangan buat lagi
    if (document.getElementById('fileUploadSection')) {
        return;
    }
    
    const searchBox = document.querySelector('.search-box');
    if (!searchBox) return;
    
    const uploadHTML = `
        <div id="fileUploadSection" style="margin-top: 1rem; padding: 1.5rem; background: var(--bg-tertiary); border-radius: 12px; border: 2px dashed var(--border); text-align: center;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 1rem; color: var(--text-muted);">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h3 style="margin-bottom: 0.5rem; color: var(--text-primary);">File CSV tidak ditemukan</h3>
            <p style="margin-bottom: 1.5rem; color: var(--text-secondary); font-size: 0.9rem;">Silakan upload file CSV untuk melanjutkan</p>
            <label for="csvFileInput" style="display: inline-block; background: var(--gradient); color: white; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;">
                <input type="file" id="csvFileInput" accept=".csv" style="display: none;" />
                Pilih File CSV
            </label>
            <p style="margin-top: 1rem; color: var(--text-muted); font-size: 0.85rem;">Format: CSV dengan kolom NIM, Nama, dll</p>
        </div>
    `;
    
    searchBox.insertAdjacentHTML('beforeend', uploadHTML);
    
    // Setup event listener untuk file input
    setTimeout(() => {
        const fileInput = document.getElementById('csvFileInput');
        if (fileInput) {
            // Hapus event listener lama jika ada, lalu tambahkan yang baru
            const newFileInput = fileInput.cloneNode(true);
            fileInput.parentNode.replaceChild(newFileInput, fileInput);
            newFileInput.addEventListener('change', handleFileUpload);
        }
    }, 0);
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
        alert('Silakan pilih file CSV');
        return;
    }
    
    showLoading();
    
    // Hapus upload section sebelum memproses file
    const uploadSection = document.getElementById('fileUploadSection');
    if (uploadSection) {
        uploadSection.remove();
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            parseCSVText(text);
            hideLoading();
            
            // Update UI
            updateUIState();
            
            // Tampilkan tombol update CSV
            if (updateCsvBtn) {
                updateCsvBtn.classList.remove('hidden');
            }
            
            if (nimInput) {
                nimInput.focus();
            }
        } catch (err) {
            console.error('Error parsing uploaded file:', err);
            hideLoading();
            displayError('Gagal memuat file. Pastikan format CSV benar.');
            // Tampilkan kembali upload section jika error
            showFileUploadOption();
        }
    };
    
    reader.onerror = function() {
        hideLoading();
        displayError('Gagal membaca file.');
        // Tampilkan kembali upload section jika error
        showFileUploadOption();
    };
    
    reader.readAsText(file, 'UTF-8');
}

// Search function
function searchBiodata(last3Digits) {
    // Validasi data sudah dimuat
    if (!isDataLoaded) {
        alert('Data belum dimuat. Silakan refresh halaman.');
        return;
    }

    // Validasi input
    if (!last3Digits || last3Digits.length !== 3 || !/^\d{3}$/.test(last3Digits)) {
        alert('Masukkan 3 digit angka yang valid');
        return;
    }

    hideAllResults();
    showLoading();

    // Simulate loading delay for better UX
    setTimeout(() => {
        const found = parsedData.find(item => {
            if (!item.nim || item.nim.length < 3) return false;
            const last3 = item.nim.slice(-3);
            return last3 === last3Digits;
        });

        hideLoading();

        if (found) {
            displayResult(found);
        } else {
            displayError();
        }
    }, 500);
}

// Display result
function displayResult(data) {
    document.getElementById('no').textContent = data.no || '-';
    document.getElementById('nim').textContent = data.nim || '-';
    document.getElementById('nama').textContent = data.nama || '-';
    document.getElementById('kelompok').textContent = data.kelompok || '-';
    document.getElementById('ttl').textContent = data.ttl || '-';
    document.getElementById('instagram').textContent = data.instagram || '-';
    document.getElementById('hobi').textContent = data.hobi || '-';
    document.getElementById('golonganDarah').textContent = data.golonganDarah || '-';
    document.getElementById('alamat').textContent = data.alamat || '-';

    result.classList.remove('hidden');
    error.classList.add('hidden');
}

// Display error
function displayError(message) {
    result.classList.add('hidden');
    error.classList.remove('hidden');
    
    // Update error message jika ada custom message
    if (message) {
        const errorText = document.getElementById('errorMessage');
        if (errorText) {
            errorText.textContent = sanitizeText(message);
        }
    } else {
        // Reset ke default message
        const errorText = document.getElementById('errorMessage');
        if (errorText) {
            errorText.textContent = 'Mohon periksa kembali 3 digit terakhir NIM yang Anda masukkan';
        }
    }
}

// Show loading
function showLoading() {
    loading.classList.remove('hidden');
    result.classList.add('hidden');
    error.classList.add('hidden');
}

// Hide loading
function hideLoading() {
    loading.classList.add('hidden');
}

// Hide all results
function hideAllResults() {
    result.classList.add('hidden');
    error.classList.add('hidden');
}

// Reset search
function resetSearch() {
    hideAllResults();
    nimInput.value = '';
    nimInput.focus();
}

// Validate input (only numbers, max 3 digits)
function validateInput(value) {
    // Remove non-numeric characters
    return value.replace(/\D/g, '').slice(0, 3);
}

// Event listeners
searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const input = validateInput(nimInput.value);
    if (input.length === 3) {
        searchBiodata(input);
    } else {
        alert('Masukkan 3 digit terakhir NIM');
        nimInput.focus();
    }
});

nimInput.addEventListener('input', (e) => {
    e.target.value = validateInput(e.target.value);
});

nimInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const input = validateInput(nimInput.value);
        if (input.length === 3) {
            searchBiodata(input);
        } else {
            alert('Masukkan 3 digit terakhir NIM');
        }
    }
});

// Prevent form submission jika ada form
nimInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
    }
});

searchAgainBtn.addEventListener('click', resetSearch);
tryAgainBtn.addEventListener('click', resetSearch);

// Update CSV button
if (updateCsvBtn) {
    updateCsvBtn.addEventListener('click', () => {
        // Reset data
        parsedData = [];
        isDataLoaded = false;
        hideAllResults();
        
        // Update UI
        updateUIState();
        
        // Tampilkan upload section
        showFileUploadOption();
        
        // Sembunyikan tombol update sementara
        if (updateCsvBtn) {
            updateCsvBtn.classList.add('hidden');
        }
    });
}

// Update UI state based on data loading status
function updateUIState() {
    if (searchBtn) {
        searchBtn.disabled = !isDataLoaded;
    }
    if (nimInput) {
        nimInput.disabled = !isDataLoaded;
        if (!isDataLoaded) {
            nimInput.placeholder = 'Memuat data...';
        } else {
            nimInput.placeholder = 'Masukkan 3 digit terakhir NIM (contoh: 001)';
        }
    }
    if (updateCsvBtn) {
        updateCsvBtn.style.display = isDataLoaded ? 'inline-flex' : 'none';
    }
}

// Initialize: Load CSV on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check if elements exist
    if (!nimInput || !searchBtn || !loading || !result || !error) {
        console.error('Required DOM elements not found');
        document.body.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--error);">Error: Halaman tidak dapat dimuat dengan benar.</div>';
        return;
    }
    
    // Disable UI saat loading
    updateUIState();
    
    await loadCSV();
    
    // Enable UI setelah data dimuat
    updateUIState();
    
    // Focus input setelah data dimuat
    if (isDataLoaded && nimInput) {
        setTimeout(() => {
            nimInput.focus();
        }, 100);
    }
});

// Handle page visibility change (reload data jika perlu)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !isDataLoaded) {
        loadCSV();
    }
});

