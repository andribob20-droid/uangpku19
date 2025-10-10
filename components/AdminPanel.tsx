import React, { useState } from 'react';
import { Payment, Student, Transaction, PaymentStatus, TransactionType, SumberDana } from '../types';
import BulkAddStudents from './BulkAddStudents';
import MonthlyExport from './MonthlyExport';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

// --- Sub-components for Admin Panel ---

const AddPayment: React.FC<{
    students: Student[];
    onAddPayment: (paymentData: { student_id: string; periode_bulan: string, tanggal: string; jumlah: number; metode: string; bukti_file: File | null; }) => void;
}> = ({ students, onAddPayment }) => {
    const [formState, setFormState] = useState({
        student_id: '',
        periode_bulan: new Date().toISOString().slice(0, 7), // YYYY-MM
        tanggal: new Date().toISOString().split('T')[0],
        jumlah: '100000',
        metode: 'Transfer Bank',
    });
    const [buktiFile, setBuktiFile] = useState<File | null>(null);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Ukuran file maksimal adalah 5MB.');
                setBuktiFile(null);
                return;
            }
            setError('');
            setBuktiFile(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formState.student_id || !formState.periode_bulan || !formState.tanggal || !formState.jumlah || !formState.metode) {
            setError("Harap isi semua kolom.");
            return;
        }
        setError('');
        onAddPayment({
            ...formState,
            jumlah: Number(formState.jumlah),
            periode_bulan: `${formState.periode_bulan}-01`,
            bukti_file: buktiFile,
        });
        setFormState({ ...formState, student_id: '', jumlah: '100000' });
        setBuktiFile(null);
        // Reset file input
        const fileInput = document.getElementById('bukti_file_admin') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tambah Pembayaran & Bukti</h3>
            <p className="text-sm text-gray-600 mb-4">Catat pembayaran iuran yang sudah divalidasi dan unggah bukti transfer yang dikirim mahasiswa.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Mahasiswa</label>
                    <select name="student_id" value={formState.student_id} onChange={handleChange} className="w-full p-2 border rounded-md" required>
                        <option value="">-- Pilih Mahasiswa --</option>
                        {students.sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name} ({s.nim})</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Periode Bulan Pembayaran</label>
                    <input type="month" name="periode_bulan" value={formState.periode_bulan} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Pembayaran Aktual</label>
                    <input type="date" name="tanggal" value={formState.tanggal} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Jumlah</label>
                    <input type="number" name="jumlah" placeholder="Jumlah" value={formState.jumlah} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Metode</label>
                    <input type="text" name="metode" placeholder="Metode (e.g., Transfer Bank)" value={formState.metode} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                </div>
                 <div>
                    <label htmlFor="bukti_file_admin" className="block text-sm font-medium text-gray-700">Unggah Bukti (Opsional, max 5MB)</label>
                    <input type="file" id="bukti_file_admin" name="bukti_file" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    {buktiFile && <p className="text-xs text-gray-500 mt-1">File terpilih: {buktiFile.name}</p>}
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">Validasi & Tambah Pembayaran</button>
            </form>
        </div>
    );
};

const AddIncome: React.FC<{ onAddIncome: (income: Omit<Transaction, 'id' | 'created_at' | 'ref_payment'>) => void; }> = ({ onAddIncome }) => {
    const [formState, setFormState] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        kategori: '',
        deskripsi: '',
        jumlah: '',
        sumber_dana: SumberDana.Kas,
        nota_url: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formState.kategori || !formState.deskripsi || !formState.jumlah) {
            alert("Harap isi semua field wajib (Kategori, Deskripsi, Jumlah).");
            return;
        }
        onAddIncome({
            tanggal: new Date(formState.tanggal).toISOString(),
            tipe: TransactionType.Pemasukan,
            kategori: formState.kategori,
            deskripsi: formState.deskripsi,
            jumlah: Number(formState.jumlah),
            sumber_dana: formState.sumber_dana,
            nota_url: formState.nota_url || null,
            created_by: null, // Will be set in parent
        });
        setFormState({ tanggal: new Date().toISOString().split('T')[0], kategori: '', deskripsi: '', jumlah: '', sumber_dana: SumberDana.Kas, nota_url: '' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tambah Pemasukan Lain</h3>
            <p className="text-sm text-gray-600 mb-4">Gunakan form ini untuk mencatat pemasukan umum di luar iuran wajib mahasiswa, seperti donasi, infaq, atau dana usaha.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="date" name="tanggal" value={formState.tanggal} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                <input type="text" name="kategori" placeholder="Kategori (e.g., Donasi, Infaq)" value={formState.kategori} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                <textarea name="deskripsi" placeholder="Deskripsi pemasukan" value={formState.deskripsi} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                <input type="number" name="jumlah" placeholder="Jumlah" value={formState.jumlah} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Dana Masuk Ke</label>
                    <select name="sumber_dana" value={formState.sumber_dana} onChange={handleChange} className="w-full p-2 border rounded-md" required>
                        <option value={SumberDana.Kas}>Kas Umum</option>
                        <option value={SumberDana.InfakDonasi}>Dana Infak/Donasi</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">URL Bukti (Opsional)</label>
                    <input type="url" name="nota_url" placeholder="https://example.com/bukti.jpg" value={formState.nota_url} onChange={handleChange} className="w-full p-2 border rounded-md" />
                </div>
                <button type="submit" className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">Tambah Pemasukan</button>
            </form>
        </div>
    );
};


const StudentFormModal: React.FC<{
    student: Student | null;
    onSave: (studentData: Omit<Student, 'id' | 'created_at'> | Student) => void;
    onClose: () => void;
}> = ({ student, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: student?.name || '',
        nim: student?.nim || '',
        angkatan: student?.angkatan || 'PKU 19',
    });

    const isEditing = !!student;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(isEditing ? { ...student, ...formData } : formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
                <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Mahasiswa' : 'Tambah Mahasiswa Baru'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nama Lengkap" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-md" required/>
                    <input type="text" placeholder="NIM" value={formData.nim} onChange={e => setFormData({...formData, nim: e.target.value})} className="w-full p-2 border rounded-md" required/>
                    <input type="text" placeholder="Angkatan" value={formData.angkatan} onChange={e => setFormData({...formData, angkatan: e.target.value})} className="w-full p-2 border rounded-md" required/>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">Batal</button>
                        <button type="submit" className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ManageStudents: React.FC<{
    students: Student[];
    onAddStudent: (studentData: Omit<Student, 'id'|'created_at'>) => void;
    onUpdateStudent: (student: Student) => void;
    onDeleteStudent: (studentId: string) => void;
}> = ({ students, onAddStudent, onUpdateStudent, onDeleteStudent }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    const handleSave = (studentData: Omit<Student, 'id'|'created_at'> | Student) => {
        if ('id' in studentData) {
            onUpdateStudent(studentData);
        } else {
            onAddStudent(studentData);
        }
    };

    const openEditModal = (student: Student) => {
        setEditingStudent(student);
        setShowModal(true);
    };

    const openAddModal = () => {
        setEditingStudent(null);
        setShowModal(true);
    };

    const handleDelete = (studentId: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus mahasiswa ini? Ini akan menghapus semua riwayat pembayaran terkait.")) {
            onDeleteStudent(studentId);
        }
    };

    return (
        <div>
            {showModal && <StudentFormModal student={editingStudent} onSave={handleSave} onClose={() => setShowModal(false)} />}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Manajemen Mahasiswa</h3>
                <button onClick={openAddModal} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                    Tambah Mahasiswa
                </button>
            </div>
            <div className="flow-root mt-6">
                 <ul className="divide-y divide-gray-200">
                    {students.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                        <li key={s.id} className="py-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                                <p className="text-sm text-gray-500">{s.nim}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => openEditModal(s)} className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                                <button onClick={() => handleDelete(s.id)} className="text-sm text-red-600 hover:text-red-800">Hapus</button>
                            </div>
                        </li>
                    ))}
                 </ul>
            </div>
        </div>
    );
};

const AddExpense: React.FC<{ onAddExpense: (expenseData: Omit<Transaction, 'id' | 'created_at' | 'ref_payment' | 'nota_url' | 'created_by'>, notaFile: File | null) => void; }> = ({ onAddExpense }) => {
    const [formState, setFormState] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        kategori: '',
        deskripsi: '',
        jumlah: '',
        sumber_dana: SumberDana.Kas,
    });
    const [notaFile, setNotaFile] = useState<File | null>(null);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Ukuran file maksimal adalah 5MB.');
                setNotaFile(null);
                return;
            }
            setError('');
            setNotaFile(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if(!formState.kategori || !formState.deskripsi || !formState.jumlah) {
            alert("Harap isi semua field wajib (Kategori, Deskripsi, Jumlah).");
            return;
        }
        onAddExpense({
            tanggal: new Date(formState.tanggal).toISOString(),
            tipe: TransactionType.Pengeluaran,
            kategori: formState.kategori,
            deskripsi: formState.deskripsi,
            jumlah: Number(formState.jumlah),
            sumber_dana: formState.sumber_dana,
        }, notaFile);
        
        setFormState({ tanggal: new Date().toISOString().split('T')[0], kategori: '', deskripsi: '', jumlah: '', sumber_dana: SumberDana.Kas });
        setNotaFile(null);
        const fileInput = document.getElementById('nota_file_admin') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tambah Pengeluaran</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="date" name="tanggal" value={formState.tanggal} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                <input type="text" name="kategori" placeholder="Kategori (e.g., Konsumsi)" value={formState.kategori} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                <textarea name="deskripsi" placeholder="Deskripsi pengeluaran" value={formState.deskripsi} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                <input type="number" name="jumlah" placeholder="Jumlah" value={formState.jumlah} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Sumber Dana</label>
                    <select name="sumber_dana" value={formState.sumber_dana} onChange={handleChange} className="w-full p-2 border rounded-md" required>
                        <option value={SumberDana.Kas}>Kas</option>
                        <option value={SumberDana.InfakDonasi}>Infak/Donasi</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="nota_file_admin" className="block text-sm font-medium text-gray-700">Unggah Bukti/Nota (Opsional, max 5MB)</label>
                    <input type="file" id="nota_file_admin" name="nota_file" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    {notaFile && <p className="text-xs text-gray-500 mt-1">File terpilih: {notaFile.name}</p>}
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Tambah</button>
            </form>
        </div>
    );
};

const TransactionFormModal: React.FC<{
    transaction: Transaction | null;
    onSave: (transactionData: Transaction) => void;
    onClose: () => void;
}> = ({ transaction, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        tanggal: transaction?.tanggal.split('T')[0] || new Date().toISOString().split('T')[0],
        tipe: transaction?.tipe || TransactionType.Pengeluaran,
        kategori: transaction?.kategori || '',
        deskripsi: transaction?.deskripsi || '',
        jumlah: transaction?.jumlah.toString() || '',
        sumber_dana: transaction?.sumber_dana || SumberDana.Kas,
        nota_url: transaction?.nota_url || '',
    });

    if (!transaction) return null;

    const isPaymentLinked = !!transaction.ref_payment;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedTransaction: Transaction = {
            ...transaction,
            deskripsi: formData.deskripsi,
            sumber_dana: formData.sumber_dana,
            nota_url: formData.nota_url || null,
            // Only update fields that are not payment-linked
            ...( !isPaymentLinked && {
                tanggal: new Date(formData.tanggal).toISOString(),
                tipe: formData.tipe,
                kategori: formData.kategori,
                jumlah: Number(formData.jumlah),
            })
        };
        onSave(updatedTransaction);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
                <h2 className="text-2xl font-bold mb-6">Edit Transaksi</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                        <input type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="w-full p-2 border rounded-md disabled:bg-gray-100" required disabled={isPaymentLinked}/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Tipe Transaksi</label>
                        <select value={formData.tipe} onChange={e => setFormData({...formData, tipe: e.target.value as TransactionType})} className="w-full p-2 border rounded-md disabled:bg-gray-100" required disabled={isPaymentLinked}>
                            <option value={TransactionType.Pemasukan}>Pemasukan</option>
                            <option value={TransactionType.Pengeluaran}>Pengeluaran</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Kategori</label>
                        <input type="text" value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} className="w-full p-2 border rounded-md disabled:bg-gray-100" required disabled={isPaymentLinked}/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                        <textarea value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className="w-full p-2 border rounded-md" required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Jumlah</label>
                        <input type="number" value={formData.jumlah} onChange={e => setFormData({...formData, jumlah: e.target.value})} className="w-full p-2 border rounded-md disabled:bg-gray-100" required disabled={isPaymentLinked}/>
                    </div>

                    {formData.tipe === TransactionType.Pengeluaran && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Sumber Dana</label>
                                <select name="sumber_dana" value={formData.sumber_dana} onChange={e => setFormData({...formData, sumber_dana: e.target.value as SumberDana})} className="w-full p-2 border rounded-md" required>
                                    <option value={SumberDana.Kas}>Kas</option>
                                    <option value={SumberDana.InfakDonasi}>Infak/Donasi</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">URL Nota (Opsional)</label>
                                <input type="url" value={formData.nota_url ?? ''} onChange={e => setFormData({...formData, nota_url: e.target.value})} className="w-full p-2 border rounded-md" />
                            </div>
                        </>
                    )}
                     {isPaymentLinked && <p className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded-md">Beberapa field tidak dapat diubah karena transaksi ini terhubung dengan pembayaran mahasiswa.</p>}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">Batal</button>
                        <button type="submit" className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Simpan Perubahan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ManageTransactions: React.FC<{
    transactions: Transaction[];
    onUpdateTransaction: (transaction: Transaction) => void;
    onDeleteTransaction: (transaction: Transaction) => void;
}> = ({ transactions, onUpdateTransaction, onDeleteTransaction }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setShowModal(true);
    };
    
    const handleSave = (transaction: Transaction) => {
        onUpdateTransaction(transaction);
        setShowModal(false); // Close modal on save
    };

    const handleDelete = (transaction: Transaction) => {
        onDeleteTransaction(transaction);
    };
    
    return (
        <div>
            {showModal && editingTransaction && <TransactionFormModal transaction={editingTransaction} onSave={handleSave} onClose={() => setShowModal(false)} />}
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Manajemen Transaksi</h3>
            <p className="text-sm text-gray-600 mb-4">Edit atau hapus transaksi yang sudah tercatat. Transaksi pemasukan yang terkait langsung dengan pembayaran mahasiswa memiliki batasan edit untuk menjaga integritas data.</p>
            <div className="flow-root mt-6 max-h-[60vh] overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                    {transactions.map(t => (
                        <li key={t.id} className="py-4 px-2 hover:bg-gray-50 rounded-md">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{t.deskripsi}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })} | <span className="font-semibold">{t.kategori}</span>
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4 ml-4">
                                    <p className={`text-lg font-bold ${t.tipe === TransactionType.Pemasukan ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(t.jumlah)}
                                    </p>
                                    <div className="flex flex-col space-y-1">
                                        <button onClick={() => handleEdit(t)} className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Edit</button>
                                        <button onClick={() => handleDelete(t)} className="text-xs px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">Hapus</button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// --- Main Admin Panel Component ---

const AdminPanel: React.FC<{
  students: Student[];
  transactions: Transaction[];
  onAddPayment: (paymentData: { student_id: string; periode_bulan: string; tanggal: string; jumlah: number; metode: string; bukti_file: File | null; }) => void;
  onAddIncome: (income: Omit<Transaction, 'id' | 'created_at' | 'ref_payment'>) => void;
  onAddExpense: (expenseData: Omit<Transaction, 'id' | 'created_at' | 'ref_payment' | 'nota_url' | 'created_by'>, notaFile: File | null) => void;
  onAddStudent: (studentData: Omit<Student, 'id'|'created_at'>) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
  onBulkAdd: (students: Omit<Student, 'id' | 'created_at'>[]) => Promise<void>;
}> = (props) => {
    const TABS = ['Tambah Pembayaran', 'Tambah Pemasukan', 'Tambah Pengeluaran', 'Manajemen Mahasiswa', 'Tambah Massal', 'Manajemen Transaksi', 'Ekspor Excel'];
    const [activeTab, setActiveTab] = useState(TABS[0]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Panel</h2>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`${
                                activeTab === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="mt-6">
                {activeTab === 'Tambah Pembayaran' && <AddPayment students={props.students} onAddPayment={props.onAddPayment} />}
                {activeTab === 'Tambah Pemasukan' && <AddIncome onAddIncome={props.onAddIncome} />}
                {activeTab === 'Tambah Pengeluaran' && <AddExpense onAddExpense={props.onAddExpense} />}
                {activeTab === 'Manajemen Mahasiswa' && <ManageStudents students={props.students} onAddStudent={props.onAddStudent} onUpdateStudent={props.onUpdateStudent} onDeleteStudent={props.onDeleteStudent} />}
                {activeTab === 'Tambah Massal' && <BulkAddStudents onBulkAdd={props.onBulkAdd} />}
                {activeTab === 'Manajemen Transaksi' && <ManageTransactions transactions={props.transactions} onUpdateTransaction={props.onUpdateTransaction} onDeleteTransaction={props.onDeleteTransaction} />}
                {activeTab === 'Ekspor Excel' && <MonthlyExport transactions={props.transactions} />}
            </div>
        </div>
    );
};

export default AdminPanel;