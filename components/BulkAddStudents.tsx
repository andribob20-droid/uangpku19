import React, { useState } from 'react';
import { Student } from '../types';

interface BulkAddStudentsProps {
    onBulkAdd: (students: Omit<Student, 'id' | 'created_at'>[]) => Promise<void>;
}

const BulkAddStudents: React.FC<BulkAddStudentsProps> = ({ onBulkAdd }) => {
    const [textData, setTextData] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleProcess = async () => {
        setIsLoading(true);
        setFeedback(null);

        const lines = textData.trim().split('\n');
        const studentsToAdd: Omit<Student, 'id' | 'created_at'>[] = [];
        const errors: string[] = [];

        lines.forEach((line, index) => {
            if (!line.trim()) return; // Skip empty lines

            const parts = line.split(',').map(p => p.trim());
            if (parts.length !== 3) {
                errors.push(`Baris ${index + 1}: Format tidak sesuai (harus NIM,Nama,Angkatan).`);
                return;
            }
            
            const [nim, name, angkatan] = parts;
            if (!nim || !name || !angkatan) {
                errors.push(`Baris ${index + 1}: NIM, Nama, atau Angkatan tidak boleh kosong.`);
                return;
            }

            studentsToAdd.push({ nim, name, angkatan });
        });

        if (errors.length > 0) {
            setFeedback({ type: 'error', message: `Ditemukan ${errors.length} error:\n- ${errors.slice(0, 5).join('\n- ')}` });
            setIsLoading(false);
            return;
        }

        if (studentsToAdd.length === 0) {
            setFeedback({ type: 'error', message: 'Tidak ada data mahasiswa valid untuk ditambahkan.' });
            setIsLoading(false);
            return;
        }

        try {
            await onBulkAdd(studentsToAdd);
            setFeedback({ type: 'success', message: `Berhasil menambahkan ${studentsToAdd.length} mahasiswa!` });
            setTextData('');
        } catch (error: any) {
            setFeedback({ type: 'error', message: `Gagal menambahkan: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Tambah Mahasiswa Massal</h3>
            <p className="text-sm text-gray-600 mb-4">
                Salin dan tempel data dari spreadsheet (Excel, Google Sheets). Pastikan formatnya adalah <strong>NIM,Nama,Angkatan</strong> dan setiap mahasiswa berada di baris baru.
            </p>
            <textarea
                className="w-full h-64 p-3 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh:&#10;19001,Budi Santoso,PKU 19&#10;19002,Citra Lestari,PKU 19&#10;19003,Dewi Anggraini,PKU 19"
                value={textData}
                onChange={(e) => setTextData(e.target.value)}
                disabled={isLoading}
            />
            <button
                onClick={handleProcess}
                disabled={isLoading || !textData.trim()}
                className="w-full mt-4 py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Memproses...' : 'Tambahkan Mahasiswa'}
            </button>
            {feedback && (
                <div className={`mt-4 p-4 rounded-md text-sm whitespace-pre-wrap ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {feedback.message}
                </div>
            )}
        </div>
    );
};

export default BulkAddStudents;
