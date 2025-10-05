import React, { useState, useRef } from 'react';
import Header from '../components/Header';
import ConfirmationModal from '../components/ConfirmationModal';
import { useData } from '../context/DataContext';

const DATA_KEYS = [
    'accounts', 'stocks', 'crypto', 'retirementAccounts', 'retirementHoldings',
    'retirementContributions', 'creditCards', 'incomeSources', 'incomeRecords',
    'formalDebts', 'commitments', 'receivables', 'paymentRecords', 'allocations',
    'transactions', 'otherAssets', 'goals', 'appName', 'password'
];

const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const jsonToCsv = (items: any[]) => {
    if (!items || items.length === 0) return '';
    const header = Object.keys(items[0]);
    const replacer = (key: string, value: any) => value === null ? '' : value;
    const csv = [
        header.join(','),
        ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');
    return csv;
};

const Settings: React.FC = () => {
    const { appName, setAppName, password, setPassword, ...data } = useData();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // App Name State
    const [tempAppName, setTempAppName] = useState(appName);
    
    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Export State
    const [exportType, setExportType] = useState('transactions');
    const restoreInputRef = useRef<HTMLInputElement>(null);

    const handleSaveAppName = () => {
        if (tempAppName.trim()) {
            setAppName(tempAppName.trim());
            alert('App name updated!');
        }
    };
    
    const handleSetPassword = () => {
        if (newPassword.length < 4) {
            setPasswordError('Password must be at least 4 characters long.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }
        setPassword(newPassword);
        setPasswordError('');
        setNewPassword('');
        setConfirmNewPassword('');
        alert('Password set successfully! The app will be locked the next time you open it.');
    };
    
    const handleRemovePassword = () => {
        if (currentPassword !== password) {
            setPasswordError('Incorrect current password.');
            return;
        }
        setPassword(null);
        setPasswordError('');
        setCurrentPassword('');
        alert('Password removed successfully!');
    };

    const handleBackup = () => {
        const backupData: { [key: string]: any } = {};
        DATA_KEYS.forEach(key => {
            const item = localStorage.getItem(key);
            if(item) {
                backupData[key] = JSON.parse(item);
            }
        });
        const jsonString = JSON.stringify(backupData, null, 2);
        downloadFile(jsonString, `findash_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    };

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("Invalid file content");
                const restoredData = JSON.parse(text);
                
                let restoredKeys = 0;
                const api = (window as any).electronAPI;
                const setMainItem = api && typeof api.setItem === 'function';
                Object.keys(restoredData).forEach(key => {
                    if (DATA_KEYS.includes(key)) {
                        localStorage.setItem(key, JSON.stringify(restoredData[key]));
                        // Also ask main process to persist the item when possible
                        if (setMainItem) {
                            try { api.setItem(key, restoredData[key]); } catch (e) { console.error('Failed to set main item', e); }
                        }
                        restoredKeys++;
                    }
                });
                
                if (restoredKeys > 0) {
                    alert('Restore successful! The application will now reload to apply changes.');
                    window.location.reload();
                } else {
                    alert('No valid data found in the backup file.');
                }
            } catch (error) {
                alert('Failed to restore backup. The file may be corrupt or invalid.');
                console.error("Restore error:", error);
            } finally {
                if (restoreInputRef.current) {
                    restoreInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const handleExport = () => {
        let dataToExport: any[] = [];
        let fileName = `${exportType.replace(/_/g, '-')}.csv`;

        if (exportType === 'transactions') {
            dataToExport = data.transactions.map(t => ({ accountName: data.accounts.find(a=>a.id === t.accountId)?.name, ...t }));
            fileName = 'all-transactions.csv';
        } else if (exportType.startsWith('account_')) {
            const accountId = exportType.split('_')[1];
            const account = data.accounts.find(a => a.id === accountId);
            if (account) {
                dataToExport = data.transactions.filter(t => t.accountId === accountId);
                fileName = `transactions-${account.name.replace(/\s/g, '_')}.csv`;
            }
        } else if (data.hasOwnProperty(exportType)) {
             dataToExport = (data as any)[exportType];
        }

        if (dataToExport.length > 0) {
            const csvString = jsonToCsv(dataToExport);
            downloadFile(csvString, fileName, 'text/csv;charset=utf-8;');
        } else {
            alert('No data available to export for this selection.');
        }
    };

    const confirmClearData = () => {
        // Clear renderer localStorage
        window.localStorage.clear();
        // Also request main process to clear its DB copy if the API exists
        try {
            if ((window as any).electronAPI && typeof (window as any).electronAPI.clearAll === 'function') {
                (window as any).electronAPI.clearAll();
            }
        } catch (e) {
            console.error('Failed to clear main DB via electronAPI', e);
        }
        window.location.reload();
    };

    return (
    <div className="p-6">
        <Header title="Settings" />
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* General Settings */}
            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">General</h3>
                <div className="space-y-2">
                    <label htmlFor="appName" className="block text-sm font-medium text-gray-300">Application Name</label>
                    <div className="flex items-center space-x-2">
                        <input id="appName" type="text" value={tempAppName} onChange={(e) => setTempAppName(e.target.value)} className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" />
                        <button onClick={handleSaveAppName} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save</button>
                    </div>
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">Security</h3>
                {!password ? (
                    <div>
                        <p className="text-gray-400 mb-4">Set a password to lock your application on startup.</p>
                        <div className="space-y-3">
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password (min 4 chars)" className="w-full bg-gray-700 rounded-md p-2"/>
                            <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Confirm New Password" className="w-full bg-gray-700 rounded-md p-2"/>
                            <button onClick={handleSetPassword} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Set Password</button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-400 mb-4">Your application is password protected.</p>
                        <div className="space-y-3">
                             <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current Password" className="w-full bg-gray-700 rounded-md p-2" />
                             <button onClick={handleRemovePassword} className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">Remove Password</button>
                        </div>
                    </div>
                )}
                {passwordError && <p className="text-red-500 text-sm mt-2">{passwordError}</p>}
            </div>

            {/* Data Management */}
            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">Data Management</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-200">Backup & Restore</h4>
                        <p className="text-gray-400 text-sm mb-2">Save all your data to a file or restore from a previous backup.</p>
                        <div className="flex space-x-2">
                            <button onClick={handleBackup} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Generate Backup File</button>
                            <button onClick={() => restoreInputRef.current?.click()} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500">Restore from Backup</button>
                            <input type="file" ref={restoreInputRef} onChange={handleRestore} accept=".json" className="hidden" />
                        </div>
                    </div>
                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="font-semibold text-red-400">Danger Zone</h4>
                        <p className="text-gray-400 text-sm mb-2">This will permanently clear all data stored in your browser.</p>
                        <button onClick={() => setIsConfirmOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Clear All Data</button>
                    </div>
                </div>
            </div>

            {/* Export Data */}
            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">Export Data</h3>
                <p className="text-gray-400 text-sm mb-4">Export specific data sets to a CSV file for use in spreadsheet applications.</p>
                <div className="flex items-center space-x-2">
                    <select value={exportType} onChange={e => setExportType(e.target.value)} className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
                        <optgroup label="General">
                            <option value="transactions">All Transactions</option>
                            <option value="stocks">Stock Holdings</option>
                            <option value="crypto">Crypto Holdings</option>
                            <option value="otherAssets">Other Assets</option>
                        </optgroup>
                        {data.accounts.length > 0 && (
                            <optgroup label="Transactions by Account">
                                {data.accounts.map(acc => (
                                    <option key={acc.id} value={`account_${acc.id}`}>{acc.name}</option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                    <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Export CSV</button>
                </div>
            </div>
        </div>
        
        <ConfirmationModal
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={confirmClearData}
            title="Delete All Data"
            message="Are you sure you want to delete ALL data? This action is permanent and cannot be undone."
            confirmText="Yes, Delete Everything"
        />
    </div>
    );
};

export default Settings;
