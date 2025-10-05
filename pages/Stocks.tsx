import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Holding } from '../types';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import HoldingsTable from '../components/HoldingsTable';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import AreaChartComponent from '../components/charts/AreaChartComponent';
import PieChartComponent from '../components/charts/PieChartComponent';
import { StockColors } from '../constants';

const HoldingForm: React.FC<{
    onSubmit: (holding: Omit<Holding, 'id'>) => void;
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
                <label className="block text-sm font-medium text-gray-300">Symbol</label>
                <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Quantity</label>
                <input type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="0" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Current Price</label>
                <input type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="0.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Average Cost Per Share</label>
                <input type="number" step="any" value={averageCost} onChange={(e) => setAverageCost(e.target.value)} required placeholder="0.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Holding</button>
            </div>
        </form>
    );
};

const Stocks: React.FC = () => {
    const { stocks, setStocks } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
    const [holdingToDelete, setHoldingToDelete] = useState<Holding | null>(null);

    const portfolioStats = useMemo(() => {
        const totalValue = stocks.reduce((sum, h) => sum + h.quantity * h.price, 0);
        const totalCostBasis = stocks.reduce((sum, h) => sum + h.costBasis, 0);
        const totalGainLoss = totalValue - totalCostBasis;
        return { totalValue, totalCostBasis, totalGainLoss };
    }, [stocks]);

    const chartData = useMemo(() => {
        if (stocks.length === 0) return [];
        const { totalCostBasis, totalValue } = portfolioStats;
        const data = [];
        const steps = 6;
        for (let i = 0; i <= steps; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - (steps - i));
            const value = totalCostBasis + (totalValue - totalCostBasis) * (i / steps);
            data.push({ name: date.toLocaleString('default', { month: 'short', year: '2-digit' }), Value: value });
        }
        return data;
    }, [stocks, portfolioStats]);

    const allocationData = useMemo(() => {
        return stocks.map(h => ({ name: h.symbol, value: h.quantity * h.price }));
    }, [stocks]);
    
    const handleAddHolding = (data: Omit<Holding, 'id'>) => {
        setStocks([...stocks, { ...data, id: crypto.randomUUID() }]);
    };

    const handleEditHolding = (data: Omit<Holding, 'id'>) => {
        if (!editingHolding) return;
        setStocks(stocks.map(h => h.id === editingHolding.id ? { ...h, ...data } : h));
    };

    const openDeleteConfirm = (holding: Holding) => {
        setHoldingToDelete(holding);
    };

    const confirmDeleteHolding = () => {
        if (!holdingToDelete) return;
        setStocks(prevStocks => prevStocks.filter(h => h.id !== holdingToDelete.id));
        setHoldingToDelete(null);
    };
    
    const openModalForAdd = () => {
        setEditingHolding(null);
        setIsModalOpen(true);
    };

    const openModalForEdit = (holding: Holding) => {
        setEditingHolding(holding);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6">
            <Header title="Stocks Portfolio">
                <button onClick={openModalForAdd} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add Holding</button>
            </Header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Total Value" value={`$${portfolioStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-white" />
                <StatCard label="Total Gain/Loss" value={`$${portfolioStats.totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass={portfolioStats.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'} />
                <StatCard label="Total Cost Basis" value={`$${portfolioStats.totalCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-gray-400" />
            </div>

            {stocks.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Portfolio Growth</h3>
                            <AreaChartComponent data={chartData} dataKey="Value" color="#3b82f6" />
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Asset Allocation</h3>
                            <PieChartComponent data={allocationData} colors={StockColors} />
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Holdings</h3>
                        <HoldingsTable holdings={stocks} onEdit={openModalForEdit} onDelete={(id) => openDeleteConfirm(stocks.find(s => s.id === id)!)} />
                    </div>
                </>
            ) : (
                <div className="bg-gray-800 p-8 rounded-lg text-center">
                    <p className="text-gray-400">No stock holdings yet. Click "Add Holding" to get started.</p>
                </div>
            )}
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingHolding ? "Edit Stock Holding" : "Add Stock Holding"}>
                <HoldingForm onSubmit={editingHolding ? handleEditHolding : handleAddHolding} onClose={() => setIsModalOpen(false)} initialData={editingHolding} />
            </Modal>
            
            <ConfirmationModal
                isOpen={!!holdingToDelete}
                onClose={() => setHoldingToDelete(null)}
                onConfirm={confirmDeleteHolding}
                title="Confirm Deletion"
                message={<>Are you sure you want to delete your holding in <strong>{holdingToDelete?.name} ({holdingToDelete?.symbol})</strong>?</>}
                confirmText="Delete"
            />
        </div>
    );
};

export default Stocks;
