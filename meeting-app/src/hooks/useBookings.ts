import { useState, useEffect } from 'react';
import { bookingsService } from '../services/bookingsService';
import type { Booking } from '../types';

export const useBookings = (token?: string) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await bookingsService.getAll(token);
        setBookings(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [token]);

  const addBooking = async (bookingData: Omit<Booking, 'id'>) => {
    const newBooking = await bookingsService.create(bookingData, token);
    setBookings(prev => [...prev, newBooking]);
    return newBooking;
  };

  const updateBooking = async (id: string, bookingData: Partial<Booking>) => {
    const updatedBooking = await bookingsService.update(id, bookingData, token);
    setBookings(prev => prev.map(booking => (booking.id === id ? updatedBooking : booking)));
    return updatedBooking;
  };

  const deleteBooking = async (id: string) => {
    await bookingsService.delete(id, token);
    setBookings(prev => prev.filter(booking => booking.id !== id));
  };

  return {
    bookings,
    loading,
    error,
    addBooking,
    updateBooking,
    deleteBooking,
  };
};
