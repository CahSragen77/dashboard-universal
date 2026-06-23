// Menangkap elemen dari HTML
const fileInput = document.getElementById('fileSQL');
const tabelHead = document.getElementById('tabelHead');
const tabelBody = document.getElementById('tabelBody');

// Mengawasi ketika ada file yang diunggah
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        // SIMULASI: Anggap data SQL sudah dikonversi AI menjadi objek data Array biasa
        const dataDinamis = JalankanEkstraksiData(event.target.result); 
        
        TampilkanKeDashboardUniversal(dataDinamis);
    };
    reader.readAsText(file);
});

// FUNGSI UTAMA YANG MEMBUATNYA JADI UNIVERSAL
function TampilkanKeDashboardUniversal(dataArray) {
    // Kosongkan tabel lama
    tabelHead.innerHTML = "";
    tabelBody.innerHTML = "";

    if (dataArray.length === 0) return;

    // KUNCI UNIVERSAL 1: Ambil semua Nama Kolom secara otomatis dari baris pertama
    const semuaKolom = Object.keys(dataArray[0]); 

    // Buat Header Tabel otomatis berdasarkan nama kolom yang ditemukan
    let barisHeader = "<tr>";
    semuaKolom.forEach(namaKolom => {
        barisHeader += `<th>${namaKolom}</th>`;
    });
    barisHeader += "</tr>";
    tabelHead.innerHTML = barisHeader;

    // KUNCI UNIVERSAL 2: Masukkan baris data secara otomatis berapapun jumlah kolomnya
    dataArray.forEach(barisData => {
        let cetakBaris = "<tr>";
        semuaKolom.forEach(namaKolom => {
            cetakBaris += `<td>${barisData[namaKolom]}</td>`; // Mengambil nilai secara dinamis
        });
        cetakBaris += "</tr>";
        tabelBody.innerHTML += cetakBaris;
    });

    // Panggil fungsi untuk memperbarui pilihan dropdown grafik secara otomatis
    PerbaruiDropdownGrafik(semuaKolom);
}
