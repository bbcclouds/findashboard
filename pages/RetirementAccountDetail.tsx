
import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Holding, Contribution } from '../types';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import HoldingsTable from '../components/HoldingsTable';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PieChartComponent from '../components/charts/PieChartComponent';
import { ChartColors } from '../constants';

const HoldingForm: React.FC<{
    onSubmit: (holding: Omit<Holding, 'id' | 'accountId'>) => void;
    onClose: () => void;
    initialData?: Holding | null;
}> = ({ onSubmit, onClose, initialData }) => {
    const [symbol, setSymbol] = useState(initialData?.symbol || '');
    const [name, setName] = useState(initialData?.name || '');
    const initialQuantity = initialData?.quantity;
    const [quantity, setQuantity] = useState<string>(initialQuantity ? initialQuantity.toString() : '');
    const initialPrice = initialData?.price;
    const [price, setPrice] = useState<string>(initialPrice ? initialPrice.toString() : '');
    const initialAverageCost = initialData && initialData.quantity > 0 ? initialData.costBasis / initialData.quantity : 0;
    const [averageCost, setAverageCost] = useState<string>(initialAverageCost ? initialAverageCost.toString() : '');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numQuantity = parseFloat(quantity) || 0;
        const numAverageCost = parseFloat(averageCost) || 0;
        const costBasis = numAverageCost * numQuantity;
        onSubmit({ symbol, name, quantity: numQuantity, price: parseFloat(price) || 0, costBasis });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">Symbol/Ticker</label>
                <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Quantity / Units</label>
                <input type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="0" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Current Price</label>
                <input type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="0.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Average Cost Per Unit</label>
                <input type="number" step="any" value={averageCost} onChange={(e) => setAverageCost(e.target.value)} required placeholder="0.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Holding</button>
            </div>
        </form>
    );
};

const ContributionForm: React.FC<{
    onSubmit: (contribution: Omit<Contribution, 'id' | 'accountId'>) => void;
    onClose: () => void;
    initialData?: Contribution | null;
}> = ({ onSubmit, onClose, initialData }) => {
    const initialAmount = initialData?.amount;
    const [amount, setAmount] = useState<string>(initialAmount ? initialAmount.toString() : '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ amount: parseFloat(amount) || 0, date });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">Contribution Amount</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Contribution Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Contribution</button>
            </div>
        </form>
    );
};

const RetirementAccountDetail: React.FC = () => {
    const { accountId } = useParams<{ accountId: string }>();
    const { retirementAccounts, retirementHoldings, setRetirementHoldings, retirementContributions, setRetirementContributions } = useData();
    const [isHoldingModalOpen, setIsHoldingModalOpen] = useState(false);
    const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
    const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
    const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{type: 'holding' | 'contribution', data: any} | null>(null);
    const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});

    const account = useMemo(() => retirementAccounts.find(acc => acc.id === accountId), [retirementAccounts, accountId]);
    const holdings = useMemo(() => retirementHoldings.filter(h => h.accountId === accountId), [retirementHoldings, accountId]);
    const contributions = useMemo(() => retirementContributions.filter(c => c.accountId === accountId), [retirementContributions, accountId]);

    const portfolioStats = useMemo(() => {
        const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.price, 0);
        const totalCostBasis = holdings.reduce((sum, h) => sum + h.costBasis, 0);
        const totalGainLoss = totalValue - totalCostBasis;
        return { totalValue, totalCostBasis, totalGainLoss };
    }, [holdings]);

    const chartData = useMemo(() => {
        if (holdings.length === 0 && contributions.length === 0) return [];
        
        const { totalValue } = portfolioStats;
        const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);

        const dates = new Set<string>();
        contributions.forEach(c => dates.add(c.date));
        
        const steps = 6;
        for (let i = 0; i <= steps; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - (steps - i));
            dates.add(date.toISOString().split('T')[0]);
        }
        dates.add(new Date().toISOString().split('T')[0]);

        const sortedDates = Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const sortedContributions = [...contributions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let cumulativeContribution = 0;
        const finalData = sortedDates.map((dateStr, index) => {
            while(sortedContributions.length > 0 && new Date(sortedContributions[0].date) <= new Date(dateStr)) {
                cumulativeContribution += sortedContributions.shift()!.amount;
            }

            const timeRatio = index / (sortedDates.length - 1 || 1);
            const portfolioValue = totalContributions + (totalValue - totalContributions) * timeRatio;

            return {
                name: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                date: dateStr,
                'Portfolio Value': portfolioValue > 0 ? portfolioValue: 0,
                'Total Contributions': cumulativeContribution,
            };
        });
        
        return finalData;
    }, [holdings, contributions, portfolioStats]);

    const allocationData = useMemo(() => {
        return holdings.map(h => ({ name: h.symbol, value: h.quantity * h.price }));
    }, [holdings]);
    
    const handleAddHolding = (data: Omit<Holding, 'id' | 'accountId'>) => {
        if (!accountId) return;
        setRetirementHoldings(prev => [...prev, { ...data, id: crypto.randomUUID(), accountId }]);
    };
    const handleEditHolding = (data: Omit<Holding, 'id' | 'accountId'>) => {
        if (!editingHolding) return;
        setRetirementHoldings(prev => prev.map(h => h.id === editingHolding.id ? { ...h, ...data } : h));
    };
    const confirmDeleteHolding = () => {
        if (!itemToDelete || itemToDelete.type !== 'holding') return;
        setRetirementHoldings(prev => prev.filter(h => h.id !== itemToDelete.data.id));
        setItemToDelete(null);
    };

    const handleAddContribution = (data: Omit<Contribution, 'id' | 'accountId'>) => {
        if (!accountId) return;
        setRetirementContributions(prev => [...prev, { ...data, id: crypto.randomUUID(), accountId }]);
    };
    const handleEditContribution = (data: Omit<Contribution, 'id' | 'accountId'>) => {
        if (!editingContribution) return;
        setRetirementContributions(prev => prev.map(c => c.id === editingContribution.id ? { ...c, ...data } : c));
    };
    const confirmDeleteContribution = () => {
        if (!itemToDelete || itemToDelete.type !== 'contribution') return;
        setRetirementContributions(prev => prev.filter(c => c.id !== itemToDelete.data.id));
        setItemToDelete(null);
    };
    
    const openHoldingModal = (holding: Holding | null) => {
        setEditingHolding(holding);
        setIsHoldingModalOpen(true);
    };
    const openContributionModal = (contribution: Contribution | null) => {
        setEditingContribution(contribution);
        setIsContributionModalOpen(true);
    };

    const groupedContributions = useMemo(() => {
        const sorted = [...contributions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sorted.reduce((acc, contribution) => {
            const year = new Date(contribution.date).getFullYear();
            if (!acc[year]) {
                acc[year] = { contributions: [], total: 0 };
            }
            acc[year].contributions.push(contribution);
            acc[year].total += contribution.amount;
            return acc;
        }, {} as Record<string, { contributions: Contribution[], total: number }>);
    }, [contributions]);

    const toggleYearExpansion = (year: string) => {
        setExpandedYears(prev => ({...prev, [year]: !prev[year]}));
    };

    if (!account) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-2xl font-bold text-white">Retirement account not found</h2>
                <Link to="/retirement" className="text-blue-400 hover:underline mt-4 inline-block">Go back to Retirement Accounts</Link>
            </div>
        );
    }

    return (
        <div className="p-6">
            <Header title={account.name}>
                <div className="space-x-2">
                    <button onClick={() => openContributionModal(null)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Add Contribution</button>
                    <button onClick={() => openHoldingModal(null)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add Holding</button>
                </div>
            </Header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Total Value" value={`$${portfolioStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-green-500" />
                <StatCard label="Total Gain/Loss" value={`$${portfolioStats.totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass={portfolioStats.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'} />
                <StatCard label="Total Cost Basis" value={`$${portfolioStats.totalCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-gray-400" />
            </div>

            {holdings.length > 0 || contributions.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Portfolio Growth</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                                    <XAxis dataKey="name" stroke="#a0aec0" />
                                    <YAxis stroke="#a0aec0" tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none', color: '#e2e8f0' }} formatter={(value: number) => `$${value.toLocaleString()}`} />
                                    <Legend />
                                    <Area type="monotone" dataKey="Portfolio Value" stroke="#a78bfa" fillOpacity={1} fill="url(#colorValue)" />
                                    <Line type="monotone" dataKey="Total Contributions" stroke="#facc15" strokeWidth={2} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Asset Allocation</h3>
                            <PieChartComponent data={allocationData} colors={ChartColors} />
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg mb-8">
                        <h3 className="text-lg font-semibold mb-4">Holdings</h3>
                        <HoldingsTable 
                            holdings={holdings} 
                            totalPortfolioValue={portfolioStats.totalValue}
                            onEdit={(h) => openHoldingModal(h)} 
                            onDelete={(id) => setItemToDelete({type: 'holding', data: holdings.find(h => h.id === id)!})} />
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-xl font-bold text-white mb-4">Contributions History</h3>
                         <div className="overflow-x-auto max-h-[50vh]">
                            <table className="w-full text-left">
                                <thead className="bg-gray-700 text-gray-400 uppercase text-sm sticky top-0">
                                    <tr>
                                        <th className="p-3 w-1/2">Year / Date</th>
                                        <th className="p-3">Amount</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-200">
                                {Object.keys(groupedContributions).length > 0 ? (
                                    Object.entries(groupedContributions).map(([year, group]) => (
                                        <React.Fragment key={year}>
                                            <tr className="border-b border-gray-700 bg-gray-700/50 hover:bg-gray-700/30 cursor-pointer" onClick={() => toggleYearExpansion(year)}>
                                                <td className="p-3 font-semibold whitespace-nowrap">
                                                    <span className={`inline-block w-4 mr-2 transition-transform duration-200 ${expandedYears[year] ? 'rotate-90' : ''}`}>&#9654;</span>
                                                    {year}
                                                </td>
                                                <td className="p-3 font-semibold text-lg" colSpan={2}>
                                                    Total: <span className="text-green-400">${group.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                                </td>
                                            </tr>
                                            {expandedYears[year] && group.contributions.map(c => (
                                                <tr key={c.id} className="border-b border-gray-600 bg-gray-800 hover:bg-gray-700/50">
                                                    <td className="p-3 pl-12 text-sm">{new Date(c.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</td>
                                                    <td className="p-3 font-semibold text-green-400">${c.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                    <td className="p-3">
                                                        <button onClick={() => openContributionModal(c)} className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm mr-2 hover:bg-yellow-600">Edit</button>
                                                        <button onClick={() => setItemToDelete({type: 'contribution', data: c})} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <tr><td colSpan={3} className="text-center p-8 text-gray-400">No contributions logged yet.</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-gray-800 p-8 rounded-lg text-center">
                    <p className="text-gray-400">No holdings or contributions for this account yet. Click "Add Holding" or "Add Contribution" to get started.</p>
                </div>
            )}
            
            <Modal isOpen={isHoldingModalOpen} onClose={() => setIsHoldingModalOpen(false)} title={editingHolding ? "Edit Retirement Holding" : "Add Retirement Holding"}>
                <HoldingForm onSubmit={editingHolding ? handleEditHolding : handleAddHolding} onClose={() => setIsHoldingModalOpen(false)} initialData={editingHolding} />
            </Modal>

            <Modal isOpen={isContributionModalOpen} onClose={() => setIsContributionModalOpen(false)} title={editingContribution ? "Edit Contribution" : "Add Contribution"}>
                <ContributionForm onSubmit={editingContribution ? handleEditContribution : handleAddContribution} onClose={() => setIsContributionModalOpen(false)} initialData={editingContribution} />
            </Modal>
            
            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={itemToDelete?.type === 'holding' ? confirmDeleteHolding : confirmDeleteContribution}
                title="Confirm Deletion"
                message={
                    itemToDelete?.type === 'holding'
                    ? <>Are you sure you want to delete your holding in <strong>{itemToDelete.data?.name} ({itemToDelete.data?.symbol})</strong>?</>
                    : <>Are you sure you want to delete this contribution of <strong>${itemToDelete?.data.amount.toLocaleString()}</strong>?</>
                }
                confirmText="Delete"
            />
        </div>
    );
};

export default RetirementAccountDetail;