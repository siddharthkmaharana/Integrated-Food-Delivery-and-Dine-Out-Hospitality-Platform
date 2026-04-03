import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';

describe('WebSocket Tests', () => {
  let httpServer, ioServer, clientSocket, clientSocket2;

  beforeAll((done) => {
    httpServer = createServer();
    ioServer = new Server(httpServer);

    httpServer.listen(() => {
      const port = httpServer.address().port;

      // Setup socket handler
      ioServer.on('connection', (socket) => {
        socket.on('join_order', (orderId) => {
          socket.join(orderId);
          socket.emit('joined', { orderId });
        });
        socket.on('join_restaurant', (restaurantId) => {
          socket.join(restaurantId);
          socket.emit('joined', { restaurantId });
        });
        socket.on('update_order_status', (data) => {
          ioServer.emit('order_update', {
            orderId: data.orderId,
            status: data.status,
            timestamp: new Date()
          });
        });
      });

      clientSocket = Client(`http://localhost:${port}`);
      clientSocket2 = Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    ioServer.close();
    httpServer.close();
    clientSocket.close();
    clientSocket2.close();
  });

  // Test 1 — Connection
  test('Client should connect to server', (done) => {
    expect(clientSocket.connected).toBe(true);
    done();
  });

  // Test 2 — Join order room
  test('Client should join order room', (done) => {
    clientSocket.emit('join_order', 'order123');
    clientSocket.on('joined', (data) => {
      expect(data.orderId).toBe('order123');
      done();
    });
  });

  // Test 3 — Join restaurant room
  test('Client should join restaurant room', (done) => {
    clientSocket.emit('join_restaurant', 'rest456');
    clientSocket.on('joined', (data) => {
      expect(data.restaurantId).toBe('rest456');
      done();
    });
  });

  // Test 4 — Order status update broadcast
  test('Should broadcast order_update to all clients', (done) => {
    clientSocket2.on('order_update', (data) => {
      expect(data.orderId).toBe('order789');
      expect(data.status).toBe('DELIVERED');
      done();
    });
    clientSocket.emit('update_order_status', {
      orderId: 'order789',
      status: 'DELIVERED'
    });
  });

  // Test 5 — Reconnection handling
  test('Client should reconnect after disconnect', (done) => {
    clientSocket.disconnect();
    expect(clientSocket.connected).toBe(false);
    clientSocket.connect();
    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });

  // Test 6 — Multiple clients
  test('Multiple clients should receive same update', (done) => {
    let count = 0;
    const handler = (data) => {
      expect(data.status).toBe('ORDER_PREPARING');
      count++;
      if (count === 2) done();
    };
    clientSocket.on('order_update', handler);
    clientSocket2.on('order_update', handler);
    clientSocket.emit('update_order_status', {
      orderId: 'orderABC',
      status: 'ORDER_PREPARING'
    });
  });
});
