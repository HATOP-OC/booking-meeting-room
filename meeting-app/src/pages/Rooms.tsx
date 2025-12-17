// src/pages/Rooms.tsx
import React, { useState } from 'react';
import { Users, Monitor, Edit, Trash2, Plus, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import type { Room } from '../types';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { BookingModal } from '../components/BookingModal';
import { ManageUsersModal } from '../components/ManageUsersModal';

export const Rooms: React.FC = () => {
  const { user } = useAuth();
  const { rooms, deleteRoom, addRoom, updateRoom, getUserRoleForRoom } = useData();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const handleCreateRoom = () => {
    setSelectedRoom(null);
    setIsRoomModalOpen(true);
  };

  const handleRoomSubmit = async (data: Omit<Room, 'id'>) => {
    try {
      if (selectedRoom) {
        await updateRoom(selectedRoom.id, data);
        showToast({ message: 'Room updated successfully', type: 'success' });
      } else {
        await addRoom(data);
        showToast({ message: 'Room created successfully', type: 'success' });
      }
      setIsRoomModalOpen(false);
    } catch (err) {
      showToast({ 
        message: err instanceof Error ? err.message : 'Failed to save room', 
        type: 'error' 
      });
    }
  };

  const handleDeleteRoom = async (id: string) => {
    confirm({
      title: 'Delete Room',
      message: 'Are you sure you want to delete this room? All bookings will be removed.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteRoom(id);
          showToast({ message: 'Room deleted successfully', type: 'success' });
        } catch (err) {
          showToast({ 
            message: err instanceof Error ? err.message : 'Failed to delete room', 
            type: 'error' 
          });
        }
      }
    });
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsRoomModalOpen(true);
  };

  const handleBook = (room: Room) => {
    setSelectedRoom(room);
    setIsBookingModalOpen(true);
  };

  const handleManageUsers = (room: Room) => {
    setSelectedRoom(room);
    setIsUsersModalOpen(true);
  };

  const canManageRoom = (room: Room) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const role = getUserRoleForRoom(room.id, user.email);
    return role === 'admin';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Available Rooms</h2>
        {user?.role === 'admin' && (
          <button 
            onClick={handleCreateRoom}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Room
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const canManage = canManageRoom(room);
          return (
            <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                {room.capacity && (
                  <div className="flex items-center text-gray-500 bg-gray-100 px-2 py-1 rounded text-sm">
                    <Users size={16} className="mr-1" />
                    {room.capacity}
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 mb-6 text-sm h-12 overflow-hidden">
                {room.description}
              </p>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="flex gap-2 text-gray-400">
                  <Monitor size={18} />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleBook(room)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 bg-blue-50 rounded-md"
                  >
                    Bookings
                  </button>

                  {canManage && (
                    <>
                      <button 
                        onClick={() => handleManageUsers(room)}
                        className="p-1 text-gray-400 hover:text-purple-600"
                        title="Manage Users"
                      >
                        <UserPlus size={18} />
                      </button>
                      <button 
                        onClick={() => handleEditRoom(room)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit Room"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteRoom(room.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete Room"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <CreateRoomModal 
        isOpen={isRoomModalOpen} 
        onClose={() => setIsRoomModalOpen(false)} 
        onSubmit={handleRoomSubmit}
        initialData={selectedRoom || undefined}
      />

      {selectedRoom && (
        <>
          <BookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            roomId={selectedRoom.id}
            roomName={selectedRoom.name}
          />
          <ManageUsersModal
            isOpen={isUsersModalOpen}
            onClose={() => setIsUsersModalOpen(false)}
            roomId={selectedRoom.id}
            roomName={selectedRoom.name}
          />
        </>
      )}
    </div>
  );
};