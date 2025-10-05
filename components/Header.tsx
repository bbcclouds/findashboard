
import React, { ReactNode } from 'react';

interface HeaderProps {
    title: string;
    children?: ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, children }) => {
    return (
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">{title}</h2>
            <div>{children}</div>
        </div>
    );
};

export default Header;
