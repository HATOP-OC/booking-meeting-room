import React, { useState } from 'react';
import { Modal } from './Modal';
import type { Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({ 
  isOpen, onClose, roomId, roomName 
}) => {
  const { user } = useAuth();
  const { bookings, addBooking, updateBooking, deleteBooking, getUserRoleForRoom } = useData();
  
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const roomBookings = bookings.filter(b => b.roomId === roomId).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const userRole = user ? getUserRoleForRoom(roomId, user.email) : null;
  const isAdmin = user?.role === 'admin' || userRole === 'admin';

  const resetForm = () => {
    setTitle('');
    setStartTime('');
    setEndTime('');
    setEditingId(null);
    setError('');
  };

  const handleEdit = (booking: Booking) => {
    setTitle(booking.title);
    setStartTime(booking.startTime.slice(0, 16)); // Format for datetime-local
    setEndTime(booking.endTime.slice(0, 16));
    setEditingId(booking.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    setError('');
    try {
      await deleteBooking(id);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete booking');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) return;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      setError('End time must be after start time');
      return;
    }

    // Conflict check
    const hasConflict = bookings.some(booking => {
      if (booking.roomId !== roomId) return false;
      if (editingId && booking.id === editingId) return false; // Ignore self when editing

      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      return (start < bookingEnd && end > bookingStart);
    });

    if (hasConflict) {
      setError('Time slot conflict!');
      return;
    }

    try {
      if (editingId) {
        await updateBooking(editingId, {
          title,
          startTime: start.toISOString(),
          endTime: end.toISOString()
        });
      } else {
        await addBooking({
          roomId,
          userId: user.id,
          userEmail: user.email,
          title,
          startTime: start.toISOString(),
          endTime: end.toISOString()
        });
      }
      resetForm();
    } catch (err: any) {
      if (err.message && err.message.includes('time conflict')) setError('Time slot conflict!');
      else setError(err?.message || 'Failed to save booking');
    }
  };

  const canModify = (booking: Booking) => {
    if (!user) return false;
    // allow admin, same user id, or same email (since backend may create different numeric user ids)
    return isAdmin || booking.userId === user.id || booking.userEmail === user.email;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Bookings for ${roomName}`}>
      <div className="space-y-6">
        {/* Form */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">{editingId ? 'Edit Booking' : 'New Booking'}</h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="text-red-600 text-sm">{error}</div>}
            
            <div>
              <input 
                placeholder="Meeting Title"
                required 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full border border-gray-300 rounded-md p-2 text-sm" 
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input 
                required 
                type="datetime-local" 
                value={startTime} 
                onChange={e => setStartTime(e.target.value)} 
                className="w-full border border-gray-300 rounded-md p-2 text-sm" 
              />
              <input 
                required 
                type="datetime-local" 
                value={endTime} 
                onChange={e => setEndTime(e.target.value)} 
                className="w-full border border-gray-300 rounded-md p-2 text-sm" 
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-sm">
                {editingId ? 'Update' : 'Book'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-200 rounded-md text-sm">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div>
          <h4 className="font-medium mb-2">Scheduled Meetings</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {roomBookings.length === 0 ? (
              <p className="text-gray-500 text-sm">No bookings yet.</p>
            ) : (
              roomBookings.map(booking => (
                <div key={booking.id} className="border border-gray-200 p-3 rounded-md flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{booking.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(booking.startTime).toLocaleString()} - {new Date(booking.endTime).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">by {booking.userEmail}</div>
                  </div>
                  
                  {canModify(booking) && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(booking)} className="text-blue-600 text-xs hover:underline">Edit</button>
                      <button onClick={() => handleDelete(booking.id)} className="text-red-600 text-xs hover:underline">Cancel</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};