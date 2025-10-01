import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';

// Since Recharts is loaded from a CDN, we need to access it from the window object.
// We provide a fallback to prevent crashes if the script hasn't loaded yet.
const {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} = (window as any).Recharts || {};

const formatCurrencySimple = (value: number) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-bold text-gray-800">{label}</p>
        {payload.map((pld: any, index: number) => (
             <p key={index} style={{ color: pld.fill }}>
                {`${pld.name}: ${formatCurrencySimple(pld.value)}`}
            </p>
        ))}
      </div>
    );
  }
  return null;
};


const FinancialChart: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {

  const monthlyData = useMemo(() => {
    const dataByMonth: { [key: string]: { pemasukan: number, pengeluaran: number } } = {};

    transactions.forEach(t => {
      const date = new Date(t.tanggal);
      const monthKey = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });

      if (!dataByMonth[monthKey]) {
        dataByMonth[monthKey] = { pemasukan: 0, pengeluaran: 0 };
      }

      const amount = Number(t.jumlah) || 0;
      if (t.tipe === TransactionType.Pemasukan) {
        dataByMonth[monthKey].pemasukan += amount;
      } else {
        dataByMonth[monthKey].pengeluaran += amount;
      }
    });

    return Object.entries(dataByMonth)
      .map(([month, values]) => ({ month, ...values }))
      .sort((a, b) => new Date(a.month.replace(/(\w{3}) (\d{4})/, '$1 1, $2')).getTime() - new Date(b.month.replace(/(\w{3}) (\d{4})/, '$1 1, $2')).getTime());

  }, [transactions]);

  const expenseByCategoryData = useMemo(() => {
    const expenseData: { [key: string]: number } = {};
    transactions
      .filter(t => t.tipe === TransactionType.Pengeluaran)
      .forEach(t => {
        const category = t.kategori || 'Lainnya';
        const amount = Number(t.jumlah) || 0;
        if (!expenseData[category]) {
          expenseData[category] = 0;
        }
        expenseData[category] += amount;
      });

    return Object.entries(expenseData).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

  // Check if Recharts is available
  if (!BarChart) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">
            Gagal memuat library visualisasi data.
        </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Visualisasi Data Keuangan</h2>
      
      {transactions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            {/* Monthly Flow Chart */}
            <div className="lg:col-span-3 h-80">
                 <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Arus Kas Bulanan</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis tickFormatter={value => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value as number)} fontSize={12}/>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="pemasukan" fill="#10B981" name="Pemasukan" />
                        <Bar dataKey="pengeluaran" fill="#EF4444" name="Pengeluaran" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Expense Composition Chart */}
            <div className="lg:col-span-2 h-80">
                 <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Komposisi Pengeluaran</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={expenseByCategoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                        >
                            {expenseByCategoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrencySimple(value)} />
                        <Legend wrapperStyle={{fontSize: "12px"}} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">Belum ada data transaksi untuk divisualisasikan.</p>
      )}

    </div>
  );
};

export default FinancialChart;
