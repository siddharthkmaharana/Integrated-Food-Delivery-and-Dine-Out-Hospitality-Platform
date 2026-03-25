const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(` Client connected: ${socket.id}`);

    // Customer joins order room to track their order
    socket.on('join_order', (orderId) => {
      socket.join(orderId);
      console.log(`Customer joined order room: ${orderId}`);
    });

    // Restaurant joins their room to receive new orders
    socket.on('join_restaurant', (restaurantId) => {
      socket.join(restaurantId);
      console.log(`Restaurant joined room: ${restaurantId}`);
    });

    // Courier joins their room
    socket.on('join_courier', (courierId) => {
      socket.join(courierId);
      console.log(`Courier joined room: ${courierId}`);
    });

    // Order status updates
    socket.on('update_order_status', (data) => {
      const { orderId, status } = data;
      io.to(orderId).emit('order_status_updated', {
        orderId,
        status,
        timestamp: new Date()
      });
      console.log(`Order ${orderId} updated to: ${status}`);
    });

    socket.on('disconnect', () => {
      console.log(` Client disconnected: ${socket.id}`);
    });
  });
};

export default socketHandler;