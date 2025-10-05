
import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import AccountCard from '../components/AccountCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PieChartComponent from '../components/charts/PieChartComponent';
import { AccountType } from '../types';
import { ChartColors, NAV_ITEMS } from '../constants';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const { accounts, netWorth, totalAssets, totalLiabilities, stocks, crypto, retirementHoldings, historicalData, otherAssets } = useData();

    const assetAllocationData = useMemo(() => {
        const cash = accounts
            .filter(acc => acc.type === AccountType.CHECKING || acc.type === AccountType.SAVINGS || acc.type === AccountType.OTHER)
            .reduce((sum, acc) => sum + acc.balance, 0);
        
        const stockValue = stocks.reduce((sum, stock) => sum + stock.quantity * stock.price, 0);
        const cryptoValue = crypto.reduce((sum, c) => sum + c.quantity * c.price, 0);
        const retirementValue = retirementHoldings.reduce((sum, h) => sum + h.quantity * h.price, 0);
        const otherAssetsValue = otherAssets.reduce((sum, asset) => sum + asset.currentValue, 0);

        const data = [
            { name: 'Cash', value: cash },
            { name: 'Stocks', value: stockValue },
            { name: 'Crypto', value: cryptoValue },
            { name: 'Retirement', value: retirementValue },
            { name: 'Other Assets', value: otherAssetsValue },
        ].filter(d => d.value > 0);

        return data;
    }, [accounts, stocks, crypto, retirementHoldings, otherAssets]);


    return (
        <div className="p-6">
            <Header title="Dashboard" />

            <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
                <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                    {NAV_ITEMS.filter(item => item.name !== 'Dashboard').map(item => (
                        <Link 
                            key={item.name} 
                            to={item.path}
                            className="flex flex-col items-center justify-center text-center p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                        >
                            <item.icon className="w-6 h-6 mb-1 text-blue-400" />
                            <span className="text-xs text-gray-300">{item.name}</span>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Net Worth" value={`$${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass={netWorth >= 0 ? 'text-green-500' : 'text-red-500'} />
                <StatCard label="Total Assets" value={`$${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-green-500" />
                <StatCard label="Total Liabilities" value={`$${totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} colorClass="text-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-white">Performance Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={historicalData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis dataKey="date" stroke="#a0aec0" tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} />
                            <YAxis stroke="#a0aec0" tickFormatter={(value) => `$${(Number(value)/1000)}k`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#2d3748', border: 'none', color: '#e2e8f0' }}
                                formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="assets" name="Assets" stroke="#10b981" dot={false} strokeWidth={2} />
                            <Line type="monotone" dataKey="liabilities" name="Liabilities" stroke="#ef4444" dot={false} strokeWidth={2}/>
                            <Line type="monotone" dataKey="netWorth" name="Net Worth" stroke="#3b82f6" dot={false} strokeWidth={2}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-white">Asset Allocation</h3>
                    <PieChartComponent data={assetAllocationData} colors={ChartColors} />
                </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">Your Accounts</h3>
            {accounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map(account => (
                        <AccountCard 
                            key={account.id}
                            id={account.id}
                            type={account.type}
                            name={account.name}
                            balance={`$${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        />
                    ))}
                </div>
            ) : (
                 <div className="bg-gray-800 p-8 rounded-lg text-center">
                    <p className="text-gray-400">No accounts found. Go to the Accounts page to add one.</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
