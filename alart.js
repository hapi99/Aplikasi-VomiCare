// GLOBAL STATE
let vomitCount = 0;
let vomitLogs = [];

// JALANKAN SETELAH DOM SELESAI DIMUAT
document.addEventListener('DOMContentLoaded', () => {
    const btnPlus = document.getElementById('btn-plus');
    const btnMinus = document.getElementById('btn-minus');

    if (btnPlus) {
        btnPlus.addEventListener('click', () => adjustCounter(1));
    }
    if (btnMinus) {
        btnMinus.addEventListener('click', () => adjustCounter(-1));
    }
});

// 1. SWITCH TAB NAVIGATION
function switchTab(tab) {
    const assessmentSec = document.getElementById('section-assessment');
    const trackerSec = document.getElementById('section-tracker');
    const eduSec = document.getElementById('section-education');

    const btnAssessment = document.getElementById('tab-assessment');
    const btnTracker = document.getElementById('tab-tracker');
    const btnEdu = document.getElementById('tab-education');

    assessmentSec.classList.add('hidden');
    trackerSec.classList.add('hidden');
    eduSec.classList.add('hidden');

    btnAssessment.classList.remove('active');
    btnTracker.classList.remove('active');
    btnEdu.classList.remove('active');

    if (tab === 'assessment') {
        assessmentSec.classList.remove('hidden');
        btnAssessment.classList.add('active');
    } else if (tab === 'tracker') {
        trackerSec.classList.remove('hidden');
        btnTracker.classList.add('active');
    } else if (tab === 'education') {
        eduSec.classList.remove('hidden');
        btnEdu.classList.add('active');
    }
}

// 2. COUNTER FUNCTION (+ / -)
function adjustCounter(val) {
    vomitCount = Math.max(0, vomitCount + val);
    const countDisplay = document.getElementById('muntah-count');
    if (countDisplay) {
        countDisplay.innerText = vomitCount;
    }
}

// 3. LOG VOMIT REAL-TIME (Tab Tracker)
function logVomit() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    vomitLogs.unshift(timeStr);
    adjustCounter(1);

    renderLogs();
}

function renderLogs() {
    const container = document.getElementById('log-list');
    if (!container) return;

    if (vomitLogs.length === 0) {
        container.innerHTML = `<p id="empty-log" class="text-center py-6 text-xs text-slate-400">Belum ada catatan muntah hari ini.</p>`;
        return;
    }

    container.innerHTML = vomitLogs.map((time, index) => `
        <div class="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium">
            <span class="text-slate-700">Muntah #${vomitLogs.length - index}</span>
            <span class="bg-teal-100 text-teal-800 px-2.5 py-1 rounded-lg font-mono font-bold">${time} WIB</span>
        </div>
    `).join('');
}

function clearLogs() {
    vomitLogs = [];
    vomitCount = 0;
    const countDisplay = document.getElementById('muntah-count');
    if (countDisplay) countDisplay.innerText = 0;
    renderLogs();
}

// TOGGLE GEJALA BAHAYA vs TIDAK ADA GEJALA
function toggleNoRedFlags(noneCheckbox) {
    if (noneCheckbox.checked) {
        document.querySelectorAll('.red-flag').forEach(cb => cb.checked = false);
    }
}

function uncheckNoRedFlags() {
    const noRed = document.getElementById('no-red-flags');
    if (noRed) noRed.checked = false;
}

// 4. TRIAGE CDSS ENGINE
function calculateTriage(e) {
    if (e) e.preventDefault();

    const nama = document.getElementById('nama-pasien').value || '-';
    const umur = document.getElementById('umur-pasien').value || '-';
    const hamil = document.getElementById('usia-kehamilan').value || '-';
    const alamat = document.getElementById('alamat-pasien').value || '-';

    const bbSebelum = parseFloat(document.getElementById('bb-sebelum').value) || 0;
    const bbSekarang = parseFloat(document.getElementById('bb-sekarang').value) || 0;
    const cairanScore = parseInt(document.getElementById('cairan-status').value) || 0;
    const bakScore = parseInt(document.getElementById('bak-status').value) || 0;
    const isNoRedFlagsChecked = document.getElementById('no-red-flags').checked;

    const redFlags = [];
    document.querySelectorAll('.red-flag:checked').forEach(cb => redFlags.push(cb.value));

    let bbLossPercent = 0;
    if (bbSebelum > 0 && bbSekarang > 0 && bbSebelum > bbSekarang) {
        bbLossPercent = ((bbSebelum - bbSekarang) / bbSebelum) * 100;
    }

    let totalScore = cairanScore + bakScore;
    if (vomitCount >= 6) totalScore += 3;
    else if (vomitCount >= 4) totalScore += 2;
    else if (vomitCount >= 1) totalScore += 1;

    if (bbLossPercent >= 5) totalScore += 3;
    else if (bbLossPercent >= 2) totalScore += 1;

    const resultCard = document.getElementById('result-card');
    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');
    const resultSubtitle = document.getElementById('result-subtitle');
    const resultReasons = document.getElementById('result-reasons');
    const resultAction = document.getElementById('result-action');

    document.getElementById('res-nama').innerText = nama;
    document.getElementById('res-umur').innerText = umur;
    document.getElementById('res-hamil').innerText = hamil;
    document.getElementById('res-alamat').innerText = alamat;

    let reasons = [];
    if (vomitCount > 0) reasons.push(`Frekuensi muntah: ${vomitCount}x dalam 24 jam terakhir.`);
    if (cairanScore === 5) reasons.push("TIDAK BISA mempertahankan cairan sama sekali.");
    else if (cairanScore === 2) reasons.push("Sulit mempertahankan cairan (sering muntah setelah minum).");

    if (bakScore === 4) reasons.push("Sangat jarang buang air kecil (>8 jam terakhir).");
    else if (bakScore === 2) reasons.push("Frekuensi BAK mulai berkurang (4-8 jam lalu).");

    if (bbLossPercent > 0) reasons.push(`Penurunan berat badan sebesar ${bbLossPercent.toFixed(1)}%.`);
    
    if (isNoRedFlagsChecked) {
        reasons.push("Ibu mengonfirmasi TIDAK ADA tanda bahaya penyerta.");
    } else {
        redFlags.forEach(flag => reasons.push(`Tanda Bahaya: ${flag}`));
    }

    if (reasons.length === 0) reasons.push("Kondisi cairan dan BAK terpantau normal tanpa tanda bahaya.");

    // KATEGORI WARNA
    if (redFlags.length > 0 || cairanScore === 5 || bakScore === 4 || totalScore >= 7) {
        resultCard.className = "rounded-2xl p-5 border shadow-lg space-y-4 transition-all duration-300 bg-rose-50 border-rose-300 text-rose-950";
        resultIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-rose-600"></i>';
        resultTitle.innerText = "🔴 SEGERA KE FASILITAS KESEHATAN";
        resultSubtitle.innerText = "Kondisi Anda memerlukan penanganan medis darurat segera.";
        resultAction.innerText = "Jangan menunda. Segera bawa Ibu ke IGD Puskesmas/Klinik/Rumah Sakit terdekat untuk penanganan rehidrasi cairan (infus).";
    } else if (totalScore >= 3 || cairanScore === 2 || bakScore === 2 || vomitCount >= 4) {
        resultCard.className = "rounded-2xl p-5 border shadow-lg space-y-4 transition-all duration-300 bg-amber-50 border-amber-300 text-amber-950";
        resultIcon.innerHTML = '<i class="fa-solid fa-circle-exclamation text-amber-600"></i>';
        resultTitle.innerText = "🟡 SEBAIKNYA KONSULTASI MEDIS";
        resultSubtitle.innerText = "Kondisi Anda perlu pemantauan dan saran dari tenaga kesehatan.";
        resultAction.innerText = "Disarankan menghubungi Bidan atau Dokter hari ini. Cobalah minum cairan oralit/elektrolit sedikit demi sedikit (1-2 sendok) secara teratur.";
    } else {
        resultCard.className = "rounded-2xl p-5 border shadow-lg space-y-4 transition-all duration-300 bg-emerald-50 border-emerald-300 text-emerald-950";
        resultIcon.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-600"></i>';
        resultTitle.innerText = "🟢 DAPAT DIPANTAU MANDIRI";
        resultSubtitle.innerText = "Kondisi Anda saat ini relatif aman dan stabil.";
        resultAction.innerText = "Tetap istirahat cukup, konsumsi makanan kering (biskuit/roti) dalam porsi kecil namun sering, dan minum air putih sedikit demi sedikit.";
    }

    resultReasons.innerHTML = reasons.map(r => `<li>${r}</li>`).join('');
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth' });
}