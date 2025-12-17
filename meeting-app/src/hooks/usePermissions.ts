import { useState, useCallback } from 'react';
import { permissionsService } from '../services/permissionsService';
import type { Role, RoomPermission } from '../types';

export const usePermissions = (token?: string) => {
  const [permissions, setPermissions] = useState<RoomPermission[]>([]);

  const loadRoomUsers = useCallback(async (roomId: string) => {
    const users = await permissionsService.getRoomUsers(roomId, token);
    setPermissions(prev => {
      const filtered = prev.filter(p => p.roomId !== roomId);
      return [...filtered, ...users];
    });
    return users;
  }, [token]);

  const addRoomUser = async (roomId: string, userEmail: string, role: Role) => {
    if (!token) throw new Error('Not authenticated');
    const newPermission = await permissionsService.addRoomUser(roomId, userEmail, role, token);
    setPermissions(prev => {
      const filtered = prev.filter(p => !(p.roomId === roomId && p.userEmail === userEmail));
      return [...filtered, newPermission];
    });
  };

  const removeRoomUser = async (roomId: string, userEmail: string) => {
    if (!token) throw new Error('Not authenticated');
    await permissionsService.removeRoomUser(roomId, userEmail, token);
    setPermissions(prev => prev.filter(p => !(p.roomId === roomId && p.userEmail === userEmail)));
  };

  const getUserRoleForRoom = (roomId: string, userEmail: string): Role | null => {
    const permission = permissions.find(p => p.roomId === roomId && p.userEmail === userEmail);
    return permission ? permission.role : null;
  };

  return {
    permissions,
    loadRoomUsers,
    addRoomUser,
    removeRoomUser,
    getUserRoleForRoom,
  };
};
