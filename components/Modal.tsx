import React, { ReactNode, useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl' | '4xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Effect to center the modal when it first opens
  useEffect(() => {
    if (isOpen) {
      const modalElement = modalRef.current;
      if (modalElement) {
        const { offsetWidth, offsetHeight } = modalElement;
        const initialX = (window.innerWidth - offsetWidth) / 2;
        const initialY = (window.innerHeight - offsetHeight) / 2;
        // Ensure the modal doesn't start off-screen
        setPosition({
          x: Math.max(0, initialX),
          y: Math.max(16, initialY), // Start a bit from the top
        });
      }
      setIsDragging(false); // Reset dragging state on open
    }
  }, [isOpen, size]);

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    // Prevent dragging if the click is on a button (like the close button)
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.parentElement?.tagName === 'BUTTON') {
      return;
    }
    
    if (modalRef.current) {
        setIsDragging(true);
        setOffset({
            x: e.clientX - modalRef.current.offsetLeft,
            y: e.clientY - modalRef.current.offsetTop,
        });
        document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    }
  };

  // Effect to handle dragging logic with global mouse listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = ''; // Re-enable text selection
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, offset]);
  
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div
        ref={modalRef}
        className={`bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]}`}
        style={{
          position: 'absolute',
          top: `${position.y}px`,
          left: `${position.x}px`,
          transform: 'none', // Override any potential transform utilities
        }}
      >
        <div
          onMouseDown={handleMouseDown}
          className="flex justify-between items-center p-4 border-b border-gray-700 cursor-move"
        >
          <h3 className="text-xl font-semibold text-white pointer-events-none">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer z-10">&times;</button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;