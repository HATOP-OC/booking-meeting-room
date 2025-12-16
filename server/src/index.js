import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.PG_CONN_STRING || 'postgresql://postgres:postgres@localhost:5432/meeting_app'
});

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const HASH_ROUNDS = parseInt(process.env.HASH_ROUNDS || '10', 10);

// Ensure schema (run once at start) - add columns if they don't exist and seed admin password hashed
const ensureSchema = async () => {
  // Add columns if missing
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'");

  // If admin user exists but has no password or no role, set hashed default password and role
  const adminQ = await pool.query("SELECT id, email, password, role FROM users WHERE email = $1", ['admin@example.com']);
  if (adminQ.rows.length) {
    const admin = adminQ.rows[0];
    if (!admin.password || admin.password === '123456') {
      const hash = await bcrypt.hash('123456', HASH_ROUNDS);
      await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hash, admin.id]);
    }
    if (admin.role !== 'admin') {
      await pool.query("UPDATE users SET role='admin' WHERE id=$1", [admin.id]);
    }
  } else {
    // create default admin
    const hash = await bcrypt.hash('123456', HASH_ROUNDS);
    await pool.query('INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', ['Admin', 'admin@example.com', hash, 'admin']);
  }

  // ensure serial sequences are advanced
  await pool.query("SELECT setval(pg_get_serial_sequence('users','id'), COALESCE((SELECT MAX(id) FROM users), 1), true)");
};

ensureSchema().catch(err => console.error('schema init error', err));

// Helper: convert DB row to API shape
const mapBookingRow = (row) => ({
  id: row.id.toString(),
  roomId: row.room_id.toString(),
  userId: row.user_id ? row.user_id.toString() : null,
  userEmail: row.user_email || row.email || null,
  title: row.purpose || row.title || '',
  startTime: row.start_time ? new Date(row.start_time).toISOString() : null,
  endTime: row.end_time ? new Date(row.end_time).toISOString() : null,
  roomName: row.room_name || null,
  userName: row.user_name || null
});

// auth middleware
const authMiddleware = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing_token' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { userId, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' });
  }
};

app.get('/api/rooms', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rooms ORDER BY id');
    const rooms = rows.map(r => ({ id: r.id.toString(), name: r.name, description: r.location || r.description || '', capacity: r.capacity }));
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Create room (admin only)
app.post('/api/rooms', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const { name, description, capacity } = req.body;
    if (!name || !description) return res.status(400).json({ error: 'missing_fields' });
    const insert = await pool.query('INSERT INTO rooms (name, capacity, location) VALUES ($1,$2,$3) RETURNING *', [name, capacity || null, description]);
    const r = insert.rows[0];
    res.status(201).json({ id: r.id.toString(), name: r.name, description: r.location, capacity: r.capacity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Update room (admin only)
app.put('/api/rooms/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const { id } = req.params;
    const { name, description, capacity } = req.body;
    const upd = await pool.query('UPDATE rooms SET name=$1, capacity=$2, location=$3 WHERE id=$4 RETURNING *', [name, capacity || null, description, parseInt(id)]);
    if (!upd.rows.length) return res.status(404).json({ error: 'not_found' });
    const r = upd.rows[0];
    res.json({ id: r.id.toString(), name: r.name, description: r.location, capacity: r.capacity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Delete room (admin only)
app.delete('/api/rooms/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const { id } = req.params;
    const del = await pool.query('DELETE FROM rooms WHERE id=$1 RETURNING *', [parseInt(id)]);
    if (!del.rows.length) return res.status(404).json({ error: 'not_found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Room permissions
app.get('/api/rooms/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const q = await pool.query('SELECT user_email, role FROM room_permissions WHERE room_id=$1', [parseInt(id)]);
    res.json(q.rows.map(r => ({ userEmail: r.user_email, role: r.role })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.post('/api/rooms/:id/users', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail, role } = req.body;
    if (!userEmail || !role) return res.status(400).json({ error: 'missing_fields' });
    const roomId = parseInt(id);
    const roomQ = await pool.query('SELECT * FROM rooms WHERE id=$1', [roomId]);
    if (!roomQ.rows.length) return res.status(404).json({ error: 'room_not_found' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      const permQ = await pool.query('SELECT role FROM room_permissions WHERE room_id=$1 AND user_email=$2', [roomId, req.user.email]);
      if (!permQ.rows.length || permQ.rows[0].role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    }

    // ensure user exists
    let uid = null;
    const userQ = await pool.query('SELECT id FROM users WHERE email=$1', [userEmail]);
    if (userQ.rows.length) uid = userQ.rows[0].id;
    else {
      const name = userEmail.split('@')[0];
      const insertU = await pool.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id', [name, userEmail]);
      uid = insertU.rows[0].id;
    }

    await pool.query('INSERT INTO room_permissions (room_id, user_id, user_email, role) VALUES ($1,$2,$3,$4) ON CONFLICT (room_id, user_email) DO UPDATE SET role = EXCLUDED.role', [roomId, uid, userEmail, role]);
    res.status(201).json({ userEmail, role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.delete('/api/rooms/:id/users', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).json({ error: 'missing_fields' });
    const roomId = parseInt(id);

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      const permQ = await pool.query('SELECT role FROM room_permissions WHERE room_id=$1 AND user_email=$2', [roomId, req.user.email]);
      if (!permQ.rows.length || permQ.rows[0].role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    }

    await pool.query('DELETE FROM room_permissions WHERE room_id=$1 AND user_email=$2', [roomId, userEmail]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT b.*, r.name as room_name, u.name as user_name, u.email as user_email FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id LEFT JOIN users u ON b.user_id = u.id ORDER BY b.start_time");
    res.json(rows.map(mapBookingRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'missing fields' });

    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'user_exists' });

    const hashed = await bcrypt.hash(password, HASH_ROUNDS);
    const insert = await pool.query('INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role', [name, email, hashed, 'user']);
    const user = insert.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: { id: user.id.toString(), name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'missing fields' });

    const q = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!q.rows.length) return res.status(401).json({ error: 'invalid_credentials' });
    const user = q.rows[0];

    const stored = user.password || '';
    let ok = false;
    try {
      ok = await bcrypt.compare(password, stored);
    } catch (e) {
      ok = stored === password; // fallback if stored plain
      if (ok) {
        // hash plain password for future
        const newHash = await bcrypt.hash(password, HASH_ROUNDS);
        await pool.query('UPDATE users SET password=$1 WHERE id=$2', [newHash, user.id]);
      }
    }

    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id.toString(), name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// me
app.get('/api/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing_token' });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    const userQ = await pool.query('SELECT id,name,email,role FROM users WHERE id = $1', [payload.userId]);
    if (!userQ.rows.length) return res.status(404).json({ error: 'not_found' });
    const u = userQ.rows[0];
    res.json({ id: u.id.toString(), name: u.name, email: u.email, role: u.role });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'invalid_token' });
  }
});

// Create booking (authenticated)
app.post('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const { roomId, userEmail: bodyEmail, title, startTime, endTime } = req.body;
    const requester = req.user;
    if (!roomId || !startTime || !endTime) return res.status(400).json({ error: 'missing fields' });

    const room_id = parseInt(roomId);
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) return res.status(400).json({ error: 'invalid time range' });

    const conflictQ = await pool.query(
      'SELECT COUNT(*) FROM bookings WHERE room_id = $1 AND NOT (end_time <= $2 OR start_time >= $3)',
      [room_id, start.toISOString(), end.toISOString()]
    );
    if (parseInt(conflictQ.rows[0].count) > 0) return res.status(409).json({ error: 'time conflict' });

    let uid = null;
    let userEmail = requester.email;
    if (bodyEmail && requester.role === 'admin') userEmail = bodyEmail;

    const userQ = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
    if (userQ.rows.length > 0) uid = userQ.rows[0].id;
    else {
      const name = userEmail.split('@')[0];
      const insertU = await pool.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id', [name, userEmail]);
      uid = insertU.rows[0].id;
    }

    const insertQ = await pool.query('INSERT INTO bookings (room_id, user_id, start_time, end_time, purpose) VALUES ($1,$2,$3,$4,$5) RETURNING *', [room_id, uid, start.toISOString(), end.toISOString(), title || null]);
    const row = insertQ.rows[0];

    const joined = await pool.query('SELECT b.*, r.name as room_name, u.name as user_name, u.email as user_email FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id LEFT JOIN users u ON b.user_id = u.id WHERE b.id = $1', [row.id]);
    res.status(201).json(mapBookingRow(joined.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Update booking (authenticated + authz)
app.put('/api/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, startTime, endTime } = req.body;
    const bid = parseInt(id);
    const requester = req.user;

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) return res.status(400).json({ error: 'invalid time range' });

    const existingQ = await pool.query('SELECT * FROM bookings WHERE id = $1', [bid]);
    if (!existingQ.rows.length) return res.status(404).json({ error: 'not found' });
    const existing = existingQ.rows[0];

    // Authorization: allow owner or global admin or room admin
    if (requester.role !== 'admin' && requester.userId !== existing.user_id) {
      const permQ = await pool.query('SELECT role FROM room_permissions WHERE room_id=$1 AND user_email=$2', [existing.room_id, requester.email]);
      if (!permQ.rows.length || permQ.rows[0].role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    }

    const conflictQ = await pool.query(
      'SELECT COUNT(*) FROM bookings WHERE room_id = $1 AND id <> $4 AND NOT (end_time <= $2 OR start_time >= $3)',
      [existing.room_id, start.toISOString(), end.toISOString(), bid]
    );
    if (parseInt(conflictQ.rows[0].count) > 0) return res.status(409).json({ error: 'time conflict' });

    const updQ = await pool.query('UPDATE bookings SET start_time=$1, end_time=$2, purpose=$3 WHERE id=$4 RETURNING *', [start.toISOString(), end.toISOString(), title || null, bid]);
    const row = updQ.rows[0];
    const joined = await pool.query('SELECT b.*, r.name as room_name, u.name as user_name, u.email as user_email FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id LEFT JOIN users u ON b.user_id = u.id WHERE b.id = $1', [row.id]);
    res.json(mapBookingRow(joined.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});
// Delete booking (authenticated + authz)
app.delete('/api/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const bid = parseInt(id);
    const requester = req.user;

    const existingQ = await pool.query('SELECT * FROM bookings WHERE id = $1', [bid]);
    if (!existingQ.rows.length) return res.status(404).json({ error: 'not found' });
    const existing = existingQ.rows[0];

    if (requester.role !== 'admin' && requester.userId !== existing.user_id) {
      const permQ = await pool.query('SELECT role FROM room_permissions WHERE room_id=$1 AND user_email=$2', [existing.room_id, requester.email]);
      if (!permQ.rows.length || permQ.rows[0].role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    }

    const del = await pool.query('DELETE FROM bookings WHERE id=$1 RETURNING *', [bid]);
    if (!del.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Test utilities (only available in test env)
if (process.env.NODE_ENV === 'test') {
  app.delete('/api/test-utils/user', async (req, res) => {
    try {
      const { email } = req.body;
      await pool.query('DELETE FROM users WHERE email=$1', [email]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'db error' });
    }
  });
}

export { app, pool };
export default app;

// Only start the HTTP listener when not testing and when LISTEN flag isn't explicitly false.
if (process.env.NODE_ENV !== 'test' && process.env.LISTEN !== 'false') {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server listening on ${port}`);
  });
}

