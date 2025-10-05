import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Stocks from './pages/Stocks';
import Crypto from './pages/Crypto';
import Retirement from './pages/Retirement';
import CreditCards from './pages/CreditCards';
import Income from './pages/Income';
import Debts from './pages/Debts';
import Calculator from './pages/Calculator';
import Settings from './pages/Settings';
import { DataProvider, useData } from './context/DataContext';
import AccountDetail from './pages/AccountDetail';
import DebtDetail from './pages/DebtDetail';
import RetirementAccountDetail from './pages/RetirementAccountDetail';
import OtherAssets from './pages/OtherAssets';
import MyGoals from './pages/MyGoals';
import Forecasting from './pages/Forecasting';
import PasswordProtectLayer from './components/PasswordProtectLayer';
import CreditCardDetail from './pages/CreditCardDetail';
import Home from './pages/Home';

const AppLayout: React.FC = () => {
    const { password } = useData();
    const [isLocked, setIsLocked] = useState(!!password);

    if (isLocked && password) {
        return <PasswordProtectLayer correctPassword={password} onUnlock={() => setIsLocked(false)} />;
    }
    
    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/accounts/:accountId" element={<AccountDetail />} />
                    <Route path="/stocks" element={<Stocks />} />
                    <Route path="/crypto" element={<Crypto />} />
                    <Route path="/retirement" element={<Retirement />} />
                    <Route path="/retirement/:accountId" element={<RetirementAccountDetail />} />
                    <Route path="/credit-cards" element={<CreditCards />} />
                    <Route path="/credit-cards/:cardId" element={<CreditCardDetail />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/income" element={<Income />} />
                    <Route path="/debts" element={<Debts />} />
                    <Route path="/debts/:itemType/:itemId" element={<DebtDetail />} />
                    <Route path="/calculator" element={<Calculator />} />
                    <Route path="/forecasting" element={<Forecasting />} />
                    <Route path="/other-assets" element={<OtherAssets />} />
                    <Route path="/my-goals" element={<MyGoals />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </main>
        </div>
    );
};


const App: React.FC = () => {
    return (
        <DataProvider>
            <HashRouter>
                <AppLayout />
            </HashRouter>
        </DataProvider>
    );
};

export default App;