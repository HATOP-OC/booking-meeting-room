// src/context/DataContext.tsx
import React, { createContext, useContext, useState } from 'react';
import type { Room, Booking, RoomPermission, Role } from '../types'; 
import { MOCK_ROOMS, MOCK_BOOKINGS } from '../data/mockData';

interface DataContextType {
  rooms: Room[];
  bookings: Booking[];
  roomPermissions: RoomPermission[];
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (id: string, data: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  addBooking: (booking: Omit<Booking, 'id'>) => void;
  updateBooking: (id: string, data: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  isRoomAvailable: (roomId: string, start: Date, end: Date, excludeBookingId?: string) => boolean;
  addRoomUser: (roomId: string, userEmail: string, role: Role) => void;
  removeRoomUser: (roomId: string, userEmail: string) => void;
  getUserRoleForRoom: (roomId: string, userEmail: string) => Role | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [roomPermissions, setRoomPermissions] = useState<RoomPermission[]>([]);

  const addRoom = (roomData: Omit<Room, 'id'>) => {
    const newRoom: Room = { ...roomData, id: Date.now().toString() };
    setRooms(prev => [...prev, newRoom]);
  };

  const updateRoom = (id: string, data: Partial<Room>) => {
    setRooms(prev => prev.map(room => room.id === id ? { ...room, ...data } : room));
  };

  const deleteRoom = (id: string) => {
    setRooms(prev => prev.filter(room => room.id !== id));
    setBookings(prev => prev.filter(b => b.roomId !== id));
    setRoomPermissions(prev => prev.filter(p => p.roomId !== id));
  };

  const addBooking = (bookingData: Omit<Booking, 'id'>) => {
    const newBooking: Booking = { ...bookingData, id: Date.now().toString() };
    setBookings(prev => [...prev, newBooking]);
  };

  const updateBooking = (id: string, data: Partial<Booking>) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  };

  const deleteBooking = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const isRoomAvailable = (roomId: string, start: Date, end: Date, excludeBookingId?: string) => {
    return !bookings.some(booking => {
      if (booking.roomId !== roomId) return false;
      if (excludeBookingId && booking.id === excludeBookingId) return false;
      
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      return start < bookingEnd && end > bookingStart;
    });
  };

  const addRoomUser = (roomId: string, userEmail: string, role: Role) => {
    setRoomPermissions(prev => {
      const filtered = prev.filter(p => !(p.roomId === roomId && p.userEmail === userEmail));
      return [...filtered, { roomId, userEmail, role }];
    });
  };

  const removeRoomUser = (roomId: string, userEmail: string) => {
    setRoomPermissions(prev => prev.filter(p => !(p.roomId === roomId && p.userEmail === userEmail)));
  };

  const getUserRoleForRoom = (roomId: string, userEmail: string): Role | null => {
    const perm = roomPermissions.find(p => p.roomId === roomId && p.userEmail === userEmail);
    return perm ? perm.role : null;
  };

  return (
    <DataContext.Provider value={{ 
      rooms, bookings, roomPermissions, 
      addRoom, updateRoom, deleteRoom, 
      addBooking, updateBooking, deleteBooking, 
      isRoomAvailable, 
      addRoomUser, removeRoomUser, getUserRoleForRoom 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};