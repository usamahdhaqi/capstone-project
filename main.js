const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Membuat koneksi ke database SQLite
const db = new sqlite3.Database(path.join(__dirname, 'data/data.db'), (err) => {
    if (err) {
        console.error('Gagal terhubung ke database:', err.message);
        process.exit(1);
    } else {
        console.log('Berhasil terhubung ke database.');
    }
});

// Membuat jendela aplikasi
function createWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'src/preload.js'),
        },
        icon: path.join(__dirname, 'assets/logoaplikasi.ico'),
        autoHideMenuBar: true
    });

    // Menghapus menu bar sepenuhnya
    win.setMenu(null);

    win.loadFile('src/frontend/index.html');
}

// Membuat tabel saat aplikasi dimulai
function initializeDatabase() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS finances (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                income REAL NOT NULL CHECK(income >= 0),
                expense REAL NOT NULL CHECK(expense >= 0)
            )
        `, (err) => {
            if (err) console.error('Gagal membuat tabel:', err.message);
            else console.log('Tabel berhasil dibuat atau sudah ada.');
        });
    });
}

// Menghandle permintaan IPC untuk fetch, add, update, dan delete
ipcMain.handle('fetch-finances', async () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM finances ORDER BY date ASC', [], (err, rows) => {
            if (err) reject(err.message);
            else resolve(rows);
        });
    });
});

ipcMain.handle('add-finance', async (event, { date, income, expense }) => {
    if (!date || income < 0 || expense < 0) {
        throw new Error('Data tidak valid. Pastikan semua field terisi dengan benar.');
    }
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO finances (date, income, expense) VALUES (?, ?, ?)`,
            [date, income, expense],
            function (err) {
                if (err) reject(err.message);
                else resolve({ id: this.lastID, date, income, expense });
            }
        );
    });
});

ipcMain.handle('update-finance', async (event, { id, date, income, expense }) => {
    if (!id || !date || income < 0 || expense < 0) {
        throw new Error('Data tidak valid. Pastikan semua field terisi dengan benar.');
    }
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE finances SET date = ?, income = ?, expense = ? WHERE id = ?`,
            [date, income, expense, id],
            function (err) {
                if (err) reject(err.message);
                else resolve({ message: 'Data berhasil diperbarui' });
            }
        );
    });
});

ipcMain.handle('delete-finance', async (event, id) => {
    if (!id) throw new Error('ID tidak valid.');
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM finances WHERE id = ?`, [id], function (err) {
            if (err) reject(err.message);
            else resolve({ message: 'Data berhasil dihapus' });
        });
    });
});

// Event ketika aplikasi siap
app.whenReady().then(() => {
    createWindow();
    initializeDatabase();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Event ketika semua jendela ditutup
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
    db.close((err) => {
        if (err) console.error('Gagal menutup koneksi database:', err.message);
        else console.log('Koneksi database berhasil ditutup.');
    });
});
