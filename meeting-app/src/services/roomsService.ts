import { apiClient } from './apiClient';
import type { Room } from '../types';
import type { ApiRoom } from '../types/api';

const mapApiRoom = (apiRoom: ApiRoom): Room => ({
  id: apiRoom.id.toString(),
  name: apiRoom.name,
  description: apiRoom.description || '',
  capacity: apiRoom.capacity,
});

export const roomsService = {
  async getAll(token?: string): Promise<Room[]> {
    const data = await apiClient.get<ApiRoom[]>('/api/rooms', token);
    return data.map(mapApiRoom);
  },

  async create(roomData: Omit<Room, 'id'>, token: string): Promise<Room> {
    const data = await apiClient.post<ApiRoom>('/api/rooms', roomData, token);
    return mapApiRoom(data);
  },

  async update(id: string, roomData: Partial<Room>, token: string): Promise<Room> {
    const data = await apiClient.put<ApiRoom>(`/api/rooms/${id}`, roomData, token);
    return mapApiRoom(data);
  },

  async delete(id: string, token: string): Promise<void> {
    await apiClient.delete(`/api/rooms/${id}`, token);
  },
};
