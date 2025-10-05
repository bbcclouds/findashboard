
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { RecurringEvent, Frequency, Account } from '../types';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const RecurringEventForm: React.FC<{
    onSubmit: (event: Omit<RecurringEvent, 'id'>) => void;
    onClose: () => void;
    initialData?: RecurringEvent | null;
    accounts: Account[];
}> = ({ onSubmit, onClose, initialData, accounts }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense');
    const initialAmount = initialData?.amount;
    const [amount, setAmount] = useState<string>(initialAmount ? initialAmount.toString() : '');
    const [frequency, setFrequency] = useState<Frequency>(initialData?.frequency || Frequency.MONTHLY);
    const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState(initialData?.accountId || (accounts.length > 0 ? accounts[0].id : ''));
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, type, amount: parseFloat(amount) || 0, frequency, startDate, accountId });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="flex items-center justify-center space-x-4 bg-gray-700 p-2 rounded-lg">
                <button type="button" onClick={() => setType('expense')} className={`px-4 py-2 rounded-md w-full transition-colors ${type === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>Expense</button>
                <button type="button" onClick={() => setType('income')} className={`px-4 py-2 rounded-md w-full transition-colors ${type === 'income' ? 'bg-green-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>Income</button>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g., Rent, Salary" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300">Amount</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Account</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Frequency</label>
                    <select value={frequency} onChange={e => setFrequency(e.target.value as Frequency)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
                        {Object.values(Frequency).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" />
                </div>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Event</button>
            </div>
        </form>
    );
};


const Forecasting: React.FC = () => {
    const { accounts, recurringEvents, setRecurringEvents } = useData();
    const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts.length > 0 ? accounts[0].id : '');
    const [forecastDuration, setForecastDuration] = useState(90); // in days
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<RecurringEvent | null>(null);
    const [eventToDelete, setEventToDelete] = useState<RecurringEvent | null>(null);

    const [whatIfEvents, setWhatIfEvents] = useState<{name: string, date: string, amount: number}[]>([]);
    const [whatIfName, setWhatIfName] = useState('');
    const [whatIfDate, setWhatIfDate] = useState('');
    const [whatIfAmount, setWhatIfAmount] = useState('');

    const forecastData = useMemo(() => {
        const selectedAccount = accounts.find(a => a.id === selectedAccountId);
        if (!selectedAccount) return [];

        const data: { date: string, balance: number, whatIfBalance?: number }[] = [];
        let currentBalance = selectedAccount.balance;
        let whatIfCurrentBalance = selectedAccount.balance;
        const today = new Date();
        today.setHours(0,0,0,0);

        const eventsForAccount = recurringEvents.filter(e => e.accountId === selectedAccountId);

        for (let i = 0; i < forecastDuration; i++) {
            const forecastDate = new Date(today);
            forecastDate.setDate(today.getDate() + i);
            const dateStr = forecastDate.toISOString().split('T')[0];

            let dailyChange = 0;
            eventsForAccount.forEach(event => {
                const startDate = new Date(event.startDate);
                if (forecastDate < startDate) return;

                let eventOccurs = false;
                switch(event.frequency) {
                    case Frequency.DAILY: eventOccurs = true; break;
                    case Frequency.WEEKLY: if (forecastDate.getDay() === startDate.getDay()) eventOccurs = true; break;
                    case Frequency.BIWEEKLY: 
                        const diffTime = Math.abs(forecastDate.getTime() - startDate.getTime());
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        if(diffDays % 14 === 0) eventOccurs = true;
                        break;
                    case Frequency.MONTHLY: if (forecastDate.getDate() === startDate.getDate()) eventOccurs = true; break;
                    case Frequency.YEARLY: if (forecastDate.getDate() === startDate.getDate() && forecastDate.getMonth() === startDate.getMonth()) eventOccurs = true; break;
                }
                if (eventOccurs) {
                    dailyChange += event.type === 'income' ? event.amount : -event.amount;
                }
            });
            
            currentBalance += dailyChange;
            whatIfCurrentBalance += dailyChange;

            const whatIfChange = whatIfEvents.reduce((sum, e) => e.date === dateStr ? sum + e.amount : sum, 0);
            whatIfCurrentBalance += whatIfChange;

            data.push({
                date: dateStr,
                balance: currentBalance,
                whatIfBalance: whatIfChange !== 0 || whatIfEvents.length > 0 ? whatIfCurrentBalance : undefined
            });
        }
        return data;
    }, [selectedAccountId, accounts, recurringEvents, forecastDuration, whatIfEvents]);

    const handleAddEvent = (data: Omit<RecurringEvent, 'id'>) => setRecurringEvents(prev => [...prev, {...data, id: crypto.randomUUID()}]);
    const handleEditEvent = (data: Omit<RecurringEvent, 'id'>) => {
        if (!editingEvent) return;
        setRecurringEvents(prev => prev.map(e => e.id === editingEvent.id ? {...e, ...data} : e));
    };
    const confirmDeleteEvent = () => {
        if (!eventToDelete) return;
        setRecurringEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
        setEventToDelete(null);
    };

    const handleAddWhatIf = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(whatIfAmount);
        if (whatIfName && whatIfDate && !isNaN(amount)) {
            setWhatIfEvents([...whatIfEvents, { name: whatIfName, date: whatIfDate, amount }]);
            setWhatIfName('');
            setWhatIfDate('');
            setWhatIfAmount('');
        }
    };

    return (
        <div className="p-6">
            <Header title="Cash Flow Forecasting">
                <button onClick={() => { setEditingEvent(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add Recurring Event</button>
            </Header>

            <div className="bg-gray-800 p-4 rounded-lg mb-8 flex items-center space-x-4">
                <div className="flex-1">
                    <label className="text-sm text-gray-400">Forecast Account</label>
                    <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white mt-1">
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>)}
                    </select>
                </div>
                 <div>
                    <label className="text-sm text-gray-400">Time Horizon</label>
                    <div className="flex items-center space-x-1 bg-gray-700 p-1 rounded-md mt-1">
                        {[30, 90, 365].map(days => (
                             <button key={days} onClick={() => setForecastDuration(days)} className={`px-3 py-1 text-sm rounded-md ${forecastDuration === days ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}>{days} Days</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                <div className="xl:col-span-2 bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-white">Projected Balance</h3>
                    {forecastData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={forecastData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis dataKey="date" stroke="#a0aec0" tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} />
                            <YAxis stroke="#a0aec0" tickFormatter={(value) => `$${(Number(value)/1000).toFixed(0)}k`} domain={['auto', 'auto']}/>
                            <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
                            <Legend />
                             <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
                            <Line type="monotone" dataKey="balance" name="Projected Balance" stroke="#3b82f6" dot={false} strokeWidth={2}/>
                            {whatIfEvents.length > 0 && <Line type="monotone" dataKey="whatIfBalance" name="What-If Scenario" stroke="#f59e0b" strokeDasharray="5 5" dot={false} strokeWidth={2}/>}
                        </LineChart>
                    </ResponsiveContainer>
                    ) : <p className="text-gray-400 text-center py-16">Please select an account to see the forecast.</p>}
                </div>
                 <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">"What-If" Scenarios</h3>
                    <form onSubmit={handleAddWhatIf} className="space-y-3">
                        <input type="text" value={whatIfName} onChange={e => setWhatIfName(e.target.value)} placeholder="Event Name (e.g., New Laptop)" className="w-full bg-gray-700 rounded-md py-2 px-3"/>
                        <input type="date" value={whatIfDate} onChange={e => setWhatIfDate(e.target.value)} className="w-full bg-gray-700 rounded-md py-2 px-3"/>
                        <input type="number" value={whatIfAmount} onChange={e => setWhatIfAmount(e.target.value)} placeholder="Amount (e.g., -1500 or 500)" className="w-full bg-gray-700 rounded-md py-2 px-3"/>
                        <button type="submit" className="w-full bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">Add Scenario Event</button>
                    </form>
                    <div className="border-t border-gray-700 mt-4 pt-3">
                        {whatIfEvents.map((e, i) => (
                             <div key={i} className="flex justify-between items-center text-sm p-1.5 rounded bg-gray-700/50 mb-1.5">
                                <span className="truncate pr-2">{e.name} ({e.date})</span>
                                <span className={`${e.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>${e.amount.toLocaleString()}</span>
                            </div>
                        ))}
                        {whatIfEvents.length > 0 && <button onClick={() => setWhatIfEvents([])} className="w-full text-center text-sm text-gray-400 hover:text-white mt-2">Clear Scenarios</button>}
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-4">Recurring Events</h3>
                 {recurringEvents.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                             <thead className="bg-gray-700 text-gray-400 uppercase text-sm"><tr><th className="p-3">Name</th><th className="p-3">Account</th><th className="p-3">Amount</th><th className="p-3">Frequency</th><th className="p-3">Start Date</th><th className="p-3">Actions</th></tr></thead>
                             <tbody>
                                {recurringEvents.map(event => {
                                    const account = accounts.find(a => a.id === event.accountId);
                                    return (
                                     <tr key={event.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="p-3 font-semibold">{event.name}</td>
                                        <td className="p-3">{account?.name || 'N/A'}</td>
                                        <td className={`p-3 font-semibold ${event.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>${event.amount.toLocaleString()}</td>
                                        <td className="p-3">{event.frequency}</td>
                                        <td className="p-3">{event.startDate}</td>
                                        <td className="p-3 space-x-2 whitespace-nowrap">
                                            <button onClick={() => { setEditingEvent(event); setIsModalOpen(true); }} className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600">Edit</button>
                                            <button onClick={() => setEventToDelete(event)} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                                        </td>
                                     </tr>
                                )})}
                             </tbody>
                        </table>
                    </div>
                 ) : (
                    <p className="text-gray-400 text-center py-4">No recurring events defined. Add one to start forecasting.</p>
                 )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEvent ? 'Edit Recurring Event' : 'Add Recurring Event'}>
                <RecurringEventForm onSubmit={editingEvent ? handleEditEvent : handleAddEvent} onClose={() => setIsModalOpen(false)} initialData={editingEvent} accounts={accounts} />
            </Modal>
            <ConfirmationModal isOpen={!!eventToDelete} onClose={() => setEventToDelete(null)} onConfirm={confirmDeleteEvent} title="Confirm Deletion" message={<>Are you sure you want to delete the recurring event <strong>"{eventToDelete?.name}"</strong>?</>} confirmText="Delete" />
        </div>
    );
};

export default Forecasting;
