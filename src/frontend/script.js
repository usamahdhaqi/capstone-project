new Vue({
  el: '#app',
  data: {
    selectedDate: '',
    newIncome: '',
    newExpense: '',
    finances: [],
    showEditModal: false,
    showDeleteModal: false,
    editId: null,
    editDate: '',
    editIncome: '',
    editExpense: '',
    financeChart: null,
    recommendations: [],
    deleteId: null
  },

  methods: {
    async fetchFinances() {
      this.finances = await window.electronAPI.fetchFinances();
      this.updateChart();
      this.fetchRecommendations();
    },

    async addEntry() {
      const income = parseFloat(this.newIncome.replace(/\D/g, ''));
      const expense = parseFloat(this.newExpense.replace(/\D/g, ''));
    
      if (!this.selectedDate || isNaN(income) || isNaN(expense) || income < 0 || expense < 0) {
        alert("Harap masukkan data yang valid. Pendapatan dan pengeluaran tidak boleh negatif.");
        return;
      }
    
      const isDateExists = this.finances.some(entry => entry.date === this.selectedDate);
      if (isDateExists) {
        alert("Data untuk tanggal ini sudah ada. Harap pilih tanggal lain atau edit data yang ada.");
        return;
      }
    
      const newEntry = { date: this.selectedDate, income, expense };
      try {
        const savedEntry = await window.electronAPI.addFinance(newEntry);
        this.finances.push(savedEntry);
        this.finances.sort((a, b) => new Date(a.date) - new Date(b.date));
        this.updateChart();
        this.fetchRecommendations();
        this.selectedDate = '';
        this.newIncome = '';
        this.newExpense = '';
      } catch (error) {
        console.error('Gagal menambahkan data:', error.message);
        alert("Terjadi kesalahan saat menambahkan data. Silakan coba lagi.");
      }
    },        

    deleteEntry(id) {
      this.deleteId = id;
      this.showDeleteModal = true; // Menampilkan modal hapus custom
    },

    openEditModal(finance) {
      this.editId = finance.id;
      this.editDate = finance.date;
      this.editIncome = 'Rp. ' + parseFloat(finance.income).toLocaleString('id-ID');
      this.editExpense = 'Rp. ' + parseFloat(finance.expense).toLocaleString('id-ID');
      this.showEditModal = true;
    },

    closeEditModal() {
      this.showEditModal = false;
      this.editId = null;
      this.editDate = '';
      this.editIncome = '';
      this.editExpense = '';
    },
    
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.deleteId = null;
      this.updateChart();
      this.fetchRecommendations();
    },

    async updateEntry() {
      const income = parseFloat(this.editIncome.replace(/\D/g, ''));
      const expense = parseFloat(this.editExpense.replace(/\D/g, ''));
    
      if (!this.editDate || isNaN(income) || isNaN(expense) || income < 0 || expense < 0) {
        alert("Harap masukkan data yang valid. Pendapatan dan pengeluaran tidak boleh negatif.");
        return;
      }
    
      const updatedEntry = { id: this.editId, date: this.editDate, income, expense };
    
      try {
        const response = await window.electronAPI.updateFinance(updatedEntry);
        if (response.message === 'Data berhasil diperbarui') {
          const index = this.finances.findIndex(finance => finance.id === this.editId);
          if (index !== -1) {
            this.finances[index] = { id: this.editId, ...updatedEntry };
            this.finances.sort((a, b) => new Date(a.date) - new Date(b.date));
          }
          this.updateChart();
          this.fetchRecommendations();
          this.closeEditModal();
        } else {
          throw new Error("Gagal memperbarui data di database.");
        }
      } catch (error) {
        console.error('Gagal memperbarui data:', error.message);
        alert("Terjadi kesalahan saat memperbarui data. Silakan coba lagi.");
      }
    },    
    
    async confirmDelete() {
      if (this.deleteId !== null) {
        try {
          await window.electronAPI.deleteFinance(this.deleteId); // Memanggil API dari preload.js
          this.finances = this.finances.filter(entry => entry.id !== this.deleteId);
          this.updateChart(); // Perbarui grafik setelah penghapusan
        } catch (error) {
          console.error('Gagal menghapus data:', error.message);
        }
      }
      this.closeDeleteModal(); // Tutup modal setelah penghapusan
    },    

    formatDate(date) {
      const parsedDate = new Date(date);
      return parsedDate.toLocaleDateString('id-ID', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    },
    
    formatCurrency(field) {
      const value = this[field].replace(/\D/g, '');
      this[field] = 'Rp. ' + parseFloat(value).toLocaleString('id-ID');
    },
    
    formatCurrencyDisplay(value) {
      return 'Rp. ' + parseFloat(value).toLocaleString('id-ID');
    },
    
    // Membuat atau memperbarui grafik
    updateChart() {
      const labels = this.finances.map(finance => this.formatDate(finance.date));
      const incomeData = this.finances.map(finance => finance.income);
      const expenseData = this.finances.map(finance => finance.expense);
    
      if (this.financeChart) {
        this.financeChart.destroy();
      }
    
      const ctx = document.getElementById('financeChart').getContext('2d');
      this.financeChart = new Chart(ctx, {
        type: 'line',  // Mengubah tipe chart menjadi 'line'
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Pendapatan',
              data: incomeData,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 2,
              fill: false, // Tidak mengisi area di bawah garis
              tension: 0.4 // Menambahkan kelengkungan garis
            },
            {
              label: 'Pengeluaran',
              data: expenseData,
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderWidth: 2,
              fill: false,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              beginAtZero: true
            },
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            legend: {
              position: 'top'
            }
          }
        }
      });
    },
    
    fetchRecommendations() {
      try {
        if (this.finances.length === 0) {
          this.recommendations = ["Belum ada data keuangan. Tambahkan data untuk melihat rekomendasi."];
          return;
        }

        const totalIncome = this.finances.reduce((sum, item) => sum + item.income, 0);
        const totalExpense = this.finances.reduce((sum, item) => sum + item.expense, 0);
        const surplus = totalIncome - totalExpense;
    
        const recommendations = [];
    
        // Surplus atau Defisit
        if (surplus > 0) {
          recommendations.push(`Arus kas positif: Anda memiliki surplus sebesar Rp. ${surplus.toLocaleString('id-ID')}. Pertimbangkan untuk menyisihkan dana sebagai tabungan atau investasi.`);
        } else {
          recommendations.push('Arus kas negatif: Pengeluaran Anda lebih besar daripada pendapatan. Evaluasi pengeluaran untuk mengurangi beban keuangan.');
        }

        // Rekomendasi Rasio Tabungan
        if (surplus > 0) {
          const saving = surplus * 0.3; // 30% untuk tabungan
          const investment = surplus * 0.5; // 50% untuk investasi
          const others = surplus * 0.2; // 20% untuk kebutuhan lain

          recommendations.push(
              `Dari surplus sebesar Rp. ${surplus.toLocaleString('id-ID')}, kami merekomendasikan alokasi sebagai berikut:\n` +
              `- Tabungan: Rp. ${saving.toLocaleString('id-ID')}\n` +
              `- Investasi: Rp. ${investment.toLocaleString('id-ID')}\n` +
              `- Kebutuhan lainnya: Rp. ${others.toLocaleString('id-ID')}`
          );
        } else {
          recommendations.push('Karena tidak ada surplus, prioritaskan untuk menyeimbangkan pendapatan dan pengeluaran sebelum menyisihkan dana untuk tabungan atau investasi.');
        }

        // Mitigasi Risiko Keuangan
        const emergencyFundAllocation = surplus * 0.2; // Alokasi 20% dari surplus
        if (surplus > 0) {
            recommendations.push(`Buat anggaran khusus untuk bulan dengan pengeluaran tak terduga. Simpan setidaknya Rp. ${emergencyFundAllocation.toLocaleString('id-ID')} dari surplus bulan sebelumnya sebagai dana darurat.`);
        }

        // Rasio Pendapatan terhadap Pengeluaran
        const ratio = totalIncome / totalExpense;
        if (ratio > 2) {
          recommendations.push('Pendapatan Anda jauh lebih tinggi dibandingkan pengeluaran. Ini adalah kesempatan baik untuk memperluas usaha atau menambah investasi.');
        } else if (ratio < 1) {
          recommendations.push('Pengeluaran Anda lebih besar daripada pendapatan. Anda perlu segera mengurangi pengeluaran yang tidak perlu.');
        }
        
        // Analisis Tren Pengeluaran Bulanan
        const expenseTrends = this.finances.map((item, index, array) => {
          if (index === 0) return null; // Tidak ada data bulan sebelumnya untuk bulan pertama
          return {
              date: item.date,
              trend: item.expense - array[index - 1].expense, // Selisih pengeluaran antara bulan ini dan sebelumnya
          };
        }).filter(item => item !== null);

        const increasingTrends = expenseTrends.filter(item => item.trend > 0);
        const decreasingTrends = expenseTrends.filter(item => item.trend < 0);

        if (increasingTrends.length > decreasingTrends.length) {
          recommendations.push('Pengeluaran Anda cenderung meningkat dari bulan ke bulan. Pertimbangkan untuk mengevaluasi pola pengeluaran Anda agar lebih efisien.');
        } else if (decreasingTrends.length > increasingTrends.length) {
          recommendations.push('Pengeluaran Anda menunjukkan tren menurun. Ini merupakan tanda pengelolaan keuangan yang lebih baik. Pertahankan atau tingkatkan efisiensi pengeluaran.');
        } else {
          recommendations.push('Pengeluaran Anda stabil tanpa tren signifikan. Pastikan pengeluaran tetap seimbang dengan pendapatan.');
        }

        // Pengeluaran pada Bulan Tertentu yang Sangat Tinggi
        const maxExpense = Math.max(...this.finances.map(item => item.expense));
        const highExpenseMonth = this.finances.find(item => item.expense === maxExpense);
        if (highExpenseMonth) {
          recommendations.push(`Pengeluaran tertinggi terjadi pada ${new Date(highExpenseMonth.date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}. Evaluasi pengeluaran di bulan ini untuk mengurangi beban keuangan.`);
        }

        // Strategi Investasi dan Tabungan
        const surplusMonths = this.finances.filter(item => item.income > item.expense);
        if (surplusMonths.length > 0) {
            const surplusDetails = surplusMonths.map(item => 
                `${new Date(item.date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
            ).join(', ');
            recommendations.push(`Surplus pada bulan ${surplusDetails} dapat dialokasikan untuk investasi atau tabungan cadangan guna menghadapi potensi defisit di bulan mendatang.`);
        }

        // Optimalkan Pendapatan
        const maxIncome = Math.max(...this.finances.map(item => item.income));
        const highIncomeMonths = this.finances.filter(item => item.income === maxIncome);
        if (highIncomeMonths.length > 0) {
            const highIncomeDetails = highIncomeMonths.map(item => 
                `${new Date(item.date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
            ).join(', ');
            recommendations.push(`Fokus pada strategi yang mendorong lonjakan pendapatan di bulan ${highIncomeDetails}, seperti promosi atau diskon spesial. Meniru pola keberhasilan di bulan-bulan tersebut dapat menghasilkan peningkatan berkelanjutan.`);
        }

        

        // Frekuensi Defisit Bulanan
        let consecutiveDeficits = 0;
        let maxConsecutiveDeficits = 0;
        this.finances.forEach(item => {
          if (item.income < item.expense) {
            consecutiveDeficits++;
            maxConsecutiveDeficits = Math.max(maxConsecutiveDeficits, consecutiveDeficits);
          } else {
            consecutiveDeficits = 0;
          }
        });
    
        if (maxConsecutiveDeficits > 1) {
          recommendations.push(`Anda mengalami defisit berturut-turut selama ${maxConsecutiveDeficits} bulan. Ini bisa berdampak negatif pada stabilitas keuangan. Prioritaskan untuk memperbaiki arus kas Anda.`);
        }
    
        this.recommendations = recommendations;
      } catch (error) {
        console.error('Gagal menghasilkan rekomendasi:', error.message);
        alert("Terjadi kesalahan saat menghitung rekomendasi.");
      }
    }        
  },

  mounted() {
    this.fetchFinances();
    this.fetchRecommendations();
  }
});
