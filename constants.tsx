
import React from 'react';

export const ChartColors = ['#3b82f6', '#10b981', '#f97316', '#f59e0b', '#8b5cf6', '#ec4899'];
export const CryptoColors = ['#f97316', '#3b82f6', '#10b981', '#ec4899'];
export const StockColors = ['#3b82f6', '#10b981', '#8b5cf6'];


export const DashboardIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
);
export const AccountsIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v2H4zm0 3h16v2H4zm0 3h16v2H4zm0 3h16v2H4zm0 3h16v2H4z"/></svg>
);
export const StocksIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.09-4-4L2 17.08l1.5 1.41z"/></svg>
);
export const CryptoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v2h-2zm0 4h2v6h-2z"/></svg>
);
export const RetirementIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM12 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-2.7 0-5.8 1.29-6 2.01V18c0-2.21 3.58-4 6-4s6 1.79 6 4v.01c-.2-0.72-3.3-2.01-6-2.01z"/></svg>
);
export const IncomeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-4-4 1.41-1.41L10 12.17l6.59-6.59L18 7l-8 8z"/></svg>
);
export const DebtsIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
);
export const CreditCardIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-1 14H5c-.55 0-1-.45-1-1v-5h16v5c0 .55-.45 1-1 1zm0-8H4V6h16v4z"/></svg>
);
export const CalculatorIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v2h10v-2zm-4-4H7v2h6V9zm4 8H7v2h10v-2z"/></svg>
);
export const SettingsIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>
);
export const OtherAssetsIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h14V6H5zm5 5h4v2h-4v-2zm-2 4h8v2H8v-2z"/></svg>
);
export const MyGoalsIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 4c.83 0 1.5.67 1.5 1.5v13c0 .83-.67 1.5-1.5 1.5h-17C2.67 20 2 19.33 2 18.5V5.5C2 4.67 2.67 4 3.5 4h5.09c.47-2.28 2.48-4 4.91-4s4.44 1.72 4.91 4h5.09zM12 2c-1.85 0-3.44 1.28-3.86 3h7.72c-.42-1.72-2.01-3-3.86-3zM4 6v12h16V6H4zm8 2c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
);

export const ForecastingIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm-7 7H3v4h4v-2H5v-2zm14-2h-2v2h4v-4h-2v2zM7 5H5v2H3V3h4v2zM21 3h-4v2h2v2h2V3zM7 16.5c-1.38 0-2.5-1.12-2.5-2.5S5.62 11.5 7 11.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM17 16.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
);

export const HomeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
);


export const NAV_ITEMS = [
    { name: 'Dashboard', path: '/', icon: DashboardIcon },
    { name: 'Calculator', path: '/calculator', icon: CalculatorIcon },
    { name: 'Forecasting', path: '/forecasting', icon: ForecastingIcon },
    { name: 'Income', path: '/income', icon: IncomeIcon },
    { name: 'Accounts', path: '/accounts', icon: AccountsIcon },
    { name: 'Home', path: '/home', icon: HomeIcon },
    { name: 'Debts', path: '/debts', icon: DebtsIcon },
    { name: 'Credit Cards', path: '/credit-cards', icon: CreditCardIcon },
    { name: 'Stocks', path: '/stocks', icon: StocksIcon },
    { name: 'Retirement', path: '/retirement', icon: RetirementIcon },
    { name: 'Crypto', path: '/crypto', icon: CryptoIcon },
    { name: 'Other Assets', path: '/other-assets', icon: OtherAssetsIcon },
    { name: 'My Goals', path: '/my-goals', icon: MyGoalsIcon },
];