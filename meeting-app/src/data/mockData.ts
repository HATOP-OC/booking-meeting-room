import type { Room, Booking } from '../types';

export const MOCK_ROOMS: Room[] = [
  {
    id: '1',
    name: 'Conference Hall A',
    description: 'Велика кімната з проектором та дошкою. Підходить для презентацій.',
    capacity: 20
  },
  {
    id: '2',
    name: 'Meeting Room Small',
    description: 'Затишна кімната для командних зустрічей.',
    capacity: 5
  },
  {
    id: '3',
    name: 'Chill Zone',
    description: 'Кімната з диванами для неформальних обговорень.',
    capacity: 8
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    roomId: '1',
    userId: '1',
    userEmail: 'admin@test.com',
    title: 'Daily Standup',
    startTime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(), 
    endTime: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),   
  }
];