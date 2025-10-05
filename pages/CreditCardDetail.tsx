import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Transaction, Category, CreditCard, Account } from '../types';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import PieChartComponent from '../components/charts/PieChartComponent';
import { ChartColors } from '../constants';

const TransactionForm: React.FC<{
    onSubmit: (transaction: Omit<Transaction, 'id' | 'accountId'>, paymentInfo?: { fromAccountId: string }) => void;
    onClose: () => void;
    initialData?: Transaction | null;
    categories: Category[];
    accounts: Account[];
}> = ({ onSubmit, onClose, initialData, categories, accounts }) => {
    // For CCs, a purchase is an "expense", a payment/refund is "income" relative to the balance
    const isPurchase = initialData ? initialData.amount > 0 : true;
    const [amount, setAmount] = useState<string>(initialData ? String(Math.abs(initialData.amount)) : '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState(initialData?.description || '');
    const [payee, setPayee] = useState(initialData?.payee || '');
    const [category, setCategory] = useState(initialData?.category || '');
    const [isPurchaseType, setIsPurchaseType] = useState(isPurchase);
    const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount === 0) return;
        
        const paymentInfo = !isPurchaseType ? { fromAccountId } : undefined;
        
        // For credit cards: purchase is positive amount (increases liability), payment/refund is negative (decreases liability)
        onSubmit({
            amount: isPurchaseType ? Math.abs(numAmount) : -Math.abs(numAmount),
            date,
            description: isPurchaseType ? description : `Payment from ${accounts.find(a => a.id === fromAccountId)?.name || 'Bank'}`,
            payee: isPurchaseType ? payee : 'Payment',
            category: isPurchaseType ? category : 'Payment/Credit',
        }, paymentInfo);
        onClose();
    };

    const isEditingPayment = !!initialData?.transferId;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center space-x-4 bg-gray-700 p-2 rounded-lg">
                <button type="button" onClick={() => setIsPurchaseType(true)} disabled={!!initialData} className={`px-4 py-2 rounded-md w-full transition-colors ${isPurchaseType ? 'bg-red-600 text-white' : 'bg-gray-600 hover:bg-gray-500'} disabled:bg-gray-500 disabled:cursor-not-allowed`}>Purchase</button>
                <button type="button" onClick={() => setIsPurchaseType(false)} disabled={!!initialData} className={`px-4 py-2 rounded-md w-full transition-colors ${!isPurchaseType ? 'bg-green-600 text-white' : 'bg-gray-600 hover:bg-gray-500'} disabled:bg-gray-500 disabled:cursor-not-allowed`}>Payment/Refund</button>
            </div>
            {isEditingPayment && <p className="text-center text-yellow-400 bg-yellow-900/50 p-2 rounded-md text-sm">Linked payments cannot be edited. Please revert the transaction instead.</p>}
            <div>
                <label className="block text-sm font-medium text-gray-300">Amount</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" disabled={isEditingPayment} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white disabled:bg-gray-600" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required disabled={isEditingPayment} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white disabled:bg-gray-600" />
            </div>
            {isPurchaseType ? (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Description</label>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required disabled={isEditingPayment} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white disabled:bg-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Payee</label>
                        <input type="text" value={payee} onChange={(e) => setPayee(e.target.value)} disabled={isEditingPayment} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white disabled:bg-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} required disabled={isEditingPayment} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white disabled:bg-gray-600">
                            <option value="" disabled>Select a category</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                </>
            ) : (
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Pay From Account</label>
                    <select value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} required disabled={isEditingPayment} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white disabled:bg-gray-600">
                        {accounts.length > 0 ? accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toFixed(2)})</option>) : <option disabled>No accounts available</option>}
                    </select>
                </div>
            )}
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" disabled={isEditingPayment} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed">{initialData ? 'Save Changes' : 'Add Transaction'}</button>
            </div>
        </form>
    );
};

interface BulkTransactionRow {
    id: number;
    date: string;
    description: string;
    payee: string;
    category: string;
    type: 'purchase' | 'payment';
    amount: string;
}

const BulkTransactionForm: React.FC<{
    onClose: () => void;
    onSubmit: (transactions: Transaction[]) => void;
    categories: Category[];
}> = ({ onClose, onSubmit, categories }) => {
    const createEmptyRow = (id: number): BulkTransactionRow => ({
        id,
        date: new Date().toISOString().split('T')[0],
        description: '',
        payee: '',
        category: '',
        type: 'purchase',
        amount: '',
    });

    const [rows, setRows] = useState<BulkTransactionRow[]>(() => Array.from({ length: 5 }, (_, i) => createEmptyRow(i)));

    const handleRowChange = (index: number, field: keyof BulkTransactionRow, value: string) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        if (index === rows.length - 1 && (newRows[index].description || newRows[index].amount)) {
            newRows.push(createEmptyRow(rows.length));
        }
        setRows(newRows);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validTransactions: Transaction[] = rows
            .map(row => {
                const numAmount = parseFloat(row.amount);
                if (!row.description || isNaN(numAmount) || numAmount === 0 || !row.category) {
                    return null;
                }
                return {
                    id: crypto.randomUUID(),
                    accountId: '', // This will be set in the parent component
                    amount: row.type === 'purchase' ? Math.abs(numAmount) : -Math.abs(numAmount),
                    date: row.date,
                    description: row.description,
                    payee: row.payee,
                    category: row.category,
                };
            })
            .filter((t): t is Exclude<typeof t, null> => t !== null);

        if (validTransactions.length > 0) {
            onSubmit(validTransactions);
        } else {
            onClose();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="overflow-y-auto max-h-[60vh] -mx-6 -my-2 px-2">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-800 z-10"><tr className="border-b border-gray-700"><th className="p-2 w-[10%]">Date</th><th className="p-2 w-[25%]">Description</th><th className="p-2 w-[15%]">Payee</th><th className="p-2 w-[15%]">Category</th><th className="p-2 w-[15%]">Type</th><th className="p-2 w-[15%]">Amount</th></tr></thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={row.id} className="border-b border-gray-700/50">
                                <td className="p-1"><input type="date" value={row.date} onChange={e => handleRowChange(index, 'date', e.target.value)} className="w-full bg-gray-700 rounded p-1 border-transparent focus:border-blue-500 focus:ring-0" /></td>
                                <td className="p-1"><input type="text" value={row.description} onChange={e => handleRowChange(index, 'description', e.target.value)} className="w-full bg-gray-700 rounded p-1 border-transparent focus:border-blue-500 focus:ring-0" /></td>
                                <td className="p-1"><input type="text" value={row.payee} onChange={e => handleRowChange(index, 'payee', e.target.value)} className="w-full bg-gray-700 rounded p-1 border-transparent focus:border-blue-500 focus:ring-0" /></td>
                                <td className="p-1"><select value={row.category} onChange={e => handleRowChange(index, 'category', e.target.value)} className="w-full bg-gray-700 rounded p-1 border-transparent focus:border-blue-500 focus:ring-0"><option value="" disabled>Select</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></td>
                                <td className="p-1"><select value={row.type} onChange={e => handleRowChange(index, 'type', e.target.value as 'purchase' | 'payment')} className="w-full bg-gray-700 rounded p-1 border-transparent focus:border-blue-500 focus:ring-0"><option value="purchase">Purchase</option><option value="payment">Payment</option></select></td>
                                <td className="p-1"><input type="number" step="0.01" value={row.amount} onChange={e => handleRowChange(index, 'amount', e.target.value)} className="w-full bg-gray-700 rounded p-1 border-transparent focus:border-blue-500 focus:ring-0" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end pt-4 space-x-2 mt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Transactions</button>
            </div>
        </form>
    );
};

// Re-using CategoryManagerModal from AccountDetail, but as a local component to avoid prop drilling issues.
const CategoryManagerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    cardId: string;
}> = ({ isOpen, onClose, cardId }) => {
    const { categories, setCategories } = useData();
    const [newCategoryName, setNewCategoryName] = useState('');
    const accountCategories = useMemo(() => categories.filter(c => c.accountId === cardId).sort((a,b) => a.name.localeCompare(b.name)), [categories, cardId]);

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim() === '') return;
        setCategories(prev => [...prev, { id: crypto.randomUUID(), name: newCategoryName.trim(), accountId: cardId }]);
        setNewCategoryName('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Categories">
            <div className="space-y-4">
                <form onSubmit={handleAddCategory} className="flex space-x-2">
                    <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="New category name" className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" />
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add</button>
                </form>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {accountCategories.map(c => (
                        <div key={c.id} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                           <span className="text-white">{c.name}</span>
                           <button onClick={() => setCategories(prev => prev.filter(cat => cat.id !== c.id))} className="text-red-500 hover:text-red-400 text-sm">Delete</button>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};


const CreditCardDetail: React.FC = () => {
    const { cardId } = useParams<{ cardId: string }>();
    const { creditCards, setCreditCards, transactions, setTransactions, categories, accounts, setAccounts } = useData();
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isBulkEntryModalOpen, setIsBulkEntryModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
    const [transactionToRevert, setTransactionToRevert] = useState<Transaction | null>(null);

    const card = useMemo(() => creditCards.find(c => c.id === cardId), [creditCards, cardId]);
    const cardCategories = useMemo(() => categories.filter(c => c.accountId === cardId), [categories, cardId]);

    const handleTransactionSubmit = (transactionData: Omit<Transaction, 'id' | 'accountId'>, paymentInfo?: { fromAccountId: string }) => {
        if (!cardId || !card) return;

        // --- EDITING LOGIC ---
        if (editingTransaction) {
            // Payments are linked and should be reverted, not edited.
            if (editingTransaction.transferId) {
                alert("Payments from a bank account cannot be edited. Please revert it instead.");
                return;
            }
            const amountDifference = transactionData.amount - editingTransaction.amount;
            setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...editingTransaction, ...transactionData } : t));
            setCreditCards(prev => prev.map(c => c.id === cardId ? { ...c, balance: c.balance + amountDifference } : c));
        
        // --- ADDING LOGIC ---
        } else {
            // It's a payment from a bank account
            if (paymentInfo) {
                const fromAccount = accounts.find(a => a.id === paymentInfo.fromAccountId);
                if (!fromAccount) return;

                const amount = Math.abs(transactionData.amount);
                const transferId = crypto.randomUUID();

                // Bank Account Transaction (Debit)
                setTransactions(prev => [...prev, {
                    id: crypto.randomUUID(),
                    accountId: fromAccount.id,
                    amount: -amount,
                    date: transactionData.date,
                    description: `Payment to ${card.name}`,
                    category: 'Credit Card Payment',
                    payee: card.issuer,
                    transferId
                }]);
                
                // Credit Card Transaction (Payment/Credit)
                setTransactions(prev => [...prev, {
                    ...transactionData,
                    id: crypto.randomUUID(),
                    accountId: cardId,
                    description: `Payment from ${fromAccount.name}`,
                    transferId
                }]);

                // Update Balances
                setAccounts(prev => prev.map(acc => acc.id === fromAccount.id ? {...acc, balance: acc.balance - amount} : acc));
                setCreditCards(prev => prev.map(c => c.id === cardId ? {...c, balance: c.balance + transactionData.amount} : c)); // amount is negative
            
            // It's a standard purchase/refund
            } else {
                const newTransaction: Transaction = { ...transactionData, id: crypto.randomUUID(), accountId: cardId };
                setTransactions(prev => [...prev, newTransaction]);
                setCreditCards(prev => prev.map(c => c.id === cardId ? { ...c, balance: c.balance + newTransaction.amount } : c));
            }
        }
        
        setIsAddModalOpen(false);
        setEditingTransaction(null);
    };

    const handleBulkSubmit = (newTransactions: Transaction[]) => {
        if (!cardId) return;
        const transactionsWithCardId = newTransactions.map(t => ({...t, accountId: cardId}));
        const totalAmountChange = transactionsWithCardId.reduce((sum, t) => sum + t.amount, 0);
        setTransactions(prev => [...prev, ...transactionsWithCardId]);
        setCreditCards(prev => prev.map(c => c.id === cardId ? { ...c, balance: c.balance + totalAmountChange } : c));
        setIsBulkEntryModalOpen(false);
    };

    const confirmDeleteTransaction = () => {
        if (!cardId || !transactionToDelete) return;
        setCreditCards(prev => prev.map(c => c.id === cardId ? { ...c, balance: c.balance - transactionToDelete.amount } : c));
        setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
        setTransactionToDelete(null);
    };
    
    const handleRevertPayment = () => {
        if (!transactionToRevert || !transactionToRevert.transferId) return;
        const otherTransaction = transactions.find(t => t.transferId === transactionToRevert.transferId && t.id !== transactionToRevert.id);
        if (!otherTransaction) {
            alert("Could not find corresponding payment transaction.");
            return;
        }

        const paymentAmount = Math.abs(transactionToRevert.amount);

        // Revert bank account balance
        setAccounts(prev => prev.map(acc => acc.id === otherTransaction.accountId ? {...acc, balance: acc.balance + paymentAmount} : acc));
        // Revert credit card balance
        setCreditCards(prev => prev.map(card => card.id === transactionToRevert.accountId ? {...card, balance: card.balance + paymentAmount} : card));

        // Delete both transactions
        setTransactions(prev => prev.filter(t => t.transferId !== transactionToRevert.transferId));
        setTransactionToRevert(null);
    };

    const cardTransactions = useMemo(() => {
        return transactions
            .filter(t => t.accountId === cardId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, cardId]);

    const spendingData = useMemo(() => {
        const categories: {[key: string]: number} = {};
        cardTransactions.filter(t => t.amount > 0).forEach(t => {
                const category = t.category || 'Uncategorized';
                categories[category] = (categories[category] || 0) + t.amount;
        });
        return Object.entries(categories).map(([name, value]) => ({ name, value }));
    }, [cardTransactions]);

    if (!card) {
        return <div className="p-6 text-center"><h2 className="text-2xl font-bold text-white">Credit Card not found</h2><Link to="/credit-cards" className="hover:underline mt-4 inline-block">Go back to Credit Cards</Link></div>;
    }

    const utilization = card.creditLimit > 0 ? (card.balance / card.creditLimit) * 100 : 0;
    const utilizationColor = utilization > 70 ? 'bg-red-500' : utilization > 30 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div className="p-6">
            <div className="mb-4 text-sm text-gray-400"><Link to="/credit-cards" className="hover:underline">Credit Cards</Link> &gt;</div>
            <Header title={card.name}>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setIsCategoryModalOpen(true)} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500">Manage Categories</button>
                    <button onClick={() => setIsBulkEntryModalOpen(true)} className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700">Bulk Entry</button>
                    <button onClick={() => { setEditingTransaction(null); setIsAddModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add Transaction</button>
                </div>
            </Header>

            <div className="mb-8 p-6 bg-gray-800 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <p className="text-gray-400 text-lg">Current Balance</p>
                    <p className="text-4xl font-bold text-red-400">${card.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-lg">Available Credit</p>
                    <p className="text-4xl font-bold text-green-400">${(card.creditLimit - card.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="space-y-2">
                     <div className="flex justify-between text-sm text-gray-300">
                        <span>Credit Limit: ${card.creditLimit.toLocaleString()}</span>
                        <span>APR: {card.apr}%</span>
                     </div>
                     <div className="w-full bg-gray-700 rounded-full h-4 relative">
                        <div className={`${utilizationColor} h-4 rounded-full flex items-center justify-center text-xs font-bold text-white`} style={{width: `${Math.min(utilization, 100)}%`}}>
                           {utilization.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {spendingData.length > 0 && <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-lg font-semibold mb-2 text-white">Spending by Category</h3><PieChartComponent data={spendingData} colors={ChartColors} /></div>}
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-4">Transaction History</h3>
                <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-700 text-gray-400 uppercase text-sm"><tr><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Category</th><th className="p-3">Amount</th><th className="p-3">Actions</th></tr></thead><tbody className="text-gray-200">
                    {cardTransactions.map(t => (<tr key={t.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="p-3">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="p-3"><p className="font-semibold">{t.description}</p>{t.payee && <p className="text-sm text-gray-400">{t.payee}</p>}</td>
                        <td className="p-3">{t.category}</td>
                        <td className={`p-3 font-semibold ${t.amount > 0 ? 'text-red-400' : 'text-green-400'}`}>{t.amount > 0 ? '+' : ''}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-3 space-x-2 whitespace-nowrap">
                             {t.transferId ? (
                                <button onClick={() => setTransactionToRevert(t)} className="bg-orange-600 text-white px-3 py-1 rounded-md text-sm hover:bg-orange-700">Revert</button>
                             ) : (
                                <>
                                    <button onClick={() => { setEditingTransaction(t); setIsAddModalOpen(true); }} className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600">Edit</button>
                                    <button onClick={() => setTransactionToDelete(t)} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                                </>
                             )}
                        </td>
                    </tr>))}
                </tbody></table>{cardTransactions.length === 0 && <div className="text-center p-8 text-gray-400"><p>No transactions found for this card.</p></div>}</div>
            </div>

            <Modal isOpen={isAddModalOpen || !!editingTransaction} onClose={() => { setIsAddModalOpen(false); setEditingTransaction(null); }} title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}><TransactionForm onSubmit={handleTransactionSubmit} onClose={() => { setIsAddModalOpen(false); setEditingTransaction(null); }} initialData={editingTransaction} categories={cardCategories} accounts={accounts} /></Modal>
            <Modal isOpen={isBulkEntryModalOpen} onClose={() => setIsBulkEntryModalOpen(false)} title="Bulk Transaction Entry" size="4xl"><BulkTransactionForm onSubmit={handleBulkSubmit} onClose={() => setIsBulkEntryModalOpen(false)} categories={cardCategories} /></Modal>
            {cardId && <CategoryManagerModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} cardId={cardId} />}
            <ConfirmationModal isOpen={!!transactionToDelete} onClose={() => setTransactionToDelete(null)} onConfirm={confirmDeleteTransaction} title="Confirm Deletion" message={<>Are you sure you want to delete this transaction? This will update the card balance and cannot be undone.</>} confirmText="Delete"/>
            <ConfirmationModal isOpen={!!transactionToRevert} onClose={() => setTransactionToRevert(null)} onConfirm={handleRevertPayment} title="Confirm Payment Reversal" message="Are you sure you want to revert this payment? This will delete the transactions from both the credit card and the bank account, and restore their balances. This action cannot be undone." confirmText="Revert Payment" confirmColorClass="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500" />
        </div>
    );
};

export default CreditCardDetail;