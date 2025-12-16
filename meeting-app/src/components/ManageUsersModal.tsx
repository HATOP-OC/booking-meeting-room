import React, { useState } from 'react';
import { Modal } from './Modal';
import type { Role } from '../types';
import { useData } from '../context/DataContext';

interface ManageUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}

export const ManageUsersModal: React.FC<ManageUsersModalProps> = ({ isOpen, onClose, roomId, roomName }) => {
  const { roomPermissions, addRoomUser, removeRoomUser } = useData();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('user');

  const roomUsers = roomPermissions.filter(p => p.roomId === roomId);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      addRoomUser(roomId, email, role);
      setEmail('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Users for ${roomName}`}>
      <div className="space-y-6">
        <form onSubmit={handleAdd} className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">User Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
              placeholder="user@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select 
              value={role} 
              onChange={e => setRole(e.target.value as Role)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            Add
          </button>
        </form>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Current Users</h4>
          {roomUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">No users added specifically to this room.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {roomUsers.map((perm) => (
                <li key={perm.userEmail} className="py-2 flex justify-between items-center">
                  <div>
                    <span className="text-gray-900 font-medium">{perm.userEmail}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${perm.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                      {perm.role}
                    </span>
                  </div>
                  <button 
                    onClick={() => removeRoomUser(roomId, perm.userEmail)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};
