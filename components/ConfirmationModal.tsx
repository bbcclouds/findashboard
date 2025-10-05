import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  confirmColorClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmColorClass = 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" role="dialog" aria-modal="true" aria-labelledby="confirmation-modal-title">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 id="confirmation-modal-title" className="text-xl font-semibold text-white mb-4">{title}</h3>
        <div className="text-gray-300 mb-6">{message}</div>
        <div className="flex justify-end space-x-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`px-4 py-2 rounded-md text-white ${confirmColorClass} focus:outline-none focus:ring-2 focus:ring-opacity-75`}
            aria-label="Confirm action"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
