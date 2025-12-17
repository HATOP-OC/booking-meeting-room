import { useState, useEffect } from 'react';
import { roomsService } from '../services/roomsService';
import type { Room } from '../types';

export const useRooms = (token?: string) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const data = await roomsService.getAll(token);
        setRooms(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [token]);

  const addRoom = async (roomData: Omit<Room, 'id'>) => {
    if (!token) throw new Error('Not authenticated');
    const newRoom = await roomsService.create(roomData, token);
    setRooms(prev => [...prev, newRoom]);
    return newRoom;
  };

  const updateRoom = async (id: string, roomData: Partial<Room>) => {
    if (!token) throw new Error('Not authenticated');
    const updatedRoom = await roomsService.update(id, roomData, token);
    setRooms(prev => prev.map(room => (room.id === id ? updatedRoom : room)));
    return updatedRoom;
  };

  const deleteRoom = async (id: string) => {
    if (!token) throw new Error('Not authenticated');
    await roomsService.delete(id, token);
    setRooms(prev => prev.filter(room => room.id !== id));
  };

  return {
    rooms,
    loading,
    error,
    addRoom,
    updateRoom,
    deleteRoom,
  };
};
