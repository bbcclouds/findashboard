
import React from 'react';
import { Holding } from '../types';

interface HoldingsTableProps {
  holdings: Holding[];
  totalPortfolioValue?: number;
  onEdit: (holding: Holding) => void;
  onDelete: (id: string) => void;
}

const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings, totalPortfolioValue, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-700 text-gray-400 uppercase text-sm">
          <tr>
            <th className="p-3">Symbol</th>
            <th className="p-3">Quantity</th>
            <th className="p-3">Price</th>
            <th className="p-3">Value</th>
            <th className="p-3">Cost Basis</th>
            <th className="p-3">Gain/Loss</th>
            {totalPortfolioValue ? <th className="p-3">% of Portfolio</th> : null}
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody className="text-gray-200">
          {holdings.map((h) => {
            const value = h.quantity * h.price;
            const gainLoss = value - h.costBasis;
            const isGain = gainLoss >= 0;
            const percentage = totalPortfolioValue && totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0;

            return (
              <tr key={h.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="p-3 font-semibold">{h.symbol}<br/><span className="text-xs text-gray-400 font-normal">{h.name}</span></td>
                <td className="p-3">{h.quantity}</td>
                <td className="p-3">${h.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-3">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-3">${h.costBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className={`p-3 font-semibold ${isGain ? 'text-green-500' : 'text-red-500'}`}>
                  ${gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                {totalPortfolioValue ? <td className="p-3">{percentage.toFixed(2)}%</td> : null}
                <td className="p-3">
                  <button onClick={() => onEdit(h)} className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm mr-2 hover:bg-yellow-600">Edit</button>
                  <button onClick={() => onDelete(h.id)} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default HoldingsTable;