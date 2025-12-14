// Global variables
let parsedData = [];
let isDataLoaded = false;
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

// Parse CSV line with quote support
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

// Sanitize text to prevent XSS
function sanitizeText(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.textContent;
}

// Parse CSV text to data
function parseCSVText(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error("File CSV tidak valid atau kosong");
  }

  parsedData = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length >= 2 && row[1] && row[1].trim() !== "") {
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
  }

  if (parsedData.length === 0) {
    throw new Error("Tidak ada data yang valid dalam file CSV");
  }

  isDataLoaded = true;
  dataLoadTime = new Date();

  updateDataInfo();

  if (updateCsvBtn) {
    updateCsvBtn.classList.remove("hidden");
  }

  if (sortGroupSection) {
    sortGroupSection.classList.remove("hidden");
  }

  populateKelompokFilter();
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
  dataInfo.textContent = `${count} data tersedia${dateStr ? ` • ${dateStr}` : ""}`;
}

// Load CSV file
async function loadCSV() {
  showLoading();
  try {
    const response = await fetch("Biodata_IF_2025 - MAIN.csv");
    if (response.ok) {
      const text = await response.text();
      parseCSVText(text);
      hideLoading();
      return;
    }
  } catch (fetchError) {
    console.log("Fetch gagal, gunakan upload file");
  }

  if (typeof embeddedCSVData !== "undefined" && embeddedCSVData) {
    parseCSVText(embeddedCSVData);
    hideLoading();
    return;
  }

  hideLoading();
  showFileUploadOption();
}

// Show file upload option
function showFileUploadOption() {
  if (document.getElementById("fileUploadSection")) return;

  const searchBox = document.querySelector(".search-box");
  if (!searchBox) return;

  const uploadSection = document.createElement("div");
  uploadSection.id = "fileUploadSection";
  uploadSection.className = "file-upload-section";

  const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  iconSvg.setAttribute("width", "48");
  iconSvg.setAttribute("height", "48");
  iconSvg.setAttribute("viewBox", "0 0 24 24");
  iconSvg.setAttribute("fill", "none");
  iconSvg.style.cssText = "margin-bottom: 1rem; color: var(--text-muted);";
  iconSvg.innerHTML =
    '<path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';

  const heading = document.createElement("h3");
  heading.textContent = "File CSV tidak ditemukan";

  const paragraph = document.createElement("p");
  paragraph.textContent = "Silakan upload file CSV untuk melanjutkan";
  paragraph.style.marginBottom = "1.5rem";

  const label = document.createElement("label");
  label.setAttribute("for", "csvFileInput");
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
  formatText.style.marginTop = "1rem";

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
    alert("Silakan pilih file CSV");
    return;
  }

  showLoading();

  const uploadSection = document.getElementById("fileUploadSection");
  if (uploadSection) uploadSection.remove();

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      parseCSVText(e.target.result);
      hideLoading();
      updateUIState();
      if (nimInput) nimInput.focus();
    } catch (err) {
      hideLoading();
      alert("Gagal memuat file: " + err.message);
      showFileUploadOption();
    }
  };

  reader.onerror = function () {
    hideLoading();
    alert("Gagal membaca file.");
    showFileUploadOption();
  };

  reader.readAsText(file, "UTF-8");
}

// Search function
function searchBiodata(last3Digits) {
  if (!isDataLoaded) {
    alert("Data belum dimuat. Silakan refresh halaman.");
    return;
  }

  if (!last3Digits || last3Digits.length !== 3 || !/^\d{3}$/.test(last3Digits)) {
    alert("Masukkan 3 digit angka yang valid");
    return;
  }

  hideAllResults();
  showLoading();

  // Immediate search - no artificial delay
  const found = parsedData.find((item) => {
    if (!item.nim || item.nim.length < 3) return false;
    return item.nim.slice(-3) === last3Digits;
  });

  hideLoading();

  if (found) {
    displayResult(found);
  } else {
    displayError();
  }
}

// Display result
function displayResult(data) {
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

  if (elements.no) elements.no.textContent = data.no || "-";
  if (elements.nim) elements.nim.textContent = data.nim || "-";
  if (elements.nama) elements.nama.textContent = data.nama || "-";
  if (elements.kelompok) elements.kelompok.textContent = data.kelompok || "-";
  if (elements.ttl) elements.ttl.textContent = data.ttl || "-";
  if (elements.instagram) elements.instagram.textContent = data.instagram || "-";
  if (elements.hobi) elements.hobi.textContent = data.hobi || "-";
  if (elements.golonganDarah) elements.golonganDarah.textContent = data.golonganDarah || "-";
  if (elements.alamat) elements.alamat.textContent = data.alamat || "-";

  if (result) result.classList.remove("hidden");
  if (error) error.classList.add("hidden");
}

// Display error
function displayError(message) {
  if (result) result.classList.add("hidden");
  if (error) error.classList.remove("hidden");

  const errorText = document.getElementById("errorMessage");
  if (errorText) {
    errorText.textContent = message || "Mohon periksa kembali 3 digit terakhir NIM yang Anda masukkan";
  }
}

// Show/Hide loading
function showLoading() {
  if (loading) loading.classList.remove("hidden");
  if (result) result.classList.add("hidden");
  if (error) error.classList.add("hidden");
}

function hideLoading() {
  if (loading) loading.classList.add("hidden");
}

function hideAllResults() {
  if (result) result.classList.add("hidden");
  if (error) error.classList.add("hidden");
}

// Reset search
function resetSearch() {
  hideAllResults();
  if (sortedDataDisplay) sortedDataDisplay.classList.add("hidden");
  if (nimInput) {
    nimInput.value = "";
    nimInput.focus();
  }
}

// Validate input
function validateInput(value) {
  return value.replace(/\D/g, "").slice(0, 3);
}

function formatNIMInput(value) {
  const numeric = value.replace(/\D/g, "");
  if (numeric.length === 0) return "";
  return numeric.padStart(3, "0").slice(0, 3);
}

// Event listeners
if (searchBtn) {
  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    let input = validateInput(nimInput ? nimInput.value : "");
    if (input.length > 0 && input.length < 3) {
      input = formatNIMInput(input);
      if (nimInput) nimInput.value = input;
    }
    if (input.length === 3) {
      searchBiodata(input);
    } else {
      alert("Masukkan 3 digit terakhir NIM");
      if (nimInput) nimInput.focus();
    }
  });
}

if (nimInput) {
  nimInput.addEventListener("input", (e) => {
    e.target.value = validateInput(e.target.value);
  });

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
      if (input.length > 0 && input.length < 3) {
        input = formatNIMInput(input);
        e.target.value = input;
      }
      if (input.length === 3) {
        searchBiodata(input);
      } else {
        alert("Masukkan 3 digit terakhir NIM");
      }
    }
  });

  nimInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.preventDefault();
  });
}

if (searchAgainBtn) searchAgainBtn.addEventListener("click", resetSearch);
if (tryAgainBtn) tryAgainBtn.addEventListener("click", resetSearch);

// Keyboard shortcut: focus with /
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
    const active = document.activeElement;
    if (active.tagName !== "INPUT" && active.tagName !== "TEXTAREA" && active.tagName !== "SELECT") {
      e.preventDefault();
      if (nimInput && isDataLoaded) {
        nimInput.focus();
        if (nimInput.value) nimInput.select();
      }
    }
  }
  
  // Close modal with Escape
  if (e.key === "Escape" && detailModal && !detailModal.classList.contains("hidden")) {
    closeDetailModalFunc();
  }
});

// Populate Kelompok Filter
function populateKelompokFilter() {
  if (!filterKelompokSelect) return;

  const kelompokSet = new Set();
  parsedData.forEach((item) => {
    if (item.kelompok && item.kelompok.trim() !== "") {
      kelompokSet.add(item.kelompok.trim());
    }
  });

  const kelompokList = Array.from(kelompokSet).sort((a, b) => a.localeCompare(b, "id"));
  filterKelompokSelect.innerHTML = '<option value="all">Semua Kelompok</option>';

  kelompokList.forEach((kelompok) => {
    const option = document.createElement("option");
    option.value = kelompok;
    option.textContent = kelompok;
    filterKelompokSelect.appendChild(option);
  });
}

// Filter, Sort, Group functions
function filterByKelompok(data, kelompokFilter) {
  if (!kelompokFilter || kelompokFilter === "all") return data;
  return data.filter((item) => item.kelompok === kelompokFilter);
}

function sortData(data, sortBy) {
  if (!sortBy || sortBy === "none") return [...data];

  const sorted = [...data];
  switch (sortBy) {
    case "nim":
      return sorted.sort((a, b) => (parseInt(a.nim) || 0) - (parseInt(b.nim) || 0));
    case "nim-desc":
      return sorted.sort((a, b) => (parseInt(b.nim) || 0) - (parseInt(a.nim) || 0));
    case "nama":
      return sorted.sort((a, b) => (a.nama || "").localeCompare(b.nama || "", "id"));
    case "nama-desc":
      return sorted.sort((a, b) => (b.nama || "").localeCompare(a.nama || "", "id"));
    case "kelompok":
      return sorted.sort((a, b) => (a.kelompok || "").localeCompare(b.kelompok || "", "id"));
    case "no":
      return sorted.sort((a, b) => (parseInt(a.no) || 0) - (parseInt(b.no) || 0));
    default:
      return sorted;
  }
}

function groupData(data, groupBy) {
  if (!groupBy || groupBy === "none") return null;

  const grouped = {};
  data.forEach((item) => {
    const key = item[groupBy] || "Tidak Diketahui";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  return grouped;
}

function displaySortedData(sortedData, groupedData) {
  if (!sortedDataDisplay) return;

  sortedDataDisplay.innerHTML = "";
  sortedDataDisplay.classList.remove("hidden");

  if (groupedData) {
    const groups = Object.keys(groupedData).sort();
    groups.forEach((groupKey) => {
      const groupDiv = document.createElement("div");
      groupDiv.className = "data-group";

      const groupHeader = document.createElement("div");
      groupHeader.className = "group-header";
      const groupLabel = groupBySelect.options[groupBySelect.selectedIndex].text;
      groupHeader.textContent = `${groupLabel}: ${groupKey} (${groupedData[groupKey].length})`;
      groupDiv.appendChild(groupHeader);

      const groupContent = document.createElement("div");
      groupContent.className = "group-content";
      groupedData[groupKey].forEach((item) => {
        groupContent.appendChild(createDataCard(item));
      });
      groupDiv.appendChild(groupContent);

      sortedDataDisplay.appendChild(groupDiv);
    });
  } else {
    const container = document.createElement("div");
    container.className = "group-content";
    sortedData.forEach((item) => container.appendChild(createDataCard(item)));
    sortedDataDisplay.appendChild(container);
  }
}

function createDataCard(item) {
  const card = document.createElement("div");
  card.className = "data-card";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");

  card.addEventListener("click", () => showDetailModal(item));
  card.addEventListener("keypress", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      showDetailModal(item);
    }
  });

  const header = document.createElement("div");
  header.className = "data-card-header";

  const nimSpan = document.createElement("span");
  nimSpan.className = "data-card-nim";
  nimSpan.textContent = item.nim || "-";

  const noSpan = document.createElement("span");
  noSpan.className = "data-card-no";
  noSpan.textContent = `#${item.no || "-"}`;

  header.appendChild(nimSpan);
  header.appendChild(noSpan);

  const body = document.createElement("div");
  body.className = "data-card-body";

  const nameH4 = document.createElement("h4");
  nameH4.className = "data-card-name";
  nameH4.textContent = item.nama || "-";

  const details = document.createElement("div");
  details.className = "data-card-details";

  const kelompokDetail = document.createElement("span");
  kelompokDetail.className = "data-card-detail";
  kelompokDetail.innerHTML = `<strong>Kelompok:</strong> ${sanitizeText(item.kelompok || "-")}`;

  const darahDetail = document.createElement("span");
  darahDetail.className = "data-card-detail";
  darahDetail.innerHTML = `<strong>Gol. Darah:</strong> ${sanitizeText(item.golonganDarah || "-")}`;

  details.appendChild(kelompokDetail);
  details.appendChild(darahDetail);

  const hint = document.createElement("span");
  hint.className = "data-card-hint";
  hint.textContent = "Klik untuk detail";

  body.appendChild(nameH4);
  body.appendChild(details);
  body.appendChild(hint);

  card.appendChild(header);
  card.appendChild(body);

  return card;
}

// Detail Modal
function showDetailModal(item) {
  if (!detailModal || !detailModalBody) return;

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
      detailItem.className = `detail-item ${field.fullWidth ? "full-width" : ""}`;

      const label = document.createElement("span");
      label.className = "detail-label";
      label.textContent = field.label;

      const value = document.createElement("span");
      value.className = "detail-value";
      value.textContent = field.value;

      detailItem.appendChild(label);
      detailItem.appendChild(value);
      detailCard.appendChild(detailItem);
    }
  });

  detailModalBody.appendChild(detailCard);
  detailModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  if (closeDetailModal) closeDetailModal.focus();
}

function closeDetailModalFunc() {
  if (detailModal) {
    detailModal.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

// Sort/Group controls
if (applySortGroupBtn) {
  applySortGroupBtn.addEventListener("click", () => {
    if (!isDataLoaded || parsedData.length === 0) {
      alert("Data belum dimuat");
      return;
    }

    const sortBy = sortBySelect ? sortBySelect.value : "none";
    const groupBy = groupBySelect ? groupBySelect.value : "none";
    const filterKelompok = filterKelompokSelect ? filterKelompokSelect.value : "all";

    let filteredData = filterByKelompok(parsedData, filterKelompok);
    let sortedData = sortData(filteredData, sortBy);
    let groupedData = groupBy !== "none" ? groupData(sortedData, groupBy) : null;

    displaySortedData(sortedData, groupedData);
  });
}

if (resetSortGroupBtn) {
  resetSortGroupBtn.addEventListener("click", () => {
    if (sortBySelect) sortBySelect.value = "none";
    if (groupBySelect) groupBySelect.value = "none";
    if (filterKelompokSelect) filterKelompokSelect.value = "all";
    if (sortedDataDisplay) {
      sortedDataDisplay.innerHTML = "";
      sortedDataDisplay.classList.add("hidden");
    }
  });
}

// Modal close handlers
if (closeDetailModal) closeDetailModal.addEventListener("click", closeDetailModalFunc);

if (detailModal) {
  const overlay = detailModal.querySelector(".detail-modal-overlay");
  if (overlay) overlay.addEventListener("click", closeDetailModalFunc);
}

// Update CSV button
if (updateCsvBtn) {
  updateCsvBtn.addEventListener("click", () => {
    parsedData = [];
    isDataLoaded = false;
    dataLoadTime = null;
    hideAllResults();
    updateUIState();
    showFileUploadOption();
    if (updateCsvBtn) updateCsvBtn.classList.add("hidden");
    if (dataInfo) dataInfo.textContent = "";
  });
}

// Update UI state
function updateUIState() {
  if (searchBtn) searchBtn.disabled = !isDataLoaded;
  if (nimInput) {
    nimInput.disabled = !isDataLoaded;
    nimInput.placeholder = isDataLoaded ? "Masukkan 3 digit terakhir NIM (contoh: 001)" : "Memuat data...";
  }
  if (updateCsvBtn) updateCsvBtn.style.display = isDataLoaded ? "inline-flex" : "none";
  if (sortGroupSection) sortGroupSection.style.display = isDataLoaded ? "block" : "none";
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  if (!nimInput || !searchBtn || !loading || !result || !error) {
    console.error("Required DOM elements not found");
    return;
  }

  updateUIState();

  try {
    await loadCSV();
  } catch (err) {
    console.error("Failed to load CSV:", err);
  }

  updateUIState();

  if (isDataLoaded && nimInput) {
    nimInput.focus();
  }
});