
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { IncomeSource, IncomeRecord, Account } from '../types';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PieChartComponent from '../components/charts/PieChartComponent';
import { ChartColors } from '../constants';
import StatCard from '../components/StatCard';

// Form for Adding or Editing an Income Source
const IncomeSourceForm: React.FC<{
    onSubmit: (source: { name: string }) => void;
    onClose: () => void;
    initialData?: IncomeSource | null;
}> = ({ onSubmit, onClose, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Source Name (e.g., Salary)" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Source</button>
            </div>
        </form>
    );
};

// Form for batch logging income from multiple sources
const LogIncomeForm: React.FC<{
    onSubmit: (data: { records: { sourceId: string, amount: number }[], date: string }) => void;
    onClose: () => void;
    sources: IncomeSource[];
}> = ({ onSubmit, onClose, sources }) => {
    const [amounts, setAmounts] = useState<Record<string, string>>({});
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const records = Object.entries(amounts)
            .map(([sourceId, amountStr]) => ({ sourceId, amount: parseFloat(amountStr) || 0 }))
            .filter(r => r.amount > 0);
        
        if (records.length === 0) {
            alert("Please enter an amount for at least one source.");
            return;
        }
        onSubmit({ records, date });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {sources.map(s => (
                <div key={s.id} className="grid grid-cols-2 gap-4 items-center">
                    <label className="text-gray-300">{s.name}</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        value={amounts[s.id] || ''} 
                        onChange={(e) => setAmounts(prev => ({...prev, [s.id]: e.target.value}))} 
                        placeholder="0.00" 
                        className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" 
                    />
                </div>
            ))}
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700">Log Income</button>
            </div>
        </form>
    );
};

type FilterType = 'ytd' | 'all' | 'custom';

const Income: React.FC = () => {
    const { incomeSources, setIncomeSources, incomeRecords, setIncomeRecords } = useData();
    const [modal, setModal] = useState<'addSource' | 'editSource' | 'logIncome' | null>(null);
    const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{type: 'source' | 'record', data: any} | null>(null);
    const [itemToArchive, setItemToArchive] = useState<IncomeSource | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
    
    const [filterType, setFilterType] = useState<FilterType>('ytd');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    useEffect(() => {
        if (incomeRecords.length > 0) {
            const firstDate = incomeRecords.reduce((earliest, current) => 
                current.date < earliest ? current.date : earliest, 
                incomeRecords[0].date
            );
            setCustomStartDate(firstDate);
        } else {
            setCustomStartDate(new Date().toISOString().split('T')[0]);
        }
    }, [incomeRecords]);


    const activeSources = useMemo(() => incomeSources.filter(s => s.status === 'active'), [incomeSources]);
    const sourceMap = useMemo(() => new Map(incomeSources.map(s => [s.id, s.name])), [incomeSources]);

    const filteredRecords = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
    
        switch (filterType) {
            case 'ytd':
                const startOfYearStr = `${now.getFullYear()}-01-01`;
                return incomeRecords.filter(r => r.date >= startOfYearStr && r.date <= todayStr);
            case 'custom':
                if (!customStartDate || !customEndDate) return incomeRecords;
                return incomeRecords.filter(r => r.date >= customStartDate && r.date <= customEndDate);
            case 'all':
            default:
                return incomeRecords;
        }
    }, [incomeRecords, filterType, customStartDate, customEndDate]);

    const totalFilteredIncome = useMemo(() => {
        return filteredRecords.reduce((sum, record) => sum + record.amount, 0);
    }, [filteredRecords]);

    const filterLabel = useMemo(() => {
        switch(filterType) {
            case 'ytd': return 'Year to Date';
            case 'all': return 'All Time';
            case 'custom': return 'Custom Range';
            default: return '';
        }
    }, [filterType]);
    
    // Handlers for Income Sources
    const handleSourceSubmit = (sourceData: { name: string }) => {
        if (modal === 'editSource' && editingSource) {
            setIncomeSources(prev => prev.map(s => s.id === editingSource.id ? { ...s, ...sourceData } : s));
        } else {
            setIncomeSources(prev => [...prev, { ...sourceData, id: crypto.randomUUID(), status: 'active' }]);
        }
        setModal(null);
        setEditingSource(null);
    };

    const handleArchiveToggle = (source: IncomeSource) => {
        setIncomeSources(prev => prev.map(s => s.id === source.id ? { ...s, status: s.status === 'active' ? 'archived' : 'active' } : s));
        setItemToArchive(null);
    };

    const handleDeleteSource = () => {
        if (!itemToDelete || itemToDelete.type !== 'source') return;
        const sourceId = itemToDelete.data.id;
        setIncomeRecords(prev => prev.filter(r => r.sourceId !== sourceId));
        setIncomeSources(prev => prev.filter(s => s.id !== sourceId));
        setItemToDelete(null);
    };

    // Handlers for Income Records
    const handleLogIncomeSubmit = ({ records, date }: { records: { sourceId: string, amount: number }[], date: string }) => {
        const newRecords: IncomeRecord[] = records.map(r => ({
            id: crypto.randomUUID(),
            sourceId: r.sourceId,
            amount: r.amount,
            date: date
        }));

        if (newRecords.length > 0) {
            setIncomeRecords(prev => [...prev, ...newRecords]);
        }
        setModal(null);
    };

    const handleDeleteRecord = () => {
        if (!itemToDelete || itemToDelete.type !== 'record') return;
        setIncomeRecords(prev => prev.filter(r => r.id !== itemToDelete.data.id));
        setItemToDelete(null);
    };
    
    const groupedAndFilteredRecords = useMemo(() => {
        const records = [...filteredRecords]
            .filter(r => {
                const sourceName = sourceMap.get(r.sourceId) || '';
                return sourceName.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return records.reduce((acc, record) => {
            const date = record.date;
            if (!acc[date]) {
                acc[date] = { records: [], total: 0 };
            }
            acc[date].records.push(record);
            acc[date].total += record.amount;
            return acc;
        }, {} as Record<string, { records: IncomeRecord[], total: number }>);

    }, [filteredRecords, searchTerm, sourceMap]);

    const getStartOfWeek = (dateString: string): string => {
        const date = new Date(dateString);
        const day = date.getUTCDay();
        const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(date.setUTCDate(diff));
        return monday.toISOString().split('T')[0];
    };
    
    const incomeOverTimeData = useMemo(() => {
        const data: {[week:string]: any} = {};
        [...filteredRecords].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(rec => {
            const weekStart = getStartOfWeek(rec.date);
            if (!data[weekStart]) {
                data[weekStart] = { name: weekStart, 'Total Income': 0 };
            }
            const sourceName = sourceMap.get(rec.sourceId) || 'Unknown';
            if (!data[weekStart][sourceName]) {
                data[weekStart][sourceName] = 0;
            }
            data[weekStart][sourceName] += rec.amount;
            data[weekStart]['Total Income'] += rec.amount;
        });
        return Object.values(data);
    }, [filteredRecords, sourceMap]);

     const incomeSourceDistributionData = useMemo(() => {
        const totalIncome = filteredRecords.reduce((sum, rec) => sum + rec.amount, 0);
        if (totalIncome === 0) return [];

        const sourceTotals: { [key: string]: number } = {};
        filteredRecords.forEach(rec => {
            const sourceName = sourceMap.get(rec.sourceId) || 'Unknown';
            sourceTotals[sourceName] = (sourceTotals[sourceName] || 0) + rec.amount;
        });

        return Object.entries(sourceTotals).map(([name, value]) => ({
            name: `${name} (${((value / totalIncome) * 100).toFixed(1)}%)`,
            value
        }));
    }, [filteredRecords, sourceMap]);
    
    const toggleDateExpansion = (date: string) => {
        setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
    };


    return (
        <div className="p-6">
            <Header title="Income Ledger">
                <div className="space-x-2">
                    <button onClick={() => setModal('addSource')} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">Manage Sources</button>
                    <button onClick={() => setModal('logIncome')} disabled={activeSources.length === 0} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-500">Log Income</button>
                </div>
            </Header>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard 
                    label={`Total Income (${filterLabel})`} 
                    value={`$${totalFilteredIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                    colorClass="text-green-500" 
                />
            </div>

             <div className="flex items-center space-x-2 mb-6 bg-gray-800 p-2 rounded-lg">
                <span className="text-sm font-medium text-gray-400 mr-2">Date Range:</span>
                <button onClick={() => setFilterType('ytd')} className={`px-3 py-1 text-sm rounded-md transition-colors ${filterType === 'ytd' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    Year to Date
                </button>
                <button onClick={() => setFilterType('all')} className={`px-3 py-1 text-sm rounded-md transition-colors ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    All Time
                </button>
                <button onClick={() => setFilterType('custom')} className={`px-3 py-1 text-sm rounded-md transition-colors ${filterType === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    Custom
                </button>
                {filterType === 'custom' && (
                    <div className="flex items-center space-x-2 pl-2 animate-fade-in-fast">
                        <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white text-sm" />
                        <span className="text-gray-400">to</span>
                        <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white text-sm" />
                    </div>
                )}
            </div>

            {incomeRecords.length > 0 && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Weekly Income by Source</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={incomeOverTimeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                                <XAxis dataKey="name" stroke="#a0aec0" tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} />
                                <YAxis stroke="#a0aec0" tickFormatter={(v) => `$${v/1000}k`} />
                                <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                                <Legend />
                                {activeSources.map((s, i) => (
                                    <Line key={s.id} type="monotone" dataKey={s.name} stroke={ChartColors[i % ChartColors.length]} strokeWidth={2} dot={false} />
                                ))}
                                <Line type="monotone" dataKey="Total Income" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Income Distribution</h3>
                        <PieChartComponent data={incomeSourceDistributionData} colors={ChartColors} />
                    </div>
                </div>
            )}
            
            <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Income History</h3>
                    <input type="text" placeholder="Search history..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-1/3 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" />
                </div>
                <div className="overflow-x-auto max-h-[50vh]">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700 text-gray-400 uppercase text-sm sticky top-0">
                            <tr>
                                <th className="p-3 w-1/4">Date</th>
                                <th className="p-3 w-1/2">Source / Daily Total</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-200">
                        {Object.keys(groupedAndFilteredRecords).length > 0 ? (
                            Object.entries(groupedAndFilteredRecords).map(([date, group]) => (
                                <React.Fragment key={date}>
                                    <tr className="border-b border-gray-700 bg-gray-700/50 hover:bg-gray-700/30 cursor-pointer" onClick={() => toggleDateExpansion(date)}>
                                        <td className="p-3 font-semibold whitespace-nowrap">
                                            <span className={`inline-block w-4 mr-2 transition-transform duration-200 ${expandedDates[date] ? 'rotate-90' : ''}`}>
                                                &#9654;
                                            </span>
                                            {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </td>
                                        <td className="p-3 font-semibold text-lg" colSpan={2}>
                                            Total: <span className="text-green-400">${group.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                        </td>
                                        <td className="p-3"></td>
                                    </tr>
                                    {expandedDates[date] && group.records.map(rec => (
                                        <tr key={rec.id} className="border-b border-gray-600 bg-gray-800 hover:bg-gray-700/50 animate-fade-in">
                                            <td className="p-3 pl-12 text-sm">{/* Intentionally empty for alignment */}</td>
                                            <td className="p-3">{sourceMap.get(rec.sourceId) || 'Unknown Source'}</td>
                                            <td className="p-3 font-semibold text-green-400">${rec.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={(e) => { e.stopPropagation(); setItemToDelete({type: 'record', data: rec}); }} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr><td colSpan={4} className="text-center p-8 text-gray-400">No income records found for the selected date range.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
                @keyframes fade-in-fast {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.3s ease-out forwards;
                }
            `}</style>

            <Modal isOpen={modal === 'addSource' || modal === 'editSource'} onClose={() => {setModal(null); setEditingSource(null)}} title={modal === 'editSource' ? 'Edit Income Source' : 'Manage Income Sources'}>
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-2">Add New Source</h4>
                    <IncomeSourceForm onSubmit={handleSourceSubmit} onClose={() => {setModal(null); setEditingSource(null)}} initialData={editingSource} />
                </div>
                 <h4 className="text-lg font-semibold text-white mb-2 border-t border-gray-700 pt-4">Existing Sources</h4>
                 <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {incomeSources.map(s => (
                        <div key={s.id} className="flex justify-between items-center bg-gray-700 p-2 rounded-md">
                            <span>{s.name} <span className={`text-xs ${s.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>({s.status})</span></span>
                            <div className="space-x-2">
                                <button onClick={() => handleArchiveToggle(s)} className="text-yellow-400 hover:text-yellow-300 text-sm">{s.status === 'active' ? 'Archive' : 'Activate'}</button>
                                <button onClick={() => setItemToDelete({type: 'source', data: s})} className="text-red-500 hover:text-red-400 text-sm">Delete</button>
                            </div>
                        </div>
                    ))}
                 </div>
            </Modal>
             <Modal isOpen={modal === 'logIncome'} onClose={() => setModal(null)} title="Log Income">
                <LogIncomeForm onSubmit={handleLogIncomeSubmit} onClose={() => setModal(null)} sources={activeSources} />
            </Modal>
            
            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={itemToDelete?.type === 'source' ? handleDeleteSource : handleDeleteRecord}
                title="Confirm Deletion"
                message={
                    itemToDelete?.type === 'source' 
                    ? <>Are you sure you want to delete the source <strong>"{itemToDelete.data.name}"</strong>? This will also remove all associated income records permanently. This action cannot be undone.</>
                    : <>Are you sure you want to delete this income record of <strong>${itemToDelete?.data.amount.toLocaleString()}</strong>? This action cannot be undone.</>
                }
                confirmText="Delete"
            />
        </div>
    );
};

export default Income;
