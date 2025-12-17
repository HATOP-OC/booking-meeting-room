import { apiClient } from './apiClient';
import type { Booking } from '../types';
import type { ApiBooking } from '../types/api';

const mapApiBooking = (apiBooking: ApiBooking): Booking => ({
  id: apiBooking.id.toString(),
  roomId: (apiBooking.roomId?.toString() || apiBooking.room_id?.toString()) ?? '',
  userId: (apiBooking.userId?.toString() || apiBooking.user_id?.toString()) ?? '',
  userEmail: apiBooking.userEmail || apiBooking.user_email || '',
  title: apiBooking.title || apiBooking.purpose || '',
  startTime: apiBooking.startTime || apiBooking.start_time || '',
  endTime: apiBooking.endTime || apiBooking.end_time || '',
});

export const bookingsService = {
  async getAll(token?: string): Promise<Booking[]> {
    const data = await apiClient.get<ApiBooking[]>('/api/bookings', token);
    return data.map(mapApiBooking);
  },

  async create(bookingData: Omit<Booking, 'id'>, token?: string): Promise<Booking> {
    const data = await apiClient.post<ApiBooking>(
      '/api/bookings',
      {
        roomId: bookingData.roomId,
        userEmail: bookingData.userEmail,
        title: bookingData.title,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
      },
      token
    );
    return mapApiBooking(data);
  },

  async update(id: string, bookingData: Partial<Booking>, token?: string): Promise<Booking> {
    const data = await apiClient.put<ApiBooking>(
      `/api/bookings/${id}`,
      {
        title: bookingData.title,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
      },
      token
    );
    return mapApiBooking(data);
  },

  async delete(id: string, token?: string): Promise<void> {
    await apiClient.delete(`/api/bookings/${id}`, token);
  },
};
