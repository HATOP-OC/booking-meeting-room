CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  location TEXT
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  purpose TEXT
);

-- Seed data (idempotent)
INSERT INTO users (id, name, email) VALUES (1, 'Admin', 'admin@example.com') ON CONFLICT DO NOTHING;
INSERT INTO rooms (id, name, capacity, location) VALUES (1, 'Ocean', 8, '1st Floor') ON CONFLICT DO NOTHING;
INSERT INTO rooms (id, name, capacity, location) VALUES (2, 'Mountain', 6, '2nd Floor') ON CONFLICT DO NOTHING;
INSERT INTO bookings (room_id, user_id, start_time, end_time, purpose) VALUES (1,1,'2025-12-17 09:00','2025-12-17 10:00','Team sync') ON CONFLICT DO NOTHING;

-- Ensure sequences are advanced to avoid duplicate key conflicts when explicit ids were inserted
SELECT setval(pg_get_serial_sequence('users','id'), COALESCE((SELECT MAX(id) FROM users), 1), true);
SELECT setval(pg_get_serial_sequence('rooms','id'), COALESCE((SELECT MAX(id) FROM rooms), 1), true);
SELECT setval(pg_get_serial_sequence('bookings','id'), COALESCE((SELECT MAX(id) FROM bookings), 1), true);
