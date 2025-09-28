
import React, { useState, useMemo } from 'react';
import { Student, Payment, PaymentStatus } from '../types';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from './Icons';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const StatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const statusMap = {
    [PaymentStatus.Valid]: { text: 'Lunas', color: 'bg-green-100 text-green-800', Icon: CheckCircleIcon },
    [PaymentStatus.Pending]: { text: 'Pending', color: 'bg-orange-100 text-orange-800', Icon: ClockIcon },
    [PaymentStatus.Rejected]: { text: 'Ditolak', color: 'bg-red-100 text-red-800', Icon: XCircleIcon },
  };
  const { text, color, Icon } = statusMap[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon className="w-4 h-4 mr-1.5" />
      {text}
    </span>
  );
};

const StudentDetail: React.FC<{ student: Student; payments: Payment[] }> = ({ student, payments }) => {
  const totalPaid = payments
    .filter(p => p.status === PaymentStatus.Valid)
    .reduce((sum, p) => sum + p.jumlah, 0);

  const paymentsByMonth = useMemo(() => payments.reduce((acc, p) => {
    // Use UTC to prevent timezone shifts when creating the date for formatting
    const month = new Date(p.periode_bulan).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', timeZone: 'UTC' });
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(p);
    return acc;
  }, {} as Record<string, Payment[]>), [payments]);

  const sortedMonths = useMemo(() => Object.keys(paymentsByMonth).sort((a, b) => {
    // A bit of a trick to sort by date from the month string
    const dateA = new Date(paymentsByMonth[a][0].periode_bulan);
    const dateB = new Date(paymentsByMonth[b][0].periode_bulan);
    return dateB.getTime() - dateA.getTime();
  }), [paymentsByMonth]);


  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold text-gray-800">{student.name}</h4>
        <div>
          <span className="text-sm text-gray-500">Total Terbayar: </span>
          <span className="font-bold text-green-600">{formatCurrency(totalPaid)}</span>
        </div>
      </div>
      <div className="mt-4 flow-root">
        {payments.length > 0 ? (
          <div className="space-y-4">
            {sortedMonths.map(month => (
              <div key={month}>
                <h5 className="text-md font-semibold text-gray-700 bg-gray-200 px-3 py-1 rounded-md">{month}</h5>
                <ul className="mt-2 -my-2 divide-y divide-gray-200">
                  {paymentsByMonth[month].map(payment => (
                     <li key={payment.id} className="py-3 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.jumlah)} - <span className="text-gray-600">{payment.metode}</span></p>
                            <p className="text-xs text-gray-500">Tgl Bayar: {new Date(payment.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' })}</p>
                        </div>
                        <StatusBadge status={payment.status} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-500 text-center py-4">Belum ada riwayat pembayaran.</p>}
      </div>
    </div>
  );
};


const StudentStatus: React.FC<{ students: Student[]; payments: Payment[] }> = ({ students, payments }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return students.filter(student =>
      student.name.toLowerCase().includes(query) || student.nim.includes(query)
    );
  }, [students, searchQuery]);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(prevId => prevId === studentId ? null : studentId);
  }
    
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Status Pembayaran Mahasiswa</h2>
      <input
        type="text"
        placeholder="Cari nama atau NIM mahasiswa..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="mt-4 max-h-96 overflow-y-auto">
        <ul className="divide-y divide-gray-200">
          {filteredStudents.map(student => (
            <li key={student.id} className="py-2">
              <button onClick={() => handleSelectStudent(student.id)} className="w-full text-left p-3 hover:bg-gray-100 rounded-md transition-colors">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.nim}</p>
                    </div>
                     <span className="text-sm text-gray-400">{selectedStudentId === student.id ? 'Tutup' : 'Lihat Detail'}</span>
                </div>
              </button>
              {selectedStudentId === student.id && (
                <StudentDetail 
                    student={student} 
                    payments={payments.filter(p => p.student_id === student.id).sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StudentStatus;