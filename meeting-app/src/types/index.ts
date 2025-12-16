export type Role = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  token: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
}

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  startTime: string; 
  endTime: string;   
  title: string;
}