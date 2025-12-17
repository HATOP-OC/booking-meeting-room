import { apiClient } from './apiClient';
import type { Role, RoomPermission } from '../types';
import type { ApiRoomUser } from '../types/api';

export const permissionsService = {
  async getRoomUsers(roomId: string, token?: string): Promise<RoomPermission[]> {
    const data = await apiClient.get<ApiRoomUser[]>(`/api/rooms/${roomId}/users`, token);
    return data.map(user => ({
      roomId,
      userEmail: user.userEmail,
      role: user.role,
    }));
  },

  async addRoomUser(roomId: string, userEmail: string, role: Role, token: string): Promise<RoomPermission> {
    const data = await apiClient.post<ApiRoomUser>(
      `/api/rooms/${roomId}/users`,
      { userEmail, role },
      token
    );
    return {
      roomId,
      userEmail: data.userEmail,
      role: data.role,
    };
  },

  async removeRoomUser(roomId: string, userEmail: string, token: string): Promise<void> {
    await apiClient.delete(`/api/rooms/${roomId}/users`, token);
  },
};
