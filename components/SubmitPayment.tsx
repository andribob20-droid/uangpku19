import React, { useState } from 'react';
import { Student } from '../types';

interface SubmitPaymentProps {
    students: Student[];
    onSubmit: (formData: {
        student_id: string;
        periode_bulan: string;
        jumlah: number;
        metode: string;
        bukti_file: File;
    }) => Promise<void>;
}

const SubmitPayment: React.FC<SubmitPaymentProps> = ({ students, onSubmit }) => {
    const [formState, setFormState] = useState({
        student_id: '',
        periode_bulan: new Date().toISOString().slice(0, 7), // YYYY-MM
        jumlah: '100000', // Default amount
        metode: 'Transfer Bank',
    });
    const [buktiFile, setBuktiFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Basic validation for file type and size
            if (!file.type.startsWith('image/')) {
                setError('File harus berupa gambar (JPG, PNG, dll.).');
                setBuktiFile(null);
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Ukuran file maksimal adalah 5MB.');
                setBuktiFile(null);
                return;
            }
            setError('');
            setBuktiFile(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formState.student_id || !formState.periode_bulan || !formState.jumlah || !formState.metode) {
            setError("Harap isi semua kolom.");
            return;
        }
        if (!buktiFile) {
            setError("Harap unggah bukti pembayaran.");
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit({
                ...formState,
                jumlah: Number(formState.jumlah),
                bukti_file: buktiFile,
            });
            setSuccess('Pembayaran berhasil dikirim dan sedang menunggu verifikasi admin.');
            // Reset form
            setFormState({
                student_id: '',
                periode_bulan: new Date().toISOString().slice(0, 7),
                jumlah: '100000',
                metode: 'Transfer Bank',
            });
            setBuktiFile(null);
            // Clear file input
            const fileInput = document.getElementById('bukti_file_input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (err: any) {
            setError(`Gagal mengirim pembayaran: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Kirim Bukti Pembayaran</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">Nama Mahasiswa</label>
                    <select id="student_id" name="student_id" value={formState.student_id} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                        <option value="">-- Pilih Nama Anda --</option>
                        {students.sort((a, b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name} ({s.nim})</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="periode_bulan" className="block text-sm font-medium text-gray-700">Periode Bulan Pembayaran</label>
                    <input type="month" id="periode_bulan" name="periode_bulan" value={formState.periode_bulan} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label htmlFor="jumlah" className="block text-sm font-medium text-gray-700">Jumlah</label>
                    <input type="number" id="jumlah" name="jumlah" placeholder="Jumlah" value={formState.jumlah} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                 <div>
                    <label htmlFor="metode" className="block text-sm font-medium text-gray-700">Metode Pembayaran</label>
                    <input type="text" id="metode" name="metode" placeholder="e.g., Transfer BSI, GoPay" value={formState.metode} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                 <div>
                    <label htmlFor="bukti_file_input" className="block text-sm font-medium text-gray-700">Unggah Bukti (Gambar, max 5MB)</label>
                    <input type="file" id="bukti_file_input" name="bukti_file" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required />
                    {buktiFile && <p className="text-xs text-gray-500 mt-1">File terpilih: {buktiFile.name}</p>}
                </div>

                {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">{error}</p>}
                {success && <p className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">{success}</p>}

                <button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                    {isLoading ? 'Mengirim...' : 'Kirim Pembayaran'}
                </button>
            </form>
        </div>
    );
};

export default SubmitPayment;
