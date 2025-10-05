import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { OtherAsset } from '../types';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import StatCard from '../components/StatCard';

const OtherAssetForm: React.FC<{
    onSubmit: (asset: Omit<OtherAsset, 'id'>) => void;
    onClose: () => void;
    initialData?: OtherAsset | null;
}> = ({ onSubmit, onClose, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const initialValue = initialData?.currentValue;
    const [currentValue, setCurrentValue] = useState<string>(initialValue ? initialValue.toString() : '');
    const initialCost = initialData?.costBasis;
    const [costBasis, setCostBasis] = useState<string>(initialCost ? initialCost.toString() : '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ 
            name, 
            description, 
            currentValue: parseFloat(currentValue) || 0, 
            costBasis: parseFloat(costBasis) || 0, 
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">Asset Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Gold Bar" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., 1oz PAMP Suisse" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Current Value</label>
                <input type="number" step="0.01" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} required placeholder="0.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Cost Basis</label>
                <input type="number" step="0.01" value={costBasis} onChange={(e) => setCostBasis(e.target.value)} required placeholder="0.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Asset</button>
            </div>
        </form>
    );
};


const OtherAssets: React.FC = () => {
    const { otherAssets, setOtherAssets } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<OtherAsset | null>(null);
    const [assetToDelete, setAssetToDelete] = useState<OtherAsset | null>(null);

    const stats = useMemo(() => {
        const totalValue = otherAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
        const totalCost = otherAssets.reduce((sum, asset) => sum + asset.costBasis, 0);
        const totalGainLoss = totalValue - totalCost;
        return { totalValue, totalCost, totalGainLoss };
    }, [otherAssets]);

    const handleAddAsset = (assetData: Omit<OtherAsset, 'id'>) => {
        setOtherAssets(prev => [...prev, { ...assetData, id: crypto.randomUUID() }]);
    };

    const handleEditAsset = (assetData: Omit<OtherAsset, 'id'>) => {
        if (!editingAsset) return;
        setOtherAssets(prev => prev.map(a => a.id === editingAsset.id ? { ...a, ...assetData } : a));
    };

    const confirmDeleteAsset = () => {
        if (!assetToDelete) return;
        setOtherAssets(prev => prev.filter(a => a.id !== assetToDelete.id));
        setAssetToDelete(null);
    };

    const openModalForEdit = (asset: OtherAsset) => {
        setEditingAsset(asset);
        setIsModalOpen(true);
    };

    const openModalForAdd = () => {
        setEditingAsset(null);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6">
            <Header title="Other Assets">
                <button onClick={openModalForAdd} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add Asset</button>
            </Header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Total Value" value={`$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-green-500" />
                <StatCard label="Total Gain/Loss" value={`$${stats.totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass={stats.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'} />
                <StatCard label="Total Cost Basis" value={`$${stats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-gray-400" />
            </div>

            {otherAssets.length > 0 ? (
                <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700 text-gray-400 uppercase text-sm">
                                <tr>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Current Value</th>
                                    <th className="p-3">Cost Basis</th>
                                    <th className="p-3">Gain/Loss</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-200">
                                {otherAssets.map(asset => {
                                    const gainLoss = asset.currentValue - asset.costBasis;
                                    const isGain = gainLoss >= 0;
                                    return (
                                        <tr key={asset.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="p-3 font-semibold">{asset.name}<br/><span className="text-xs text-gray-400 font-normal">{asset.description}</span></td>
                                            <td className="p-3">${asset.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="p-3">${asset.costBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className={`p-3 font-semibold ${isGain ? 'text-green-500' : 'text-red-500'}`}>${gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="p-3">
                                                <button onClick={() => openModalForEdit(asset)} className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm mr-2 hover:bg-yellow-600">Edit</button>
                                                <button onClick={() => setAssetToDelete(asset)} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-800 p-8 rounded-lg text-center">
                    <p className="text-gray-400">No other assets tracked. Click "Add Asset" to get started.</p>
                </div>
            )}

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAsset ? "Edit Asset" : "Add New Asset"}>
                <OtherAssetForm 
                    onSubmit={editingAsset ? handleEditAsset : handleAddAsset} 
                    onClose={() => setIsModalOpen(false)}
                    initialData={editingAsset}
                />
            </Modal>

            <ConfirmationModal
                isOpen={!!assetToDelete}
                onClose={() => setAssetToDelete(null)}
                onConfirm={confirmDeleteAsset}
                title="Confirm Deletion"
                message={<>Are you sure you want to delete the asset <strong>"{assetToDelete?.name}"</strong>?</>}
                confirmText="Delete"
            />
        </div>
    );
};

export default OtherAssets;