import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Transaction, Category, Account } from '../types';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import PieChartComponent from '../components/charts/PieChartComponent';
import { ChartColors } from '../constants';

const TransactionForm: React.FC<{
    onSubmit: (transaction: Omit<Transaction, 'id' | 'accountId'>) => void;
    onClose: () => void;
    initialData?: Transaction | null;
    categories: Category[];
}> = ({ onSubmit, onClose, initialData, categories }) => {
    const [amount, setAmount] = useState<string>(initialData ? String(Math.abs(initialData.amount)) : '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState(initialData?.description || '');
    const [payee, setPayee] = useState(initialData?.payee || '');
    const [category, setCategory] = useState(initialData?.category || '');
    const [isExpense, setIsExpense] = useState(initialData ? initialData.amount < 0 : true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount === 0) return;
        
        onSubmit({
            amount: isExpense ? -Math.abs(numAmount) : Math.abs(numAmount),
            date,
            description,
            payee,
            category,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center space-x-4 bg-gray-700 p-2 rounded-lg">
                <button type="button" onClick={() => setIsExpense(true)} className={`px-4 py-2 rounded-md w-full transition-colors ${isExpense ? 'bg-red-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>Expense</button>
                <button type="button" onClick={() => setIsExpense(false)} className={`px-4 py-2 rounded-md w-full transition-colors ${!isExpense ? 'bg-green-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>Income</button>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Amount</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300">{isExpense ? 'Paid To' : 'Received From'} (Payee)</label>
                <input type="text" value={payee} onChange={(e) => setPayee(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Category</label>
                 <select value={category} onChange={e => setCategory(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white">
                    <option value="" disabled>Select a category</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">{initialData ? 'Save Changes' : 'Add Transaction'}</button>
            </div>
        </form>
    );
};

const InternalTransferForm: React.FC<{
    onClose: () => void;
    parentAccount: Account;
    subAccounts: Account[];
    unallocatedBalance: number;
    onTransfer: (data: { from: string, to: string, amount: number, notes: string }) => void;
}> = ({ onClose, parentAccount, subAccounts, unallocatedBalance, onTransfer }) => {
    const UNALLOCATED_ID = 'unallocated';
    const allSources = [{ id: UNALLOCATED_ID, name: `Unallocated Funds`, balance: unallocatedBalance }, ...subAccounts];
    
    const [fromId, setFromId] = useState(UNALLOCATED_ID);
    const [toId, setToId] = useState(subAccounts[0]?.id || '');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const fromAccountBalance = allSources.find(s => s.id === fromId)?.balance || 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError("Please enter a valid positive amount.");
            return;
        }
        if (fromId === toId) {
            setError("Cannot transfer to and from the same account.");
            return;
        }
        if (numAmount > fromAccountBalance) {
            setError("Transfer amount cannot be greater than the source balance.");
            return;
        }
        onTransfer({ from: fromId, to: toId, amount: numAmount, notes });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">From</label>
                    <select value={fromId} onChange={e => setFromId(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
                        {allSources.map(s => <option key={s.id} value={s.id}>{s.name} (${s.balance.toFixed(2)})</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">To</label>
                    <select value={toId} onChange={e => setToId(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
                         {allSources.map(s => <option key={s.id} value={s.id}>{s.name} (${s.balance.toFixed(2)})</option>)}
                    </select>
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300">Amount</label>
                <div className="relative">
                    <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white pr-20"/>
                    <button type="button" onClick={() => setAmount(String(fromAccountBalance))} className="absolute inset-y-0 right-0 top-1 mr-1 px-2 py-1 text-xs bg-gray-600 rounded">Max</button>
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300">Notes (Optional)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Monthly savings transfer" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
            </div>
             <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Transfer Funds</button>
            </div>
        </form>
    );
};

const CategoryManagerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    accountId: string;
}> = ({ isOpen, onClose, accountId }) => {
    const { categories, setCategories } = useData();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    const accountCategories = useMemo(() => categories.filter(c => c.accountId === accountId).sort((a,b) => a.name.localeCompare(b.name)), [categories, accountId]);

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim() === '') return;
        setCategories(prev => [...prev, { id: crypto.randomUUID(), name: newCategoryName.trim(), accountId }]);
        setNewCategoryName('');
    };
    
    const handleUpdateCategory = () => {
        if (!editingCategory || editingCategory.name.trim() === '') return;
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? editingCategory : c));
        setEditingCategory(null);
    };

    const confirmDeleteCategory = () => {
        if (!categoryToDelete) return;
        setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
        setCategoryToDelete(null);
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
                            {editingCategory?.id === c.id ? (
                                <input
                                    type="text"
                                    value={editingCategory.name}
                                    onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                                    autoFocus
                                    onBlur={handleUpdateCategory}
                                    onKeyDown={e => e.key === 'Enter' && handleUpdateCategory()}
                                    className="bg-gray-600 text-white rounded px-2 py-1"
                                />
                            ) : (
                                <span className="text-white">{c.name}</span>
                            )}
                            <div className="space-x-2">
                                <button onClick={() => setEditingCategory(c)} className="text-yellow-400 hover:text-yellow-300 text-sm">Edit</button>
                                <button onClick={() => setCategoryToDelete(c)} className="text-red-500 hover:text-red-400 text-sm">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
                 <ConfirmationModal
                    isOpen={!!categoryToDelete}
                    onClose={() => setCategoryToDelete(null)}
                    onConfirm={confirmDeleteCategory}
                    title="Confirm Delete Category"
                    message={<>Are you sure you want to delete the category <strong>"{categoryToDelete?.name}"</strong>? This will not affect existing transactions.</>}
                    confirmText="Delete"
                />
            </div>
        </Modal>
    );
};

const LinkedTransactionDescription: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const { accounts } = useData();

    if (!transaction.isInternal) {
        return (
            <>
                <p className="font-semibold">{transaction.description}</p>
                {transaction.payee && <p className="text-sm text-gray-400">{transaction.payee}</p>}
            </>
        );
    }

    const match = transaction.description.match(/^(.+? (?:to|from)) (.+?)(: .*|$)/);
    if (!match) {
        return (
            <>
                <p className="font-semibold">{transaction.description}</p>
                {transaction.payee && <p className="text-sm text-gray-400">{transaction.payee}</p>}
            </>
        );
    }
    
    const prefix = match[1]; // "Transfer to" or "Internal transfer from"
    const accountName = match[2]; // "Savings" or "Unallocated"
    const suffix = match[3]; // ": Cover" or ""

    const linkedAccount = accounts.find(a => a.name === accountName);

    return (
        <>
            <p className="font-semibold">
                {prefix}{' '}
                {linkedAccount ? (
                    <Link to={`/accounts/${linkedAccount.id}`} className="text-blue-400 hover:underline">{accountName}</Link>
                ) : (
                    accountName
                )}
                {suffix}
            </p>
            {transaction.payee && <p className="text-sm text-gray-400">{transaction.payee}</p>}
        </>
    );
};

interface BulkTransactionRow {
    id: number;
    date: string;
    description: string;
    payee: string;
    category: string;
    type: 'expense' | 'income';
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
        type: 'expense',
        amount: '',
    });

    const [rows, setRows] = useState<BulkTransactionRow[]>(() => Array.from({ length: 5 }, (_, i) => createEmptyRow(i)));

    const handleRowChange = (index: number, field: keyof BulkTransactionRow, value: string) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };

        // If the last row is being edited, add a new empty row
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
                    amount: row.type === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount),
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
                    <thead className="sticky top-0 bg-gray-800 z-10">
                        <tr className="border-b border-gray-700">
                            <th className="p-2 w-[10%]">Date</th>
                            <th className="p-2 w-[25%]">Description</th>
                            <th className="p-2 w-[15%]">Payee</th>
                            <th className="p-2 w-[15%]">Category</th>
                            <th className="p-2 w-[15%]">Type</th>
                            <th className="p-2 w-[15%]">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={row.id} className="border-b border-gray-700/50">
                                <td className="p-1"><input type="date" value={row.date} onChange={e => handleRowChange(index, 'date', e.target.value)} className="w-full bg-gray-700 rounded p-1 border-transparent focus:border-blue-500 focus:ring-0" /></td>
                                <td className="p-1"><input type="text" value={row.description} onChange={e => handleRowChange(index, 'description', e.target.value)} className="w-full bg-gray-700 rounded p-1 border-transparent focus:border-blue-500 focus:ring-0" /></td>
                                <td className="p-1"><input type="text" value={row.payee} onChange={e => handleRowChange(index, 'payee', e.target.value)} className="w-full bg-gray-700 rounded p-1 border-transparent focus:border-blue-500 focus:ring-0" /></td>
                                <td className="p-1"><select value={row.category} onChange={e => handleRowChange(index, 'category', e.target.value)} className="w-full bg-gray-700 rounded p-1 border-transparent focus:border-blue-500 focus:ring-0"><option value="" disabled>Select</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></td>
                                <td className="p-1"><select value={row.type} onChange={e => handleRowChange(index, 'type', e.target.value as 'expense' | 'income')} className="w-full bg-gray-700 rounded p-1 border-transparent focus:border-blue-500 focus:ring-0"><option value="expense">Expense</option><option value="income">Income</option></select></td>
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


const AccountDetail: React.FC = () => {
    const { accountId } = useParams<{ accountId: string }>();
    const { accounts, setAccounts, transactions, setTransactions, paymentRecords, setPaymentRecords, formalDebts, commitments, receivables, categories } = useData();
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isBulkEntryModalOpen, setIsBulkEntryModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
    const [transactionToRevert, setTransactionToRevert] = useState<Transaction | null>(null);
    const [deleteLinkedPayment, setDeleteLinkedPayment] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date_desc');

    const account = useMemo(() => accounts.find(acc => acc.id === accountId), [accounts, accountId]);
    const parentAccount = useMemo(() => account?.parentId ? accounts.find(a => a.id === account.parentId) : null, [accounts, account]);

    const isParent = useMemo(() => !account?.parentId && accounts.some(a => a.parentId === accountId), [accounts, accountId, account]);
    const subAccounts = useMemo(() => isParent ? accounts.filter(a => a.parentId === accountId) : [], [accounts, accountId, isParent]);

    const unallocatedBalance = useMemo(() => {
        if (!isParent || !account) return 0;
        const subAccountsTotal = subAccounts.reduce((sum, sa) => sum + sa.balance, 0);
        return account.balance - subAccountsTotal;
    }, [isParent, account, subAccounts]);

    const accountCategories = useMemo(() => categories.filter(c => c.accountId === accountId), [categories, accountId]);

    const handleAddTransaction = (transactionData: Omit<Transaction, 'id' | 'accountId'>) => {
        if (!accountId) return;
        const newTransaction: Transaction = { ...transactionData, id: crypto.randomUUID(), accountId: accountId };
        setTransactions(prev => [...prev, newTransaction]);
        
        setAccounts(prev => prev.map(acc => {
            if (acc.id === accountId) { // Update current account
                return { ...acc, balance: acc.balance + newTransaction.amount };
            }
            if (acc.id === account?.parentId) { // Also update parent account
                return { ...acc, balance: acc.balance + newTransaction.amount };
            }
            return acc;
        }));

        setIsAddModalOpen(false);
    };

    const handleBulkSubmit = (newTransactions: Transaction[]) => {
        if (!accountId) return;

        const transactionsWithAccountId = newTransactions.map(t => ({...t, accountId}));
        const totalAmountChange = transactionsWithAccountId.reduce((sum, t) => sum + t.amount, 0);

        setTransactions(prev => [...prev, ...transactionsWithAccountId]);

        setAccounts(prev => prev.map(acc => {
             if (acc.id === accountId || acc.id === account?.parentId) {
                return { ...acc, balance: acc.balance + totalAmountChange };
            }
            return acc;
        }));
        
        setIsBulkEntryModalOpen(false);
    };


    const handleEditTransaction = (transactionData: Omit<Transaction, 'id' | 'accountId'>) => {
        if (!accountId || !editingTransaction) return;
        const amountDifference = transactionData.amount - editingTransaction.amount;

        setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...editingTransaction, ...transactionData } : t));
        setAccounts(prev => prev.map(acc => {
            if (acc.id === accountId) { // Update current account
                return { ...acc, balance: acc.balance + amountDifference };
            }
            if (acc.id === account?.parentId) { // Also update parent account
                return { ...acc, balance: acc.balance + amountDifference };
            }
            return acc;
        }));
        
        setEditingTransaction(null);
    };
    
    const handleInternalTransfer = ({ from, to, amount, notes }: { from: string, to: string, amount: number, notes: string }) => {
        const UNALLOCATED_ID = 'unallocated';
        // This is an internal allocation, so the parent's total balance does not change.
        // We only adjust the balances of the sub-accounts.
        setAccounts(prev => prev.map(acc => {
            if (acc.id === from) return { ...acc, balance: acc.balance - amount };
            if (acc.id === to) return { ...acc, balance: acc.balance + amount };
            return acc;
        }));
        
        // Create transactions for history, marked as internal
        const fromName = from === UNALLOCATED_ID ? 'Unallocated' : accounts.find(a => a.id === from)?.name;
        const toName = to === UNALLOCATED_ID ? 'Unallocated' : accounts.find(a => a.id === to)?.name;
        const descriptionText = notes ? `: ${notes}` : '';
        const transferId = crypto.randomUUID();

        const fromTransaction: Transaction = {
            id: crypto.randomUUID(),
            accountId: from === UNALLOCATED_ID ? accountId! : from,
            amount: -amount,
            date: new Date().toISOString().split('T')[0],
            description: `Internal transfer to ${toName}${descriptionText}`,
            category: 'Internal Transfer',
            payee: 'Internal',
            isInternal: true,
            transferId,
        };
        const toTransaction: Transaction = {
            id: crypto.randomUUID(),
            accountId: to === UNALLOCATED_ID ? accountId! : to,
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            description: `Internal transfer from ${fromName}${descriptionText}`,
            category: 'Internal Transfer',
            payee: 'Internal',
            isInternal: true,
            transferId,
        };
        setTransactions(prev => [...prev, fromTransaction, toTransaction]);
        
        setIsTransferModalOpen(false);
    };
    
    const handleRevertTransaction = () => {
        if (!transactionToRevert || !transactionToRevert.transferId) return;
        
        const otherTransaction = transactions.find(t => t.transferId === transactionToRevert.transferId && t.id !== transactionToRevert.id);
        if (!otherTransaction) {
            alert("Error: Could not find the corresponding transaction to revert. The operation has been cancelled.");
            setTransactionToRevert(null);
            return;
        }

        const debitTransaction = transactionToRevert.amount < 0 ? transactionToRevert : otherTransaction;
        const creditTransaction = transactionToRevert.amount > 0 ? transactionToRevert : otherTransaction;
        const amount = Math.abs(debitTransaction.amount);
        
        const fromAccount = accounts.find(a => a.id === debitTransaction.accountId);
        const toAccount = accounts.find(a => a.id === creditTransaction.accountId);
        
        setAccounts(prev => prev.map(acc => {
            let newBalance = acc.balance;
            if (acc.id === debitTransaction.accountId) newBalance += amount;
            if (fromAccount?.parentId && acc.id === fromAccount.parentId) newBalance += amount;
            if (acc.id === creditTransaction.accountId) newBalance -= amount;
            if (toAccount?.parentId && acc.id === toAccount.parentId) newBalance -= amount;
            return { ...acc, balance: newBalance };
        }));

        setTransactions(prev => prev.filter(t => t.transferId !== transactionToRevert.transferId));
        setTransactionToRevert(null);
    };

    const linkedPaymentInfo = useMemo(() => {
        if (!transactionToDelete) return null;
        const payment = paymentRecords.find(p => p.transactionId === transactionToDelete.id);
        if (!payment) return null;
        
        const debt = formalDebts.find(d => d.id === payment.itemId);
        if (debt) return { payment, itemName: debt.name };
        const commitment = commitments.find(c => c.id === payment.itemId);
        if (commitment) return { payment, itemName: commitment.name };
        const receivable = receivables.find(r => r.id === payment.itemId);
        if (receivable) return { payment, itemName: receivable.name };
        return null;
    }, [transactionToDelete, paymentRecords, formalDebts, commitments, receivables]);

    const confirmationMessage = useMemo(() => {
        if (!linkedPaymentInfo) {
            return <>Are you sure you want to delete this transaction? This action will update the account balance and cannot be undone.</>;
        }
        return (
            <div>
                <p className="mb-4">This transaction is linked to a payment for <strong>"{linkedPaymentInfo.itemName}"</strong>.</p>
                <p className="mb-4">Are you sure you want to delete this transaction? This will update the account balance.</p>
                <label className="flex items-center space-x-2 bg-gray-700 p-3 rounded-md hover:bg-gray-600 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={deleteLinkedPayment} 
                        onChange={(e) => setDeleteLinkedPayment(e.target.checked)}
                        className="h-5 w-5 text-red-600 bg-gray-900 border-gray-600 rounded focus:ring-red-500"
                    />
                    <span>Also delete the corresponding payment record.</span>
                </label>
            </div>
        );
    }, [linkedPaymentInfo, deleteLinkedPayment]);

    const confirmDeleteTransaction = () => {
        if (!accountId || !transactionToDelete) return;
        setAccounts(prev => prev.map(acc => {
            if (acc.id === accountId) {
                return { ...acc, balance: acc.balance - transactionToDelete.amount };
            }
            if (acc.id === account?.parentId) {
                return { ...acc, balance: acc.balance - transactionToDelete.amount };
            }
            return acc;
        }));
        if (linkedPaymentInfo) {
            if (deleteLinkedPayment) {
                setPaymentRecords(prev => prev.filter(p => p.id !== linkedPaymentInfo.payment.id));
            } else {
                setPaymentRecords(prev => prev.map(p => p.id === linkedPaymentInfo.payment.id ? { ...p, transactionId: undefined } : p));
            }
        }
        setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
        setTransactionToDelete(null);
        setDeleteLinkedPayment(false);
    };

    const closeConfirmationModal = () => {
        setTransactionToDelete(null);
        setDeleteLinkedPayment(false);
    };

    const openEditModal = (transaction: Transaction) => {
        setEditingTransaction(transaction);
    };

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => t.accountId === accountId)
            .filter(t => {
                const searchMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || (t.payee || '').toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase());
                const categoryMatch = categoryFilter === 'all' || t.category === categoryFilter;
                return searchMatch && categoryMatch;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'date_asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
                    case 'amount_desc': return Math.abs(b.amount) - Math.abs(a.amount);
                    case 'amount_asc': return Math.abs(a.amount) - Math.abs(b.amount);
                    case 'date_desc':
                    default:
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                }
            });
    }, [transactions, accountId, searchTerm, categoryFilter, sortBy]);

    const spendingData = useMemo(() => {
        const categories: {[key: string]: number} = {};
        filteredTransactions
            .filter(t => t.amount < 0 && !t.isInternal)
            .forEach(t => {
                const category = t.category || 'Uncategorized';
                if (!categories[category]) categories[category] = 0;
                categories[category] += Math.abs(t.amount);
            });
        return Object.entries(categories).map(([name, value]) => ({ name, value }));
    }, [filteredTransactions]);

    const incomeVsExpenseData = useMemo(() => {
        const totals = filteredTransactions
            .filter(t => !t.isInternal)
            .reduce((acc, t) => {
                if (t.amount > 0) acc.income += t.amount;
                else acc.expenses += Math.abs(t.amount);
                return acc;
            }, { income: 0, expenses: 0 });
        if (totals.income === 0 && totals.expenses === 0) return [];
        return [{ name: 'Income', value: totals.income }, { name: 'Expenses', value: totals.expenses }].filter(d => d.value > 0);
    }, [filteredTransactions]);
    
    const incomeVsExpenseColors = useMemo(() => {
        return incomeVsExpenseData.map(d => d.name === 'Income' ? '#10b981' : '#ef4444');
    }, [incomeVsExpenseData]);

    if (!account) {
        return <div className="p-6 text-center"><h2 className="text-2xl font-bold text-white">Account not found</h2><Link to="/accounts" className="text-blue-400 hover:underline mt-4 inline-block">Go back to Accounts</Link></div>;
    }

    return (
        <div className="p-6">
            <div className="mb-4 text-sm text-gray-400">
                {parentAccount ? <><Link to="/accounts" className="hover:underline">Accounts</Link> &gt; <Link to={`/accounts/${parentAccount.id}`} className="hover:underline">{parentAccount.name}</Link> &gt;</> : <><Link to="/accounts" className="hover:underline">Accounts</Link> &gt;</>}
            </div>
            <Header title={account.name}>
                <div className="flex items-center space-x-2">
                    {isParent && <button onClick={() => setIsTransferModalOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">Internal Transfer</button>}
                    <button onClick={() => setIsCategoryModalOpen(true)} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500">Manage Categories</button>
                    <button onClick={() => setIsBulkEntryModalOpen(true)} className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700">Bulk Entry</button>
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add Transaction</button>
                </div>
            </Header>

            <div className="mb-8 p-6 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-lg">Current Balance</p>
                <p className={`text-4xl font-bold ${account.balance >= 0 ? 'text-white' : 'text-red-400'}`}>${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            
            {isParent && (
                <div className="bg-gray-800 p-4 rounded-lg mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-white">Allocations</h3>
                    <div className="space-y-2">
                        {subAccounts.map(sa => (
                            <div key={sa.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-md">
                                <span className="font-semibold">{sa.name}</span>
                                <span className="font-mono">${sa.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        ))}
                        <div className="flex justify-between items-center bg-gray-700/50 p-3 rounded-md border-t-2 border-dashed border-gray-600">
                            <span className="font-semibold text-gray-400">Unallocated Funds</span>
                            <span className="font-mono text-gray-400">${unallocatedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {incomeVsExpenseData.length > 0 && <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-lg font-semibold mb-2 text-white">Income vs. Expenses</h3><PieChartComponent data={incomeVsExpenseData} colors={incomeVsExpenseColors} /></div>}
                {spendingData.length > 0 && <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-lg font-semibold mb-2 text-white">Spending by Category</h3><PieChartComponent data={spendingData} colors={ChartColors} /></div>}
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white">
                        <option value="all">All Categories</option>
                        {accountCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                     <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white">
                        <option value="date_desc">Date (Newest)</option><option value="date_asc">Date (Oldest)</option><option value="amount_desc">Amount (High-Low)</option><option value="amount_asc">Amount (Low-High)</option>
                    </select>
                </div>

                <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-700 text-gray-400 uppercase text-sm"><tr><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Category</th><th className="p-3">Amount</th><th className="p-3">Actions</th></tr></thead><tbody className="text-gray-200">
                    {filteredTransactions.map(t => (<tr key={t.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="p-3">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="p-3"><LinkedTransactionDescription transaction={t} /></td>
                        <td className="p-3">{t.category}</td>
                        <td className={`p-3 font-semibold ${t.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>{t.amount < 0 ? '-' : '+'}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-3 space-x-2 whitespace-nowrap">
                            {t.isInternal ? (
                                t.amount < 0 ? (
                                    <button onClick={() => setTransactionToRevert(t)} className="bg-orange-600 text-white px-3 py-1 rounded-md text-sm hover:bg-orange-700">Revert</button>
                                ) : (
                                    <span className="text-xs text-gray-500 italic">System Entry</span>
                                )
                            ) : (
                                <>
                                    <button onClick={() => openEditModal(t)} className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600">Edit</button>
                                    <button onClick={() => setTransactionToDelete(t)} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                                </>
                            )}
                        </td>
                    </tr>))}
                </tbody></table>{filteredTransactions.length === 0 && <div className="text-center p-8 text-gray-400"><p>No transactions found. Try adjusting your filters or add a new transaction.</p></div>}</div>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Transaction"><TransactionForm onSubmit={handleAddTransaction} onClose={() => setIsAddModalOpen(false)} categories={accountCategories} /></Modal>
            <Modal isOpen={!!editingTransaction} onClose={() => setEditingTransaction(null)} title="Edit Transaction"><TransactionForm onSubmit={handleEditTransaction} onClose={() => setEditingTransaction(null)} initialData={editingTransaction} categories={accountCategories}/></Modal>
            <Modal isOpen={isBulkEntryModalOpen} onClose={() => setIsBulkEntryModalOpen(false)} title="Bulk Transaction Entry" size="4xl"><BulkTransactionForm onSubmit={handleBulkSubmit} onClose={() => setIsBulkEntryModalOpen(false)} categories={accountCategories} /></Modal>
            {isParent && <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Internal Fund Transfer"><InternalTransferForm onClose={() => setIsTransferModalOpen(false)} parentAccount={account} subAccounts={subAccounts} unallocatedBalance={unallocatedBalance} onTransfer={handleInternalTransfer}/></Modal>}
            {accountId && <CategoryManagerModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} accountId={accountId} />}
            <ConfirmationModal isOpen={!!transactionToDelete} onClose={closeConfirmationModal} onConfirm={confirmDeleteTransaction} title="Confirm Deletion" message={confirmationMessage} confirmText="Delete"/>
            <ConfirmationModal 
                isOpen={!!transactionToRevert} 
                onClose={() => setTransactionToRevert(null)} 
                onConfirm={handleRevertTransaction} 
                title="Confirm Transfer Reversal" 
                message="Are you sure you want to revert this transfer? This will delete both the outgoing and incoming transaction records and adjust account balances accordingly. This action cannot be undone."
                confirmText="Revert Transfer"
                confirmColorClass="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
            />
        </div>
    );
};

export default AccountDetail;
