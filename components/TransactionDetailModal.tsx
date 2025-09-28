import React, { useRef, useState } from 'react';
import { Transaction, TransactionType } from '../types';

// Tell TypeScript about the global variables from the CDN scripts
declare const html2canvas: any;
declare const jspdf: { jsPDF: new (options?: any) => any };


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

interface TransactionDetailModalProps {
    transaction: Transaction;
    onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value: string | React.ReactNode; isDescription?: boolean }> = ({ label, value, isDescription }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className={`mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 ${isDescription ? 'whitespace-pre-wrap break-words' : ''}`}>
            {value}
        </dd>
    </div>
);

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, onClose }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async (format: 'png' | 'pdf') => {
        if (!contentRef.current) return;
        setIsDownloading(true);

        try {
            const canvas = await html2canvas(contentRef.current, {
                scale: 2, // Higher scale for better quality
                backgroundColor: '#ffffff',
                useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const fileName = `transaksi_${transaction.id.substring(0, 8)}.${format}`;

            if (format === 'png') {
                const link = document.createElement('a');
                link.href = imgData;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                const { jsPDF } = jspdf;
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });
                
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save(fileName);
            }

        } catch (error) {
            console.error("Download failed:", error);
            alert("Gagal mengunduh file. Silakan coba lagi.");
        } finally {
            setIsDownloading(false);
        }
    };

    const isPemasukan = transaction.tipe === TransactionType.Pemasukan;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl relative max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200">
                     <h2 className="text-2xl font-bold text-gray-800">Detail Transaksi</h2>
                     <button onClick={onClose} className="absolute top-4 right-4 text-3xl font-light text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                
                {/* Content to be exported */}
                <div ref={contentRef} className="p-6 overflow-y-auto">
                    <div className="border-b-2 pb-4 mb-4" style={{ borderColor: isPemasukan ? '#10B981' : '#EF4444' }}>
                        <p className="text-sm text-gray-500">Jumlah Transaksi</p>
                        <p className={`text-4xl font-bold ${isPemasukan ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(transaction.jumlah)}
                        </p>
                    </div>

                    <dl className="divide-y divide-gray-200">
                        <DetailRow label="ID Transaksi" value={transaction.id} />
                        <DetailRow label="Tanggal" value={new Date(transaction.tanggal).toLocaleString('id-ID', {
                            dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta'
                        })} />
                        <DetailRow label="Tipe" value={
                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isPemasukan ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {transaction.tipe}
                            </span>
                        } />
                        <DetailRow label="Kategori" value={transaction.kategori} />
                        <DetailRow label="Deskripsi" value={transaction.deskripsi} isDescription={true} />
                        <DetailRow label="Sumber Dana" value={transaction.sumber_dana} />
                        {transaction.nota_url && (
                             <DetailRow label="Bukti/Nota" value={
                                 <a href={transaction.nota_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                     Lihat Bukti
                                 </a>
                             } />
                        )}
                         {transaction.ref_payment && (
                             <DetailRow label="Ref. Pembayaran" value={transaction.ref_payment} />
                        )}
                    </dl>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200 mt-auto">
                    <div className="flex justify-end space-x-4">
                        <button onClick={() => handleDownload('png')} disabled={isDownloading} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50">
                            {isDownloading ? 'Mengunduh...' : 'Download PNG'}
                        </button>
                        <button onClick={() => handleDownload('pdf')} disabled={isDownloading} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50">
                            {isDownloading ? 'Mengunduh...' : 'Download PDF'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailModal;
