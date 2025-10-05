import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Account, AccountType, Category, Transaction } from '../types';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { Link } from 'react-router-dom';

const AccountForm: React.FC<{
    onSubmit: (account: Omit<Account, 'id'>, isSubAccount: boolean) => void;
    onClose: () => void;
    initialData?: Account | null;
    parentId?: string;
}> = ({ onSubmit, onClose, initialData, parentId }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState<AccountType>(initialData?.type || AccountType.CHECKING);
    const [balance, setBalance] = useState<string>(initialData ? initialData.balance.toString() : '');
    const isSubAccount = !!parentId;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const accountData: Omit<Account, 'id'> = {
            name,
            type,
            balance: parseFloat(balance) || 0,
            ...(parentId && { parentId })
        };
        onSubmit(accountData, isSubAccount);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">{isSubAccount ? 'Sub-Account Name' : 'Account Name'}</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            {!isSubAccount && (
                <div>
                    <label className="block text-sm font-medium text-gray-300">Account Type</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as AccountType)}
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value={AccountType.CHECKING}>{AccountType.CHECKING}</option>
                        <option value={AccountType.SAVINGS}>{AccountType.SAVINGS}</option>
                        <option value={AccountType.OTHER}>{AccountType.OTHER}</option>
                    </select>
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-300">Initial Balance</label>
                <input
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={!!initialData}
                />
                 {initialData ? 
                    <p className="text-xs text-gray-400 mt-1">Balance can be changed via transactions after creation.</p> :
                    !isSubAccount && <p className="text-xs text-gray-400 mt-1">This will create a starting transaction record.</p>
                 }
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Account</button>
            </div>
        </form>
    );
};


const TransferForm: React.FC<{
    onSubmit: (data: { fromId: string, toId: string, amount: number, date: string, notes: string }) => void;
    onClose: () => void;
    accounts: Account[];
}> = ({ onSubmit, onClose, accounts }) => {
    const allAccounts = useMemo(() => accounts.sort((a,b) => a.name.localeCompare(b.name)), [accounts]);
    const [fromId, setFromId] = useState(allAccounts[0]?.id || '');
    const [toId, setToId] = useState(allAccounts[1]?.id || '');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!fromId || !toId) {
            setError('Please select both a "from" and "to" account.'); return;
        }
        if (fromId === toId) {
            setError('Cannot transfer to and from the same account.'); return;
        }
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid positive amount.'); return;
        }
        const fromAccount = accounts.find(a => a.id === fromId);
        if (fromAccount && numAmount > fromAccount.balance) {
            setError('Transfer amount exceeds the balance of the source account.'); return;
        }
        onSubmit({ fromId, toId, amount: numAmount, date, notes });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">From Account</label>
                    <select value={fromId} onChange={e => setFromId(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
                         {allAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toFixed(2)})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">To Account</label>
                    <select value={toId} onChange={e => setToId(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
                        {allAccounts.filter(a => a.id !== fromId).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Amount</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Notes (Optional)</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                </div>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Confirm Transfer</button>
            </div>
        </form>
    );
};


const Accounts: React.FC = () => {
    const { accounts, setAccounts, setTransactions, setCategories } = useData();
    const [modalState, setModalState] = useState<{ isOpen: boolean, editingAccount: Account | null, parentId?: string }>({ isOpen: false, editingAccount: null });
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

    const { parentAccounts, subAccountsById } = useMemo(() => {
        const parents = accounts.filter(a => !a.parentId).sort((a,b) => a.name.localeCompare(b.name));
        const subs: Record<string, Account[]> = {};
        accounts.forEach(a => {
            if (a.parentId) {
                if (!subs[a.parentId]) {
                    subs[a.parentId] = [];
                }
                subs[a.parentId].push(a);
            }
        });
        Object.values(subs).forEach(subList => subList.sort((a,b) => a.name.localeCompare(b.name)));
        return { parentAccounts: parents, subAccountsById: subs };
    }, [accounts]);

    const handleFormSubmit = (accountData: Omit<Account, 'id'>, isSubAccount: boolean) => {
        if (modalState.editingAccount) { // Editing
            setAccounts(accounts.map(acc => acc.id === modalState.editingAccount!.id ? { ...acc, name: accountData.name, type: accountData.type } : acc));
        } else { // Adding
            const newAccount: Account = { ...accountData, id: crypto.randomUUID() };
            
            setAccounts(prev => {
                let newAccounts = [...prev, newAccount];
                // If adding a sub-account with a balance, add that balance to the parent as well
                if (isSubAccount && newAccount.parentId && newAccount.balance > 0) {
                    newAccounts = newAccounts.map(acc => 
                        acc.id === newAccount.parentId ? { ...acc, balance: acc.balance + newAccount.balance } : acc
                    );
                }
                return newAccounts;
            });

            // Create a transaction for the initial balance if it's not zero
            if (accountData.balance !== 0) {
                const initialTransaction: Transaction = {
                    id: crypto.randomUUID(),
                    accountId: newAccount.id,
                    amount: accountData.balance,
                    date: new Date().toISOString().split('T')[0],
                    description: 'Initial Balance',
                    category: 'Initial Balance',
                    payee: 'Initial Setup',
                };
                setTransactions(prev => [...prev, initialTransaction]);
            }

            // Create default categories for the new account
            const DEFAULT_CATEGORIES = ['Groceries', 'Utilities', 'Rent/Mortgage', 'Transportation', 'Dining Out', 'Entertainment', 'Shopping', 'Health & Fitness', 'Salary', 'Investment', 'Other'];
            if (accountData.balance !== 0) {
                DEFAULT_CATEGORIES.push('Initial Balance');
            }
            const newCategories: Category[] = DEFAULT_CATEGORIES.map(name => ({
                id: crypto.randomUUID(), name, accountId: newAccount.id,
            }));
            setCategories(prev => [...prev, ...newCategories]);
        }
    };

    const handleTransferSubmit = ({ fromId, toId, amount, date, notes }: { fromId: string, toId: string, amount: number, date: string, notes: string }) => {
        const fromAccount = accounts.find(a => a.id === fromId);
        const toAccount = accounts.find(a => a.id === toId);
        if (!fromAccount || !toAccount) return;

        const descriptionText = notes ? `: ${notes}` : '';
        const transferId = crypto.randomUUID();

        const fromTransaction: Transaction = {
            id: crypto.randomUUID(),
            accountId: fromId,
            amount: -amount,
            date: date,
            description: `Transfer to ${toAccount.name}${descriptionText}`,
            category: 'Account Transfer',
            isInternal: true,
            transferId,
        };

        const toTransaction: Transaction = {
            id: crypto.randomUUID(),
            accountId: toId,
            amount: amount,
            date: date,
            description: `Transfer from ${fromAccount.name}${descriptionText}`,
            category: 'Account Transfer',
            isInternal: true,
            transferId,
        };

        setTransactions(prev => [...prev, fromTransaction, toTransaction]);

        setAccounts(prev => prev.map(acc => {
            let newBalance = acc.balance;
            // Debit from source and its parent (if applicable)
            if (acc.id === fromId) newBalance -= amount;
            if (fromAccount.parentId && acc.id === fromAccount.parentId) newBalance -= amount;
            // Credit to destination and its parent (if applicable)
            if (acc.id === toId) newBalance += amount;
            if (toAccount.parentId && acc.id === toAccount.parentId) newBalance += amount;
            
            return { ...acc, balance: newBalance };
        }));

        setIsTransferModalOpen(false);
    };
    
    const confirmDeleteAccount = () => {
        if (!accountToDelete) return;

        let accountsToDelete = [accountToDelete.id];
        // If it's a parent account, also queue its children for deletion
        if (!accountToDelete.parentId) {
            const children = accounts.filter(a => a.parentId === accountToDelete.id);
            accountsToDelete = [...accountsToDelete, ...children.map(c => c.id)];
        }

        setAccounts(prev => prev.filter(acc => !accountsToDelete.includes(acc.id)));
        setTransactions(prev => prev.filter(t => !accountsToDelete.includes(t.accountId)));
        setCategories(prev => prev.filter(c => !accountsToDelete.includes(c.accountId)));
        setAccountToDelete(null);
    };

    const openModalForEdit = (account: Account) => {
        setModalState({ isOpen: true, editingAccount: account });
    };

    const openModalForAdd = (parentId?: string) => {
        setModalState({ isOpen: true, editingAccount: null, parentId });
    };

    return (
        <div className="p-6">
            <Header title="Accounts Manager">
                <div className="flex items-center space-x-2">
                    <button onClick={() => setIsTransferModalOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                        Transfer
                    </button>
                    <button onClick={() => openModalForAdd()} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Add Main Account
                    </button>
                </div>
            </Header>
            {accounts.length > 0 ? (
                 <div className="space-y-8">
                    {parentAccounts.map(account => (
                        <div key={account.id} className="bg-gray-800 rounded-lg shadow-md transition-all duration-300">
                           <div className="p-4 flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-700/50">
                                <Link to={`/accounts/${account.id}`} className="block group">
                                    <div className="flex items-center">
                                        <h3 className="text-xl font-bold text-white pr-2 group-hover:underline">{account.name}</h3>
                                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full flex-shrink-0">{account.type}</span>
                                    </div>
                                    <p className="text-3xl font-semibold text-white mt-2">
                                        ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                               </Link>
                               <div className="flex-shrink-0 mt-4 sm:mt-0 flex space-x-2">
                                    <button onClick={() => openModalForAdd(account.id)} className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700">Add Sub-Account</button>
                                    <button onClick={() => openModalForEdit(account)} className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600">Edit</button>
                                    <button onClick={() => setAccountToDelete(account)} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                               </div>
                           </div>
                           {(subAccountsById[account.id] || []).length > 0 && (
                               <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                   {subAccountsById[account.id].map(sub => (
                                       <div key={sub.id} className="bg-gray-900/50 rounded-lg p-3">
                                            <Link to={`/accounts/${sub.id}`} className="block group">
                                                <p className="font-semibold group-hover:underline">{sub.name}</p>
                                                <p className="text-xl font-mono">${sub.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </Link>
                                            <div className="text-right mt-2">
                                                <button onClick={() => openModalForEdit(sub)} className="text-xs text-yellow-400 hover:text-yellow-300 mr-2">Edit</button>
                                                <button onClick={() => setAccountToDelete(sub)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                                            </div>
                                       </div>
                                   ))}
                               </div>
                           )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-800 p-8 rounded-lg text-center">
                    <p className="text-gray-400">No accounts yet. Click "Add Main Account" to get started.</p>
                </div>
            )}

            <Modal isOpen={modalState.isOpen} onClose={() => setModalState({ isOpen: false, editingAccount: null })} title={modalState.editingAccount ? "Edit Account" : (modalState.parentId ? "Add Sub-Account" : "Add New Account")}>
                <AccountForm 
                    onSubmit={handleFormSubmit}
                    onClose={() => setModalState({ isOpen: false, editingAccount: null })}
                    initialData={modalState.editingAccount}
                    parentId={modalState.parentId}
                />
            </Modal>
            
            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer Between Accounts">
                <TransferForm onSubmit={handleTransferSubmit} onClose={() => setIsTransferModalOpen(false)} accounts={accounts} />
            </Modal>

            <ConfirmationModal
                isOpen={!!accountToDelete}
                onClose={() => setAccountToDelete(null)}
                onConfirm={confirmDeleteAccount}
                title="Confirm Deletion"
                message={<>Are you sure you want to delete the account <strong>"{accountToDelete?.name}"</strong>? { !accountToDelete?.parentId && "This will also delete all its sub-accounts."} This removes all associated transactions and categories. This action cannot be undone.</>}
                confirmText="Delete"
            />
        </div>
    );
};

export default Accounts;