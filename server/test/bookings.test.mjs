process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/index.js';

const api = request(app);

test('bookings create/edit/delete + conflict', async (t) => {
  const email = `btest+${Date.now()}@example.com`;
  const password = 'pw12345';

  // register
  const reg = await api.post('/api/register').send({ name: 'B Test', email, password }).expect(201);
  const token = reg.body.token;

  // create room as admin
  const admin = await api.post('/api/login').send({ email: 'admin@example.com', password: '123456' }).expect(200);
  const adminToken = admin.body.token;
  const room = await api.post('/api/rooms').set('Authorization', `Bearer ${adminToken}`).send({ name: 'BookRoom', description: 'desc', capacity: 2 }).expect(201);
  const roomId = room.body.id;

  // create booking
  const start = new Date();
  start.setHours(start.getHours() + 24);
  const end = new Date(start.getTime());
  end.setHours(end.getHours() + 1);

  const create = await api.post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ roomId, startTime: start.toISOString(), endTime: end.toISOString(), title: 'Meeting' }).expect(201);
  const bookingId = create.body.id;

  // conflict - overlapping
  await api.post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ roomId, startTime: start.toISOString(), endTime: end.toISOString(), title: 'Overlap' }).expect(409);

  // edit booking (owner)
  const newEnd = new Date(end.getTime());
  newEnd.setHours(newEnd.getHours() + 1);
  await api.put(`/api/bookings/${bookingId}`).set('Authorization', `Bearer ${token}`).send({ startTime: start.toISOString(), endTime: newEnd.toISOString(), title: 'Updated' }).expect(200);

  // delete booking (owner)
  await api.delete(`/api/bookings/${bookingId}`).set('Authorization', `Bearer ${token}`).expect(200);

  // cleanup remove room
  await api.delete(`/api/rooms/${roomId}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
});