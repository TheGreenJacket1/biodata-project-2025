// Global variables
let parsedData = [];
let isDataLoaded = false;
let searchDebounceTimer = null;
let dataLoadTime = null;

// DOM elements
const nimInput = document.getElementById("nimInput");
const searchBtn = document.getElementById("searchBtn");
const loading = document.getElementById("loading");
const result = document.getElementById("result");
const error = document.getElementById("error");
const searchAgainBtn = document.getElementById("searchAgainBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const updateCsvBtn = document.getElementById("updateCsvBtn");
const toastContainer = document.getElementById("toastContainer");
const dataInfo = document.getElementById("dataInfo");
const sortGroupSection = document.getElementById("sortGroupSection");
const sortBySelect = document.getElementById("sortBy");
const groupBySelect = document.getElementById("groupBy");
const filterKelompokSelect = document.getElementById("filterKelompok");
const applySortGroupBtn = document.getElementById("applySortGroupBtn");
const resetSortGroupBtn = document.getElementById("resetSortGroupBtn");
const sortedDataDisplay = document.getElementById("sortedDataDisplay");
const detailModal = document.getElementById("detailModal");
const closeDetailModal = document.getElementById("closeDetailModal");
const detailModalBody = document.getElementById("detailModalBody");

// Platform Detection
function detectPlatform() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const platform = {
    isAndroid: /android/i.test(userAgent),
    isIOS: /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream,
    isMac: /Macintosh|Mac OS X/.test(userAgent),
    isWindows: /Windows/.test(userAgent),
    isMobile:
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      ),
    isTouch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
  };
  return platform;
}

const platform = detectPlatform();

// Toast Notification System
function showToast(message, type = "info", duration = 3000) {
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");

  const icons = {
    success:
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    error:
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    warning:
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };

  const icon = icons[type] || icons.info;
  const sanitizedMessage = sanitizeText(message);

  toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">${sanitizedMessage}</div>
        <button class="toast-close" aria-label="Tutup notifikasi" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    `;

  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // Close button handler
  const closeBtn = toast.querySelector(".toast-close");
  const closeToast = () => {
    toast.classList.remove("show");
    toast.classList.add("hide");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  };

  if (closeBtn) {
    closeBtn.addEventListener("click", closeToast);
  }

  // Auto remove
  if (duration > 0) {
    setTimeout(closeToast, duration);
  }

  return toast;
}

// Parse CSV line dengan dukungan tanda kutip (sama seperti C++)
function parseCSVLine(line) {
  const result = [];
  let field = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (c === '"') {
      insideQuotes = !insideQuotes;
    } else if (c === "," && !insideQuotes) {
      result.push(field.trim());
      field = "";
    } else {
      field += c;
    }
  }
  result.push(field.trim());
  return result;
}

// Sanitize text untuk mencegah XSS
function sanitizeText(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.textContent;
}

// Parse CSV text menjadi data
function parseCSVText(text) {
  try {
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      throw new Error("File CSV tidak valid atau kosong");
    }

    parsedData = [];
    // Skip header (baris pertama)
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = parseCSVLine(lines[i]);
        if (row.length >= 2 && row[1] && row[1].trim() !== "") {
          // Pastikan ada NIM
          parsedData.push({
            no: sanitizeText(row[0] || ""),
            nim: sanitizeText(row[1] || ""),
            nama: sanitizeText(row[2] || ""),
            kelompok: sanitizeText(row[3] || ""),
            ttl: sanitizeText(row[4] || ""),
            instagram: sanitizeText(row[5] || ""),
            hobi: sanitizeText(row[6] || ""),
            golonganDarah: sanitizeText(row[7] || ""),
            alamat: sanitizeText(row[8] || ""),
          });
        }
      } catch (parseError) {
        console.warn(`Error parsing line ${i + 1}:`, parseError);
        // Continue dengan baris berikutnya
      }
    }

    if (parsedData.length === 0) {
      throw new Error("Tidak ada data yang valid dalam file CSV");
    }

    isDataLoaded = true;
    dataLoadTime = new Date();

    // Update data info
    updateDataInfo();

    // Tampilkan tombol update CSV setelah data berhasil dimuat
    if (updateCsvBtn) {
      updateCsvBtn.classList.remove("hidden");
    }

    // Tampilkan sort/group section
    if (sortGroupSection) {
      sortGroupSection.classList.remove("hidden");
    }

    // Populate filter kelompok dropdown
    populateKelompokFilter();

    showToast(
      `Data berhasil dimuat: ${parsedData.length} mahasiswa`,
      "success"
    );
  } catch (error) {
    console.error("Error parsing CSV:", error);
    throw error;
  }
}

// Update data info in footer
function updateDataInfo() {
  if (!dataInfo) return;

  const count = parsedData.length;
  const dateStr = dataLoadTime
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dataLoadTime)
    : "";

  dataInfo.textContent = `${count} data tersedia${
    dateStr ? ` • ${dateStr}` : ""
  }`;
}

// Load CSV file
async function loadCSV() {
  try {
    showLoading();

    // Coba load dari fetch (untuk server/http)
    try {
      const response = await fetch("Biodata_IF_2025 - MAIN.csv");
      if (response.ok) {
        const text = await response.text();
        parseCSVText(text);
        hideLoading();
        return;
      }
    } catch (fetchError) {
      // Jika fetch gagal (file:// protocol), gunakan data embedded
      console.log("Fetch gagal, menggunakan data embedded atau upload file");
    }

    // Jika fetch gagal, coba load dari data embedded
    if (typeof embeddedCSVData !== "undefined" && embeddedCSVData) {
      parseCSVText(embeddedCSVData);
      hideLoading();
      return;
    }

    // Jika tidak ada data embedded, minta user upload file
    throw new Error("FILE_NOT_FOUND");
  } catch (err) {
    console.error("Error loading CSV:", err);
    hideLoading();

    if (err.message === "FILE_NOT_FOUND") {
      // Tampilkan opsi upload file
      showFileUploadOption();
    } else {
      const errorMsg =
        err.message ||
        "Gagal memuat data. Silakan upload file CSV atau pastikan file tersedia.";
      showToast(errorMsg, "error", 5000);
      displayError(errorMsg);
      isDataLoaded = false;
    }
  }
}

// Show file upload option (using safe DOM methods)
function showFileUploadOption() {
  // Cek apakah upload section sudah ada, jika ya jangan buat lagi
  if (document.getElementById("fileUploadSection")) {
    return;
  }

  const searchBox = document.querySelector(".search-box");
  if (!searchBox) return;

  // Create elements safely
  const uploadSection = document.createElement("div");
  uploadSection.id = "fileUploadSection";
  uploadSection.className = "file-upload-section";
  uploadSection.style.cssText =
    "margin-top: 1rem; padding: 1.5rem; background: var(--bg-tertiary); border-radius: 12px; border: 2px dashed var(--border); text-align: center;";

  const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  iconSvg.setAttribute("width", "48");
  iconSvg.setAttribute("height", "48");
  iconSvg.setAttribute("viewBox", "0 0 24 24");
  iconSvg.setAttribute("fill", "none");
  iconSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  iconSvg.style.cssText = "margin-bottom: 1rem; color: var(--text-muted);";
  iconSvg.innerHTML =
    '<path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';

  const heading = document.createElement("h3");
  heading.textContent = "File CSV tidak ditemukan";
  heading.style.cssText = "margin-bottom: 0.5rem; color: var(--text-primary);";

  const paragraph = document.createElement("p");
  paragraph.textContent = "Silakan upload file CSV untuk melanjutkan";
  paragraph.style.cssText =
    "margin-bottom: 1.5rem; color: var(--text-secondary); font-size: 0.9rem;";

  const label = document.createElement("label");
  label.setAttribute("for", "csvFileInput");
  label.style.cssText =
    "display: inline-block; background: var(--gradient); color: white; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;";
  label.textContent = "Pilih File CSV";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "csvFileInput";
  fileInput.accept = ".csv";
  fileInput.style.display = "none";
  fileInput.addEventListener("change", handleFileUpload);

  label.appendChild(fileInput);

  const formatText = document.createElement("p");
  formatText.textContent = "Format: CSV dengan kolom NIM, Nama, dll";
  formatText.style.cssText =
    "margin-top: 1rem; color: var(--text-muted); font-size: 0.85rem;";

  uploadSection.appendChild(iconSvg);
  uploadSection.appendChild(heading);
  uploadSection.appendChild(paragraph);
  uploadSection.appendChild(label);
  uploadSection.appendChild(formatText);

  searchBox.appendChild(uploadSection);
}

// Handle file upload
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.endsWith(".csv")) {
    showToast("Silakan pilih file CSV", "error");
    return;
  }

  showLoading();

  // Hapus upload section sebelum memproses file
  const uploadSection = document.getElementById("fileUploadSection");
  if (uploadSection) {
    uploadSection.remove();
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const text = e.target.result;
      parseCSVText(text);
      hideLoading();

      // Update UI
      updateUIState();

      // Tampilkan tombol update CSV
      if (updateCsvBtn) {
        updateCsvBtn.classList.remove("hidden");
      }

      if (nimInput) {
        nimInput.focus();
      }
    } catch (err) {
      console.error("Error parsing uploaded file:", err);
      hideLoading();
      const errorMsg =
        err.message || "Gagal memuat file. Pastikan format CSV benar.";
      showToast(errorMsg, "error", 5000);
      displayError(errorMsg);
      // Tampilkan kembali upload section jika error
      showFileUploadOption();
    }
  };

  reader.onerror = function () {
    hideLoading();
    const errorMsg = "Gagal membaca file.";
    showToast(errorMsg, "error");
    displayError(errorMsg);
    // Tampilkan kembali upload section jika error
    showFileUploadOption();
  };

  reader.readAsText(file, "UTF-8");
}

// Debounced search function
function debounceSearch(value) {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  searchDebounceTimer = setTimeout(() => {
    if (value.length === 3 && /^\d{3}$/.test(value)) {
      searchBiodata(value);
    }
  }, 400);
}

// Search function
function searchBiodata(last3Digits) {
  // Validasi data sudah dimuat
  if (!isDataLoaded) {
    showToast("Data belum dimuat. Silakan refresh halaman.", "warning");
    return;
  }

  // Validasi input dengan regex ketat
  if (
    !last3Digits ||
    last3Digits.length !== 3 ||
    !/^\d{3}$/.test(last3Digits)
  ) {
    showToast("Masukkan 3 digit angka yang valid", "error");
    return;
  }

  hideAllResults();
  showLoading();

  // Simulate loading delay for better UX
  setTimeout(() => {
    try {
      const found = parsedData.find((item) => {
        if (!item.nim || item.nim.length < 3) return false;
        const last3 = item.nim.slice(-3);
        return last3 === last3Digits;
      });

      hideLoading();

      if (found) {
        displayResult(found);
        showToast("Data ditemukan!", "success", 2000);
      } else {
        displayError();
        showToast(
          "Data tidak ditemukan. Periksa kembali NIM Anda.",
          "warning",
          3000
        );
      }
    } catch (err) {
      console.error("Error searching:", err);
      hideLoading();
      showToast("Terjadi kesalahan saat mencari data", "error");
      displayError("Terjadi kesalahan saat mencari data");
    }
  }, 500);
}

// Display result
function displayResult(data) {
  try {
    const elements = {
      no: document.getElementById("no"),
      nim: document.getElementById("nim"),
      nama: document.getElementById("nama"),
      kelompok: document.getElementById("kelompok"),
      ttl: document.getElementById("ttl"),
      instagram: document.getElementById("instagram"),
      hobi: document.getElementById("hobi"),
      golonganDarah: document.getElementById("golonganDarah"),
      alamat: document.getElementById("alamat"),
    };

    // Use textContent for security
    if (elements.no) elements.no.textContent = data.no || "-";
    if (elements.nim) elements.nim.textContent = data.nim || "-";
    if (elements.nama) elements.nama.textContent = data.nama || "-";
    if (elements.kelompok) elements.kelompok.textContent = data.kelompok || "-";
    if (elements.ttl) elements.ttl.textContent = data.ttl || "-";
    if (elements.instagram)
      elements.instagram.textContent = data.instagram || "-";
    if (elements.hobi) elements.hobi.textContent = data.hobi || "-";
    if (elements.golonganDarah)
      elements.golonganDarah.textContent = data.golonganDarah || "-";
    if (elements.alamat) elements.alamat.textContent = data.alamat || "-";

    if (result) result.classList.remove("hidden");
    if (error) error.classList.add("hidden");

    // Scroll to result smoothly
    if (result) {
      setTimeout(() => {
        result.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  } catch (err) {
    console.error("Error displaying result:", err);
    showToast("Terjadi kesalahan saat menampilkan hasil", "error");
  }
}

// Display error
function displayError(message) {
  if (result) result.classList.add("hidden");
  if (error) error.classList.remove("hidden");

  // Update error message jika ada custom message
  const errorText = document.getElementById("errorMessage");
  if (errorText) {
    errorText.textContent = message
      ? sanitizeText(message)
      : "Mohon periksa kembali 3 digit terakhir NIM yang Anda masukkan";
  }
}

// Show loading
function showLoading() {
  if (loading) loading.classList.remove("hidden");
  if (result) result.classList.add("hidden");
  if (error) error.classList.add("hidden");
}

// Hide loading
function hideLoading() {
  if (loading) loading.classList.add("hidden");
}

// Hide all results
function hideAllResults() {
  if (result) result.classList.add("hidden");
  if (error) error.classList.add("hidden");
}

// Reset search
function resetSearch() {
  hideAllResults();

  // Remove sticky from search section
  const searchSection = document.querySelector(".search-section");
  if (searchSection) {
    searchSection.classList.remove("sticky");
  }

  // Hide sorted data display
  if (sortedDataDisplay) {
    sortedDataDisplay.classList.add("hidden");
  }

  if (nimInput) {
    nimInput.value = "";
    nimInput.focus();
  }
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;
  }
}

// Validate input (only numbers, max 3 digits) and auto-format
function validateInput(value) {
  // Remove non-numeric characters
  const numeric = value.replace(/\D/g, "").slice(0, 3);

  // Auto-format: pad with leading zeros if less than 3 digits
  // But only if user has finished typing (not while typing)
  return numeric;
}

// Format NIM input with leading zeros
function formatNIMInput(value) {
  const numeric = value.replace(/\D/g, "");
  if (numeric.length === 0) return "";

  // If user types 1, 11, etc., pad to 3 digits
  // But only pad when input loses focus or when searching
  return numeric.padStart(3, "0").slice(0, 3);
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    const activeElement = document.activeElement;
    const isInputFocused =
      activeElement === nimInput ||
      activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA" ||
      activeElement.tagName === "SELECT" ||
      activeElement.isContentEditable;

    // Handle Escape key
    if (e.key === "Escape" || e.keyCode === 27) {
      if (isInputFocused && nimInput && nimInput.value) {
        e.preventDefault();
        nimInput.value = "";
        nimInput.focus();
      } else if (!isInputFocused) {
        resetSearch();
      }
      return;
    }

    // Prevent shortcuts when typing in input/textarea/select
    if (isInputFocused) {
      return;
    }

    // Focus search input with '/' key
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      if (nimInput && isDataLoaded) {
        nimInput.focus();
        if (nimInput.value) {
          nimInput.select();
        }
      }
    }

    // Ctrl/Cmd + K to focus search (common shortcut)
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (nimInput && isDataLoaded) {
        nimInput.focus();
        if (nimInput.value) {
          nimInput.select();
        }
      }
    }

    // Ctrl/Cmd + S to toggle sort/group section
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      toggleSortGroupSection();
    }
  });
}

// Event listeners
if (searchBtn) {
  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    let input = validateInput(nimInput ? nimInput.value : "");

    // Auto-format if less than 3 digits
    if (input.length > 0 && input.length < 3) {
      input = formatNIMInput(input);
      if (nimInput) {
        nimInput.value = input;
      }
    }

    if (input.length === 3) {
      searchBiodata(input);
    } else {
      showToast("Masukkan 3 digit terakhir NIM", "warning");
      if (nimInput) nimInput.focus();
    }
  });
}

if (nimInput) {
  nimInput.addEventListener("input", (e) => {
    const validated = validateInput(e.target.value);
    e.target.value = validated;

    // Debounced search for better UX
    if (validated.length === 3 && /^\d{3}$/.test(validated)) {
      debounceSearch(validated);
    }
  });

  // Auto-format on blur (when user leaves input)
  nimInput.addEventListener("blur", (e) => {
    const value = e.target.value;
    if (value && value.length > 0 && value.length < 3) {
      const formatted = formatNIMInput(value);
      e.target.value = formatted;
      if (formatted.length === 3) {
        searchBiodata(formatted);
      }
    }
  });

  nimInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      let input = validateInput(e.target.value);

      // Auto-format if less than 3 digits
      if (input.length > 0 && input.length < 3) {
        input = formatNIMInput(input);
        e.target.value = input;
      }

      if (input.length === 3) {
        if (searchDebounceTimer) {
          clearTimeout(searchDebounceTimer);
        }
        searchBiodata(input);
      } else {
        showToast("Masukkan 3 digit terakhir NIM", "warning");
      }
    }
  });

  // Prevent form submission jika ada form
  nimInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  });
}

if (searchAgainBtn) {
  searchAgainBtn.addEventListener("click", resetSearch);
}

if (tryAgainBtn) {
  tryAgainBtn.addEventListener("click", resetSearch);
}

// Reset Sort/Group Function
function resetSortGroup() {
  // Reset all selects to default
  if (sortBySelect) {
    sortBySelect.value = "none";
  }
  if (groupBySelect) {
    groupBySelect.value = "none";
  }
  if (filterKelompokSelect) {
    filterKelompokSelect.value = "all";
  }

  // Clear sorted data display
  if (sortedDataDisplay) {
    while (sortedDataDisplay.firstChild) {
      sortedDataDisplay.removeChild(sortedDataDisplay.firstChild);
    }
    sortedDataDisplay.classList.add("hidden");
  }

  // Remove sticky from search section
  const searchSection = document.querySelector(".search-section");
  if (searchSection) {
    searchSection.classList.remove("sticky");
  }

  // Show success message
  showToast("Filter, sort, dan group telah direset", "success", 2000);
}

// Sort/Group event listeners
if (applySortGroupBtn) {
  applySortGroupBtn.addEventListener("click", applySortGroup);
}

if (resetSortGroupBtn) {
  resetSortGroupBtn.addEventListener("click", resetSortGroup);
}

if (sortBySelect && groupBySelect) {
  [sortBySelect, groupBySelect].forEach((select) => {
    select.addEventListener("change", () => {
      // Auto-apply on change (optional, bisa di-comment jika ingin manual)
      // applySortGroup();
    });
  });
}

if (filterKelompokSelect) {
  filterKelompokSelect.addEventListener("change", () => {
    // Auto-apply on change (optional)
    // applySortGroup();
  });
}

// Modal event listeners
if (closeDetailModal) {
  closeDetailModal.addEventListener("click", closeDetailModalFunc);
}

if (detailModal) {
  // Close on overlay click
  const overlay = detailModal.querySelector(".detail-modal-overlay");
  if (overlay) {
    overlay.addEventListener("click", closeDetailModalFunc);
  }

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !detailModal.classList.contains("hidden")) {
      closeDetailModalFunc();
    }
  });
}

// Update CSV button
if (updateCsvBtn) {
  updateCsvBtn.addEventListener("click", () => {
    // Reset data
    parsedData = [];
    isDataLoaded = false;
    dataLoadTime = null;
    hideAllResults();

    // Update UI
    updateUIState();

    // Tampilkan upload section
    showFileUploadOption();

    // Sembunyikan tombol update sementara
    if (updateCsvBtn) {
      updateCsvBtn.classList.add("hidden");
    }

    if (dataInfo) {
      dataInfo.textContent = "";
    }

    showToast("Silakan upload file CSV baru", "info");
  });
}

// Populate Kelompok Filter
function populateKelompokFilter() {
  if (!filterKelompokSelect) return;

  // Get unique kelompok values
  const kelompokSet = new Set();
  parsedData.forEach((item) => {
    if (item.kelompok && item.kelompok.trim() !== "") {
      kelompokSet.add(item.kelompok.trim());
    }
  });

  // Sort kelompok alphabetically
  const kelompokList = Array.from(kelompokSet).sort((a, b) =>
    a.localeCompare(b, "id")
  );

  // Clear existing options except "all"
  filterKelompokSelect.innerHTML =
    '<option value="all">Semua Kelompok</option>';

  // Add kelompok options
  kelompokList.forEach((kelompok) => {
    const option = document.createElement("option");
    option.value = kelompok;
    option.textContent = kelompok;
    filterKelompokSelect.appendChild(option);
  });
}

// Filter data by kelompok
function filterByKelompok(data, kelompokFilter) {
  if (!kelompokFilter || kelompokFilter === "all") {
    return data;
  }
  return data.filter((item) => item.kelompok === kelompokFilter);
}

// Sort and Group Functions
function sortData(data, sortBy) {
  if (!sortBy || sortBy === "none") return [...data];

  const sorted = [...data];
  switch (sortBy) {
    case "nim":
      return sorted.sort((a, b) => {
        const nimA = parseInt(a.nim) || 0;
        const nimB = parseInt(b.nim) || 0;
        return nimA - nimB;
      });
    case "nim-desc":
      return sorted.sort((a, b) => {
        const nimA = parseInt(a.nim) || 0;
        const nimB = parseInt(b.nim) || 0;
        return nimB - nimA;
      });
    case "nama":
      return sorted.sort((a, b) => {
        const namaA = (a.nama || "").toLowerCase();
        const namaB = (b.nama || "").toLowerCase();
        return namaA.localeCompare(namaB, "id");
      });
    case "nama-desc":
      return sorted.sort((a, b) => {
        const namaA = (a.nama || "").toLowerCase();
        const namaB = (b.nama || "").toLowerCase();
        return namaB.localeCompare(namaA, "id");
      });
    case "kelompok":
      return sorted.sort((a, b) => {
        const kelompokA = (a.kelompok || "").toLowerCase();
        const kelompokB = (b.kelompok || "").toLowerCase();
        return kelompokA.localeCompare(kelompokB, "id");
      });
    case "no":
      return sorted.sort((a, b) => {
        const noA = parseInt(a.no) || 0;
        const noB = parseInt(b.no) || 0;
        return noA - noB;
      });
    default:
      return sorted;
  }
}

function groupData(data, groupBy) {
  if (!groupBy || groupBy === "none") return null;

  const grouped = {};
  data.forEach((item) => {
    const key = item[groupBy] || "Tidak Diketahui";
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });

  return grouped;
}

function displaySortedData(sortedData, groupedData) {
  if (!sortedDataDisplay) return;

  // Clear previous content efficiently
  while (sortedDataDisplay.firstChild) {
    sortedDataDisplay.removeChild(sortedDataDisplay.firstChild);
  }

  sortedDataDisplay.classList.remove("hidden");

  // Make search section sticky when data is displayed
  const searchSection = document.querySelector(".search-section");
  if (searchSection) {
    searchSection.classList.add("sticky");
  }

  // Use requestAnimationFrame for smooth rendering
  requestAnimationFrame(() => {
    if (groupedData) {
      // Display grouped data
      const groups = Object.keys(groupedData).sort();
      const fragment = document.createDocumentFragment();

      groups.forEach((groupKey, index) => {
        const groupDiv = document.createElement("div");
        groupDiv.className = "data-group";
        groupDiv.style.animationDelay = `${index * 0.1}s`;

        const groupHeader = document.createElement("div");
        groupHeader.className = "group-header";
        const groupLabel =
          groupBySelect.options[groupBySelect.selectedIndex].text;
        groupHeader.textContent = `${groupLabel}: ${groupKey} (${groupedData[groupKey].length})`;
        groupDiv.appendChild(groupHeader);

        const groupContent = document.createElement("div");
        groupContent.className = "group-content";

        // Use fragment for better performance
        const cardFragment = document.createDocumentFragment();
        groupedData[groupKey].forEach((item) => {
          cardFragment.appendChild(createDataCard(item));
        });
        groupContent.appendChild(cardFragment);
        groupDiv.appendChild(groupContent);

        fragment.appendChild(groupDiv);
      });

      sortedDataDisplay.appendChild(fragment);
    } else {
      // Display flat sorted data
      const fragment = document.createDocumentFragment();
      sortedData.forEach((item, index) => {
        const card = createDataCard(item);
        card.style.animationDelay = `${index * 0.05}s`;
        fragment.appendChild(card);
      });
      sortedDataDisplay.appendChild(fragment);
    }

    // Scroll to display
    setTimeout(() => {
      sortedDataDisplay.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  });
}

function createDataCard(item) {
  const card = document.createElement("div");
  card.className = "data-card";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute(
    "aria-label",
    `Detail biodata ${sanitizeText(item.nama || "")}`
  );

  // Store full item data in data attribute for modal
  card.dataset.itemData = JSON.stringify(item);

  // Add click handler
  card.addEventListener("click", () => {
    showDetailModal(item);
  });

  // Add keyboard support
  card.addEventListener("keypress", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      showDetailModal(item);
    }
  });

  // Use safe DOM methods instead of innerHTML
  const header = document.createElement("div");
  header.className = "data-card-header";

  const nimSpan = document.createElement("span");
  nimSpan.className = "data-card-nim";
  nimSpan.textContent = sanitizeText(item.nim || "-");

  const noSpan = document.createElement("span");
  noSpan.className = "data-card-no";
  noSpan.textContent = `#${sanitizeText(item.no || "-")}`;

  header.appendChild(nimSpan);
  header.appendChild(noSpan);

  const body = document.createElement("div");
  body.className = "data-card-body";

  const nameH4 = document.createElement("h4");
  nameH4.className = "data-card-name";
  nameH4.textContent = sanitizeText(item.nama || "-");

  const details = document.createElement("div");
  details.className = "data-card-details";

  const kelompokDetail = document.createElement("span");
  kelompokDetail.className = "data-card-detail";
  const kelompokStrong = document.createElement("strong");
  kelompokStrong.textContent = "Kelompok: ";
  kelompokDetail.appendChild(kelompokStrong);
  kelompokDetail.appendChild(
    document.createTextNode(sanitizeText(item.kelompok || "-"))
  );

  const darahDetail = document.createElement("span");
  darahDetail.className = "data-card-detail";
  const darahStrong = document.createElement("strong");
  darahStrong.textContent = "Gol. Darah: ";
  darahDetail.appendChild(darahStrong);
  darahDetail.appendChild(
    document.createTextNode(sanitizeText(item.golonganDarah || "-"))
  );

  details.appendChild(kelompokDetail);
  details.appendChild(darahDetail);

  if (item.instagram) {
    const instagramDetail = document.createElement("span");
    instagramDetail.className = "data-card-detail";
    const instagramStrong = document.createElement("strong");
    instagramStrong.textContent = "Instagram: ";
    instagramDetail.appendChild(instagramStrong);
    instagramDetail.appendChild(
      document.createTextNode(sanitizeText(item.instagram))
    );
    details.appendChild(instagramDetail);
  }

  // Add click hint
  const clickHint = document.createElement("span");
  clickHint.className = "data-card-hint";
  clickHint.textContent = "Klik untuk detail lengkap";

  body.appendChild(nameH4);
  body.appendChild(details);
  body.appendChild(clickHint);

  card.appendChild(header);
  card.appendChild(body);

  return card;
}

// Show Detail Modal
function showDetailModal(item) {
  if (!detailModal || !detailModalBody) return;

  // Populate modal with full details
  detailModalBody.innerHTML = "";

  const detailCard = document.createElement("div");
  detailCard.className = "detail-card";

  const fields = [
    { label: "No", value: item.no },
    { label: "NIM", value: item.nim },
    { label: "Nama Mahasiswa", value: item.nama },
    { label: "Kelompok", value: item.kelompok },
    { label: "Tempat, Tanggal Lahir", value: item.ttl },
    { label: "Instagram", value: item.instagram },
    { label: "Hobi", value: item.hobi },
    { label: "Golongan Darah", value: item.golonganDarah },
    { label: "Alamat saat ini", value: item.alamat, fullWidth: true },
  ];

  fields.forEach((field) => {
    if (field.value) {
      const detailItem = document.createElement("div");
      detailItem.className = `detail-item ${
        field.fullWidth ? "full-width" : ""
      }`;

      const label = document.createElement("span");
      label.className = "detail-label";
      label.textContent = field.label;

      const value = document.createElement("span");
      value.className = "detail-value";
      value.textContent = sanitizeText(field.value);

      detailItem.appendChild(label);
      detailItem.appendChild(value);
      detailCard.appendChild(detailItem);
    }
  });

  detailModalBody.appendChild(detailCard);
  detailModal.classList.remove("hidden");

  // Prevent body scroll but allow modal scroll
  document.body.style.overflow = "hidden";

  // Reset modal scroll position
  detailModal.scrollTop = 0;
  if (detailModalBody) {
    detailModalBody.scrollTop = 0;
  }

  // Focus on close button for accessibility
  if (closeDetailModal) {
    setTimeout(() => {
      closeDetailModal.focus();
      // Scroll modal to top
      detailModal.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  }
}

// Close Detail Modal
function closeDetailModalFunc() {
  if (detailModal) {
    detailModal.classList.add("hidden");
    document.body.style.overflow = "";
    // Scroll modal to top when closing
    detailModal.scrollTop = 0;
  }
}

function toggleSortGroupSection() {
  if (!sortGroupSection) return;
  sortGroupSection.classList.toggle("hidden");
  if (!sortGroupSection.classList.contains("hidden")) {
    sortGroupSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function applySortGroup() {
  if (!isDataLoaded || parsedData.length === 0) {
    showToast("Data belum dimuat", "warning");
    return;
  }

  const sortBy = sortBySelect ? sortBySelect.value : "none";
  const groupBy = groupBySelect ? groupBySelect.value : "none";
  const filterKelompok = filterKelompokSelect
    ? filterKelompokSelect.value
    : "all";

  // Show loading state
  if (sortedDataDisplay) {
    sortedDataDisplay.classList.add("hidden");
  }

  // Use setTimeout to allow UI to update
  setTimeout(() => {
    try {
      // First filter by kelompok
      let filteredData = filterByKelompok(parsedData, filterKelompok);

      // Then sort
      let sortedData = sortData(filteredData, sortBy);

      // Then group
      let groupedData = null;
      if (groupBy !== "none") {
        groupedData = groupData(sortedData, groupBy);
      }

      displaySortedData(sortedData, groupedData);

      const sortText = sortBySelect.options[sortBySelect.selectedIndex].text;
      const groupText =
        groupBy !== "none"
          ? `, dikelompokkan per ${
              groupBySelect.options[groupBySelect.selectedIndex].text
            }`
          : "";
      const filterText =
        filterKelompok !== "all" ? `, filter: ${filterKelompok}` : "";
      showToast(
        `Data diurutkan: ${sortText}${groupText}${filterText}`,
        "success",
        3000
      );
    } catch (err) {
      console.error("Error applying sort/group:", err);
      showToast("Terjadi kesalahan saat mengurutkan data", "error");
    }
  }, 50);
}

// Update UI state based on data loading status
function updateUIState() {
  if (searchBtn) {
    searchBtn.disabled = !isDataLoaded;
  }
  if (nimInput) {
    nimInput.disabled = !isDataLoaded;
    if (!isDataLoaded) {
      nimInput.placeholder = "Memuat data...";
    } else {
      nimInput.placeholder = "Masukkan 3 digit terakhir NIM (contoh: 001)";
    }
  }
  if (updateCsvBtn) {
    updateCsvBtn.style.display = isDataLoaded ? "inline-flex" : "none";
  }
  if (sortGroupSection) {
    sortGroupSection.style.display = isDataLoaded ? "block" : "none";
  }
}

// Initialize: Load CSV on page load
document.addEventListener("DOMContentLoaded", async () => {
  // Check if elements exist
  if (!nimInput || !searchBtn || !loading || !result || !error) {
    console.error("Required DOM elements not found");
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText =
      "padding: 2rem; text-align: center; color: var(--error);";
    errorDiv.textContent = "Error: Halaman tidak dapat dimuat dengan benar.";
    if (document.body) {
      document.body.innerHTML = "";
      document.body.appendChild(errorDiv);
    }
    return;
  }

  // Setup keyboard shortcuts
  setupKeyboardShortcuts();

  // Disable UI saat loading
  updateUIState();

  try {
    await loadCSV();
  } catch (err) {
    console.error("Failed to load CSV:", err);
    showToast("Gagal memuat data. Silakan refresh halaman.", "error", 5000);
  }

  // Enable UI setelah data dimuat
  updateUIState();

  // Focus input setelah data dimuat
  if (isDataLoaded && nimInput) {
    setTimeout(() => {
      nimInput.focus();
    }, 100);
  }

  // Show platform-specific hint
  if (platform.isMobile) {
    setTimeout(() => {
      showToast("Gunakan keyboard untuk memasukkan 3 digit NIM", "info", 3000);
    }, 1500);
  }
});

// Handle page visibility change (reload data jika perlu)
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !isDataLoaded) {
    loadCSV();
  }
});

// Global error handler
window.addEventListener("error", (e) => {
  console.error("Global error:", e.error);
  if (toastContainer) {
    showToast("Terjadi kesalahan. Silakan refresh halaman.", "error", 5000);
  }
});

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
  if (toastContainer) {
    showToast("Terjadi kesalahan. Silakan refresh halaman.", "error", 5000);
  }
});
