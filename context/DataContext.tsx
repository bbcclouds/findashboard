

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState, useCallback } from 'react';
import { Account, Holding, IncomeSource, IncomeRecord, FormalDebt, Commitment, Receivable, Allocation, Transaction, HistoricalDataPoint, AccountType, DebtHistoricalDataPoint, PaymentRecord, CreditCard, Contribution, RetirementAccount, OtherAsset, Goal, RecurringEvent, Category, Home, HomeImprovement } from '../types';

interface DataContextProps {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  stocks: Holding[];
  setStocks: React.Dispatch<React.SetStateAction<Holding[]>>;
  crypto: Holding[];
  setCrypto: React.Dispatch<React.SetStateAction<Holding[]>>;
  retirementAccounts: RetirementAccount[];
  setRetirementAccounts: React.Dispatch<React.SetStateAction<RetirementAccount[]>>;
  retirementHoldings: Holding[];
  setRetirementHoldings: React.Dispatch<React.SetStateAction<Holding[]>>;
  retirementContributions: Contribution[];
  setRetirementContributions: React.Dispatch<React.SetStateAction<Contribution[]>>;
  creditCards: CreditCard[];
  setCreditCards: React.Dispatch<React.SetStateAction<CreditCard[]>>;
  incomeSources: IncomeSource[];
  setIncomeSources: React.Dispatch<React.SetStateAction<IncomeSource[]>>;
  incomeRecords: IncomeRecord[];
  setIncomeRecords: React.Dispatch<React.SetStateAction<IncomeRecord[]>>;
  formalDebts: FormalDebt[];
  setFormalDebts: React.Dispatch<React.SetStateAction<FormalDebt[]>>;
  commitments: Commitment[];
  setCommitments: React.Dispatch<React.SetStateAction<Commitment[]>>;
  receivables: Receivable[];
  setReceivables: React.Dispatch<React.SetStateAction<Receivable[]>>;
  paymentRecords: PaymentRecord[];
  setPaymentRecords: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
  allocations: Allocation[];
  setAllocations: React.Dispatch<React.SetStateAction<Allocation[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  otherAssets: OtherAsset[];
  setOtherAssets: React.Dispatch<React.SetStateAction<OtherAsset[]>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  recurringEvents: RecurringEvent[];
  setRecurringEvents: React.Dispatch<React.SetStateAction<RecurringEvent[]>>;
  homes: Home[];
  setHomes: React.Dispatch<React.SetStateAction<Home[]>>;
  homeImprovements: HomeImprovement[];
  setHomeImprovements: React.Dispatch<React.SetStateAction<HomeImprovement[]>>;
  historicalData: HistoricalDataPoint[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  appName: string;
  setAppName: React.Dispatch<React.SetStateAction<string>>;
  password: string | null;
  setPassword: React.Dispatch<React.SetStateAction<string | null>>;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // App state — start with defaults, will be hydrated from main DB on mount
  const [appName, setAppName] = useState<string>('FinDash');
  const [password, setPassword] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stocks, setStocks] = useState<Holding[]>([]);
  const [crypto, setCrypto] = useState<Holding[]>([]);
  const [retirementAccounts, setRetirementAccounts] = useState<RetirementAccount[]>([]);
  const [retirementHoldings, setRetirementHoldings] = useState<Holding[]>([]);
  const [retirementContributions, setRetirementContributions] = useState<Contribution[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [formalDebts, setFormalDebts] = useState<FormalDebt[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [otherAssets, setOtherAssets] = useState<OtherAsset[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringEvents, setRecurringEvents] = useState<RecurringEvent[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [homeImprovements, setHomeImprovements] = useState<HomeImprovement[]>([]);

  // Loading state — don't render children until main DB is loaded
  const [isHydrated, setIsHydrated] = useState(false);

  // Helper to persist a key to main DB
  const persist = useCallback(async (key: string, value: any) => {
    try {
      const api = (window as any).electronAPI;
      if (api && typeof api.setItem === 'function') {
        await api.setItem(key, value);
      }
    } catch (e) {
      console.error('Failed to persist key to main DB', key, e);
    }
  }, []);

  // Hydrate initial state from main DB
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const api = (window as any).electronAPI;
        if (!api || typeof api.getItem !== 'function') {
          setIsHydrated(true);
          return;
        }

        const keys = [
          'appName','password','accounts','stocks','crypto','retirementAccounts','retirementHoldings','retirementContributions','creditCards','incomeSources','incomeRecords','formalDebts','commitments','receivables','paymentRecords','allocations','transactions','categories','otherAssets','goals','recurringEvents','homes','homeImprovements'
        ];

        for (const key of keys) {
          try {
            const res = await api.getItem(key);
            if (!mounted) return;
            if (res && res.ok) {
              const v = res.value;
              switch (key) {
                case 'appName': if (v !== undefined) setAppName(v); break;
                case 'password': if (v !== undefined) setPassword(v); break;
                case 'accounts': if (v) setAccounts(v); break;
                case 'stocks': if (v) setStocks(v); break;
                case 'crypto': if (v) setCrypto(v); break;
                case 'retirementAccounts': if (v) setRetirementAccounts(v); break;
                case 'retirementHoldings': if (v) setRetirementHoldings(v); break;
                case 'retirementContributions': if (v) setRetirementContributions(v); break;
                case 'creditCards': if (v) setCreditCards(v); break;
                case 'incomeSources': if (v) setIncomeSources(v); break;
                case 'incomeRecords': if (v) setIncomeRecords(v); break;
                case 'formalDebts': if (v) setFormalDebts(v); break;
                case 'commitments': if (v) setCommitments(v); break;
                case 'receivables': if (v) setReceivables(v); break;
                case 'paymentRecords': if (v) setPaymentRecords(v); break;
                case 'allocations': if (v) setAllocations(v); break;
                case 'transactions': if (v) setTransactions(v); break;
                case 'categories': if (v) setCategories(v); break;
                case 'otherAssets': if (v) setOtherAssets(v); break;
                case 'goals': if (v) setGoals(v); break;
                case 'recurringEvents': if (v) setRecurringEvents(v); break;
                case 'homes': if (v) setHomes(v); break;
                case 'homeImprovements': if (v) setHomeImprovements(v); break;
                default: break;
              }
            }
          } catch (e) {
            console.error('Error hydrating key', key, e);
          }
        }
      } catch (e) {
        console.error('Hydration failed', e);
      } finally {
        if (mounted) setIsHydrated(true);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Persist changes to main DB when state changes
  useEffect(() => { if (isHydrated) persist('appName', appName); }, [appName, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('password', password); }, [password, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('accounts', accounts); }, [accounts, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('stocks', stocks); }, [stocks, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('crypto', crypto); }, [crypto, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('retirementAccounts', retirementAccounts); }, [retirementAccounts, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('retirementHoldings', retirementHoldings); }, [retirementHoldings, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('retirementContributions', retirementContributions); }, [retirementContributions, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('creditCards', creditCards); }, [creditCards, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('incomeSources', incomeSources); }, [incomeSources, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('incomeRecords', incomeRecords); }, [incomeRecords, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('formalDebts', formalDebts); }, [formalDebts, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('commitments', commitments); }, [commitments, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('receivables', receivables); }, [receivables, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('paymentRecords', paymentRecords); }, [paymentRecords, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('allocations', allocations); }, [allocations, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('transactions', transactions); }, [transactions, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('categories', categories); }, [categories, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('otherAssets', otherAssets); }, [otherAssets, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('goals', goals); }, [goals, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('recurringEvents', recurringEvents); }, [recurringEvents, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('homes', homes); }, [homes, persist, isHydrated]);
  useEffect(() => { if (isHydrated) persist('homeImprovements', homeImprovements); }, [homeImprovements, persist, isHydrated]);
  
  const totalReceivables = useMemo(() => receivables.filter(r => r.status === 'active').reduce((sum, r) => sum + r.amount, 0), [receivables]);
  
  const totalAssets = useMemo(() => {
    // Only include top-level accounts in asset calculation to avoid double-counting sub-accounts
    const accountAssets = accounts.filter(acc => !acc.parentId).reduce((sum, acc) => sum + acc.balance, 0);
    const stockAssets = stocks.reduce((sum, stock) => sum + stock.quantity * stock.price, 0);
    const cryptoAssets = crypto.reduce((sum, c) => sum + c.quantity * c.price, 0);
    const retirementAssets = retirementHoldings.reduce((sum, h) => sum + h.quantity * h.price, 0);
    const otherAssetsValue = otherAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const homeAssets = homes.reduce((sum, home) => sum + home.currentValue, 0);
    return accountAssets + stockAssets + cryptoAssets + retirementAssets + totalReceivables + otherAssetsValue + homeAssets;
  }, [accounts, stocks, crypto, retirementHoldings, totalReceivables, otherAssets, homes]);

  const totalFormalDebt = useMemo(() => {
    return formalDebts.filter(d => d.status === 'active').reduce((sum, debt) => {
        const isMortgage = debt.assetType === 'home';
        const paymentsForDebt = paymentRecords.filter(p => p.itemId === debt.id);
        
        const principalPaid = isMortgage
            ? paymentsForDebt.reduce((s, p) => s + (p.breakdown?.principal || 0), 0)
            : paymentsForDebt.reduce((s, p) => s + p.amount, 0);
            
        return sum + (debt.totalAmount - principalPaid);
    }, 0);
  }, [formalDebts, paymentRecords]);

  const totalCommitments = useMemo(() => {
    return commitments.filter(c => c.status === 'active').reduce((sum, commitment) => {
        const paid = paymentRecords
            .filter(p => p.itemId === commitment.id)
            .reduce((s, p) => s + p.amount, 0);
        return sum + (commitment.amount - paid);
    }, 0);
  }, [commitments, paymentRecords]);


  const totalLiabilities = useMemo(() => {
    const creditCardDebt = creditCards.reduce((sum, card) => sum + card.balance, 0);
    return creditCardDebt + totalFormalDebt + totalCommitments;
  }, [creditCards, totalFormalDebt, totalCommitments]);

  const netWorth = useMemo(() => totalAssets - totalLiabilities, [totalAssets, totalLiabilities]);

  const historicalData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const allEvents: { date: string, assetChange: number, liabilityChange: number }[] = [];
    
    const accountIds = new Set(accounts.map(a => a.id));
    const creditCardIds = new Set(creditCards.map(c => c.id));
    
    // Asset changes from account transactions & liability changes from credit card transactions
    transactions.forEach(t => {
      if (accountIds.has(t.accountId)) {
        allEvents.push({ date: t.date, assetChange: t.amount, liabilityChange: 0 });
      } else if (creditCardIds.has(t.accountId)) {
        allEvents.push({ date: t.date, assetChange: 0, liabilityChange: t.amount });
      }
    });

    // Liability changes
    formalDebts.forEach(d => allEvents.push({ date: d.creationDate, assetChange: 0, liabilityChange: d.totalAmount }));
    commitments.forEach(c => allEvents.push({ date: c.creationDate, assetChange: 0, liabilityChange: c.amount }));
    paymentRecords.forEach(p => {
        const isLiabilityPayment = formalDebts.some(d => d.id === p.itemId) || commitments.some(c => c.id === p.itemId);
        if (isLiabilityPayment) {
            // Asset change is already handled by the linked transaction, here we only adjust liability.
            allEvents.push({ date: p.date, assetChange: 0, liabilityChange: -p.amount });
        }
    });

    // If there are no historical events, return a single data point for today.
    if (allEvents.length === 0) {
        return [{ date: today, assets: totalAssets, liabilities: totalLiabilities, netWorth }];
    }
    
    // Group all changes by date
    const dailyChanges = new Map<string, { assetChange: number, liabilityChange: number }>();
    allEvents.forEach(event => {
        const entry = dailyChanges.get(event.date) || { assetChange: 0, liabilityChange: 0 };
        entry.assetChange += event.assetChange;
        entry.liabilityChange += event.liabilityChange;
        dailyChanges.set(event.date, entry);
    });

    // Ensure today is in the map so the graph extends to the current day
    if (!dailyChanges.has(today)) {
        dailyChanges.set(today, { assetChange: 0, liabilityChange: 0 });
    }
    
    // Get all unique dates and sort them from most recent to oldest
    const sortedDates = Array.from(dailyChanges.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    const dataPoints = new Map<string, { assets: number, liabilities: number, netWorth: number }>();
    
    // Start with current totals and work backwards
    let runningAssets = totalAssets;
    let runningLiabilities = totalLiabilities;
    
    for (const date of sortedDates) {
        // The value for 'date' is the state at the END of that day
        dataPoints.set(date, {
            assets: runningAssets,
            liabilities: runningLiabilities,
            netWorth: runningAssets - runningLiabilities,
        });
        
        // Subtract the changes of that day to get the state at the START of that day
        const changes = dailyChanges.get(date)!;
        runningAssets -= changes.assetChange;
        runningLiabilities -= changes.liabilityChange;
    }

    // Convert map to array and sort chronologically
    const result = Array.from(dataPoints.entries())
        .map(([date, values]) => ({ date, ...values }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Prepend an initial data point for a smoother chart start
    if (result.length > 0) {
        const firstDateStr = result[0].date;
        const firstChanges = dailyChanges.get(firstDateStr) || { assetChange: 0, liabilityChange: 0 };
        const initialAssetValue = result[0].assets - firstChanges.assetChange;
        const initialLiabilityValue = result[0].liabilities - firstChanges.liabilityChange;
        
        const firstDate = new Date(firstDateStr);
        firstDate.setDate(firstDate.getDate() - 1);
        const initialDateStr = firstDate.toISOString().split('T')[0];

        result.unshift({
            date: initialDateStr,
            assets: initialAssetValue,
            liabilities: initialLiabilityValue,
            netWorth: initialAssetValue - initialLiabilityValue
        });
    }
    
    // Return up to the last 365 days of data
    return result.slice(-365);
    
}, [totalAssets, totalLiabilities, netWorth, transactions, formalDebts, commitments, paymentRecords, accounts, creditCards]);

  const value = {
    accounts, setAccounts,
    stocks, setStocks,
    crypto, setCrypto,
    retirementAccounts, setRetirementAccounts,
    retirementHoldings, setRetirementHoldings,
    retirementContributions, setRetirementContributions,
    creditCards, setCreditCards,
    incomeSources, setIncomeSources,
    incomeRecords, setIncomeRecords,
    formalDebts, setFormalDebts,
    commitments, setCommitments,
    receivables, setReceivables,
    paymentRecords, setPaymentRecords,
    allocations, setAllocations,
    transactions, setTransactions,
    categories, setCategories,
    otherAssets, setOtherAssets,
    goals, setGoals,
    recurringEvents, setRecurringEvents,
    homes, setHomes,
    homeImprovements, setHomeImprovements,
    historicalData,
    totalAssets,
    totalLiabilities,
    netWorth,
    appName, setAppName,
    password, setPassword,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};