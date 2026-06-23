const fileInput = document.getElementById('fileSQL');
const tabelHead = document.getElementById('tabelHead');
const tabelBody = document.getElementById('tabelBody');
const selectX = document.getElementById('selectX');
const selectY = document.getElementById('selectY');

let globalDataArray = [];
let objekGrafik = null;

// Memuat pustaka database SQL.js secara otomatis dari internet saat web dibuka
let SQL;
const scriptSQL = document.createElement('script');
scriptSQL.src = "https://cloudflare.com";
document.head.appendChild(scriptSQL);

scriptSQL.onload = async () => {
    // Inisialisasi mesin database mini di browser
    const config = { locateFile: filename => `https://cloudflare.com{filename}` };
    SQL = await initSqlJs(config);
    console.log("Mesin Database Mini Siap Beraksi!");
};

fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!SQL) {
        alert("Mesin database sedang memuat, harap tunggu 3 detik lalu coba unggah kembali.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            // Membuat database bayangan di memori browser dari teks file SQL Anda
            const db = new SQL.Database();
            db.run(event.target.result);

            // KUNCI UNIVERSAL: Cari nama tabel pertama yang sukses terbuat dari file SQL Anda
            const cekTabel = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
            
            if (cekTabel.length === 0 || !cekTabel[0].values.length) {
                // Jika tidak ada tabel nyata dengan isi data, gunakan metode pembacaan baris teks darurat
                globalDataArray = MetodeDaruratMembacaTeks(event.target.result);
            } else {
                const namaTabelUtama = cekTabel[0].values[0][0];
                // Mengambil seluruh isi data dari tabel tersebut
                const hasilQuery = db.exec(`SELECT * FROM ${namaTabelUtama} LIMIT 100;`);
                
                if (hasilQuery.length > 0) {
                    globalDataArray = KonversiKeObjekDinamis(hasilQuery[0].columns, hasilQuery[0].values);
                }
            }

            if (globalDataArray.length > 0) {
                TampilkanKeDashboardUniversal(globalDataArray);
            } else {
                alert("File berhasil dibaca, namun tidak ditemukan baris data transaksi di dalamnya. Pastikan file SQL Anda berisi data kasir.");
            }
        } catch (err) {
            // Jika struktur file PostgreSQL terlalu kompleks, gunakan mesin penyaring teks darurat kita
            globalDataArray = MetodeDaruratMembacaTeks(event.target.result);
            if (globalDataArray.length > 0) {
                TampilkanKeDashboardUniversal(globalDataArray);
            } else {
                alert("Gagal mengekstrak data. Struktur file SQL ini hanya berisi definisi tabel kosong tanpa baris data.");
            }
        }
    };
    reader.readAsText(file);
});

// MESIN DARURAT: Menyaring baris teks jika file SQL tidak bisa dieksekusi langsung oleh database mini
function MetodeDaruratMembacaTeks(teksSQL) {
    const hasilData = [];
    const barisTeks = teksSQL.split('\n');
    
    barisTeks.forEach(baris => {
        const barisBersih = baris.trim();
        // Hanya mengambil baris data nyata (INSERT INTO) dan mengabaikan baris rumus/fungsi (CREATE FUNCTION)
        if (barisBersih.toUpperCase().startsWith("INSERT INTO") && barisBersih.includes("VALUES")) {
            try {
                const bagianKolom = barisBersih.substring(barisBersih.indexOf('(') + 1, barisBersih.indexOf(')'));
                const namaKolomArray = bagianKolom.split(',').map(k => k.replace(/[`"'\s]/g, ''));

                const bagianValues = barisBersih.substring(barisBersih.toUpperCase().indexOf('VALUES') + 6).trim();
                const isiDataBersih = bagianValues.substring(bagianValues.indexOf('(') + 1, bagianValues.lastIndexOf(')'));
                const nilaiDataArray = isiDataBersih.split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));

                if (namaKolomArray.length === nilaiDataArray.length) {
                    const objekBaris = {};
                    namaKolomArray.forEach((kolom, indeks) => {
                        // Saringan ketat: Memastikan nama variabel rumus tidak masuk sebagai nama kolom
                        if(!kolom.includes('|') && !kolom.includes('#')) {
                            const nilai = nilaiDataArray[indeks];
                            objekBaris[kolom] = isNaN(nilai) ? nilai : Number(nilai);
                        }
                    });
                    if (Object.keys(objekBaris).length > 0) {
                        hasilData.push(objekBaris);
                    }
                }
            } catch (e) {}
        }
    });
    return hasilData;
}

function KonversiKeObjekDinamis(kolom, nilaiBaris) {
    return nilaiBaris.map(baris => {
        const objek = {};
        kolom.forEach((namaKolom, indeks) => {
            objek[namaKolom] = isNaN(baris[indeks]) ? baris[indeks] : Number(baris[indeks]);
        });
        return objek;
    });
}

function TampilkanKeDashboardUniversal(dataArray) {
    tabelHead.innerHTML = "";
    tabelBody.innerHTML = "";

    if (!dataArray || dataArray.length === 0) return;

    const semuaKolom = Object.keys(dataArray[0]); 

    let barisHeader = "<tr>";
    semuaKolom.forEach(namaKolom => {
        barisHeader += `<th>${namaKolom}</th>`;
    });
    barisHeader += "</tr>";
    tabelHead.innerHTML = barisHeader;

    dataArray.forEach(barisData => {
        let cetakBaris = "<tr>";
        semuaKolom.forEach(namaKolom => {
            cetakBaris += `<td>${barisData[namaKolom] !== undefined ? barisData[namaKolom] : ''}</td>`;
        });
        cetakBaris += "</tr>";
        tabelBody.innerHTML += cetakBaris;
    });

    PerbaruiDropdownGrafik(semuaKolom);
}

function PerbaruiDropdownGrafik(semuaKolom) {
    selectX.innerHTML = "";
    selectY.innerHTML = "";

    semuaKolom.forEach(kolom => {
        selectX.innerHTML += `<option value="${kolom}">${kolom}</option>`;
        selectY.innerHTML += `<option value="${kolom}">${kolom}</option>`;
    });

    if(semuaKolom.length > 1) {
        selectY.selectedIndex = 1;
    }
    BuatAtauPerbaruiGrafik();
}

selectX.addEventListener('change', BuatAtauPerbaruiGrafik);
selectY.addEventListener('change', BuatAtauPerbaruiGrafik);

function BuatAtauPerbaruiGrafik() {
    const kolomX = selectX.value;
    const kolomY = selectY.value;

    if (!kolomX || !kolomY || globalDataArray.length === 0) return;

    const labelX = globalDataArray.map(data => data[kolomX]);
    const nilaiY = globalDataArray.map(data => data[kolomY]);

    const ctx = document.getElementById('grafikUniversal').getContext('2d');

    if (objekGrafik) {
        objekGrafik.destroy();
    }

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
            scales: { y: { beginAtZero: true } }
        }
    });
}
