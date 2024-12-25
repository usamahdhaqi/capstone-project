const { ipcMain } = require('electron');
const database = require('./backend/database.js');

// Tambah data baru
ipcMain.handle('add-finance', async (event, data) => {
    database.saveFinance(data.date, data.income, data.expense);
});

// Ambil semua data
ipcMain.handle('get-finances', async (event) => {
    return new Promise((resolve) => {
        database.getAllFinances((rows) => {
            resolve(rows);
        });
    });
});

// Hapus data
ipcMain.handle('delete-finance', async (event, id) => {
    return new Promise((resolve) => {
        database.deleteFinance(id, (success) => {
            resolve(success);
        });
    });
});

// Perbarui data
ipcMain.handle('update-finance', async (event, data) => {
    return new Promise((resolve) => {
        database.updateFinance(data.id, data.date, data.income, data.expense, (success) => {
            resolve(success);
        });
    });
});
