import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Room, Booking, RoomPermission, Role } from '../types';

interface DataContextType {
  rooms: Room[];
  bookings: Booking[];
  roomPermissions: RoomPermission[];
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (id: string, data: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  addBooking: (booking: Omit<Booking, 'id'>) => Promise<void>;
  updateBooking: (id: string, data: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  isRoomAvailable: (roomId: string, start: Date, end: Date, excludeBookingId?: string) => boolean;
  addRoomUser: (roomId: string, userEmail: string, role: Role) => void;
  removeRoomUser: (roomId: string, userEmail: string) => void;
  getUserRoleForRoom: (roomId: string, userEmail: string) => Role | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

const mapApiBooking = (b: any): Booking => ({
  id: b.id.toString(),
  roomId: b.roomId?.toString() || b.room_id?.toString(),
  userId: b.userId?.toString() || b.user_id?.toString() || (b.userId === null ? null : ''),
  userEmail: b.userEmail || b.user_email || '',
  title: b.title || b.purpose || '',
  startTime: b.startTime || b.start_time,
  endTime: b.endTime || b.end_time,
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [roomPermissions, setRoomPermissions] = useState<RoomPermission[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rRes, bRes] = await Promise.all([
          fetch(`${API_BASE}/api/rooms`),
          fetch(`${API_BASE}/api/bookings`),
        ]);
        if (rRes.ok) {
          const rData = await rRes.json();
          setRooms(rData.map((r: any) => ({ id: r.id.toString(), name: r.name, description: r.description || '', capacity: r.capacity })));
        }
        if (bRes.ok) {
          const bData = await bRes.json();
          setBookings(bData.map((b: any) => mapApiBooking(b)));
        }
      } catch (err) {
        console.error('Failed to fetch initial data', err);
      }
    };
    fetchData();
  }, []);

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

  const addBooking = async (bookingData: Omit<Booking, 'id'>) => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: bookingData.roomId,
          userId: bookingData.userId,
          userEmail: bookingData.userEmail,
          title: bookingData.title,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add booking');
      }
      const data = await res.json();
      const mapped = mapApiBooking(data);
      setBookings(prev => [...prev, mapped]);
    } catch (err: any) {
      console.error('addBooking error', err);
      throw err;
    }
  };

  const updateBooking = async (id: string, data: Partial<Booking>) => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.title, startTime: data.startTime, endTime: data.endTime }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update booking');
      }
      const updated = await res.json();
      const mapped = mapApiBooking(updated);
      setBookings(prev => prev.map(b => b.id === id ? mapped : b));
    } catch (err: any) {
      console.error('updateBooking error', err);
      throw err;
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete booking');
      }
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('deleteBooking error', err);
      throw err;
    }
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