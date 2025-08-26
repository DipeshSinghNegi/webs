const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5001;

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
    // ⚠️ consider adding unique IDs here to avoid collisions
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

let lastPhoto = null;
let lastPhotoPath = null;

// ---- Cooldown state ----
let lastUploadTime = 0;
const COOLDOWN_MS = 3000; // 3 seconds

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get("/", (req, res) => {
  res.send({ message: "API live master." });
});

app.post("/upload", upload.single("image"), (req, res) => {
  const now = Date.now();

  // Check cooldown
  if (now - lastUploadTime < COOLDOWN_MS) {
    return res.status(429).send({ error: "Please wait 3 seconds before next upload." });
  }
  lastUploadTime = now;

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

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
