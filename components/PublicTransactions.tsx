import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from './Icons';

// Re-using the formatter for consistency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

type FilterType = 'today' | '7d' | '14d' | 'month';

const PublicTransactions: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const [filter, setFilter] = useState<FilterType>('7d');

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // To get a full 7 days including today, we go back 6 days from today's date at midnight.
        const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000);
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        switch (filter) {
            case 'today':
                // Transactions from midnight today until now
                return transactions.filter(t => new Date(t.tanggal) >= today);
            case '7d':
                return transactions.filter(t => new Date(t.tanggal) >= sevenDaysAgo);
            case '14d':
                return transactions.filter(t => new Date(t.tanggal) >= fourteenDaysAgo);
            case 'month':
                return transactions.filter(t => new Date(t.tanggal) >= firstDayOfMonth);
            default:
                return transactions;
        }
    }, [transactions, filter]);
    
    const FilterButton: React.FC<{
        label: string;
        value: FilterType;
        currentFilter: FilterType;
        setFilter: (value: FilterType) => void;
    }> = ({ label, value, currentFilter, setFilter }) => {
        const isActive = value === currentFilter;
        return (
            <button
                onClick={() => setFilter(value)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Riwayat Transaksi Publik</h2>
                <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
                   <FilterButton label="Hari Ini" value="today" currentFilter={filter} setFilter={setFilter} />
                   <FilterButton label="7 Hari" value="7d" currentFilter={filter} setFilter={setFilter} />
                   <FilterButton label="14 Hari" value="14d" currentFilter={filter} setFilter={setFilter} />
                   <FilterButton label="Bulan Ini" value="month" currentFilter={filter} setFilter={setFilter} />
                </div>
            </div>
            <div className="flow-root max-h-96 overflow-y-auto">
                {filteredTransactions.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {filteredTransactions.map(t => (
                            <li key={t.id} className="py-3 flex items-center justify-between">
                                <div className="flex items-center space-x-4 min-w-0">
                                    <div className={`flex-shrink-0 rounded-full p-2 ${t.tipe === TransactionType.Pemasukan ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                       {t.tipe === TransactionType.Pemasukan ? <ArrowUpIcon className="w-5 h-5" /> : <ArrowDownIcon className="w-5 h-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{t.deskripsi}</p>
                                        <p className="text-xs text-gray-500">{new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - {t.kategori}</p>
                                    </div>
                                </div>
                                <p className={`text-sm font-semibold whitespace-nowrap ml-4 ${t.tipe === TransactionType.Pemasukan ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.jumlah)}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 py-8">Tidak ada transaksi pada periode yang dipilih.</p>
                )}
            </div>
        </div>
    );
};

export default PublicTransactions;
