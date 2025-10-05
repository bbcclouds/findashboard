export enum AccountType {
  CHECKING = 'Checking',
  SAVINGS = 'Savings',
  OTHER = 'Other'
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  parentId?: string; // If present, this is a sub-account of another account
}

export interface CreditCard {
    id: string;
    name: string;
    issuer: string;
    creditLimit: number;
    balance: number;
    apr: number;
    minimumPayment: number;
}

export enum RetirementAccountType {
    TRADITIONAL_IRA = 'Traditional IRA',
    ROTH_IRA = 'Roth IRA',
    SEP_IRA = 'SEP IRA',
    SIMPLE_IRA = 'SIMPLE IRA',
    _401K = '401(k)',
    ROTH_401K = 'Roth 401(k)',
    _403B = '403(b)',
    TSP = 'Thrift Savings Plan',
    OTHER = 'Other'
}

export interface RetirementAccount {
  id: string;
  name: string;
  type: RetirementAccountType;
}

export interface Holding {
  id:string;
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  costBasis: number;
  accountId?: string; // Link to retirement account if applicable
}

export interface Contribution {
  id: string;
  accountId: string; // Link to retirement account
  amount: number;
  date: string;
}

export interface IncomeSource {
    id: string;
    name: string;
    status: 'active' | 'archived';
}

export interface IncomeRecord {
    id: string;
    sourceId: string;
    accountId?: string;
    amount: number;
    date: string;
}

export interface FormalDebt {
    id:string;
    name: string;
    description: string;
    totalAmount: number; // Original Principal
    interestRate: number;
    nextPaymentDate: string;
    status: 'active' | 'archived';
    paidOffDate?: string;
    creationDate: string;
    linkedAssetId?: string;
    assetType?: 'otherAsset' | 'home';
    loanTermYears?: number;
    loanOriginationDate?: string;
    monthlyPayment?: number; // Calculated P&I
    monthlyTax?: number;
    monthlyInsurance?: number;
    monthlyPMI?: number;
}

export interface PaymentRecord {
    id: string;
    itemId: string;
    accountId: string;
    amount: number;
    date: string;
    transactionId?: string;
    paymentType?: 'regular' | 'extra';
    breakdown?: {
        principal: number;
        interest: number;
        escrow: number;
        total: number;
    };
}

export interface Commitment {
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    status: 'active' | 'archived';
    paidOffDate?: string;
    creationDate: string;
}

export interface Receivable {
    id: string;
    name: string;
    from: string;
    amount: number;
    dueDate: string;
    status: 'active' | 'archived';
    paidOffDate?: string;
    creationDate: string;
}


export interface Allocation {
    id: string;
    tier: 1 | 2;
    name: string;
    type: 'fixed' | 'percentage';
    value: number;
    notes?: string;
}

export interface Transaction {
  id: string;
  accountId: string; // Can be a bank account ID or a credit card ID
  amount: number; // For bank accounts: negative for expense, positive for income. For CC: positive for purchase, negative for payment.
  date: string;
  description: string;
  payee?: string; // "Paid to" or "Received from"
  category: string;
  isInternal?: boolean; // Flag for internal transfers between sub-accounts
  transferId?: string; // Links two transfer transactions
}

export interface Category {
    id: string;
    name: string;
    accountId: string; // Can be a bank account ID or a credit card ID
}

export interface HistoricalDataPoint {
    date: string;
    assets: number;
    liabilities: number;
    netWorth: number;
}

export interface DebtHistoricalDataPoint {
    date: string;
    formalDebt: number;
    commitments: number;
    receivables: number;
}

export interface OtherAsset {
  id: string;
  name: string;
  description: string;
  currentValue: number;
  costBasis: number;
}

export interface Goal {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'achieved';
    creationDate: string;
    achievedDate?: string;
}

export enum Frequency {
    DAILY = 'Daily',
    WEEKLY = 'Weekly',
    BIWEEKLY = 'Bi-Weekly',
    MONTHLY = 'Monthly',
    YEARLY = 'Yearly',
}

export interface RecurringEvent {
    id: string;
    name: string;
    type: 'income' | 'expense';
    amount: number;
    frequency: Frequency;
    startDate: string; // YYYY-MM-DD
    accountId: string;
}

export interface Home {
    id: string;
    name: string;
    purchasePrice: number;
    purchaseDate: string;
    currentValue: number;
    linkedDebtId?: string;
    downPayment: number;
    closingCosts: number;
}

export interface HomeImprovement {
    id: string;
    homeId: string;
    description: string;
    cost: number;
    date: string;
}