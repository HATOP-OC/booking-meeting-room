import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import type { Room } from '../types';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Room, 'id'>) => void;
  initialData?: Room;
}

export const CreateRoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { register, handleSubmit, reset, setValue } = useForm<Omit<Room, 'id'>>();

  useEffect(() => {
    if (initialData) {
      setValue('name', initialData.name);
      setValue('description', initialData.description);
      setValue('capacity', initialData.capacity);
    } else {
      reset({ name: '', description: '', capacity: 0 });
    }
  }, [initialData, isOpen, setValue, reset]);

  const handleFormSubmit = (data: Omit<Room, 'id'>) => {
    onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Room" : "Add New Room"}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Room Name</label>
          <input {...register('name', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="e.g. Main Hall" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea {...register('description', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Capacity</label>
          <input type="number" {...register('capacity', { required: true, min: 1 })} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
          {initialData ? "Save Changes" : "Create Room"}
        </button>
      </form>
    </Modal>
  );
};