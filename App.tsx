import React, { useState, useEffect, useMemo } from 'react';
import { Student, Payment, Transaction, PaymentStatus, TransactionType, SumberDana } from './types';
import { ADMIN_USER, ADMIN_PASS, MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MINUTES } from './constants';
import Dashboard from './components/Dashboard';
import StudentStatus from './components/StudentStatus';
import AdminPanel from './components/AdminPanel';
import PublicTransactions from './components/PublicTransactions';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// --- Login Modal Component ---
const LoginModal: React.FC<{
    onLogin: (password: string) => boolean;
    onClose: () => void;
    error: string;
    isLocked: boolean;
    lockoutTime: number;
}> = ({ onLogin, onClose, error, isLocked, lockoutTime }) => {
    const [username, setUsername] = useState(ADMIN_USER);
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(password);
    };
    
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm relative">
                <button onClick={onClose} className="absolute top-2 right-3 text-3xl font-light text-gray-500 hover:text-gray-800">&times;</button>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Admin Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
                            readOnly
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="******************"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            disabled={isLocked}
                            autoFocus
                        />
                    </div>
                     {error && !isLocked && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                    {isLocked && (
                         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center" role="alert">
                            <strong className="font-bold">Terlalu banyak percobaan!</strong>
                            <span className="block sm:inline"> Coba lagi dalam {formatTime(lockoutTime)}.</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-gray-400"
                            disabled={isLocked}
                        >
                           {isLocked ? 'Terkunci' : 'Sign In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main App Component ---
function App() {
    // --- State Management ---
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState(0);
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(true);

    const [students, setStudents] = useState<Student[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // --- Effects ---

    // Initial data fetch from Supabase
    useEffect(() => {
        if (!isSupabaseConfigured) {
            console.error("Supabase not configured.");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const [studentsRes, paymentsRes, transactionsRes] = await Promise.all([
                    supabase.from('students').select('*'),
                    supabase.from('payments').select('*'),
                    supabase.from('transactions').select('*'),
                ]);

                if (studentsRes.error) throw studentsRes.error;
                if (paymentsRes.error) throw paymentsRes.error;
                if (transactionsRes.error) throw transactionsRes.error;

                setStudents(studentsRes.data || []);
                setPayments(paymentsRes.data || []);
                setTransactions(transactionsRes.data || []);
            } catch (error: any) {
                alert(`Error fetching data: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Supabase real-time subscriptions - REFACTORED FOR RELIABILITY
    useEffect(() => {
        if (!isSupabaseConfigured) return;

        const handlePayload = (setter: React.Dispatch<React.SetStateAction<any[]>>, payload: any) => {
            switch (payload.eventType) {
                case 'INSERT':
                    setter(prev => [...prev, payload.new]);
                    break;
                case 'UPDATE':
                    setter(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
                    break;
                case 'DELETE':
                     // Supabase provides `old` which contains the full object including id
                    setter(prev => prev.filter(item => item.id !== payload.old.id));
                    break;
                default:
                    break;
            }
        };

        const channel = supabase.channel('database-changes');
        
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public' },
            (payload) => {
                switch (payload.table) {
                    case 'students':
                        handlePayload(setStudents, payload);
                        break;
                    case 'payments':
                        handlePayload(setPayments, payload);
                        break;
                    case 'transactions':
                        handlePayload(setTransactions, payload);
                        break;
                    default:
                        break;
                }
            }
        ).subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Lockout timer effect
    useEffect(() => {
        if (lockoutTime > 0) {
            const timer = setTimeout(() => setLockoutTime(lockoutTime - 1), 1000);
            return () => clearTimeout(timer);
        } else if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            setLoginAttempts(0);
        }
    }, [lockoutTime, loginAttempts]);
    
    // --- Auth Handlers ---
    const handleLogin = (password: string): boolean => {
        if (password === ADMIN_PASS) {
            setIsLoggedIn(true);
            setLoginError('');
            setLoginAttempts(0);
            setShowLoginModal(false);
            return true;
        } else {
            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);
            if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
                setLoginError(`Terlalu banyak percobaan gagal. Akun terkunci.`);
                setLockoutTime(LOCKOUT_DURATION_MINUTES * 60);
            } else {
                setLoginError(`Password salah. Sisa percobaan: ${MAX_LOGIN_ATTEMPTS - newAttempts}`);
            }
            return false;
        }
    };

    const handleLogout = () => setIsLoggedIn(false);

    // --- Data Manipulation Handlers ( interacting with Supabase ) ---

    const handleAddStudent = async (studentData: Omit<Student, 'id' | 'created_at'>) => {
        const { error } = await supabase.from('students').insert([studentData]);
        if (error) alert(`Gagal menambah mahasiswa: ${error.message}`);
    };
    
    const handleBulkAddStudents = async (studentsToAdd: Omit<Student, 'id' | 'created_at'>[]) => {
        const { error } = await supabase.from('students').insert(studentsToAdd);
        if (error) {
            // Rethrow the error to be caught by the component
            throw new Error(error.message);
        }
    };


    const handleUpdateStudent = async (updatedStudent: Student) => {
        const { error } = await supabase.from('students').update(updatedStudent).eq('id', updatedStudent.id);
        if (error) alert(`Gagal memperbarui mahasiswa: ${error.message}`);
    };

    const handleDeleteStudent = async (studentId: string) => {
        // Since the DB schema has ON DELETE CASCADE for payments,
        // and ON DELETE SET NULL for transactions, we need to manually delete
        // the "Iuran Wajib" transactions first.
        const { data: studentPayments, error: paymentError } = await supabase.from('payments').select('id').eq('student_id', studentId);
        
        if (paymentError) {
            alert(`Gagal mengambil data pembayaran: ${paymentError.message}`);
            return;
        }

        if (studentPayments && studentPayments.length > 0) {
            const paymentIds = studentPayments.map(p => p.id);
            const { error: txError } = await supabase.from('transactions').delete().in('ref_payment', paymentIds);
            if (txError) {
                alert(`Gagal menghapus transaksi terkait: ${txError.message}`);
                return;
            }
        }
        
        // Now delete the student. Supabase will cascade delete the payments.
        const { error: studentError } = await supabase.from('students').delete().eq('id', studentId);
        if (studentError) alert(`Gagal menghapus mahasiswa: ${studentError.message}`);
    };
    
    const handleAddPayment = async (paymentData: { student_id: string; periode_bulan: string; tanggal: string; jumlah: number; metode: string; }) => {
        const student = students.find(s => s.id === paymentData.student_id);
        if (!student) return;

        const newPayment: Omit<Payment, 'id' | 'created_at'> = {
            ...paymentData,
            bukti_url: '',
            status: PaymentStatus.Valid,
            verified_by: ADMIN_USER,
            tanggal: new Date(paymentData.tanggal).toISOString(),
        };

        const { data, error: paymentError } = await supabase.from('payments').insert(newPayment).select().single();

        if (paymentError || !data) {
            alert(`Gagal menambah pembayaran: ${paymentError?.message || 'Data tidak kembali.'}`);
            return;
        }

        const newTransaction: Omit<Transaction, 'id' | 'created_at'> = {
            tanggal: data.tanggal,
            tipe: TransactionType.Pemasukan,
            kategori: 'Iuran Wajib',
            sumber_dana: SumberDana.Kas,
            deskripsi: `Pembayaran iuran dari ${student.name}`,
            jumlah: data.jumlah,
            ref_payment: data.id,
            nota_url: null,
            created_by: ADMIN_USER,
        };

        const { error: transactionError } = await supabase.from('transactions').insert(newTransaction);
        if(transactionError) alert(`Pembayaran ditambahkan, tapi gagal mencatat transaksi: ${transactionError.message}`);
        else alert("Pembayaran berhasil ditambahkan dan divalidasi.");
    };

    const handleAddIncome = async (incomeData: Omit<Transaction, 'id' | 'created_at' | 'ref_payment'>) => {
        const newIncome = { ...incomeData, ref_payment: null, created_by: ADMIN_USER };
        const { error } = await supabase.from('transactions').insert(newIncome);
        if (error) alert(`Gagal menambah pemasukan: ${error.message}`);
        else alert("Pemasukan berhasil ditambahkan.");
    };

    const handleAddExpense = async (expenseData: Omit<Transaction, 'id' | 'created_at' | 'ref_payment'>) => {
        const newExpense = { ...expenseData, ref_payment: null, created_by: ADMIN_USER };
        const { error } = await supabase.from('transactions').insert(newExpense);
        if (error) alert(`Gagal menambah pengeluaran: ${error.message}`);
    };

    const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
        const { error } = await supabase.from('transactions').update(updatedTransaction).eq('id', updatedTransaction.id);
        if (error) alert(`Gagal memperbarui transaksi: ${error.message}`);
    };

    const handleDeleteTransaction = async (transactionToDelete: Transaction) => {
        if (transactionToDelete.ref_payment) {
            alert("Transaksi ini tidak dapat dihapus karena terhubung dengan pembayaran mahasiswa. Hapus data mahasiswa terkait untuk menghapus transaksi ini secara otomatis.");
            return;
        }
        if (window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
            const { error } = await supabase.from('transactions').delete().eq('id', transactionToDelete.id);
            if(error) alert(`Gagal menghapus transaksi: ${error.message}`);
        }
    };
    
    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    }, [transactions]);


    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    if (!isSupabaseConfigured) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-100 text-red-800 p-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Konfigurasi Supabase Diperlukan</h2>
                    <p>Harap konfigurasikan URL dan Kunci Anon Supabase Anda di dalam file <code>supabaseClient.ts</code> untuk melanjutkan.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen">
            {showLoginModal && (
                <LoginModal 
                    onLogin={handleLogin} 
                    onClose={() => setShowLoginModal(false)}
                    error={loginError} 
                    isLocked={lockoutTime > 0} 
                    lockoutTime={lockoutTime} 
                />
            )}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Cash Flow Mahasiswa PKU 19</h1>
                    {isLoggedIn ? (
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setLoginError('');
                                setShowLoginModal(true)
                            }}
                            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Admin Login
                        </button>
                    )}
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0 space-y-8">
                    <Dashboard transactions={sortedTransactions} />
                    <PublicTransactions transactions={sortedTransactions} />
                    <StudentStatus students={students} payments={payments} />
                    {isLoggedIn && (
                        <AdminPanel 
                            students={students}
                            payments={payments}
                            transactions={sortedTransactions}
                            onAddPayment={handleAddPayment}
                            onAddIncome={handleAddIncome}
                            onAddExpense={handleAddExpense}
                            onAddStudent={handleAddStudent}
                            onUpdateStudent={handleUpdateStudent}
                            onDeleteStudent={handleDeleteStudent}
                            onUpdateTransaction={handleUpdateTransaction}
                            onDeleteTransaction={handleDeleteTransaction}
                            onBulkAdd={handleBulkAddStudents}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;