import React from 'react';
import { Payment, Student, PaymentStatus } from '../types';

interface VerifyPaymentsProps {
    payments: Payment[];
    students: Student[];
    onVerify: (paymentId: string, newStatus: PaymentStatus.Valid | PaymentStatus.Rejected) => Promise<void>;
}

const VerifyPayments: React.FC<VerifyPaymentsProps> = ({ payments, students, onVerify }) => {

    const getStudentName = (studentId: string) => {
        return students.find(s => s.id === studentId)?.name || 'Nama tidak ditemukan';
    };

    const handleVerify = async (paymentId: string, status: PaymentStatus.Valid | PaymentStatus.Rejected) => {
        const action = status === PaymentStatus.Valid ? 'menyetujui' : 'menolak';
        if (window.confirm(`Apakah Anda yakin ingin ${action} pembayaran ini?`)) {
            try {
                await onVerify(paymentId, status);
            } catch (error: any) {
                alert(`Gagal memverifikasi: ${error.message}`);
            }
        }
    };
    
    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Verifikasi Pembayaran Masuk</h3>
            <p className="text-sm text-gray-600 mb-4">Tinjau pembayaran yang dikirim oleh mahasiswa. Setujui untuk mencatatnya sebagai pemasukan kas atau tolak jika bukti tidak valid.</p>
            <div className="flow-root mt-6 max-h-[60vh] overflow-y-auto">
                {payments.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {payments.map(p => (
                            <li key={p.id} className="py-4 px-2">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                    {/* Info Pembayaran */}
                                    <div className="md:col-span-2 space-y-2">
                                        <p className="text-sm font-bold text-gray-900">{getStudentName(p.student_id)}</p>
                                        <p className="text-sm text-gray-600">
                                            <strong>Periode:</strong> {new Date(p.periode_bulan).toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <strong>Jumlah:</strong> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(p.jumlah)}
                                        </p>
                                         <p className="text-sm text-gray-600">
                                            <strong>Metode:</strong> {p.metode}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            <strong>Dikirim:</strong> {new Date(p.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                        <a href={p.bukti_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                            Lihat Bukti Pembayaran &rarr;
                                        </a>
                                    </div>
                                    {/* Gambar & Aksi */}
                                    <div className="flex flex-col items-center space-y-3">
                                        <a href={p.bukti_url} target="_blank" rel="noopener noreferrer" className="w-full">
                                            <img src={p.bukti_url} alt="Bukti pembayaran" className="w-full h-32 object-cover rounded-md border border-gray-200" loading="lazy" />
                                        </a>
                                        <div className="flex w-full space-x-2">
                                            <button onClick={() => handleVerify(p.id, PaymentStatus.Valid)} className="flex-1 py-2 px-3 text-sm bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">Setujui</button>
                                            <button onClick={() => handleVerify(p.id, PaymentStatus.Rejected)} className="flex-1 py-2 px-3 text-sm bg-red-600 text-white font-semibold rounded-md hover:bg-red-700">Tolak</button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                     <p className="text-center text-gray-500 py-8">Tidak ada pembayaran yang menunggu verifikasi.</p>
                )}
            </div>
        </div>
    );
};

export default VerifyPayments;
