import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Allocation } from '../types';
import Header from '../components/Header';
import Modal from '../components/Modal';

const AllocationForm: React.FC<{
    onSubmit: (alloc: Omit<Allocation, 'id'>) => void;
    onClose: () => void;
    initialData?: Allocation | null;
    tier: 1 | 2;
}> = ({ onSubmit, onClose, initialData, tier }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState<'fixed' | 'percentage'>(initialData?.type || (tier === 1 ? 'fixed' : 'percentage'));
    const initialValue = initialData?.value;
    const [value, setValue] = useState<string>(initialValue ? initialValue.toString() : '');
    const [notes, setNotes] = useState(initialData?.notes || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, tier, type, value: parseFloat(value) || 0, notes });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">Allocation Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Rent, Savings" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            
            {tier === 1 && (
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value as 'fixed' | 'percentage')} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white">
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                    </select>
                </div>
            )}
            
            <div>
                <label className="block text-sm font-medium text-gray-300">{type === 'fixed' ? 'Amount ($)' : 'Percentage (%)'}</label>
                <input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required placeholder="0.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300">Notes (Optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>

            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save</button>
            </div>
        </form>
    );
};

const Calculator: React.FC = () => {
    const { allocations, setAllocations } = useData();
    const [income, setIncome] = useState('');
    const [modalState, setModalState] = useState<{ isOpen: boolean, tier: 1 | 2, editingAlloc: Allocation | null }>({ isOpen: false, tier: 1, editingAlloc: null });

    const incomeValue = useMemo(() => parseFloat(income) || 0, [income]);

    const tier1Allocations = useMemo(() => allocations.filter(a => a.tier === 1), [allocations]);
    const tier2Allocations = useMemo(() => allocations.filter(a => a.tier === 2), [allocations]);

    const tier1Calculations = useMemo(() => {
        const calculated = tier1Allocations.map(alloc => {
            const amount = alloc.type === 'fixed' ? alloc.value : (incomeValue * alloc.value) / 100;
            return { ...alloc, amount };
        });
        const totalAllocated = calculated.reduce((sum, alloc) => sum + alloc.amount, 0);
        return { calculated, totalAllocated };
    }, [incomeValue, tier1Allocations]);

    const remainderForTier2 = useMemo(() => incomeValue - tier1Calculations.totalAllocated, [incomeValue, tier1Calculations]);

    const tier2Calculations = useMemo(() => {
        const calculated = tier2Allocations.map(alloc => {
            const amount = (remainderForTier2 * alloc.value) / 100;
            return { ...alloc, amount };
        });
        const totalAllocated = calculated.reduce((sum, alloc) => sum + alloc.amount, 0);
        const totalPercentage = tier2Allocations.reduce((sum, alloc) => sum + alloc.value, 0);
        return { calculated, totalAllocated, totalPercentage };
    }, [remainderForTier2, tier2Allocations]);

    const finalUnallocated = remainderForTier2 - tier2Calculations.totalAllocated;
    const totalAllocated = tier1Calculations.totalAllocated + tier2Calculations.totalAllocated;

    const openModal = (tier: 1 | 2, editingAlloc: Allocation | null = null) => {
        setModalState({ isOpen: true, tier, editingAlloc });
    };

    const handleAdd = (data: Omit<Allocation, 'id'>) => {
        setAllocations(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
    };
    const handleEdit = (data: Omit<Allocation, 'id'>) => {
        if (!modalState.editingAlloc) return;
        setAllocations(prev => prev.map(a => a.id === modalState.editingAlloc!.id ? { ...a, ...data } : a));
    };
    const handleDelete = (id: string) => {
        setAllocations(prev => prev.filter(a => a.id !== id));
    };

    const renderAllocationRow = (alloc: Allocation & { amount: number }, tier: 1 | 2) => (
        <div key={alloc.id} className="grid grid-cols-12 gap-4 items-center p-3 even:bg-gray-700/50 rounded-md">
            <div className="col-span-12 md:col-span-3">
                <p className="font-semibold">{alloc.name}</p>
                {alloc.notes && <p className="text-xs text-gray-400 italic">{alloc.notes}</p>}
            </div>
            <div className="col-span-4 md:col-span-2 text-gray-400">{alloc.type === 'fixed' ? 'Fixed' : 'Percentage'}</div>
            <div className="col-span-4 md:col-span-2 font-mono">{alloc.type === 'fixed' ? `$${alloc.value.toFixed(2)}` : `${alloc.value}%`}</div>
            <div className="col-span-4 md:col-span-2 font-semibold text-green-400 font-mono">${alloc.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="col-span-12 md:col-span-3 text-right">
                <button onClick={() => openModal(tier, alloc)} className="text-yellow-400 hover:text-yellow-300 mr-4 text-sm font-medium">Edit</button>
                <button onClick={() => handleDelete(alloc.id)} className="text-red-500 hover:text-red-400 text-sm font-medium">Delete</button>
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <Header title="Allocation Calculator" />

            <div className="space-y-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">Total Revenue / Income</h3>
                     <div className="flex items-center space-x-2">
                        <span className="text-3xl font-bold text-gray-400">$</span>
                        <input
                            type="number"
                            value={income}
                            onChange={(e) => setIncome(e.target.value)}
                            placeholder="1873.75"
                            className="text-3xl font-bold w-full bg-transparent border-b-2 border-gray-600 focus:outline-none focus:border-blue-500 py-1"
                        />
                    </div>
                </div>

                <div className="bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-center p-4 border-b border-gray-700">
                        <h3 className="text-xl font-semibold">Primary Allocations</h3>
                        <button onClick={() => openModal(1)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">Add Primary</button>
                    </div>
                    <div className="p-4 space-y-2">
                        {tier1Calculations.calculated.length > 0 ? tier1Calculations.calculated.map(a => renderAllocationRow(a, 1)) : <p className="text-gray-400 text-center py-4">No primary allocations. Add one to get started.</p>}
                    </div>
                    <div className="p-4 bg-gray-900/50 rounded-b-lg text-right space-y-1 font-semibold">
                        <p>Sub Total: <span className="font-mono">${tier1Calculations.totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                        <p className="text-blue-400">Amount Remaining: <span className="font-mono">${remainderForTier2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                    </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg">
                     <div className="flex justify-between items-center p-4 border-b border-gray-700">
                        <h3 className="text-xl font-semibold">Secondary Allocations (from Remainder)</h3>
                        <button onClick={() => openModal(2)} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm">Add Secondary</button>
                    </div>
                    <div className="p-4 space-y-2">
                        {tier2Calculations.calculated.length > 0 ? tier2Calculations.calculated.map(a => renderAllocationRow(a, 2)) : <p className="text-gray-400 text-center py-4">No secondary allocations.</p>}
                    </div>
                     <div className="p-4 bg-gray-900/50 rounded-b-lg text-right space-y-1 font-semibold">
                        <p className={tier2Calculations.totalPercentage > 100 ? 'text-red-400' : ''}>Total Percentage: <span className="font-mono">{tier2Calculations.totalPercentage.toFixed(1)}%</span></p>
                        <p>Sub Total: <span className="font-mono">${tier2Calculations.totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                    </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-gray-400">Total Income</p>
                        <p className="text-2xl font-bold text-white font-mono">${incomeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                        <p className="text-gray-400">Total Allocated</p>
                        <p className="text-2xl font-bold text-green-500 font-mono">${totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                     <div>
                        <p className="text-gray-400">Final Unallocated</p>
                        <p className={`text-2xl font-bold font-mono ${finalUnallocated < 0 ? 'text-red-500' : 'text-yellow-400'}`}>${finalUnallocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>

            <Modal isOpen={modalState.isOpen} onClose={() => setModalState({ ...modalState, isOpen: false })} title={modalState.editingAlloc ? "Edit Allocation" : "Add Allocation"}>
                <AllocationForm 
                    onSubmit={modalState.editingAlloc ? handleEdit : handleAdd} 
                    onClose={() => setModalState({ ...modalState, isOpen: false })} 
                    initialData={modalState.editingAlloc}
                    tier={modalState.tier}
                />
            </Modal>
        </div>
    );
};

export default Calculator;
