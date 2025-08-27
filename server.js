// backend/server.js
const express = require("express");
const http = require("http");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors({ origin: "*" }));

// serve uploaded files
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
app.use("/uploads", express.static(UPLOAD_DIR));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname; // avoid collisions
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// ===== Queue State =====
let queue = [];
let isProcessing = false;

// Process next photo in queue
function processNext() {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  const next = queue.shift();
  console.log("📸 Sending photo:", next);

  // Send photo to display clients
  io.to("main-panel").emit("display_photo", next);
}

// Socket.io setup
io.on("connection", (socket) => {
  console.log("✅ Client connected");

  socket.on("join_main_panel", () => {
    socket.join("main-panel");
    console.log("👀 A screen joined main-panel");
  });

  // When frontend says "I displayed the photo"
  socket.on("photo_loaded", () => {
    console.log("👍 Photo acknowledged, moving to next");
    isProcessing = false;
    processNext();
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

// Upload route
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const photoUrl = `/uploads/${req.file.filename}`;
  queue.push(photoUrl); // enqueue new photo
  processNext(); // try sending if not already busy

  // cleanup: keep only last 50 files on disk
  const files = fs.readdirSync(UPLOAD_DIR)
    .map(name => ({
      name,
      time: fs.statSync(path.join(UPLOAD_DIR, name)).mtime.getTime()
    }))
    .sort((a, b) => a.time - b.time); // oldest first

  if (files.length > 50) {
    const toDelete = files.slice(0, files.length - 50);
    toDelete.forEach(f => fs.unlinkSync(path.join(UPLOAD_DIR, f.name)));
  }

  res.json({ success: true, url: photoUrl });
});

// Latest photo fallback (polling/debug)
app.get("/display_pic", (req, res) => {
  if (!queue.length && !isProcessing) {
    return res.status(400).json({ error: "No photos yet" });
  }
  res.json({ photo: queue[0] || null });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
