
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, SettingsIcon } from '../constants';
import { useData } from '../context/DataContext';

const Sidebar: React.FC = () => {
    const { appName } = useData();
    return (
        <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col border-r border-gray-700">
            <div className="p-4 border-b border-gray-700">
                <h1 className="text-2xl font-bold text-white">{appName}</h1>
            </div>
            <nav className="flex-grow p-4 space-y-2">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                                isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'hover:bg-gray-700 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                            isActive
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-gray-700 hover:text-white'
                        }`
                    }
                >
                    <SettingsIcon className="w-5 h-5 mr-3" />
                    <span>Settings</span>
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;