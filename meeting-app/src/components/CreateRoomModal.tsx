import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import type { Room } from '../types';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Room, 'id'>) => void;
  initialData?: Room;
}

export const CreateRoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState<number | ''>(0);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setCapacity(initialData.capacity || 0);
    } else if (isOpen) {
      setName(''); setDescription(''); setCapacity(0);
    }
  }, [initialData, isOpen]);

  const handleFormSubmit = () => {
    onSubmit({ name, description, capacity: Number(capacity) });
    setName(''); setDescription(''); setCapacity(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Room" : "Add New Room"}>
      <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Room Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500" placeholder="e.g. Main Hall" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm resize-y max-h-40" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Capacity</label>
          <input type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm" />
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-md hover:from-blue-700 hover:to-indigo-700 shadow">
          {initialData ? "Save Changes" : "Create Room"}
        </button>
      </form>
    </Modal>
  );
};