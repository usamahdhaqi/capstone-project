const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Lokasi file database SQLite
const dbPath = path.join(__dirname, '../data/data.db'); // Pastikan folder `data/` sudah ada
const db = new sqlite3.Database(dbPath);

// Membuat tabel jika belum ada
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS finances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            income REAL NOT NULL,
            expense REAL NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error("Error saat membuat tabel:", err.message);
        } else {
            console.log("Tabel `finances` siap digunakan.");
        }
    });
});

// Fungsi untuk menyimpan data keuangan
function saveFinance(date, income, expense) {
    db.run(`
        INSERT INTO finances (date, income, expense) 
        VALUES (?, ?, ?)
    `, [date, income, expense], (err) => {
        if (err) {
            console.error("Error menyimpan data:", err.message);
        } else {
            console.log("Data berhasil disimpan.");
        }
    });
}

// Fungsi untuk membaca semua data keuangan
function getAllFinances(callback) {
    db.all("SELECT * FROM finances ORDER BY date ASC", [], (err, rows) => {
        if (err) {
            console.error("Error membaca data:", err.message);
            callback([]);
        } else {
            callback(rows);
        }
    });
}

// Fungsi untuk menghapus data keuangan berdasarkan ID
function deleteFinance(id, callback) {
    db.run("DELETE FROM finances WHERE id = ?", [id], function (err) {
        if (err) {
            console.error("Error menghapus data:", err.message);
            callback(false);
        } else {
            console.log("Data berhasil dihapus.");
            callback(true);
        }
    });
}

// Fungsi untuk memperbarui data keuangan berdasarkan ID
function updateFinance(id, date, income, expense, callback) {
    db.run(`
        UPDATE finances
        SET date = ?, income = ?, expense = ?
        WHERE id = ?
    `, [date, income, expense, id], function (err) {
        if (err) {
            console.error("Error memperbarui data:", err.message);
            callback(false);
        } else {
            console.log("Data berhasil diperbarui.");
            callback(true);
        }
    });
}

// Ekspor fungsi-fungsi untuk digunakan di file lain
module.exports = {
    saveFinance,
    getAllFinances,
    deleteFinance,
    updateFinance
};
