import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { FormalDebt, Commitment, Receivable, PaymentRecord, Account, Transaction } from '../types';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import StatCard from '../components/StatCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

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

const FormalDebtForm: React.FC<{
    onSubmit: (debt: Partial<Omit<FormalDebt, 'id' | 'status' | 'creationDate'>>) => void;
    onClose: () => void;
    initialData?: FormalDebt | null;
}> = ({ onSubmit, onClose, initialData }) => {
    const { otherAssets } = useData();
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const initialTotalAmount = initialData?.totalAmount;
    const [totalAmount, setTotalAmount] = useState(initialTotalAmount ? String(initialTotalAmount) : '');
    const initialInterestRate = initialData?.interestRate;
    const [interestRate, setInterestRate] = useState(initialInterestRate ? String(initialInterestRate) : '');
    const [loanOriginationDate, setLoanOriginationDate] = useState(initialData?.loanOriginationDate || initialData?.creationDate || new Date().toISOString().split('T')[0]);
    const [nextPaymentDate, setNextPaymentDate] = useState(initialData?.nextPaymentDate || new Date().toISOString().split('T')[0]);
    const [loanTermYears, setLoanTermYears] = useState(initialData?.loanTermYears ? String(initialData.loanTermYears) : '');
    const [linkedAsset, setLinkedAsset] = useState(() => {
        if (initialData?.assetType && initialData?.linkedAssetId) {
            return `${initialData.assetType}-${initialData.linkedAssetId}`;
        }
        return 'none';
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const [assetTypeStr, linkedAssetId] = linkedAsset.split('-');
        const assetType = assetTypeStr as 'otherAsset' | 'home' | undefined;

        onSubmit({ 
            name, 
            description, 
            totalAmount: parseFloat(totalAmount) || 0, 
            interestRate: parseFloat(interestRate) || 0,
            loanOriginationDate, 
            nextPaymentDate,
            loanTermYears: parseFloat(loanTermYears) || undefined,
            linkedAssetId: linkedAsset === 'none' ? undefined : linkedAssetId,
            assetType: linkedAsset === 'none' ? undefined : assetType,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Debt Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Car Loan" className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Lender or Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="e.g., Challenger Bank" className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Total Amount</label>
                <input type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required placeholder="0.00" className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Interest Rate (%)</label>
                    <input type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} required placeholder="0.00" className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Loan Term (Years)</label>
                    <input type="number" step="1" value={loanTermYears} onChange={(e) => setLoanTermYears(e.target.value)} placeholder="e.g., 5" className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Loan Origination Date</label>
                    <input type="date" value={loanOriginationDate} onChange={(e) => setLoanOriginationDate(e.target.value)} required className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Next Payment Date</label>
                    <input type="date" value={nextPaymentDate} onChange={(e) => setNextPaymentDate(e.target.value)} required className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Link to Asset (for Equity Tracking)</label>
                <select value={linkedAsset} onChange={(e) => setLinkedAsset(e.target.value)} className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white">
                    <option value="none">None</option>
                    {otherAssets.length > 0 && <optgroup label="Other Assets">
                        {otherAssets.map(asset => <option key={asset.id} value={`otherAsset-${asset.id}`}>{asset.name}</option>)}
                    </optgroup>}
                </select>
                <p className="text-xs text-gray-400 mt-1">Mortgages must be added/edited from the Home page.</p>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Debt</button>
            </div>
        </form>
    );
};

const ItemPaymentForm: React.FC<{
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

const CommitmentForm: React.FC<{
    onSubmit: (commitment: Omit<Commitment, 'id' | 'status' | 'creationDate'>) => void;
    onClose: () => void;
    initialData?: Commitment | null;
}> = ({ onSubmit, onClose, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const initialAmount = initialData?.amount;
    const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');
    const [dueDate, setDueDate] = useState(initialData?.dueDate || new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, amount: parseFloat(amount) || 0, dueDate });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Commitment Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Rent" className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Commitment</button>
            </div>
        </form>
    );
};

const ReceivableForm: React.FC<{
    onSubmit: (receivable: Omit<Receivable, 'id' | 'status' | 'creationDate'>) => void;
    onClose: () => void;
    initialData?: Receivable | null;
}> = ({ onSubmit, onClose, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [from, setFrom] = useState(initialData?.from || '');
    const initialAmount = initialData?.amount;
    const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');
    const [dueDate, setDueDate] = useState(initialData?.dueDate || new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, from, amount: parseFloat(amount) || 0, dueDate });
        onClose();
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Receivable Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Freelance Work" className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">From</label>
                <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} required placeholder="Client Name" className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Receivable</button>
            </div>
        </form>
    );
};

const generateHistory = (
    items: (FormalDebt | Commitment | Receivable)[],
    payments: PaymentRecord[],
    dataKey: 'formalDebt' | 'commitments' | 'receivables',
    allFormalDebtsForLookup?: FormalDebt[]
) => {
    // 1. Collate all financial events (item creation, payments)
    const allEvents: { date: string; change: number }[] = [];

    items.forEach((item) => {
        const debt = item as FormalDebt; // Assuming similar structure for others
        const startDate = debt.loanOriginationDate || debt.creationDate;
        const amount = debt.totalAmount || (item as Commitment).amount;
        if (startDate && amount > 0) {
            allEvents.push({ date: startDate, change: amount });
        }
    });

    const itemIds = new Set(items.map(i => i.id));
    payments.filter(p => itemIds.has(p.itemId)).forEach(payment => {
        let principalPaid = payment.amount;
        if (dataKey === 'formalDebt' && allFormalDebtsForLookup) {
            const debt = allFormalDebtsForLookup.find(d => d.id === payment.itemId);
            // For mortgages, only the principal portion reduces the debt balance on the chart
            if (debt?.assetType === 'home') {
                principalPaid = payment.breakdown?.principal ?? payment.amount;
            }
        }
        if (principalPaid > 0) {
            allEvents.push({ date: payment.date, change: -principalPaid });
        }
    });

    if (allEvents.length === 0) {
        return [];
    }
    
    // 2. Group events by date and calculate net change for each day
    const dailyChanges = new Map<string, number>();
    allEvents.forEach(event => {
        const existingChange = dailyChanges.get(event.date) || 0;
        dailyChanges.set(event.date, existingChange + event.change);
    });

    const sortedDates = Array.from(dailyChanges.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    // 3. Calculate running balance over time
    const dataPoints: { date: string; [key: string]: number | string }[] = [];
    let runningBalance = 0;

    // Add a zero-value point one day before the first event to ground the chart
    const firstDate = new Date(sortedDates[0]);
    firstDate.setDate(firstDate.getDate() - 1);
    const initialDateStr = firstDate.toISOString().split('T')[0];
    dataPoints.push({ date: initialDateStr, [dataKey]: 0 });

    // Create a data point for each day there was a change
    sortedDates.forEach(date => {
        runningBalance += dailyChanges.get(date) || 0;
        dataPoints.push({ date, [dataKey]: runningBalance });
    });

    // Add a point for today to extend the line if needed
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDateStr = sortedDates[sortedDates.length - 1];
    if (lastDateStr && lastDateStr < todayStr) {
        dataPoints.push({ date: todayStr, [dataKey]: runningBalance });
    }

    return dataPoints;
};


const Debts: React.FC = () => {
    const { formalDebts, setFormalDebts, commitments, setCommitments, receivables, setReceivables, paymentRecords, setPaymentRecords, accounts, setAccounts, setTransactions, otherAssets, homes } = useData();
    const [modalState, setModalState] = useState<{ type: 'debt' | 'commitment' | 'receivable' | null; data: any | null }>({ type: null, data: null });
    const [paymentModalState, setPaymentModalState] = useState<{ item: FormalDebt | Commitment | Receivable | null; type: 'debt' | 'commitment' | 'receivable' | null }>({ item: null, type: null });
    const [itemToDelete, setItemToDelete] = useState<{ type: 'debt' | 'commitment' | 'receivable'; id: string; name: string } | null>(null);
    
    const activeFormalDebts = useMemo(() => formalDebts.filter(d => d.status === 'active'), [formalDebts]);
    const archivedFormalDebts = useMemo(() => formalDebts.filter(d => d.status === 'archived'), [formalDebts]);
    const activeCommitments = useMemo(() => commitments.filter(c => c.status === 'active'), [commitments]);
    const archivedCommitments = useMemo(() => commitments.filter(c => c.status === 'archived'), [commitments]);
    const activeReceivables = useMemo(() => receivables.filter(r => r.status === 'active'), [receivables]);
    const archivedReceivables = useMemo(() => receivables.filter(r => r.status === 'archived'), [receivables]);

    const totalFormalDebt = useMemo(() => {
        return activeFormalDebts.reduce((sum, debt) => {
            const isMortgage = debt.assetType === 'home';
            const paymentsForDebt = paymentRecords.filter(p => p.itemId === debt.id);
            const principalPaid = isMortgage
                ? paymentsForDebt.reduce((s, p) => s + (p.breakdown?.principal || 0), 0)
                : paymentsForDebt.reduce((s, p) => s + p.amount, 0);
            return sum + (debt.totalAmount - principalPaid);
        }, 0);
    }, [activeFormalDebts, paymentRecords]);

    const totalCommitments = useMemo(() => {
        return activeCommitments.reduce((sum, c) => {
            const paid = paymentRecords.filter(p => p.itemId === c.id).reduce((s,p) => s + p.amount, 0);
            return sum + (c.amount - paid);
        }, 0);
    }, [activeCommitments, paymentRecords]);

    const totalReceivables = useMemo(() => {
        return activeReceivables.reduce((sum, r) => {
            const received = paymentRecords.filter(p => p.itemId === r.id).reduce((s,p) => s + p.amount, 0);
            return sum + (r.amount - received);
        }, 0)
    }, [activeReceivables, paymentRecords]);

    const formalDebtHistoryData = useMemo(() => {
        return generateHistory(formalDebts, paymentRecords, 'formalDebt', formalDebts);
    }, [formalDebts, paymentRecords]);

    const commitmentsHistoryData = useMemo(() => {
        return generateHistory(commitments, paymentRecords, 'commitments');
    }, [commitments, paymentRecords]);

    const receivablesHistoryData = useMemo(() => {
        return generateHistory(receivables, paymentRecords, 'receivables');
    }, [receivables, paymentRecords]);


    const openModal = (type: 'debt' | 'commitment' | 'receivable', data: any | null = null) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: null });

    const handlePaymentSubmit = (paymentData: Omit<PaymentRecord, 'id' | 'itemId' | 'transactionId'>) => {
        if (!paymentModalState.item || !paymentModalState.type) return;
    
        const item = paymentModalState.item;
        const isReceivable = paymentModalState.type === 'receivable';
        const isMortgage = paymentModalState.type === 'debt' && (item as FormalDebt).assetType === 'home';
    
        // 1. Create Transaction
        let payee: string;
        let category: string;
    
        if (isReceivable) {
            payee = (item as Receivable).from;
            category = 'Receivable';
        } else if (paymentModalState.type === 'debt') {
            payee = (item as FormalDebt).description;
            category = 'Debt Payment';
        } else {
            payee = (item as Commitment).name;
            category = 'Commitment Payment';
        }
    
        const newTransaction: Transaction = {
            id: crypto.randomUUID(),
            accountId: paymentData.accountId,
            amount: isReceivable ? paymentData.amount : -paymentData.amount,
            date: paymentData.date,
            description: `${isReceivable ? 'Received for' : 'Payment for'} ${item.name}`,
            payee: payee,
            category: category
        };
        
        setTransactions(prev => [...prev, newTransaction]);
        
        // 2. Create Payment Record
        const newPayment: PaymentRecord = {
            ...paymentData,
            id: crypto.randomUUID(),
            itemId: item.id,
            transactionId: newTransaction.id,
        };
        
        // 3. Update Account Balance
        setAccounts(prev => prev.map(acc => {
            if (acc.id === newPayment.accountId) {
                const newBalance = isReceivable
                    ? acc.balance + newPayment.amount
                    : acc.balance - newPayment.amount;
                return { ...acc, balance: newBalance };
            }
            return acc;
        }));
    
        // 4. Update Payment Records (with amortization for mortgages)
        if (isMortgage) {
            const currentMortgagePayments = paymentRecords.filter(p => p.itemId === item.id);
            const recalculated = applyAmortizationToPayments(item as FormalDebt, [...currentMortgagePayments, newPayment]);
            setPaymentRecords(prev => [...prev.filter(p => p.itemId !== item.id), ...recalculated]);
        } else {
            setPaymentRecords(prev => [...prev, newPayment]);
        }
        
        setPaymentModalState({ item: null, type: null });
    };

    const handleSubmit = (formData: any) => {
        const { type, data } = modalState;
        if (data) { // Editing
            if (type === 'debt') setFormalDebts(formalDebts.map(d => d.id === data.id ? { ...d, ...formData } : d));
            if (type === 'commitment') setCommitments(commitments.map(c => c.id === data.id ? { ...c, ...formData } : c));
            if (type === 'receivable') setReceivables(receivables.map(r => r.id === data.id ? { ...r, ...formData } : r));
        } else { // Adding
            const newItem = { ...formData, id: crypto.randomUUID(), status: 'active' as const, creationDate: new Date().toISOString().split('T')[0] };
            if (type === 'debt') setFormalDebts([...formalDebts, newItem]);
            if (type === 'commitment') setCommitments([...commitments, newItem]);
            if (type === 'receivable') setReceivables([...receivables, newItem]);
        }
        closeModal();
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        const { type, id } = itemToDelete;
        switch (type) {
            case 'debt':
                setFormalDebts(prev => prev.filter(d => d.id !== id));
                break;
            case 'commitment':
                setCommitments(prev => prev.filter(c => c.id !== id));
                break;
            case 'receivable':
                setReceivables(prev => prev.filter(r => r.id !== id));
                break;
        }
        setPaymentRecords(prev => prev.filter(p => p.itemId !== id));
        setItemToDelete(null);
    };
    
    const handleArchive = (type: 'debt' | 'commitment' | 'receivable', id: string) => {
        const paidOffDate = new Date().toISOString().split('T')[0];

        const updateStatus = (item: any) => item.id === id ? {...item, status: 'archived', paidOffDate} : item;

        if (type === 'debt') setFormalDebts(prev => prev.map(updateStatus));
        if (type === 'commitment') setCommitments(prev => prev.map(updateStatus));
        if (type === 'receivable') setReceivables(prev => prev.map(updateStatus));
    };

    const handleUnarchive = (type: 'debt' | 'commitment' | 'receivable', id: string) => {
        const updateStatus = (item: any) => item.id === id ? {...item, status: 'active', paidOffDate: undefined} : item;

        if (type === 'debt') setFormalDebts(prev => prev.map(updateStatus));
        if (type === 'commitment') setCommitments(prev => prev.map(updateStatus));
        if (type === 'receivable') setReceivables(prev => prev.map(updateStatus));
    };

    const modalTitle = useMemo(() => {
        if (!modalState.type) return '';
        const action = modalState.data ? 'Edit' : 'Add';
        switch (modalState.type) {
            case 'debt': return `${action} Formal Debt`;
            case 'commitment': return `${action} Commitment`;
            case 'receivable': return `${action} Receivable`;
        }
    }, [modalState]);

    const yAxisTickFormatter = (value: number) => {
        if (Math.abs(value) >= 1000) {
            return `$${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
        }
        return `$${value}`;
    };

    const renderChart = (chartData: any[], dataKey: string, title: string, color: string) => (
         <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                    <XAxis dataKey="date" stroke="#a0aec0" tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short' })} />
                    <YAxis stroke="#a0aec0" tickFormatter={yAxisTickFormatter} />
                    <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                    <Line type="stepAfter" dataKey={dataKey} stroke={color} dot={false} strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    return (
        <div className="p-6">
            <Header title="Debts & Commitments">
                <div className="space-x-2">
                    <button onClick={() => openModal('debt')} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Add Debt</button>
                    <button onClick={() => openModal('commitment')} className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">Add Commitment</button>
                    <button onClick={() => openModal('receivable')} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">Add Receivable</button>
                </div>
            </Header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Total Formal Debt" value={`$${totalFormalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-red-500" />
                <StatCard label="Total Commitments" value={`$${totalCommitments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-yellow-400" />
                <StatCard label="Total Receivables" value={`$${totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-green-500" />
            </div>

             {(formalDebtHistoryData.length > 0 || commitmentsHistoryData.length > 0 || receivablesHistoryData.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {renderChart(formalDebtHistoryData, "formalDebt", "Formal Debt History", "#ef4444")}
                    {renderChart(commitmentsHistoryData, "commitments", "Commitments History", "#f59e0b")}
                    {renderChart(receivablesHistoryData, "receivables", "Receivables History", "#10b981")}
                </div>
             )}

            <div className="bg-gray-800 p-4 rounded-lg mb-8">
                <h3 className="text-xl font-bold text-white mb-4">Active Formal Debts</h3>
                {activeFormalDebts.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-gray-400 uppercase text-sm"><tr><th className="p-3">Name</th><th className="p-3">Interest Rate</th><th className="p-3">Remaining Balance</th><th className="p-3">Progress</th><th className="p-3">Next Payment</th><th className="p-3">Actions</th></tr></thead>
                        <tbody>
                            {activeFormalDebts.map(debt => {
                                const isMortgage = debt.assetType === 'home';
                                const paymentsForDebt = paymentRecords.filter(p => p.itemId === debt.id);
                                
                                const principalPaid = isMortgage
                                    ? paymentsForDebt.reduce((sum, p) => sum + (p.breakdown?.principal || 0), 0)
                                    : paymentsForDebt.reduce((sum, p) => sum + p.amount, 0);

                                const remaining = debt.totalAmount - principalPaid;
                                const progress = debt.totalAmount > 0 ? (principalPaid / debt.totalAmount) * 100 : 0;
                                const progressWidth = Math.min(progress, 100);

                                let equityDisplay = null;
                                if (debt.linkedAssetId && debt.assetType === 'otherAsset') {
                                    const asset = otherAssets.find(a => a.id === debt.linkedAssetId);
                                    if (asset) {
                                        const equity = asset.currentValue - remaining;
                                        equityDisplay = (
                                            <div className="text-xs mt-1">
                                                <span className="text-gray-400">Equity: </span>
                                                <span className={equity >= 0 ? 'text-blue-400' : 'text-red-400'}>
                                                    ${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        );
                                    }
                                }

                                return (
                                <tr key={debt.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3 font-semibold">
                                        <Link to={`/debts/debt/${debt.id}`} className="hover:underline">{debt.name}</Link>
                                        <br/>
                                        <span className="text-xs text-gray-400 font-normal">{debt.description}</span>
                                        {isMortgage ? <div className="text-xs text-purple-400 mt-1">(Mortgage - Managed on Home Page)</div> : equityDisplay}
                                    </td>
                                    <td className="p-3">{debt.interestRate.toFixed(2)}%</td>
                                    <td className="p-3">${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="p-3"><div className="flex items-center space-x-2"><div className="w-24 bg-gray-600 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{width: `${progressWidth}%`}}></div></div><span className="text-xs text-gray-400">{progress.toFixed(1)}% Paid</span></div></td>
                                    <td className="p-3">{debt.nextPaymentDate}</td>
                                    <td className="p-3 space-x-2 whitespace-nowrap">
                                        <button onClick={() => setPaymentModalState({item: debt, type: 'debt'})} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700">Pay</button>
                                        <button onClick={() => openModal('debt', debt)} disabled={isMortgage} className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600 disabled:bg-gray-500 disabled:cursor-not-allowed">Edit</button>
                                        {remaining <= 0 && <button onClick={() => handleArchive('debt', debt.id)} className="bg-purple-500 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-600">Archive</button>}
                                        <button onClick={() => setItemToDelete({type: 'debt', id: debt.id, name: debt.name})} disabled={isMortgage} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed">Delete</button>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                ) : <p className="text-gray-400 text-center py-4">No active formal debts.</p>}
            </div>

            <div className="bg-gray-800 p-4 rounded-lg mb-8">
                <h3 className="text-xl font-bold text-white mb-4">Active Commitments</h3>
                {activeCommitments.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-gray-400 uppercase text-sm"><tr><th className="p-3">Name</th><th className="p-3">Remaining Balance</th><th className="p-3">Progress</th><th className="p-3">Due Date</th><th className="p-3">Actions</th></tr></thead>
                        <tbody>{activeCommitments.map(c => {
                            const amountPaid = paymentRecords.filter(p => p.itemId === c.id).reduce((sum, p) => sum + p.amount, 0);
                            const remaining = c.amount - amountPaid;
                            const progress = c.amount > 0 ? (amountPaid / c.amount) * 100 : 0;
                            const progressWidth = Math.min(progress, 100);
                            return (
                            <tr key={c.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-3 font-semibold"><Link to={`/debts/commitment/${c.id}`} className="hover:underline">{c.name}</Link></td>
                                <td className="p-3 text-yellow-400">${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="p-3"><div className="flex items-center space-x-2"><div className="w-24 bg-gray-600 rounded-full h-2"><div className="bg-yellow-500 h-2 rounded-full" style={{width: `${progressWidth}%`}}></div></div><span className="text-xs text-gray-400">{progress.toFixed(1)}% Paid</span></div></td>
                                <td className="p-3">{c.dueDate}</td>
                                <td className="p-3 space-x-2 whitespace-nowrap">
                                    <button onClick={() => setPaymentModalState({item: c, type: 'commitment'})} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700">Pay</button>
                                    <button onClick={() => openModal('commitment', c)} className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-700">Edit</button>
                                    {remaining <= 0 && <button onClick={() => handleArchive('commitment', c.id)} className="bg-purple-500 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-600">Archive</button>}
                                    <button onClick={() => setItemToDelete({type: 'commitment', id: c.id, name: c.name})} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                                </td>
                            </tr>
                        )})}</tbody>
                    </table>
                </div>
                ) : <p className="text-gray-400 text-center py-4">No active commitments.</p>}
            </div>

            <div className="bg-gray-800 p-4 rounded-lg mb-8">
                <h3 className="text-xl font-bold text-white mb-4">Active Receivables</h3>
                 {activeReceivables.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-gray-400 uppercase text-sm"><tr><th className="p-3">Name</th><th className="p-3">From</th><th className="p-3">Remaining Balance</th><th className="p-3">Progress</th><th className="p-3">Due Date</th><th className="p-3">Actions</th></tr></thead>
                        <tbody>{activeReceivables.map(r => {
                             const amountReceived = paymentRecords.filter(p => p.itemId === r.id).reduce((sum, p) => sum + p.amount, 0);
                             const remaining = r.amount - amountReceived;
                             const progress = r.amount > 0 ? (amountReceived / r.amount) * 100 : 0;
                             const progressWidth = Math.min(progress, 100);
                             return (
                            <tr key={r.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-3 font-semibold"><Link to={`/debts/receivable/${r.id}`} className="hover:underline">{r.name}</Link></td>
                                <td className="p-3">{r.from}</td>
                                <td className="p-3 text-green-500">${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                 <td className="p-3"><div className="flex items-center space-x-2"><div className="w-24 bg-gray-600 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{width: `${progressWidth}%`}}></div></div><span className="text-xs text-gray-400">{progress.toFixed(1)}% Rec'd</span></div></td>
                                <td className="p-3">{r.dueDate}</td>
                                <td className="p-3 space-x-2 whitespace-nowrap">
                                    <button onClick={() => setPaymentModalState({item: r, type: 'receivable'})} className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600">Receive</button>
                                    <button onClick={() => openModal('receivable', r)} className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-700">Edit</button>
                                    {remaining <= 0 && <button onClick={() => handleArchive('receivable', r.id)} className="bg-purple-500 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-600">Archive</button>}
                                    <button onClick={() => setItemToDelete({type: 'receivable', id: r.id, name: r.name})} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                                </td>
                            </tr>
                        )})}</tbody>
                    </table>
                </div>
                ) : <p className="text-gray-400 text-center py-4">No active receivables.</p>}
            </div>

             <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-4">Paid Off & Archived History</h3>
                {archivedFormalDebts.length === 0 && archivedCommitments.length === 0 && archivedReceivables.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No archived items yet.</p>
                ) : (
                    <div className="space-y-6">
                        {archivedFormalDebts.length > 0 && (
                            <div>
                                <h4 className="text-lg font-semibold text-gray-300 mb-2">Archived Debts</h4>
                                <div className="space-y-2">
                                    {archivedFormalDebts.map(d => (
                                        <div key={d.id} className="flex justify-between items-center bg-gray-900/50 p-3 rounded-md">
                                            <div>
                                                <Link to={`/debts/debt/${d.id}`} className="hover:underline font-semibold">{d.name}</Link>
                                                <span className="text-sm text-gray-400 ml-2">- Total ${d.totalAmount.toLocaleString()}</span>
                                                {d.paidOffDate && <span className="text-xs text-gray-500 ml-2">(Paid on {new Date(d.paidOffDate).toLocaleDateString()})</span>}
                                            </div>
                                            <div className="space-x-2">
                                                <button onClick={() => handleUnarchive('debt', d.id)} className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700">Unarchive</button>
                                                <button onClick={() => setItemToDelete({type: 'debt', id: d.id, name: d.name})} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {archivedCommitments.length > 0 && (
                            <div>
                                <h4 className="text-lg font-semibold text-gray-300 mb-2">Paid Commitments</h4>
                                <div className="space-y-2">
                                    {archivedCommitments.map(c => (
                                        <div key={c.id} className="flex justify-between items-center bg-gray-900/50 p-3 rounded-md">
                                            <div>
                                                <Link to={`/debts/commitment/${c.id}`} className="hover:underline font-semibold">{c.name}</Link>
                                                <span className="text-sm text-gray-400 ml-2">- ${c.amount.toLocaleString()}</span>
                                                {c.paidOffDate && <span className="text-xs text-gray-500 ml-2">(Paid on {new Date(c.paidOffDate).toLocaleDateString()})</span>}
                                            </div>
                                            <div className="space-x-2">
                                                <button onClick={() => handleUnarchive('commitment', c.id)} className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700">Unarchive</button>
                                                <button onClick={() => setItemToDelete({type: 'commitment', id: c.id, name: c.name})} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {archivedReceivables.length > 0 && (
                            <div>
                                <h4 className="text-lg font-semibold text-gray-300 mb-2">Received Payments</h4>
                                <div className="space-y-2">
                                    {archivedReceivables.map(r => (
                                        <div key={r.id} className="flex justify-between items-center bg-gray-900/50 p-3 rounded-md">
                                            <div>
                                                <Link to={`/debts/receivable/${r.id}`} className="hover:underline font-semibold">{r.name}</Link>
                                                <span className="text-sm text-gray-400 ml-2">- ${r.amount.toLocaleString()}</span>
                                                {r.paidOffDate && <span className="text-xs text-gray-500 ml-2">(Received on {new Date(r.paidOffDate).toLocaleDateString()})</span>}
                                            </div>
                                            <div className="space-x-2">
                                                <button onClick={() => handleUnarchive('receivable', r.id)} className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700">Unarchive</button>
                                                <button onClick={() => setItemToDelete({type: 'receivable', id: r.id, name: r.name})} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
             </div>
            
            <Modal isOpen={!!modalState.type} onClose={closeModal} title={modalTitle}>
                {modalState.type === 'debt' && <FormalDebtForm onSubmit={handleSubmit} onClose={closeModal} initialData={modalState.data} />}
                {modalState.type === 'commitment' && <CommitmentForm onSubmit={handleSubmit} onClose={closeModal} initialData={modalState.data} />}
                {modalState.type === 'receivable' && <ReceivableForm onSubmit={handleSubmit} onClose={closeModal} initialData={modalState.data} />}
            </Modal>
            <Modal isOpen={!!paymentModalState.item} onClose={() => setPaymentModalState({ item: null, type: null })} title={`Log Payment for ${paymentModalState.item?.name}`}>
                {paymentModalState.item && paymentModalState.type && (
                    <ItemPaymentForm 
                        onSubmit={handlePaymentSubmit} 
                        onClose={() => setPaymentModalState({ item: null, type: null })} 
                        accounts={accounts} 
                        itemType={paymentModalState.type}
                        isMortgage={paymentModalState.type === 'debt' && (paymentModalState.item as FormalDebt).assetType === 'home'}
                        mortgageDetails={paymentModalState.type === 'debt' && (paymentModalState.item as FormalDebt).assetType === 'home' ? paymentModalState.item as FormalDebt : undefined}
                    />
                )}
            </Modal>

            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                message={<>Are you sure you want to permanently delete <strong>"{itemToDelete?.name}"</strong> and all its payment history? This action cannot be undone.</>}
                confirmText="Delete"
            />
        </div>
    );
};

export default Debts;