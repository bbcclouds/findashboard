import React, { useState } from 'react';

interface PasswordProtectLayerProps {
    correctPassword: string;
    onUnlock: () => void;
}

const PasswordProtectLayer: React.FC<PasswordProtectLayerProps> = ({ correctPassword, onUnlock }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === correctPassword) {
            onUnlock();
        } else {
            setError('Incorrect password. Please try again.');
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-sm text-center">
                <h1 className="text-3xl font-bold text-white mb-4">Application Locked</h1>
                <p className="text-gray-400 mb-6">Please enter your password to unlock.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        placeholder="Password"
                        autoFocus
                        aria-label="Password"
                        aria-required="true"
                        className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}
                    <button type="submit" className="w-full px-4 py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700 font-semibold transition-colors">
                        Unlock
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PasswordProtectLayer;
