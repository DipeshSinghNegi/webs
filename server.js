const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
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

server.listen(5000, () => {
  console.log("Server listening...");
});
