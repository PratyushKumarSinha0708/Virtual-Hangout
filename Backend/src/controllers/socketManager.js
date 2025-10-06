import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // User joins a call
    socket.on("join-call", (path) => {
      if (!connections[path]) connections[path] = [];
      connections[path].push(socket.id);

      timeOnline[socket.id] = new Date();

      // Notify all users in the room
      connections[path].forEach((id) => {
        io.to(id).emit("user-joined", socket.id, connections[path]);
      });

      // Send previous messages if any
      if (messages[path]) {
        messages[path].forEach((msg) => {
          io.to(socket.id).emit(
            "chat-message",
            msg.data,
            msg.sender,
            msg["socket-id-sender"]
          );
        });
      }
    });

    // Forward SDP or ICE signals
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    // Handle chat messages
    socket.on("chat-message", (data, sender) => {
      console.log(data , sender);
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }
          return [room, isFound];
        },
        ["", false]
      );

      if (found) {
        if (!messages[matchingRoom]) messages[matchingRoom] = [];

        messages[matchingRoom].push({
          sender,
          data,
          "socket-id-sender": socket.id,
        });

        console.log("message", matchingRoom, ":", sender, data);

        connections[matchingRoom].forEach((id) => {
          io.to(id).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const diffTime = Math.abs(new Date() - timeOnline[socket.id]);

      for (const [room, users] of Object.entries(connections)) {
        if (users.includes(socket.id)) {
          // Notify everyone in the room
          users.forEach((id) => io.to(id).emit("user-left", socket.id));

          // Remove the user
          connections[room] = users.filter((id) => id !== socket.id);

          // Delete room if empty
          if (connections[room].length === 0) {
            delete connections[room];
          }
        }
      }

      delete timeOnline[socket.id];
    });
  });

  return io;
};
