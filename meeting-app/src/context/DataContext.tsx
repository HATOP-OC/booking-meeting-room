import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useRooms } from '../hooks/useRooms';
import { useBookings } from '../hooks/useBookings';
import { usePermissions } from '../hooks/usePermissions';
import { checkRoomAvailability } from '../utils/booking';
import type { Room, Booking, Role, RoomPermission } from '../types';

interface DataContextType {
  rooms: Room[];
  bookings: Booking[];
  roomPermissions: RoomPermission[];
  addRoom: (room: Omit<Room, 'id'>) => Promise<Room>;
  updateRoom: (id: string, data: Partial<Room>) => Promise<Room>;
  deleteRoom: (id: string) => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id'>) => Promise<Booking>;
  updateBooking: (id: string, data: Partial<Booking>) => Promise<Booking>;
  deleteBooking: (id: string) => Promise<void>;
  isRoomAvailable: (roomId: string, start: Date, end: Date, excludeBookingId?: string) => boolean;
  addRoomUser: (roomId: string, userEmail: string, role: Role) => Promise<void>;
  removeRoomUser: (roomId: string, userEmail: string) => Promise<void>;
  getRoomUsers: (roomId: string) => Promise<{ userEmail: string; role: Role }[]>;
  getUserRoleForRoom: (roomId: string, userEmail: string) => Role | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const token = user?.token;

  const { rooms, addRoom, updateRoom, deleteRoom } = useRooms(token);
  const { bookings, addBooking, updateBooking, deleteBooking } = useBookings(token);
  const { permissions, loadRoomUsers, addRoomUser, removeRoomUser, getUserRoleForRoom } = usePermissions(token);

  const isRoomAvailable = (roomId: string, start: Date, end: Date, excludeBookingId?: string) => {
    return checkRoomAvailability(bookings, roomId, start, end, excludeBookingId);
  };

  const getRoomUsers = async (roomId: string) => {
    const users = await loadRoomUsers(roomId);
    return users.map(u => ({ userEmail: u.userEmail, role: u.role }));
  };

  return (
    <DataContext.Provider
      value={{
        rooms,
        bookings,
        roomPermissions: permissions,
        addRoom,
        updateRoom,
        deleteRoom,
        addBooking,
        updateBooking,
        deleteBooking,
        isRoomAvailable,
        addRoomUser,
        removeRoomUser,
        getRoomUsers,
        getUserRoleForRoom,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};