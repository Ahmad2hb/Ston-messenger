const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const users = {};

io.on("connection", (socket) => {
  console.log("جهاز اتصل:", socket.id);

  socket.on("join", (username) => {
    users[socket.id] = username || "مستخدم";

    const userList = Object.entries(users).map(([id, name]) => ({
      id,
      name
    }));

    io.emit("users", userList);
  });

  socket.on("private message", (data) => {
    const senderName = users[socket.id] || "مستخدم";

    const message = {
      name: senderName,
      text: data.text
    };

    io.to(data.to).emit("private message", message);
    socket.emit("private message", message);
  });

  socket.on("disconnect", () => {
    delete users[socket.id];

    const userList = Object.entries(users).map(([id, name]) => ({
      id,
      name
    }));

    io.emit("users", userList);

    console.log("جهاز خرج:", socket.id);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});
