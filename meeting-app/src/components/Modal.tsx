import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-lg min-h-screen"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-[420px] md:max-w-[520px] mx-4 max-h-[85vh] overflow-hidden box-border animate-fade-in">
        <div className="flex items-start justify-between gap-4 px-6 py-4 bg-white border-b border-gray-100 z-10 min-h-[56px]">
          <div className="min-w-0 flex-1">
            <h3 id="modal-title" className="text-lg font-semibold text-gray-900 leading-6 break-words">{title}</h3>
          </div>
          <div className="flex-shrink-0">
            <button onClick={onClose} className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body panel */}
        <div className="p-6 space-y-4 bg-white rounded-b-2xl overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};