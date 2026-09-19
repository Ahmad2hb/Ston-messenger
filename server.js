const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const webpush = require("web-push");
const { initDatabase } = require("./database");
const { createUser, loginUser } = require("./auth");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(__dirname));

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const users = {};
const pushSubscriptions = {};

app.get("/vapid-public-key", (req, res) => {
  res.send(process.env.VAPID_PUBLIC_KEY || "");
});

app.post("/api/register", async (req, res) => {
  try {
    const { stoneId, name, password } = req.body;

    if (!stoneId || !name || !password) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }

    if (stoneId.length < 4 || password.length < 6) {
      return res.status(400).json({
        error: "STONE ID يجب أن يكون 4 أحرف على الأقل وكلمة المرور 6 أحرف على الأقل"
      });
    }

    const user = await createUser(stoneId, name, password);

    res.json({
      success: true,
      user
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "STONE ID مستخدم مسبقاً" });
    }

    console.error(err);
    res.status(500).json({ error: "حدث خطأ في إنشاء الحساب" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { stoneId, password } = req.body;

    if (!stoneId || !password) {
      return res.status(400).json({
        error: "STONE ID وكلمة المرور مطلوبان"
      });
    }

    const user = await loginUser(stoneId, password);

    if (!user) {
      return res.status(401).json({
        error: "STONE ID أو كلمة المرور غير صحيحة"
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "حدث خطأ في تسجيل الدخول"
    });
  }
});

io.on("connection", (socket) => {
  console.log("جهاز اتصل:", socket.id);

  socket.on("join", (username) => {
    users[socket.id] = username || "مستخدم";
    io.emit(
      "users",
      Object.entries(users).map(([id, name]) => ({ id, name }))
    );
  });

  socket.on("push subscribe", (subscription) => {
    pushSubscriptions[socket.id] = subscription;
  });

  socket.on("private message", async (data) => {
    const message = {
      from: socket.id,
      to: data.to,
      name: users[socket.id] || "مستخدم",
      text: data.text
    };

    io.to(data.to).emit("private message", message);
    socket.emit("private message", message);

    const sub = pushSubscriptions[data.to];

    if (sub) {
      try {
        await webpush.sendNotification(
          sub,
          JSON.stringify({
            title: users[socket.id] || "رسالة جديدة",
            body: data.text || "رسالة جديدة",
            url: "/"
          })
        );
      } catch (e) {
        console.log("Push error:", e.message);
      }
    }
  });

  socket.on("private image", (data) => {
    const message = {
      from: socket.id,
      to: data.to,
      name: users[socket.id] || "مستخدم",
      image: data.image
    };

    io.to(data.to).emit("private image", message);
    socket.emit("private image", message);
  });

  socket.on("private audio", (data) => {
    const message = {
      from: socket.id,
      to: data.to,
      name: users[socket.id] || "مستخدم",
      audio: data.audio
    };

    io.to(data.to).emit("private audio", message);
    socket.emit("private audio", message);
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    delete pushSubscriptions[socket.id];

    io.emit(
      "users",
      Object.entries(users).map(([id, name]) => ({ id, name }))
    );

    console.log("جهاز خرج:", socket.id);
  });
});

initDatabase()
  .then(() => {
    server.listen(3000, "0.0.0.0", () => {
      console.log("Server running on port 3000");
    });
  })
  .catch((err) => {
    console.error("Database initialization failed:", err);
    process.exit(1);
  });
