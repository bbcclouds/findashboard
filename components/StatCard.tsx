import React, { useState } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  colorClass: string;
  tooltip?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, colorClass, tooltip }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{label}</p>
        {tooltip && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-gray-700 text-gray-400 rounded-full text-xs font-bold hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-expanded={isExpanded}
            aria-label={`More info about ${label}`}
          >
            ?
          </button>
        )}
      </div>
      <p className={`text-2xl font-semibold ${colorClass} truncate`}>{value}</p>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-40 mt-2 pt-2 border-t border-gray-700' : 'max-h-0'}`}>
        <p className="text-xs text-gray-500">
          {tooltip}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
