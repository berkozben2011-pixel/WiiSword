const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3000;
const rooms = new Map();

app.use(express.static(__dirname, { extensions: ['html'] }));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'sword-duel-controller' }));

function makeCode() {
  let code;
  do { code = crypto.randomInt(100000, 1000000).toString(); } while (rooms.has(code));
  return code;
}

io.on('connection', socket => {
  socket.on('host:create-room', callback => {
    const code = makeCode();
    rooms.set(code, { hostId: socket.id, controllerIds: new Set() });
    socket.join(`room:${code}`);
    socket.data.hostRoom = code;
    if (typeof callback === 'function') callback({ ok: true, code });
  });

  socket.on('controller:join', ({ code } = {}, callback) => {
    const room = rooms.get(String(code || ''));
    if (!room || room.controllerIds.size >= 2) {
      if (typeof callback === 'function') callback({ ok: false, error: 'Oda bulunamadı veya iki telefon zaten bağlı.' });
      return;
    }
    room.controllerIds.add(socket.id);
    socket.data.controllerRoom = String(code);
    socket.join(`room:${code}`);
    io.to(room.hostId).emit('controller:status', { connected: true, count: room.controllerIds.size });
    if (typeof callback === 'function') callback({ ok: true });
  });

  socket.on('controller:input', payload => {
    const code = socket.data.controllerRoom;
    if (!code || !rooms.has(code)) return;
    const room = rooms.get(code);
    if (!room.controllerIds.has(socket.id)) return;
    io.to(room.hostId).emit('controller:input', payload);
  });

  socket.on('disconnect', () => {
    const code = socket.data.controllerRoom;
    if (code && rooms.has(code)) {
      const room = rooms.get(code);
      room.controllerIds.delete(socket.id);
      io.to(room.hostId).emit('controller:status', { connected: room.controllerIds.size > 0, count: room.controllerIds.size });
    }
    const hostCode = socket.data.hostRoom;
    if (hostCode && rooms.has(hostCode)) {
      io.to(`room:${hostCode}`).emit('room:closed');
      rooms.delete(hostCode);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`Sword Duel server listening on ${PORT}`));
