import { io } from "socket.io-client";

console.log("Starting WebSocket Reliability and Reconnection Tests...\n");

// Connect to the local socket server
const socket = io("http://localhost:5000", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

let reconnectCount = 0;

socket.on("connect", () => {
  console.log(`[EVENT: connect] Socket connected successfully. ID: ${socket.id}`);
  
  if (reconnectCount === 0) {
      console.log("Simulating network interruption by manually disconnecting the client...");
      // Simulate network drop
      socket.disconnect();
      
      // Attempt reconnection after 2 seconds
      setTimeout(() => {
          console.log("Attempting to reconnect...");
          socket.connect();
      }, 2000);
  }
});

socket.on("disconnect", (reason) => {
  console.log(`[EVENT: disconnect] Socket disconnected. Reason: ${reason}`);
});

socket.io.on("reconnect_attempt", (attemptNumber) => {
  console.log(`[EVENT: reconnect_attempt] Trying to reconnect... Attempt ${attemptNumber}`);
});

socket.on("connect_error", (error) => {
  console.log(`[EVENT: connect_error] Connection failed: ${error.message}`);
});

socket.io.on("reconnect", (attemptNumber) => {
  reconnectCount++;
  console.log(`[EVENT: reconnect] Successfully reconnected after ${attemptNumber} attempts.\n`);
  console.log("✅ WebSocket reliability tests passed! Client handles reconnections properly.");
  process.exit(0);
});

socket.io.on("reconnect_failed", () => {
  console.log("[EVENT: reconnect_failed] Failed to reconnect within the allowed attempts.");
  process.exit(1);
});

// Timeout safeguard
setTimeout(() => {
    if (reconnectCount === 0) {
        console.log("❌ Test timed out without successful reconnection.");
        process.exit(1);
    }
}, 10000);
