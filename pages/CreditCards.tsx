import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { CreditCard, Category, Account, Transaction } from '../types';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import StatCard from '../components/StatCard';
import { Link } from 'react-router-dom';

const CreditCardForm: React.FC<{
    onSubmit: (card: Omit<CreditCard, 'id'>) => void;
    onClose: () => void;
    initialData?: CreditCard | null;
}> = ({ onSubmit, onClose, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [issuer, setIssuer] = useState(initialData?.issuer || '');
    const [balance, setBalance] = useState<string>(initialData ? initialData.balance.toString() : '');
    const [creditLimit, setCreditLimit] = useState<string>(initialData ? initialData.creditLimit.toString() : '');
    const [apr, setApr] = useState<string>(initialData ? initialData.apr.toString() : '');
    const [minimumPayment, setMinimumPayment] = useState<string>(initialData ? initialData.minimumPayment.toString() : '');


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ 
            name, 
            issuer, 
            balance: parseFloat(balance) || 0, 
            creditLimit: parseFloat(creditLimit) || 0, 
            apr: parseFloat(apr) || 0,
            minimumPayment: parseFloat(minimumPayment) || 0
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">Card Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Issuer</label>
                <input type="text" value={issuer} onChange={(e) => setIssuer(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Current Balance</label>
                <input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} required placeholder="0.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Credit Limit</label>
                    <input type="number" step="0.01" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} required placeholder="1000.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">APR (%)</label>
                    <input type="number" step="0.01" value={apr} onChange={(e) => setApr(e.target.value)} required placeholder="21.99" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Minimum Monthly Payment</label>
                <input type="number" step="0.01" value={minimumPayment} onChange={(e) => setMinimumPayment(e.target.value)} placeholder="25.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Card</button>
            </div>
        </form>
    );
};

const PaymentForm: React.FC<{
    onSubmit: (data: { fromAccountId: string, toCardId: string, amount: number, date: string }) => void;
    onClose: () => void;
    accounts: Account[];
    creditCards: CreditCard[];
    initialCardId?: string;
}> = ({ onSubmit, onClose, accounts, creditCards, initialCardId }) => {
    const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
    const [toCardId, setToCardId] = useState(initialCardId || creditCards[0]?.id || '');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!fromAccountId || !toCardId) {
            setError('Please select an account and a credit card.'); return;
        }
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid positive amount.'); return;
        }
        onSubmit({ fromAccountId, toCardId, amount: numAmount, date });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
            <div>
                <label className="block text-sm font-medium text-gray-300">Pay From Account</label>
                <select value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toFixed(2)})</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Pay To Credit Card</label>
                <select value={toCardId} onChange={e => setToCardId(e.target.value)} disabled={!!initialCardId} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white disabled:bg-gray-600">
                    {creditCards.map(card => <option key={card.id} value={card.id}>{card.name} (${card.balance.toFixed(2)})</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Amount</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Confirm Payment</button>
            </div>
        </form>
    );
};

const CreditCards: React.FC = () => {
    const { creditCards, setCreditCards, accounts, setAccounts, setTransactions, setCategories, transactions } = useData();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
    const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);
    const [cardToPay, setCardToPay] = useState<CreditCard | null>(null);


    const cardStats = useMemo(() => {
        const totalBalance = creditCards.reduce((sum, card) => sum + card.balance, 0);
        const totalLimit = creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
        const availableCredit = totalLimit - totalBalance;
        const totalMinimumPayment = creditCards.reduce((sum, card) => sum + card.minimumPayment, 0);
        return { totalBalance, totalLimit, availableCredit, totalMinimumPayment };
    }, [creditCards]);
    
    const handleAddCard = (cardData: Omit<CreditCard, 'id'>) => {
        const newCard: CreditCard = { ...cardData, id: crypto.randomUUID() };
        setCreditCards(prev => [...prev, newCard]);

        const DEFAULT_CATEGORIES = ['Groceries', 'Gas', 'Dining', 'Shopping', 'Travel', 'Entertainment', 'Utilities', 'Payment/Credit', 'Other'];
        const newCategories: Category[] = DEFAULT_CATEGORIES.map(name => ({
            id: crypto.randomUUID(), name, accountId: newCard.id,
        }));
        setCategories(prev => [...prev, ...newCategories]);
    };

    const handleEditCard = (cardData: Omit<CreditCard, 'id'>) => {
        if (!editingCard) return;
        setCreditCards(prev => prev.map(card => card.id === editingCard.id ? { ...card, ...cardData } : card));
    };

    const handlePaymentSubmit = ({ fromAccountId, toCardId, amount, date }: { fromAccountId: string, toCardId:string, amount: number, date: string }) => {
        const fromAccount = accounts.find(a => a.id === fromAccountId);
        const toCard = creditCards.find(c => c.id === toCardId);
        if (!fromAccount || !toCard) return;

        const transferId = crypto.randomUUID();

        // Transaction for the bank account (debit)
        setTransactions(prev => [...prev, {
            id: crypto.randomUUID(),
            accountId: fromAccountId,
            amount: -amount,
            date,
            description: `Payment to ${toCard.name}`,
            category: 'Credit Card Payment',
            payee: toCard.issuer,
            transferId,
        }]);

        // Transaction for the credit card (payment)
        setTransactions(prev => [...prev, {
            id: crypto.randomUUID(),
            accountId: toCardId,
            amount: -amount, // Negative amount reduces the balance (liability)
            date,
            description: `Payment from ${fromAccount.name}`,
            category: 'Payment/Credit',
            payee: 'Payment',
            transferId,
        }]);

        // Update balances
        setAccounts(prev => prev.map(acc => acc.id === fromAccountId ? {...acc, balance: acc.balance - amount} : acc));
        setCreditCards(prev => prev.map(card => card.id === toCardId ? {...card, balance: card.balance - amount} : card));

        setIsPaymentModalOpen(false);
    };

    const openDeleteConfirm = (card: CreditCard) => {
        setCardToDelete(card);
    };
    
    const confirmDeleteCard = () => {
        if (!cardToDelete) return;
        // Also delete transactions and categories associated with this card
        setTransactions(prev => prev.filter(t => t.accountId !== cardToDelete.id));
        setCategories(prev => prev.filter(c => c.accountId !== cardToDelete.id));
        setCreditCards(prev => prev.filter(c => c.id !== cardToDelete.id));
        setCardToDelete(null);
    };

    const openModalForEdit = (card: CreditCard) => {
        setEditingCard(card);
        setIsFormModalOpen(true);
    };

    const openModalForAdd = () => {
        setEditingCard(null);
        setIsFormModalOpen(true);
    };
    
    const openPaymentModal = (card: CreditCard | null) => {
        setCardToPay(card);
        setIsPaymentModalOpen(true);
    };

    return (
        <div className="p-6">
            <Header title="Credit Cards">
                <div className="flex items-center space-x-2">
                    <button onClick={() => openPaymentModal(null)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Make Payment</button>
                    <button onClick={openModalForAdd} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add Card</button>
                </div>
            </Header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard label="Total Balance" value={`$${cardStats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-red-500" />
                <StatCard label="Available Credit" value={`$${cardStats.availableCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-green-500" />
                 <StatCard label="Total Min. Payments" value={`$${cardStats.totalMinimumPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-yellow-400" />
                <StatCard label="Total Credit Limit" value={`$${cardStats.totalLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-gray-400" />
            </div>

            {creditCards.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {creditCards.map(card => {
                        const utilization = card.creditLimit > 0 ? (card.balance / card.creditLimit) * 100 : 0;
                        const utilizationColor = utilization > 70 ? 'bg-red-500' : utilization > 30 ? 'bg-yellow-500' : 'bg-green-500';
                        return (
                            <div key={card.id} className="bg-gray-800 rounded-lg shadow-md flex flex-col">
                               <Link to={`/credit-cards/${card.id}`} className="block p-4 flex-grow hover:bg-gray-700/50 rounded-t-lg">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-white pr-2">{card.name}</h3>
                                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full flex-shrink-0">{card.issuer}</span>
                                    </div>
                                    <p className="text-3xl font-semibold text-white mt-4">
                                        ${card.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>Limit: ${card.creditLimit.toLocaleString()}</span>
                                            <span>Utilization: {utilization.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                                            <div className={`${utilizationColor} h-2.5 rounded-full`} style={{width: `${Math.min(utilization, 100)}%`}}></div>
                                        </div>
                                    </div>
                               </Link>
                               <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700 flex justify-end space-x-2">
                                    <button onClick={() => openPaymentModal(card)} className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700">Pay</button>
                                    <button onClick={() => openModalForEdit(card)} className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600">Edit</button>
                                    <button onClick={() => openDeleteConfirm(card)} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                               </div>
                            </div>
                        )
                    })}
                 </div>
            ) : (
                <div className="bg-gray-800 p-8 rounded-lg text-center">
                    <p className="text-gray-400">No credit cards yet. Click "Add Card" to get started.</p>
                </div>
            )}

            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingCard ? "Edit Credit Card" : "Add New Credit Card"}>
                <CreditCardForm 
                    onSubmit={editingCard ? handleEditCard : handleAddCard} 
                    onClose={() => setIsFormModalOpen(false)}
                    initialData={editingCard}
                />
            </Modal>
            
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Make a Payment">
                <PaymentForm 
                    onSubmit={handlePaymentSubmit} 
                    onClose={() => setIsPaymentModalOpen(false)}
                    accounts={accounts}
                    creditCards={creditCards}
                    initialCardId={cardToPay?.id}
                />
            </Modal>

            <ConfirmationModal
                isOpen={!!cardToDelete}
                onClose={() => setCardToDelete(null)}
                onConfirm={confirmDeleteCard}
                title="Confirm Deletion"
                message={<>Are you sure you want to delete the card <strong>"{cardToDelete?.name}"</strong>? This will also remove all associated transactions and categories. This action cannot be undone.</>}
                confirmText="Delete"
            />
        </div>
    );
};

export default CreditCards;