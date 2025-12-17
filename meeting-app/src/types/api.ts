export interface ApiRoom {
  id: number;
  name: string;
  description?: string;
  capacity?: number;
}

export interface ApiBooking {
  id: number;
  roomId?: number;
  room_id?: number;
  userId?: number;
  user_id?: number;
  userEmail?: string;
  user_email?: string;
  title?: string;
  purpose?: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
}

export interface ApiRoomUser {
  userEmail: string;
  role: 'admin' | 'user';
}

export interface ApiError {
  error: string;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
}
