import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Goal } from '../types';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';

const GoalForm: React.FC<{
    onSubmit: (goal: Omit<Goal, 'id' | 'status' | 'creationDate' | 'achievedDate'>) => void;
    onClose: () => void;
    initialData?: Goal | null;
}> = ({ onSubmit, onClose, initialData }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ title, description });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300">Goal Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Pay Off Car" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300">Description / Notes</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="e.g., Make extra payments of $200 per month." className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Goal</button>
            </div>
        </form>
    );
};


const MyGoals: React.FC = () => {
    const { goals, setGoals } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

    const activeGoals = useMemo(() => goals.filter(g => g.status === 'active').sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()), [goals]);
    const achievedGoals = useMemo(() => goals.filter(g => g.status === 'achieved').sort((a,b) => new Date(b.achievedDate!).getTime() - new Date(a.achievedDate!).getTime()), [goals]);

    const handleAddGoal = (goalData: Omit<Goal, 'id' | 'status' | 'creationDate' | 'achievedDate'>) => {
        const newGoal: Goal = {
            ...goalData,
            id: crypto.randomUUID(),
            status: 'active',
            creationDate: new Date().toISOString().split('T')[0],
        };
        setGoals(prev => [...prev, newGoal]);
    };

    const handleEditGoal = (goalData: Omit<Goal, 'id' | 'status' | 'creationDate' | 'achievedDate'>) => {
        if (!editingGoal) return;
        setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, ...goalData } : g));
    };
    
    const handleAchieveGoal = (goalId: string) => {
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: 'achieved', achievedDate: new Date().toISOString().split('T')[0] } : g));
    };

    const handleUnachieveGoal = (goalId: string) => {
        setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: 'active', achievedDate: undefined } : g));
    }

    const confirmDeleteGoal = () => {
        if (!goalToDelete) return;
        setGoals(prev => prev.filter(g => g.id !== goalToDelete.id));
        setGoalToDelete(null);
    };

    const openModalForEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setIsModalOpen(true);
    };

    const openModalForAdd = () => {
        setEditingGoal(null);
        setIsModalOpen(true);
    };
    
    const renderGoalCard = (goal: Goal) => {
        const isAchieved = goal.status === 'achieved';
        return (
            <div key={goal.id} className={`bg-gray-800 rounded-lg shadow-lg flex flex-col p-5 transition-all duration-300 ${isAchieved ? 'border-l-4 border-green-500 opacity-70' : 'border-l-4 border-blue-500'}`}>
                <div className="flex-grow mb-4">
                     <div className="flex justify-between items-start">
                        <h3 className={`text-xl font-bold text-white pr-2 ${isAchieved ? 'line-through' : ''}`}>{goal.title}</h3>
                        {isAchieved && (
                            <div className="flex items-center text-green-400 text-sm font-semibold bg-green-500/10 px-2 py-1 rounded-full">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                Achieved
                            </div>
                        )}
                    </div>
                    {isAchieved && goal.achievedDate && <p className="text-xs text-gray-400 mt-1">Completed on {new Date(goal.achievedDate).toLocaleDateString()}</p>}
                    <p className={`text-gray-300 mt-2 whitespace-pre-wrap ${isAchieved ? 'italic' : ''}`}>{goal.description}</p>
                </div>
                <div className="border-t border-gray-700 pt-3 flex justify-end space-x-2">
                    {isAchieved ? (
                         <button onClick={() => handleUnachieveGoal(goal.id)} className="text-yellow-400 hover:text-yellow-300 text-sm">Mark Active</button>
                    ) : (
                         <button onClick={() => handleAchieveGoal(goal.id)} className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700">Achieve</button>
                    )}
                    <button onClick={() => openModalForEdit(goal)} className="text-gray-400 hover:text-white text-sm">Edit</button>
                    <button onClick={() => setGoalToDelete(goal)} className="text-red-500 hover:text-red-400 text-sm">Delete</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <Header title="My Goals">
                <button onClick={openModalForAdd} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add New Goal</button>
            </Header>

            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-4 border-b-2 border-gray-700 pb-2">Active Goals</h2>
                    {activeGoals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {activeGoals.map(renderGoalCard)}
                        </div>
                    ) : (
                        <div className="bg-gray-800 p-8 rounded-lg text-center">
                            <p className="text-gray-400">You have no active goals. Click "Add New Goal" to set one!</p>
                        </div>
                    )}
                </div>

                 <div>
                    <h2 className="text-2xl font-semibold text-white mb-4 border-b-2 border-gray-700 pb-2">Achieved Goals</h2>
                     {achievedGoals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {achievedGoals.map(renderGoalCard)}
                        </div>
                    ) : (
                        <div className="bg-gray-800 p-8 rounded-lg text-center">
                            <p className="text-gray-400">No goals achieved yet. Keep going!</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingGoal ? "Edit Goal" : "Add New Goal"}>
                <GoalForm 
                    onSubmit={editingGoal ? handleEditGoal : handleAddGoal} 
                    onClose={() => setIsModalOpen(false)}
                    initialData={editingGoal}
                />
            </Modal>

            <ConfirmationModal
                isOpen={!!goalToDelete}
                onClose={() => setGoalToDelete(null)}
                onConfirm={confirmDeleteGoal}
                title="Confirm Deletion"
                message={<>Are you sure you want to delete the goal <strong>"{goalToDelete?.title}"</strong>?</>}
                confirmText="Delete"
            />
        </div>
    );
};

export default MyGoals;