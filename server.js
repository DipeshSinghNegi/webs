// backend/server.js
const express = require("express");
const http = require("http");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));

// serve uploaded files
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
app.use("/uploads", express.static(UPLOAD_DIR));

const server = http.createServer(app);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname; // avoid collisions
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

let lastPhoto = null;

// Upload route
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const photoUrl = `/uploads/${req.file.filename}`;
  lastPhoto = photoUrl;

  // cleanup: keep only last 10
  const files = fs.readdirSync(UPLOAD_DIR)
    .map(name => ({
      name,
      time: fs.statSync(path.join(UPLOAD_DIR, name)).mtime.getTime()
    }))
    .sort((a, b) => a.time - b.time); // oldest first

  if (files.length > 10) {
    const toDelete = files.slice(0, files.length - 10);
    toDelete.forEach(f => fs.unlinkSync(path.join(UPLOAD_DIR, f.name)));
  }

  res.json({ success: true, url: photoUrl });
});

// Latest photo (polled every 3s)
app.get("/display_pic", (req, res) => {
  if (!lastPhoto) return res.status(400).json({ error: "No photos yet" });
  res.json({ photo: lastPhoto });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
