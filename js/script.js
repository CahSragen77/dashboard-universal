// Menangkap elemen dari HTML
const fileInput = document.getElementById('fileSQL');
const tabelHead = document.getElementById('tabelHead');
const tabelBody = document.getElementById('tabelBody');
const selectX = document.getElementById('selectX');
const selectY = document.getElementById('selectY');

let globalDataArray = []; // Menyimpan data aktif secara global
let objekGrafik = null;   // Menyimpan status grafik aktif agar tidak bentrok

// Mengawasi ketika ada file yang diunggah
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        // MENGEKSTRAKSI DATA SQL NYATA SECARA DINAMIS
        globalDataArray = JalankanEkstraksiData(event.target.result); 
        
        if(globalDataArray.length > 0) {
            TampilkanKeDashboardUniversal(globalDataArray);
        } else {
            alert("File SQL terbaca, namun tidak ditemukan baris data 'INSERT INTO' di dalamnya.");
        }
    };
    reader.readAsText(file);
});

// FUNGSI UTAMA UNTUK EKSTRAKSI TEKS FILE SQL MENJADI ARRAY OBJEK (UNIVERSAL)
function JalankanEkstraksiData(teksMentahSQL) {
    const hasilData = [];
    // Membagi teks SQL per baris
    const barisTeks = teksMentahSQL.split('\n');
    
    barisTeks.forEach(baris => {
        const barisBersih = baris.trim();
        // Mencari baris yang mengandung perintah input data database (INSERT INTO)
        if (barisBersih.toUpperCase().startsWith("INSERT INTO")) {
            try {
                // 1. Ambil Nama Kolom secara dinamis dari dalam kurung pertama
                const bagianKolom = barisBersih.substring(barisBersih.indexOf('(') + 1, barisBersih.indexOf(')'));
                const namaKolomArray = bagianKolom.split(',').map(k => k.replace(/[`"'\s]/g, ''));

                // 2. Ambil Nilai Data dari bagian VALUES
                const bagianValues = barisBersih.substring(barisBersih.toUpperCase().indexOf('VALUES') + 6).trim();
                const isiDataBersih = bagianValues.substring(bagianValues.indexOf('(') + 1, bagianValues.lastIndexOf(')'));
                
                // Memisahkan nilai dengan koma, dengan membuang tanda petik pembungkus teks
                const nilaiDataArray = isiDataBersih.split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));

                // 3. Gabungkan Kolom dan Nilai menjadi satu objek Dinamis
                if (namaKolomArray.length === nilaiDataArray.length) {
                    const objekBaris = {};
                    namaKolomArray.forEach((kolom, indeks) => {
                        // Jika nilainya angka murni, ubah jadi tipe data angka agar bisa dihitung oleh grafik
                        objekBaris[kolom] = isNaN(nilaiDataArray[indeks]) ? nilaiDataArray[indeks] : Number(nilaiDataArray[indeks]);
                    });
                    hasilData.push(objekBaris);
                }
            } catch (error) {
                // Mengabaikan baris yang formatnya tidak sesuai standar ekstrasi
            }
        }
    });
    return hasilData;
}

// FUNGSI UNTUK MENAMPILKAN DATA KE TABEL HTML
function TampilkanKeDashboardUniversal(dataArray) {
    tabelHead.innerHTML = "";
    tabelBody.innerHTML = "";

    if (dataArray.length === 0) return;

    // Mengambil nama kolom otomatis dari struktur objek pertama
    const semuaKolom = Object.keys(dataArray[0]); 

    // Membuat header tabel otomatis
    let barisHeader = "<tr>";
    semuaKolom.forEach(namaKolom => {
        barisHeader += `<th>${namaKolom}</th>`;
    });
    barisHeader += "</tr>";
    tabelHead.innerHTML = barisHeader;

    // Memasukkan isi data ke baris tabel otomatis
    dataArray.forEach(barisData => {
        let cetakBaris = "<tr>";
        semuaKolom.forEach(namaKolom => {
            cetakBaris += `<td>${barisData[namaKolom]}</td>`;
        });
        cetakBaris += "</tr>";
        tabelBody.innerHTML += cetakBaris;
    });

    PerbaruiDropdownGrafik(semuaKolom);
}

// FUNGSI UNTUK MEMPERBARUI MENU PILIHAN DROPDOWN GRAFIK
function PerbaruiDropdownGrafik(semuaKolom) {
    selectX.innerHTML = "";
    selectY.innerHTML = "";

    semuaKolom.forEach(kolom => {
        selectX.innerHTML += `<option value="${kolom}">${kolom}</option>`;
        selectY.innerHTML += `<option value="${kolom}">${kolom}</option>`;
    });

    // Pilih opsi default secara otomatis (Kolom 1 untuk Sumbu X, Kolom 2 untuk Sumbu Y)
    if(semuaKolom.length > 1) {
        selectY.selectedIndex = 1;
    }

    // Picu pembuatan grafik pertama kali
    BuatAtauPerbaruiGrafik();
}

// Mengawasi perubahan jika pengguna memilih kolom grafik yang berbeda
selectX.addEventListener('change', BuatAtauPerbaruiGrafik);
selectY.addEventListener('change', BuatAtauPerbaruiGrafik);

// FUNGSI UNTUK MENGGAMBAR GRAFIK SECARA DINAMIS (CHART.JS)
function BuatAtauPerbaruiGrafik() {
    const kolomX = selectX.value;
    const kolomY = selectY.value;

    if (!kolomX || !kolomY || globalDataArray.length === 0) return;

    // Ambil data array berdasarkan kolom yang dipilih pengguna lewat dropdown
    const labelX = globalDataArray.map(data => data[kolomX]);
    const nilaiY = globalDataArray.map(data => data[kolomY]);

    const ctx = document.getElementById('grafikUniversal').getContext('2d');

    // Jika grafik lama sudah ada, hapus dulu agar tidak tumpang tindih saat digambar ulang
    if (objekGrafik) {
        objekGrafik.destroy();
    }

    // Menggambar grafik batang (Bar Chart) baru yang dinamis
    objekGrafik = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labelX,
            datasets: [{
                label: `Grafik Nilai ${kolomY}`,
                data: nilaiY,
                backgroundColor: '#38bdf8',
                borderColor: '#0284c7',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
