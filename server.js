// To enable real-time updates with socket.io:
// 1. Start your Express backend: node server.js (or npm run server if you have a script)
// 2. Start your Next.js frontend: npm run dev
// 3. In your frontend code, set the socket.io client to connect to http://localhost:5001
// 4. Set NEXT_PUBLIC_API_BASE in .env.local to http://localhost:5001 for API calls
// This way, your frontend uses Next.js on port 3000 and real-time backend on port 5001.

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const app = express();
app.use(cors({ origin: "*" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const server = http.createServer(app);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName =  file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

let lastPhoto = null;
let lastPhotoPath = null;

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get("/", (req, res) => {
  res.send({ message: "API live master." });
});

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: "No file uploaded." });
  }

  if (lastPhotoPath) {
    fs.unlink(lastPhotoPath, (err) => {
      if (err) console.error("Failed to delete old photo:", err);
    });
  }

  const photoUrl = `/uploads/${req.file.filename}`;
  lastPhoto = photoUrl;
  lastPhotoPath = path.join(__dirname, "uploads", req.file.filename);

  io.to("main-panel").emit("display_photo", photoUrl);

  res.send({ success: true, url: photoUrl });
});

app.get("/display_pic", (req, res) => {
  if (!lastPhoto) {
    return res.status(400).send({ error: "No recent pics found" });
  }
  res.json({ photo: lastPhoto });
});

io.on("connection", (socket) => {
  socket.on("join_main_panel", () => {
    socket.join("main-panel");
  });

  socket.on("disconnect", () => {});
});

server.listen(5001, () => {
  console.log("Server listening...");
});
