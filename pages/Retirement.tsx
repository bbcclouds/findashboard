
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { RetirementAccount, RetirementAccountType } from '../types';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { Link } from 'react-router-dom';

const RetirementAccountForm: React.FC<{
    onSubmit: (account: Omit<RetirementAccount, 'id'>) => void;
    onClose: () => void;
    initialData?: RetirementAccount | null;
}> = ({ onSubmit, onClose, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState<RetirementAccountType>(initialData?.type || RetirementAccountType._401K);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, type });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">Account Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Fidelity 401k"
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Account Type</label>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value as RetirementAccountType)}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                >
                    {Object.values(RetirementAccountType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Account</button>
            </div>
        </form>
    );
};

const Retirement: React.FC = () => {
    const { retirementAccounts, setRetirementAccounts, retirementHoldings, setRetirementHoldings, retirementContributions, setRetirementContributions } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<RetirementAccount | null>(null);
    const [accountToDelete, setAccountToDelete] = useState<RetirementAccount | null>(null);

    const [isReordering, setIsReordering] = useState(false);
    const [orderedAccounts, setOrderedAccounts] = useState<RetirementAccount[]>(retirementAccounts);
    
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        setOrderedAccounts(retirementAccounts);
    }, [retirementAccounts]);

    const accountValues = useMemo(() => {
        const valueMap = new Map<string, number>();
        retirementHoldings.forEach(holding => {
            if (holding.accountId) {
                const value = holding.quantity * holding.price;
                valueMap.set(holding.accountId, (valueMap.get(holding.accountId) || 0) + value);
            }
        });
        return valueMap;
    }, [retirementHoldings]);
    
    const handleAddAccount = (accountData: Omit<RetirementAccount, 'id'>) => {
        const newAccount: RetirementAccount = { ...accountData, id: crypto.randomUUID() };
        setRetirementAccounts([...retirementAccounts, newAccount]);
    };

    const handleEditAccount = (accountData: Omit<RetirementAccount, 'id'>) => {
        if (!editingAccount) return;
        setRetirementAccounts(retirementAccounts.map(acc => acc.id === editingAccount.id ? { ...acc, ...accountData } : acc));
    };

    const openDeleteConfirm = (account: RetirementAccount) => {
        setAccountToDelete(account);
    };

    const confirmDeleteAccount = () => {
        if (!accountToDelete) return;
        // Also delete associated holdings and contributions
        setRetirementHoldings(prev => prev.filter(h => h.accountId !== accountToDelete.id));
        setRetirementContributions(prev => prev.filter(c => c.accountId !== accountToDelete.id));
        setRetirementAccounts(prev => prev.filter(acc => acc.id !== accountToDelete.id));
        setAccountToDelete(null);
    };

    const openModalForEdit = (account: RetirementAccount) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const openModalForAdd = () => {
        setEditingAccount(null);
        setIsModalOpen(true);
    };
    
    const handleSortAlphabetically = () => {
        const sorted = [...retirementAccounts].sort((a, b) => a.name.localeCompare(b.name));
        setRetirementAccounts(sorted);
    };

    const handleSaveOrder = () => {
        setRetirementAccounts(orderedAccounts);
        setIsReordering(false);
    };
    
    const handleCancelReorder = () => {
        setOrderedAccounts(retirementAccounts);
        setIsReordering(false);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragOverItem.current = index;
    };
    
    const handleDrop = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const newAccounts = [...orderedAccounts];
        const draggedItemContent = newAccounts.splice(dragItem.current, 1)[0];
        newAccounts.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setOrderedAccounts(newAccounts);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('dragging');
    };

    return (
        <div className="p-6">
            <Header title="Retirement Accounts">
                 <div className="flex items-center space-x-2">
                    {isReordering ? (
                        <>
                            <button onClick={handleCancelReorder} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500">
                                Cancel
                            </button>
                             <button onClick={handleSaveOrder} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                                Save Order
                            </button>
                        </>
                    ) : (
                        <>
                             <button onClick={handleSortAlphabetically} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500">
                                Sort A-Z
                            </button>
                            <button onClick={() => setIsReordering(true)} className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">
                                Reconfigure
                            </button>
                            <button onClick={openModalForAdd} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                                Add Account
                            </button>
                        </>
                    )}
                </div>
            </Header>
            <style>{`
                .dragging {
                    opacity: 0.5;
                    border: 2px dashed #a0aec0;
                }
            `}</style>

            {retirementAccounts.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orderedAccounts.map((account, index) => (
                        <div
                            key={account.id}
                            draggable={isReordering}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className={`bg-gray-800 rounded-lg shadow-md flex flex-col transition-all duration-300 ${isReordering ? 'cursor-grab ring-2 ring-blue-500' : 'hover:shadow-lg hover:-translate-y-1'}`}
                        >
                           <Link to={!isReordering ? `/retirement/${account.id}` : '#'} onClick={(e) => { if(isReordering) e.preventDefault()}} className={`block p-4 flex-grow ${!isReordering ? 'hover:bg-gray-700/50 rounded-t-lg' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold text-white pr-2">{account.name}</h3>
                                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full flex-shrink-0">{account.type}</span>
                                </div>
                                <p className="text-3xl font-semibold text-white mt-4">
                                    ${(accountValues.get(account.id) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                           </Link>
                           <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700 flex justify-end space-x-2">
                                <button onClick={() => openModalForEdit(account)} className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600">Edit</button>
                                <button onClick={() => openDeleteConfirm(account)} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                           </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-800 p-8 rounded-lg text-center">
                    <p className="text-gray-400">No retirement accounts yet. Click "Add Retirement Account" to get started.</p>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAccount ? "Edit Retirement Account" : "Add New Retirement Account"}>
                <RetirementAccountForm 
                    onSubmit={editingAccount ? handleEditAccount : handleAddAccount} 
                    onClose={() => setIsModalOpen(false)}
                    initialData={editingAccount}
                />
            </Modal>

            <ConfirmationModal
                isOpen={!!accountToDelete}
                onClose={() => setAccountToDelete(null)}
                onConfirm={confirmDeleteAccount}
                title="Confirm Deletion"
                message={<>Are you sure you want to delete the account <strong>"{accountToDelete?.name}"</strong>? This will also remove all associated holdings and contributions. This action cannot be undone.</>}
                confirmText="Delete"
            />
        </div>
    );
};

export default Retirement;
