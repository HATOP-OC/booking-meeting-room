# Server for meeting-app

Minimal Express server that connects to PostgreSQL.

Endpoints:
- `GET /api/rooms` — list of rooms
- `GET /api/bookings` — list of bookings with room and user info
- `POST /api/bookings` — create a booking, body: { roomId, userEmail, title, startTime, endTime }
- `PUT /api/bookings/:id` — update booking times/title
- `DELETE /api/bookings/:id` — delete a booking

Configuration:
- Copy `server/.env.example` to `.env` and adjust `DATABASE_URL` if needed.

Notes:
- When creating bookings via `POST /api/bookings` the server will look up a user by email and create a user record if one doesn't exist (username is derived from the email local part).
- `db/init.sql` advances serial sequences after seeding so future inserts do not conflict with explicit seed ids.

Run (dev):

npm install
npm run dev

The server defaults to `http://localhost:4000`. 
