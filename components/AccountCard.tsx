
import React from 'react';
import { Link } from 'react-router-dom';

interface AccountCardProps {
    id: string;
    type: string;
    name: string;
    balance: string;
}

const AccountCard: React.FC<AccountCardProps> = ({ id, type, name, balance }) => {
    return (
        <Link to={`/accounts/${id}`} className="block bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors duration-200">
            <p className="text-sm text-gray-400">{type}</p>
            <p className="text-md font-semibold text-white">{name}</p>
            <p className="text-xl font-bold text-white mt-2">{balance}</p>
        </Link>
    );
};

export default AccountCard;
