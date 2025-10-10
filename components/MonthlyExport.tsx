import React, { useState } from 'react';
import { Transaction, TransactionType, SumberDana } from '../types';

// Tell TypeScript about the global XLSX variable from the CDN script
declare const XLSX: any;

type ExportType = 'all' | 'income_kas' | 'expense_kas' | 'income_infak' | 'expense_infak';

const ExportButton: React.FC<{ onClick: () => void; children: React.ReactNode, className?: string }> = ({ onClick, children, className }) => (
    <button
        onClick={onClick}
        className={`w-full text-left py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors border border-gray-200 ${className}`}
    >
        <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">{children}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
        </div>
    </button>
);


const MonthlyExport: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format

    const handleExport = (exportType: ExportType) => {
        if (typeof XLSX === 'undefined') {
            alert("Library untuk ekspor Excel (XLSX) tidak termuat. Coba refresh halaman.");
            return;
        }

        const [year, month] = selectedMonth.split('-').map(Number);
        
        const filteredTransactions = transactions.filter(t => {
            const date = new Date(t.tanggal);
            return date.getFullYear() === year && date.getMonth() === month - 1;
        });

        let dataToExport: Transaction[] = [];
        let reportTitle = '';

        switch (exportType) {
            case 'income_kas':
                dataToExport = filteredTransactions.filter(t => t.tipe === TransactionType.Pemasukan && t.sumber_dana === SumberDana.Kas);
                reportTitle = 'Pemasukan Kas Umum';
                break;
            case 'expense_kas':
                dataToExport = filteredTransactions.filter(t => t.tipe === TransactionType.Pengeluaran && t.sumber_dana === SumberDana.Kas);
                reportTitle = 'Pengeluaran Kas Umum';
                break;
            case 'income_infak':
                dataToExport = filteredTransactions.filter(t => t.tipe === TransactionType.Pemasukan && t.sumber_dana === SumberDana.InfakDonasi);
                reportTitle = 'Pemasukan Infak & Donasi';
                break;
             case 'expense_infak':
                dataToExport = filteredTransactions.filter(t => t.tipe === TransactionType.Pengeluaran && t.sumber_dana === SumberDana.InfakDonasi);
                reportTitle = 'Pengeluaran Infak & Donasi';
                break;
            case 'all':
            default:
                dataToExport = filteredTransactions;
                reportTitle = 'Semua Transaksi';
                break;
        }

        if (dataToExport.length === 0) {
            alert(`Tidak ada data "${reportTitle}" pada bulan yang dipilih untuk diekspor.`);
            return;
        }
        
        const dataForSheet = dataToExport.map(t => ({
            'ID Transaksi': t.id,
            'Tanggal': new Date(t.tanggal).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }),
            'Tipe': t.tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
            'Kategori': t.kategori,
            'Deskripsi': t.deskripsi,
            'Jumlah': t.jumlah,
            'Sumber Dana': t.sumber_dana === 'kas' ? 'Kas Umum' : 'Infak/Donasi',
            'Referensi Pembayaran': t.ref_payment || '-',
            'URL Nota': t.nota_url || '-',
            'Dibuat Oleh': t.created_by || '-',
        }));

        // Calculate total amount
        const totalJumlah = dataToExport.reduce((sum, t) => sum + Number(t.jumlah), 0);

        const ws = XLSX.utils.json_to_sheet(dataForSheet);

        // Append a spacer row and the total row
        XLSX.utils.sheet_add_json(ws, [
            {}, // Empty row for spacing
            { 'Deskripsi': 'TOTAL', 'Jumlah': totalJumlah }
        ], {
            skipHeader: true,
            origin: -1
        });
        
        const columnWidths = [ { wch: 38 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 50 }, { wch: 15 }, { wch: 20 }, { wch: 38 }, { wch: 40 }, { wch: 15 } ];
        ws['!cols'] = columnWidths;

        // Format all numerical data rows
        for (let i = 0; i < dataForSheet.length; i++) {
            const cellRef = XLSX.utils.encode_cell({c: 5, r: i + 1});
            if (ws[cellRef]) {
                ws[cellRef].t = 'n';
                ws[cellRef].z = '#,##0';
            }
        }
        
        // Format the total cell specifically
        const totalCellRef = XLSX.utils.encode_cell({c: 5, r: dataForSheet.length + 2});
        if (ws[totalCellRef]) {
            ws[totalCellRef].t = 'n';
            ws[totalCellRef].z = '#,##0';
        }

        const wb = XLSX.utils.book_new();
        const monthName = new Date(year, month - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        const sheetName = `${reportTitle} ${monthName}`;
        XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Sheet name max 31 chars

        const fileName = `laporan_${reportTitle.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}_${selectedMonth}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };
    
    return (
         <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ekspor Laporan Excel</h3>
            <p className="text-sm text-gray-600 mb-4">Pilih periode bulan dan jenis laporan yang ingin Anda unduh dalam format file Excel (.xlsx).</p>
            
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Bulan & Tahun</label>
                <input 
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full max-w-xs p-2 border border-gray-300 rounded-md"
                />
            </div>
            
            <div className="space-y-3">
                <ExportButton onClick={() => handleExport('income_kas')}>
                    Ekspor Pemasukan (Kas Umum)
                </ExportButton>
                 <ExportButton onClick={() => handleExport('expense_kas')}>
                    Ekspor Pengeluaran (Kas Umum)
                </ExportButton>
                 <ExportButton onClick={() => handleExport('income_infak')}>
                    Ekspor Pemasukan (Infak & Donasi)
                </ExportButton>
                 <ExportButton onClick={() => handleExport('expense_infak')}>
                    Ekspor Pengeluaran (Infak & Donasi)
                </ExportButton>
                <hr className="my-3"/>
                 <ExportButton onClick={() => handleExport('all')} className="bg-blue-50 hover:bg-blue-100 border-blue-200">
                    Ekspor Semua Transaksi Bulan Ini
                </ExportButton>
            </div>
        </div>
    );
};

export default MonthlyExport;