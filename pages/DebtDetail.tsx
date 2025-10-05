import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { PaymentRecord, Account, Transaction, FormalDebt, Commitment, Receivable } from '../types';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const applyAmortizationToPayments = (mortgage: FormalDebt, payments: PaymentRecord[]): PaymentRecord[] => {
    if (!mortgage.interestRate || !mortgage.totalAmount) return payments;

    const sortedPayments = [...payments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let balance = mortgage.totalAmount;
    const monthlyRate = (mortgage.interestRate / 100) / 12;
    
    return sortedPayments.map(payment => {
        const monthlyEscrowTotal = (mortgage.monthlyTax || 0) + (mortgage.monthlyInsurance || 0) + (mortgage.monthlyPMI || 0);
        
        let principalPortion = 0;
        let interestPortion = 0;
        let escrowPortion = 0;

        // An "extra" payment goes 100% to principal
        if (payment.paymentType === 'extra') {
            principalPortion = payment.amount;
        } else { // Regular payment logic
            const interestDue = balance * monthlyRate;
            interestPortion = Math.min(payment.amount, interestDue);
            const remainingAfterInterest = payment.amount - interestPortion;
            escrowPortion = Math.min(remainingAfterInterest, monthlyEscrowTotal);
            principalPortion = Math.max(0, payment.amount - interestPortion - escrowPortion);
        }

        const breakdown = {
            principal: principalPortion,
            interest: interestPortion,
            escrow: escrowPortion,
            total: payment.amount
        };

        balance -= principalPortion;

        return { ...payment, breakdown };
    });
};

const PaymentForm: React.FC<{
    onSubmit: (payment: Omit<PaymentRecord, 'id' | 'itemId' | 'transactionId'>) => void;
    onClose: () => void;
    initialData?: PaymentRecord | null;
    accounts: Account[];
    itemType: 'debt' | 'commitment' | 'receivable';
    isMortgage: boolean;
    mortgageDetails?: FormalDebt;
}> = ({ onSubmit, onClose, initialData, accounts, itemType, isMortgage, mortgageDetails }) => {
    const initialAmount = initialData?.amount;
    const [amount, setAmount] = useState<string>(initialAmount ? String(initialAmount) : '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState(initialData?.accountId || (accounts[0]?.id || ''));
    const [paymentType, setPaymentType] = useState<'regular' | 'extra'>(initialData?.paymentType || 'regular');

    const totalMonthlyPayment = useMemo(() => {
        if (!isMortgage || !mortgageDetails) return 0;
        return (mortgageDetails.monthlyPayment || 0) + (mortgageDetails.monthlyTax || 0) + (mortgageDetails.monthlyInsurance || 0) + (mortgageDetails.monthlyPMI || 0);
    }, [isMortgage, mortgageDetails]);
    
    useEffect(() => {
        if (isMortgage && paymentType === 'regular' && totalMonthlyPayment > 0 && !initialData) {
            setAmount(totalMonthlyPayment.toFixed(2));
        }
    }, [isMortgage, paymentType, totalMonthlyPayment, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (numAmount <= 0) {
            alert("Payment amount must be positive.");
            return;
        }
        if (!accountId) {
            alert("Please select an account.");
            return;
        }
        onSubmit({ amount: numAmount, date, accountId, paymentType });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             {isMortgage && !initialData && (
                <div className="flex items-center justify-center space-x-4 bg-gray-700 p-2 rounded-lg mb-4">
                    <button type="button" onClick={() => setPaymentType('regular')} className={`px-4 py-2 rounded-md w-full transition-colors ${paymentType === 'regular' ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>Regular Payment</button>
                    <button type="button" onClick={() => setPaymentType('extra')} className={`px-4 py-2 rounded-md w-full transition-colors ${paymentType === 'extra' ? 'bg-green-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>Extra Principal</button>
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" disabled={isMortgage && paymentType === 'regular' && !initialData} className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white disabled:bg-gray-600" />
                {isMortgage && paymentType === 'regular' && !initialData && <p className="text-xs text-gray-400 mt-1">Amount is based on total monthly payment.</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{itemType === 'receivable' ? 'Deposit To Account' : 'Pay From Account'}</label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white">
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toFixed(2)})</option>)}
                </select>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className={`px-4 py-2 rounded-md text-white ${itemType === 'receivable' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {itemType === 'receivable' ? 'Save Receipt' : 'Save Payment'}
                </button>
            </div>
        </form>
    );
};

const DebtDetail: React.FC = () => {
    const { itemType, itemId } = useParams<{ itemType: 'debt' | 'commitment' | 'receivable', itemId: string }>();
    const { formalDebts, commitments, receivables, paymentRecords, setPaymentRecords, accounts, setAccounts, transactions, setTransactions } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<PaymentRecord | null>(null);
    const [deleteLinkedTransaction, setDeleteLinkedTransaction] = useState(true);

    const { item, payments } = useMemo(() => {
        let currentItem: any = null;
        if (itemType === 'debt') currentItem = formalDebts.find(d => d.id === itemId);
        else if (itemType === 'commitment') currentItem = commitments.find(c => c.id === itemId);
        else if (itemType === 'receivable') currentItem = receivables.find(r => r.id === itemId);

        const itemPayments = paymentRecords.filter(p => p.itemId === itemId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { item: currentItem, payments: itemPayments };
    }, [itemType, itemId, formalDebts, commitments, receivables, paymentRecords]);

    const isMortgage = useMemo(() => itemType === 'debt' && (item as FormalDebt)?.assetType === 'home', [item, itemType]);

    const chartData = useMemo(() => {
        if (!item) return [];
        
        const totalAmount = item.totalAmount || 0;
        const sortedPayments = [...payments].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let runningBalance = totalAmount;

        const creationDate = new Date(item.creationDate || (sortedPayments.length > 0 ? sortedPayments[0].date : new Date()));
        creationDate.setDate(creationDate.getDate() -1);
        const dataPoints = [{ date: creationDate.toISOString().split('T')[0], balance: runningBalance }];

        const paymentsByDate = sortedPayments.reduce((acc, p) => {
            const principal = (isMortgage ? p.breakdown?.principal : p.amount) || 0;
            acc[p.date] = (acc[p.date] || 0) + principal;
            return acc;
        }, {} as Record<string, number>);

        for (const [date, principalPaidOnDate] of Object.entries(paymentsByDate)) {
            runningBalance -= principalPaidOnDate;
            dataPoints.push({ date, balance: runningBalance });
        }

        return dataPoints;

    }, [item, payments, isMortgage]);

    const openAddModal = () => {
        setEditingPayment(null);
        setIsModalOpen(true);
    };

    const openEditModal = (payment: PaymentRecord) => {
        setEditingPayment(payment);
        setIsModalOpen(true);
    };

    const handlePaymentSubmit = (paymentData: Omit<PaymentRecord, 'id' | 'itemId' | 'transactionId'>) => {
        if (!itemId || !itemType || !item) return;
        const isReceivable = itemType === 'receivable';

        const payee = isReceivable ? (item as Receivable).from : (itemType === 'debt' ? (item as FormalDebt).description : (item as Commitment).name);
        const category = isReceivable ? 'Receivable' : (itemType === 'debt' ? 'Debt Payment' : 'Commitment Payment');
        const description = `${isReceivable ? 'Received for' : 'Payment for'} ${item.name}`;

        if (editingPayment) {
            const originalPayment = payments.find(p => p.id === editingPayment.id);
            if (!originalPayment) return;
            
            setTransactions(prev => prev.map(t => t.id === originalPayment.transactionId ? { ...t, accountId: paymentData.accountId, amount: isReceivable ? paymentData.amount : -paymentData.amount, date: paymentData.date } : t));
            
            setAccounts(prev => prev.map(acc => {
                let newBalance = acc.balance;
                if (acc.id === originalPayment.accountId) newBalance += isReceivable ? -originalPayment.amount : originalPayment.amount;
                if (acc.id === paymentData.accountId) newBalance += isReceivable ? paymentData.amount : -paymentData.amount;
                return { ...acc, balance: newBalance };
            }));

            const updatedPaymentsForMortgage = paymentRecords
                .filter(p => p.itemId === itemId)
                .map(p => p.id === editingPayment.id ? { ...p, ...paymentData } : p);

            if (isMortgage) {
                const recalculated = applyAmortizationToPayments(item as FormalDebt, updatedPaymentsForMortgage);
                setPaymentRecords(prev => [...prev.filter(p => p.itemId !== itemId), ...recalculated]);
            } else {
                setPaymentRecords(prev => prev.map(p => p.id === editingPayment.id ? { ...p, ...paymentData } : p));
            }
        } else {
            const newTransaction: Transaction = { id: crypto.randomUUID(), accountId: paymentData.accountId, amount: isReceivable ? paymentData.amount : -paymentData.amount, date: paymentData.date, description, payee, category };
            setTransactions(prev => [...prev, newTransaction]);
            
            const newPayment: PaymentRecord = { ...paymentData, id: crypto.randomUUID(), itemId: itemId, transactionId: newTransaction.id };
            setAccounts(prev => prev.map(acc => acc.id === newPayment.accountId ? { ...acc, balance: acc.balance + (isReceivable ? newPayment.amount : -newPayment.amount) } : acc));
            
            if (isMortgage) {
                const currentMortgagePayments = paymentRecords.filter(p => p.itemId === itemId);
                const recalculated = applyAmortizationToPayments(item as FormalDebt, [...currentMortgagePayments, newPayment]);
                setPaymentRecords(prev => [...prev.filter(p => p.itemId !== itemId), ...recalculated]);
            } else {
                setPaymentRecords(prev => [...prev, newPayment]);
            }
        }
        setIsModalOpen(false);
        setEditingPayment(null);
    };

    const linkedTransactionInfo = useMemo(() => {
        if (!paymentToDelete || !paymentToDelete.transactionId) return null;
        const transaction = transactions.find(t => t.id === paymentToDelete.transactionId);
        if (!transaction) return null;
        const account = accounts.find(a => a.id === transaction.accountId);
        return { transaction, accountName: account?.name || 'Unknown Account' };
    }, [paymentToDelete, transactions, accounts]);
    
    const confirmationMessage = useMemo(() => {
        const baseMessage = <>Are you sure you want to delete this payment record of <strong>${paymentToDelete?.amount.toLocaleString()}</strong>? This will update the debt balance.</>;
        if (!linkedTransactionInfo) return baseMessage;
        return (
             <div>
                <p className="mb-4">This payment is linked to a transaction in your <strong>"{linkedTransactionInfo.accountName}"</strong> account.</p>
                 <label className="flex items-center space-x-2 bg-gray-700 p-3 rounded-md hover:bg-gray-600 cursor-pointer">
                    <input type="checkbox" checked={deleteLinkedTransaction} onChange={(e) => setDeleteLinkedTransaction(e.target.checked)} className="h-5 w-5 text-red-600 bg-gray-900 border-gray-600 rounded focus:ring-red-500"/>
                    <span>Also delete the corresponding account transaction.</span>
                </label>
            </div>
        )
    }, [linkedTransactionInfo, deleteLinkedTransaction, paymentToDelete]);

    const confirmDeletePayment = () => {
        if (!paymentToDelete || !itemType || !item) return;
        const isReceivable = itemType === 'receivable';

        if (paymentToDelete.transactionId && deleteLinkedTransaction) {
            setTransactions(prev => prev.filter(t => t.id !== paymentToDelete.transactionId));
            setAccounts(prev => prev.map(acc => acc.id === paymentToDelete.accountId ? { ...acc, balance: acc.balance + (isReceivable ? -paymentToDelete.amount : paymentToDelete.amount) } : acc));
        }

        const remainingPayments = paymentRecords.filter(p => p.id !== paymentToDelete.id);
        
        if (isMortgage) {
            const mortgagePayments = remainingPayments.filter(p => p.itemId === itemId);
            const recalculated = applyAmortizationToPayments(item as FormalDebt, mortgagePayments);
            setPaymentRecords(prev => [...prev.filter(p => p.itemId !== itemId), ...recalculated]);
        } else {
            setPaymentRecords(remainingPayments);
        }

        setPaymentToDelete(null);
        setDeleteLinkedTransaction(true);
    };

    const closeConfirmationModal = () => {
        setPaymentToDelete(null);
        setDeleteLinkedTransaction(true);
    };

    if (!item) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-2xl font-bold text-white">Item not found</h2>
                <Link to="/debts" className="text-blue-400 hover:underline mt-4 inline-block">Go back to Debts</Link>
            </div>
        );
    }

    const totalUserPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalAmount = item.totalAmount || item.amount;
    const principalPaid = useMemo(() => {
        if (!isMortgage) return totalUserPaid;
        return payments.reduce((sum, p) => sum + (p.breakdown?.principal || 0), 0);
    }, [payments, isMortgage, totalUserPaid]);
    const remaining = totalAmount - principalPaid;

    return (
        <div className="p-6">
            <Header title={item.name}>
                <button onClick={openAddModal} className={`text-white px-4 py-2 rounded-md ${itemType === 'receivable' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {itemType === 'receivable' ? 'Receive Payment' : 'Add Payment'}
                </button>
            </Header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Total Amount</p><p className="text-2xl font-semibold text-white">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                 <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Total Paid / Received</p><p className="text-2xl font-semibold text-green-500">${totalUserPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                 <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Remaining</p><p className="text-2xl font-semibold text-red-500">${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
            </div>

            {itemType === 'debt' && chartData.length > 1 && (
                <div className="bg-gray-800 p-4 rounded-lg mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">Balance History</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis dataKey="date" stroke="#a0aec0" tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} />
                            <YAxis stroke="#a0aec0" tickFormatter={(value) => `$${(Number(value)/1000).toFixed(0)}k`} domain={['dataMin', 'auto']}/>
                            <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none', color: '#e2e8f0' }} labelFormatter={(label) => new Date(label).toLocaleDateString()} formatter={(value: number, name: string) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]} />
                            <Legend wrapperStyle={{paddingTop: '20px'}}/>
                            <Line type="monotone" dataKey="balance" name="Remaining Balance" stroke="#3b82f6" dot={{r: 4}} strokeWidth={2}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-4">Payment History</h3>
                {payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-gray-400 uppercase text-sm"><tr><th className="p-3">Date</th><th className="p-3">Account</th><th className="p-3">Type</th><th className="p-3">Amount</th>{isMortgage && <th className="p-3">Principal</th>}{isMortgage && <th className="p-3">Interest</th>}<th className="p-3">Actions</th></tr></thead>
                            <tbody>{payments.map(p => { const sourceAccount = accounts.find(acc => acc.id === p.accountId); return (
                                <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3">{new Date(p.date).toLocaleDateString()}</td>
                                    <td className="p-3">{sourceAccount ? sourceAccount.name : <span className="text-gray-500">N/A</span>}</td>
                                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${p.paymentType === 'extra' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>{p.paymentType || 'regular'}</span></td>
                                    <td className={`p-3 font-semibold ${itemType === 'receivable' ? 'text-green-400' : 'text-yellow-400'}`}>${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    {isMortgage && <td className="p-3 text-green-400">${p.breakdown?.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>}
                                    {isMortgage && <td className="p-3 text-red-400">${p.breakdown?.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>}
                                    <td className="p-3 space-x-2 whitespace-nowrap"><button onClick={() => openEditModal(p)} className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600">Edit</button><button onClick={() => setPaymentToDelete(p)} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button></td>
                                </tr>
                            )})}</tbody>
                        </table>
                    </div>
                ): <p className="text-gray-400 text-center py-4">No payments recorded yet.</p>}
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPayment ? 'Edit Payment' : `${itemType === 'receivable' ? 'Log Receipt for' : 'Add Payment for'} ${item.name}`}>
                {itemType && <PaymentForm onSubmit={handlePaymentSubmit} onClose={() => setIsModalOpen(false)} initialData={editingPayment} accounts={accounts} itemType={itemType} isMortgage={isMortgage} mortgageDetails={isMortgage ? (item as FormalDebt) : undefined} />}
            </Modal>
            <ConfirmationModal isOpen={!!paymentToDelete} onClose={closeConfirmationModal} onConfirm={confirmDeletePayment} title="Confirm Deletion" message={confirmationMessage} confirmText="Delete" />
        </div>
    );
};

export default DebtDetail;