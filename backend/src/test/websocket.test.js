import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';

describe('WebSocket Tests', () => {
  let httpServer, ioServer, clientSocket, clientSocket2, port;

  beforeAll((done) => {
    httpServer = createServer();
    ioServer = new Server(httpServer, {
      cors: { origin: '*' }
    });

    httpServer.listen(() => {
      port = httpServer.address().port;

      ioServer.on('connection', (socket) => {
        socket.on('join_order', (orderId) => {
          socket.join(orderId);
          socket.emit('joined_order', { orderId });
        });
        socket.on('join_restaurant', (restaurantId) => {
          socket.join(restaurantId);
          socket.emit('joined_restaurant', { restaurantId });
        });
        socket.on('update_order_status', (data) => {
          ioServer.emit('order_update', {
            orderId: data.orderId,
            status: data.status,
            timestamp: new Date()
          });
        });
      });

      clientSocket = Client(`http://localhost:${port}`, {
        forceNew: true,
        transports: ['websocket']
      });
      clientSocket2 = Client(`http://localhost:${port}`, {
        forceNew: true,
        transports: ['websocket']
      });

      let connected = 0;
      const onConnect = () => {
        connected++;
        if (connected === 2) done();
      };
      clientSocket.on('connect', onConnect);
      clientSocket2.on('connect', onConnect);
    });
  });

  afterAll((done) => {
    clientSocket.disconnect();
    clientSocket2.disconnect();
    ioServer.close();
    httpServer.close(done);
  });

  // Clean up listeners after each test to prevent conflicts
  afterEach(() => {
    clientSocket.removeAllListeners('joined_order');
    clientSocket.removeAllListeners('joined_restaurant');
    clientSocket.removeAllListeners('order_update');
    clientSocket.removeAllListeners('connect');
    clientSocket2.removeAllListeners('order_update');
  });

  // Test 1 — Connection
  test('Client should connect to server', (done) => {
    expect(clientSocket.connected).toBe(true);
    expect(clientSocket2.connected).toBe(true);
    done();
  }, 10000);

  // Test 2 — Join order room
  test('Client should join order room', (done) => {
    clientSocket.once('joined_order', (data) => {
      expect(data.orderId).toBe('order123');
      done();
    });
    clientSocket.emit('join_order', 'order123');
  }, 10000);

  // Test 3 — Join restaurant room (fixed — separate event name)
  test('Client should join restaurant room', (done) => {
    clientSocket.once('joined_restaurant', (data) => {
      expect(data.restaurantId).toBe('rest456');
      done();
    });
    clientSocket.emit('join_restaurant', 'rest456');
  }, 10000);

  // Test 4 — Order status update broadcast (fixed — use once + unique orderId)
  test('Should broadcast order_update to all clients', (done) => {
    clientSocket2.once('order_update', (data) => {
      if (data.orderId === 'order_broadcast_test') {
        expect(data.status).toBe('DELIVERED');
        done();
      }
    });
    clientSocket.emit('update_order_status', {
      orderId: 'order_broadcast_test',
      status: 'DELIVERED'
    });
  }, 10000);

  // Test 5 — Reconnection handling
  test('Client should reconnect after disconnect', (done) => {
    clientSocket.once('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
    clientSocket.disconnect();
    expect(clientSocket.connected).toBe(false);
    clientSocket.connect();
  }, 15000);

  // Test 6 — Multiple clients receive same update (fixed — use once + unique orderId)
  test('Multiple clients should receive same update', (done) => {
    let count = 0;
    const targetOrderId = 'order_multi_test';

    const handler = (data) => {
      if (data.orderId !== targetOrderId) return;
      expect(data.status).toBe('ORDER_PREPARING');
      count++;
      if (count === 2) done();
    };

    clientSocket.once('order_update', handler);
    clientSocket2.once('order_update', handler);

    // Small delay to ensure both listeners are registered
    setTimeout(() => {
      clientSocket.emit('update_order_status', {
        orderId: targetOrderId,
        status: 'ORDER_PREPARING'
      });
    }, 100);
  }, 15000);
});