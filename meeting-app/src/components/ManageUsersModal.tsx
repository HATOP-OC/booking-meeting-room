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
  const { roomPermissions, addRoomUser, removeRoomUser, getRoomUsers } = useData();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('user');

  const roomUsers = roomPermissions.filter(p => p.roomId === roomId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      getRoomUsers(roomId).catch(() => {});
    }
  }, [isOpen, roomId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) return;
    setLoading(true);
    try {
      await addRoomUser(roomId, email, role);
      setEmail('');
    } catch (err: any) {
      setError(err?.message || 'Failed to add');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Users for ${roomName}`}>
      <div className="space-y-6">
        {error && <div className="bg-red-50 text-red-700 p-2 rounded">{error}</div>}
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">User Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500" 
              placeholder="user@example.com"
              required
            />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select 
              value={role} 
              onChange={e => setRole(e.target.value as Role)}
              className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm">
            {loading ? 'Adding...' : 'Add'}
          </button>
        </form>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Current Users</h4>
          {roomUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">No users added specifically to this room.</p>
          ) : (
            <ul className="divide-y divide-gray-100 bg-white rounded-lg shadow-sm">
              {roomUsers.map((perm) => (
                <li key={perm.userEmail} className="py-3 px-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-sm">
                      {perm.userEmail.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{perm.userEmail}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Role: <span className={`ml-1 inline-block px-2 py-0.5 rounded-full text-xs ${perm.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{perm.role}</span></div>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      setError('');
                      try {
                        await removeRoomUser(roomId, perm.userEmail);
                      } catch (err: any) {
                        setError(err?.message || 'Failed to remove');
                      }
                    }}
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
