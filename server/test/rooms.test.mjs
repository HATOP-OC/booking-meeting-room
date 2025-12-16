process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/index.js';

const api = request(app);

test('rooms CRUD + permissions', async (t) => {
  const adminEmail = 'admin@example.com';
  const adminPass = '123456';

  const login = await api.post('/api/login').send({ email: adminEmail, password: adminPass }).expect(200);
  const token = login.body.token;

  // create room
  const create = await api.post('/api/rooms').set('Authorization', `Bearer ${token}`).send({ name: 'Test Room', description: 'desc', capacity: 4 }).expect(201);
  const roomId = create.body.id;

  // add user permission
  await api.post(`/api/rooms/${roomId}/users`).set('Authorization', `Bearer ${token}`).send({ userEmail: 'user2@example.com', role: 'admin' }).expect(201);

  // list permissions
  const perms = await api.get(`/api/rooms/${roomId}/users`).expect(200);
  assert.ok(perms.body.find(p => p.userEmail === 'user2@example.com'));

  // delete permission
  await api.delete(`/api/rooms/${roomId}/users`).set('Authorization', `Bearer ${token}`).send({ userEmail: 'user2@example.com' }).expect(200);

  // cleanup
  await api.delete(`/api/rooms/${roomId}`).set('Authorization', `Bearer ${token}`).expect(200);
});