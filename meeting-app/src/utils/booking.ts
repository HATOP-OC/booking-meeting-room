import type { Booking } from '../types';

export const checkRoomAvailability = (
  bookings: Booking[],
  roomId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string
): boolean => {
  return !bookings.some(booking => {
    if (booking.roomId !== roomId) return false;
    if (excludeBookingId && booking.id === excludeBookingId) return false;

    const bookingStart = new Date(booking.startTime);
    const bookingEnd = new Date(booking.endTime);

    return start < bookingEnd && end > bookingStart;
  });
};
