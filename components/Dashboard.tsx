import React, { useMemo } from 'react';
import { Transaction, TransactionType, SumberDana } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from './Icons';

// Helper to format numbers into Indonesian Rupiah currency format.
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// A reusable card component for displaying dashboard metrics.
const StatCard: React.FC<{ title: string; amount: number; icon: React.ReactNode; color: string }> = ({ title, amount, icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{formatCurrency(amount)}</p>
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
  </div>
);

const Dashboard: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const stats = useMemo(() => {
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let kasPemasukan = 0;
    let kasPengeluaran = 0;
    let infakPemasukan = 0;
    let infakPengeluaran = 0;

    for (const t of transactions) {
      if (t.tipe === TransactionType.Pemasukan) {
        totalPemasukan += t.jumlah;
        if (t.sumber_dana === SumberDana.Kas) {
          kasPemasukan += t.jumlah;
        } else if (t.sumber_dana === SumberDana.InfakDonasi) {
          infakPemasukan += t.jumlah;
        }
      } else if (t.tipe === TransactionType.Pengeluaran) {
        totalPengeluaran += t.jumlah;
         if (t.sumber_dana === SumberDana.Kas) {
          kasPengeluaran += t.jumlah;
        } else if (t.sumber_dana === SumberDana.InfakDonasi) {
          infakPengeluaran += t.jumlah;
        }
      }
    }

    const saldoKas = kasPemasukan - kasPengeluaran;
    const saldoInfak = infakPemasukan - infakPengeluaran;
    const saldoTotal = totalPemasukan - totalPengeluaran;

    return {
      totalPemasukan,
      totalPengeluaran,
      saldoKas,
      saldoInfak,
      saldoTotal
    };
  }, [transactions]);

  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
       <h2 className="text-xl font-bold text-gray-800 mb-4">Ringkasan Keuangan</h2>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Saldo Card */}
        <div className="lg:col-span-1 md:col-span-2 bg-blue-50 p-6 rounded-lg shadow flex items-start justify-between">
           <div>
              <p className="text-sm font-medium text-blue-800 truncate">Total Saldo Akhir</p>
              <p className="mt-1 text-4xl font-bold text-blue-900">{formatCurrency(stats.saldoTotal)}</p>
           </div>
        </div>

        {/* Saldo per Sumber Dana */}
        <StatCard 
          title="Saldo Kas Umum" 
          amount={stats.saldoKas} 
          icon={<div className="font-bold text-lg text-gray-700">Rp</div>}
          color="bg-gray-200"
        />
        <StatCard 
          title="Saldo Infak & Donasi" 
          amount={stats.saldoInfak}
          icon={<div className="font-bold text-lg text-yellow-700">Rp</div>}
          color="bg-yellow-200"
        />

        {/* Pemasukan & Pengeluaran */}
        <StatCard 
          title="Total Pemasukan" 
          amount={stats.totalPemasukan} 
          icon={<ArrowUpIcon className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
        />
        <StatCard 
          title="Total Pengeluaran" 
          amount={stats.totalPengeluaran}
          icon={<ArrowDownIcon className="w-6 h-6 text-red-600" />}
          color="bg-red-100"
        />
       </div>
    </div>
  );
};

export default Dashboard;
