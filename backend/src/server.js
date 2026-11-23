import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import socketHandler from './sockets/socketHandler.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  }
});

app.set('io', io);
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
