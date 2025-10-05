import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import type { Home, HomeImprovement, FormalDebt, PaymentRecord } from '../types';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import StatCard from '../components/StatCard';
import BarChartComponent from '../components/charts/BarChartComponent';
import PieChartComponent from '../components/charts/PieChartComponent';
import { ChartColors } from '../constants';

const calculateMonthlyPI = (principal: number, annualRate: number, termYears: number): number => {
    if (principal <= 0 || annualRate < 0 || termYears <= 0) return 0;
    if (annualRate === 0) return principal / (termYears * 12);

    const monthlyRate = (annualRate / 100) / 12;
    const numberOfPayments = termYears * 12;
    
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments);
    const denominator = Math.pow(1 + monthlyRate, numberOfPayments) - 1;
    
    if (denominator === 0) return 0;

    return principal * (numerator / denominator);
};


const HomeForm: React.FC<{
    onSubmit: (home: Omit<Home, 'id' | 'linkedDebtId'>) => void;
    onClose: () => void;
    initialData?: Home | null;
}> = ({ onSubmit, onClose, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [purchasePrice, setPurchasePrice] = useState<string>(initialData ? initialData.purchasePrice.toString() : '');
    const [purchaseDate, setPurchaseDate] = useState(initialData?.purchaseDate || new Date().toISOString().split('T')[0]);
    const [currentValue, setCurrentValue] = useState<string>(initialData ? initialData.currentValue.toString() : '');
    const [downPayment, setDownPayment] = useState<string>(initialData ? initialData.downPayment.toString() : '');
    const [closingCosts, setClosingCosts] = useState<string>(initialData ? initialData.closingCosts.toString() : '');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            purchasePrice: parseFloat(purchasePrice) || 0,
            purchaseDate,
            currentValue: parseFloat(currentValue) || 0,
            downPayment: parseFloat(downPayment) || 0,
            closingCosts: parseFloat(closingCosts) || 0,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Property Name (e.g., Primary Residence)" className="w-full bg-gray-700 rounded p-2" />
            <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} required placeholder="Purchase Price" className="w-full bg-gray-700 rounded p-2" />
                <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required className="w-full bg-gray-700 rounded p-2" />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" value={downPayment} onChange={e => setDownPayment(e.target.value)} placeholder="Down Payment" className="w-full bg-gray-700 rounded p-2" />
                <input type="number" step="0.01" value={closingCosts} onChange={e => setClosingCosts(e.target.value)} placeholder="Closing Costs" className="w-full bg-gray-700 rounded p-2" />
            </div>
            <input type="number" step="0.01" value={currentValue} onChange={e => setCurrentValue(e.target.value)} required placeholder="Current Market Value" className="w-full bg-gray-700 rounded p-2" />
             <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Home</button>
            </div>
        </form>
    );
};

const MortgageForm: React.FC<{
    onSubmit: (debt: Partial<Omit<FormalDebt, 'id' | 'status' | 'creationDate' | 'assetType' | 'linkedAssetId'>>) => void;
    onClose: () => void;
    initialData?: FormalDebt | null;
    home: Home;
}> = ({ onSubmit, onClose, initialData, home }) => {
    const [name] = useState('Mortgage');
    const [description, setDescription] = useState(initialData?.description || '');
    
    const calculatedLoanAmount = home.purchasePrice - home.downPayment;
    const initialTotalAmount = initialData?.totalAmount ?? (calculatedLoanAmount > 0 ? calculatedLoanAmount : '');
    const [totalAmount, setTotalAmount] = useState(String(initialTotalAmount));
    
    const [interestRate, setInterestRate] = useState(initialData?.interestRate ? String(initialData.interestRate) : '');
    const [loanOriginationDate, setLoanOriginationDate] = useState(initialData?.loanOriginationDate || home.purchaseDate);
    const [loanTermYears, setLoanTermYears] = useState(initialData?.loanTermYears ? String(initialData.loanTermYears) : '');
    const [monthlyTax, setMonthlyTax] = useState(initialData?.monthlyTax ? String(initialData.monthlyTax) : '');
    const [monthlyInsurance, setMonthlyInsurance] = useState(initialData?.monthlyInsurance ? String(initialData.monthlyInsurance) : '');
    const [monthlyPMI, setMonthlyPMI] = useState(initialData?.monthlyPMI ? String(initialData.monthlyPMI) : '');

    useEffect(() => {
        if (!initialData) {
            const newCalculatedAmount = home.purchasePrice - home.downPayment;
            if (newCalculatedAmount > 0) {
                setTotalAmount(String(newCalculatedAmount));
            }
        }
    }, [home.purchasePrice, home.downPayment, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const principal = parseFloat(totalAmount) || 0;
        const rate = parseFloat(interestRate) || 0;
        const term = parseFloat(loanTermYears) || 0;
        
        const calculatedPI = calculateMonthlyPI(principal, rate, term);

        onSubmit({ 
            name, 
            description, 
            totalAmount: principal, 
            interestRate: rate,
            monthlyPayment: calculatedPI,
            loanOriginationDate,
            loanTermYears: term || undefined,
            monthlyTax: parseFloat(monthlyTax) || undefined,
            monthlyInsurance: parseFloat(monthlyInsurance) || undefined,
            monthlyPMI: parseFloat(monthlyPMI) || undefined,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Lender or Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="e.g., Bank of America" className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Original Loan Amount</label>
                <input type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required placeholder="0.00" className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
                 <p className="text-xs text-gray-400 mt-1">Calculated as Purchase Price - Down Payment. Adjust if needed.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Interest Rate (%)</label>
                    <input type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} required placeholder="0.00" className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Loan Term (Years)</label>
                    <input type="number" step="1" value={loanTermYears} onChange={(e) => setLoanTermYears(e.target.value)} placeholder="e.g., 30" required className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Loan Origination Date</label>
                <input type="date" value={loanOriginationDate} onChange={(e) => setLoanOriginationDate(e.target.value)} required className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
             <div className="border-t border-gray-700 pt-4 space-y-3">
                <p className="text-sm text-gray-400">Enter your other monthly housing costs (optional).</p>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Property Tax</label>
                    <input type="number" step="0.01" value={monthlyTax} onChange={e => setMonthlyTax(e.target.value)} placeholder="250.00" className="block w-full bg-gray-700 rounded p-2"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Homeowners Insurance</label>
                    <input type="number" step="0.01" value={monthlyInsurance} onChange={e => setMonthlyInsurance(e.target.value)} placeholder="100.00" className="block w-full bg-gray-700 rounded p-2"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Monthly PMI / Other Fees</label>
                    <input type="number" step="0.01" value={monthlyPMI} onChange={e => setMonthlyPMI(e.target.value)} placeholder="75.00" className="block w-full bg-gray-700 rounded p-2"/>
                    <p className="text-xs text-gray-400 mt-1">Set to 0 when no longer applicable.</p>
                </div>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Mortgage</button>
            </div>
        </form>
    );
};

const HomeImprovementForm: React.FC<{
    onSubmit: (improvement: Omit<HomeImprovement, 'id' | 'homeId'>) => void;
    onClose: () => void;
    initialData?: HomeImprovement | null;
}> = ({ onSubmit, onClose, initialData }) => {
    const [description, setDescription] = useState(initialData?.description || '');
    const [cost, setCost] = useState<string>(initialData ? initialData.cost.toString() : '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ description, cost: parseFloat(cost) || 0, date });
        onClose();
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Improvement (e.g., Kitchen Reno)" className="w-full bg-gray-700 rounded p-2" />
            <input type="number" value={cost} onChange={e => setCost(e.target.value)} required placeholder="Cost" className="w-full bg-gray-700 rounded p-2" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-gray-700 rounded p-2" />
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save</button>
            </div>
        </form>
    );
};

const Home: React.FC = () => {
    const { homes, setHomes, homeImprovements, setHomeImprovements, formalDebts, setFormalDebts, paymentRecords, setPaymentRecords } = useData();
    const [homeModal, setHomeModal] = useState<{ isOpen: boolean, data: Home | null }>({ isOpen: false, data: null });
    const [mortgageModal, setMortgageModal] = useState<{isOpen: boolean, home: Home | null, data: FormalDebt | null}>({isOpen: false, home: null, data: null});
    const [improvementModal, setImprovementModal] = useState<{ isOpen: boolean, data: HomeImprovement | null, homeId: string | null }>({ isOpen: false, data: null, homeId: null });
    const [itemToDelete, setItemToDelete] = useState<{ type: 'home' | 'improvement' | 'mortgage', data: any, homeId?: string } | null>(null);

    const handleHomeSubmit = (data: Omit<Home, 'id' | 'linkedDebtId'>) => {
        if (homeModal.data) {
            setHomes(homes.map(h => h.id === homeModal.data!.id ? { ...h, ...data } : h));
        } else {
            setHomes([...homes, { ...data, id: crypto.randomUUID(), downPayment: data.downPayment || 0, closingCosts: data.closingCosts || 0 }]);
        }
        setHomeModal({ isOpen: false, data: null });
    };
    
    const handleMortgageSubmit = (data: Partial<Omit<FormalDebt, 'id' | 'status' | 'creationDate' | 'assetType' | 'linkedAssetId'>>) => {
        const { home } = mortgageModal;
        if (!home) return;

        if (mortgageModal.data) { // Editing existing mortgage
            setFormalDebts(formalDebts.map(d => d.id === mortgageModal.data!.id ? { ...d, ...data } : d));
        } else { // Adding new mortgage
            const newMortgage: FormalDebt = {
                ...data,
                id: crypto.randomUUID(),
                status: 'active',
                creationDate: new Date().toISOString().split('T')[0],
                assetType: 'home',
                linkedAssetId: home.id,
            } as FormalDebt;
            setFormalDebts(prev => [...prev, newMortgage]);
            setHomes(prev => prev.map(h => h.id === home.id ? {...h, linkedDebtId: newMortgage.id} : h));
        }
        setMortgageModal({ isOpen: false, data: null, home: null });
    };

    const handleImprovementSubmit = (data: Omit<HomeImprovement, 'id' | 'homeId'>) => {
        const { homeId } = improvementModal;
        if (!homeId) return;

        if (improvementModal.data) {
            setHomeImprovements(homeImprovements.map(i => i.id === improvementModal.data!.id ? { ...i, ...data } : i));
        } else {
            setHomeImprovements([...homeImprovements, { ...data, id: crypto.randomUUID(), homeId }]);
        }
        setImprovementModal({ isOpen: false, data: null, homeId: null });
    };
    
    const confirmDelete = () => {
        if (!itemToDelete) return;
        const { type, data, homeId } = itemToDelete;

        if (type === 'home') {
            setHomes(homes.filter(h => h.id !== data.id));
            setHomeImprovements(homeImprovements.filter(i => i.homeId !== data.id));
            if (data.linkedDebtId) { // Also delete linked mortgage
                setFormalDebts(formalDebts.filter(d => d.id !== data.linkedDebtId));
                setPaymentRecords(paymentRecords.filter(p => p.itemId !== data.linkedDebtId));
            }
        } else if (type === 'improvement') {
            setHomeImprovements(homeImprovements.filter(i => i.id !== data.id));
        } else if (type === 'mortgage' && homeId) {
             setHomes(homes.map(h => h.id === homeId ? {...h, linkedDebtId: undefined} : h));
             setFormalDebts(formalDebts.filter(d => d.id !== data.id));
             setPaymentRecords(paymentRecords.filter(p => p.itemId !== data.id));
        }
        setItemToDelete(null);
    };

    return (
        <div className="p-6">
            <Header title="Home Equity & Investments">
                <button onClick={() => setHomeModal({isOpen: true, data: null})} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add Home</button>
            </Header>

            {homes.length === 0 ? (
                <div className="bg-gray-800 p-8 rounded-lg text-center mt-8">
                    <p className="text-gray-400">No homes added yet. Click "Add Home" to track your real estate assets.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {homes.map(home => {
                        const linkedDebt = formalDebts.find(d => d.id === home.linkedDebtId);
                        const mortgagePayments = paymentRecords.filter(p => p.itemId === home.linkedDebtId);
                        
                        const totalPrincipalPaid = mortgagePayments.reduce((sum, p) => sum + (p.breakdown?.principal || 0), 0);
                        const totalInterestPaid = mortgagePayments.reduce((sum, p) => sum + (p.breakdown?.interest || 0), 0);
                        
                        let totalTaxesPaid = 0;
                        let totalPmiPaid = 0;

                        if (linkedDebt) {
                            const monthlyTax = linkedDebt.monthlyTax || 0;
                            const monthlyInsurance = linkedDebt.monthlyInsurance || 0;
                            const monthlyPmi = linkedDebt.monthlyPMI || 0;
                            const totalMonthlyEscrow = monthlyTax + monthlyInsurance + monthlyPmi;

                            if (totalMonthlyEscrow > 0) {
                                mortgagePayments.forEach(p => {
                                    const escrowPaid = p.breakdown?.escrow || 0;
                                    if (escrowPaid > 0) {
                                       totalTaxesPaid += escrowPaid * (monthlyTax / totalMonthlyEscrow);
                                       totalPmiPaid += escrowPaid * (monthlyPmi / totalMonthlyEscrow);
                                    }
                                });
                            }
                        }
                        
                        const currentImprovements = homeImprovements.filter(i => i.homeId === home.id);
                        const totalImprovementCost = currentImprovements.reduce((sum, imp) => sum + imp.cost, 0);
                        
                        const costBreakdownData = [
                            { name: 'Closing Costs', value: home.closingCosts || 0 },
                            { name: 'Principal', value: totalPrincipalPaid },
                            { name: 'Interest', value: totalInterestPaid },
                            { name: 'Taxes', value: totalTaxesPaid },
                            { name: 'PMI', value: totalPmiPaid },
                            { name: 'Improvements', value: totalImprovementCost },
                        ].filter(d => d.value > 0);

                        const mortgageBalance = linkedDebt ? linkedDebt.totalAmount - totalPrincipalPaid : 0;
                        const equity = home.currentValue - mortgageBalance;

                        const netEquityOnSale = equity - (home.closingCosts || 0) - totalImprovementCost;

                        const costBasis = home.purchasePrice + (home.closingCosts || 0) + totalImprovementCost;
                        const appreciation = home.currentValue - home.purchasePrice;

                        const totalMonthlyHousingCost = (linkedDebt?.monthlyPayment || 0) + (linkedDebt?.monthlyTax || 0) + (linkedDebt?.monthlyInsurance || 0) + (linkedDebt?.monthlyPMI || 0);

                        const projectedTotalInterest = linkedDebt && linkedDebt.monthlyPayment && linkedDebt.loanTermYears ? (linkedDebt.monthlyPayment * linkedDebt.loanTermYears * 12) - linkedDebt.totalAmount : 0;
                        const projectedTotalLoanCost = linkedDebt ? linkedDebt.totalAmount + projectedTotalInterest : 0;
                        
                        const equityBreakdownData = [
                            { name: 'Equity', value: equity },
                            { name: 'Mortgage', value: mortgageBalance },
                        ].filter(d => d.value > 0);


                        return (
                            <div key={home.id} className="bg-gray-800 p-6 rounded-lg">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-2xl font-bold text-white">{home.name}</h2>
                                    <div className="flex-shrink-0 flex space-x-2">
                                        <button onClick={() => setImprovementModal({isOpen: true, data: null, homeId: home.id})} className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700">Add Investment</button>
                                        <button onClick={() => setHomeModal({isOpen: true, data: home})} className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600">Edit Home</button>
                                        <button onClick={() => setItemToDelete({type: 'home', data: home})} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete Home</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                                    <StatCard 
                                        label="Current Value" 
                                        value={`$${home.currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                                        colorClass="text-green-500"
                                        tooltip="The current estimated market value of your home."
                                    />
                                    <StatCard 
                                        label="Total Equity" 
                                        value={`$${equity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                                        colorClass={equity >= 0 ? 'text-blue-400' : 'text-red-400'}
                                        tooltip="Current Value - Mortgage Balance"
                                    />
                                    <StatCard 
                                        label="Net Equity on Sale" 
                                        value={`$${netEquityOnSale.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                                        colorClass={netEquityOnSale >= 0 ? 'text-blue-400' : 'text-red-400'}
                                        tooltip="Total Equity - (Closing Costs + Total Improvement Costs). Represents estimated profit upon sale."
                                    />
                                    <StatCard 
                                        label="Mortgage Balance" 
                                        value={`$${mortgageBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                                        colorClass="text-red-500"
                                        tooltip="The remaining principal on your mortgage loan."
                                    />
                                    <StatCard 
                                        label="Appreciation" 
                                        value={`$${appreciation.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                                        colorClass={appreciation >= 0 ? 'text-green-500' : 'text-yellow-400'}
                                        tooltip="Current Value - Purchase Price"
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-gray-900/50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4 text-white">Loan & Investment Insights</h3>
                                        <div className="space-y-4 text-sm">
                                            <div className="flex justify-between items-center"><span className="text-gray-400">Down Payment</span><span className="font-semibold text-white">${(home.downPayment || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-gray-400">Closing Costs</span><span className="font-semibold text-white">${(home.closingCosts || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-gray-400">Total Improvement Costs</span><span className="font-semibold text-white">${totalImprovementCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                                            <div className="flex justify-between items-center border-t border-gray-700 pt-3"><span className="text-gray-400">Total Cost Basis</span><span className="font-semibold text-white">${costBasis.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                                            <div className="text-xs text-gray-500 pl-4 -mt-3">(Purchase Price + Closing + Improvements)</div>
                                            
                                            {linkedDebt ? (
                                                <>
                                                    <div className="space-y-2 border-t border-gray-700 pt-3 mt-3">
                                                        <div className="flex justify-between items-center"><span className="text-gray-400">Monthly Payment (P&amp;I)</span><span className="font-semibold text-blue-300">${(linkedDebt.monthlyPayment || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                                                        {linkedDebt.monthlyTax && (<div className="flex justify-between items-center"><span className="text-gray-400">Property Tax</span><span className="font-semibold text-white">${(linkedDebt.monthlyTax).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>)}
                                                        {linkedDebt.monthlyInsurance && (<div className="flex justify-between items-center"><span className="text-gray-400">Homeowners Insurance</span><span className="font-semibold text-white">${(linkedDebt.monthlyInsurance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>)}
                                                        {linkedDebt.monthlyPMI && (<div className="flex justify-between items-center"><span className="text-gray-400">PMI / Other Fees</span><span className="font-semibold text-white">${(linkedDebt.monthlyPMI).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>)}
                                                        <div className="flex justify-between items-center border-t border-gray-600 pt-2 mt-2"><span className="text-gray-300 font-bold">Total Est. Monthly Housing Cost</span><span className="font-bold text-lg text-white">${totalMonthlyHousingCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                                                    </div>
                                                    <div className="space-y-2 border-t border-gray-700 pt-3 mt-3">
                                                        <div className="flex justify-between items-center"><span className="text-gray-400">Projected Total Interest</span><span className="font-semibold text-yellow-400">${projectedTotalInterest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                                                        <div className="flex justify-between items-center"><span className="text-gray-400">Projected Total Loan Cost</span><span className="font-semibold text-red-400">${projectedTotalLoanCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                                                        <div className="text-xs text-gray-500 pl-4 -mt-3">(Principal + Interest)</div>
                                                    </div>
                                                    <div className="flex justify-end space-x-2 pt-2"><button onClick={() => setMortgageModal({isOpen: true, data: linkedDebt, home: home})} className="text-xs text-yellow-400 hover:text-yellow-300">Edit</button><button onClick={() => setItemToDelete({type: 'mortgage', data: linkedDebt, homeId: home.id})} className="text-xs text-red-500 hover:text-red-400">Delete</button></div>
                                                </>
                                            ) : (
                                                <button onClick={() => setMortgageModal({isOpen: true, data: null, home: home})} className="w-full mt-4 bg-blue-600/50 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600">Add Mortgage</button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-gray-900/50 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-2 text-white">Equity Breakdown</h3>
                                            {equityBreakdownData.length > 0 ? (
                                                <PieChartComponent data={equityBreakdownData} colors={[ChartColors[0], ChartColors[2]]} />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400">No mortgage data to calculate equity.</div>
                                            )}
                                        </div>
                                        <div className="bg-gray-900/50 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-2 text-white">Total Costs Breakdown</h3>
                                            {costBreakdownData.length > 0 ? (
                                                <BarChartComponent data={costBreakdownData} colors={ChartColors} />
                                            ) : (
                                                <div className="flex items-center justify-center h-[300px] text-gray-400">Add a down payment, closing costs, or a mortgage to see a breakdown.</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2 bg-gray-900/50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-2 text-white">Investments & Improvements</h3>
                                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                            {currentImprovements.length > 0 ? currentImprovements.map(imp => (
                                                <div key={imp.id} className="flex justify-between items-center bg-gray-700 p-2 rounded-md">
                                                    <div>
                                                        <p className="font-semibold">{imp.description}</p>
                                                        <p className="text-xs text-gray-400">{new Date(imp.date).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-green-400">${imp.cost.toLocaleString()}</p>
                                                        <div>
                                                            <button onClick={() => setImprovementModal({isOpen: true, data: imp, homeId: home.id})} className="text-xs text-yellow-400 hover:text-yellow-300 mr-2">Edit</button>
                                                            <button onClick={() => setItemToDelete({type: 'improvement', data: imp})} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : <p className="text-gray-400 text-center pt-8">No improvements logged.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            <Modal isOpen={homeModal.isOpen} onClose={() => setHomeModal({isOpen: false, data: null})} title={homeModal.data ? "Edit Home" : "Add Home"}>
                <HomeForm onSubmit={handleHomeSubmit} onClose={() => setHomeModal({isOpen: false, data: null})} initialData={homeModal.data} />
            </Modal>
            {mortgageModal.home && (
                <Modal isOpen={mortgageModal.isOpen} onClose={() => setMortgageModal({isOpen: false, data: null, home: null})} title={mortgageModal.data ? "Edit Mortgage" : "Add Mortgage"}>
                    <MortgageForm onSubmit={handleMortgageSubmit} onClose={() => setMortgageModal({isOpen: false, data: null, home: null})} initialData={mortgageModal.data} home={mortgageModal.home} />
                </Modal>
            )}
             <Modal isOpen={improvementModal.isOpen} onClose={() => setImprovementModal({isOpen: false, data: null, homeId: null})} title={improvementModal.data ? "Edit Investment" : "Add Investment"}>
                <HomeImprovementForm onSubmit={handleImprovementSubmit} onClose={() => setImprovementModal({isOpen: false, data: null, homeId: null})} initialData={improvementModal.data} />
            </Modal>
            <ConfirmationModal 
                isOpen={!!itemToDelete} 
                onClose={() => setItemToDelete(null)} 
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                message={<>Are you sure you want to delete <strong>{itemToDelete?.data.name || itemToDelete?.data.description}</strong>? This action will remove all associated data and cannot be undone.</>}
                confirmText="Delete"
            />
        </div>
    );
};

export default Home;
