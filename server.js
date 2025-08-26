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
    // safer to add unique name to avoid overwriting
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

let lastPhoto = null;
let lastPhotoPath = null;

// === Queue system ===
let queue = [];
let processing = false;
const DISPLAY_DELAY = 3000; // 3s between images

function processQueue() {
  if (queue.length === 0) {
    processing = false;
    return;
  }
  processing = true;

  const { photoUrl, filePath, resolve } = queue.shift();

  // cleanup old photo (optional: keep history if you want slideshow)
  if (lastPhotoPath) {
    fs.unlink(lastPhotoPath, (err) => {
      if (err) console.error("Failed to delete old photo:", err);
    });
  }

  lastPhoto = photoUrl;
  lastPhotoPath = filePath;

  io.to("main-panel").emit("display_photo", photoUrl);

  // tell the uploader their image is now live
  resolve({ success: true, url: photoUrl });

  // wait DISPLAY_DELAY then continue
  setTimeout(processQueue, DISPLAY_DELAY);
}

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: "No file uploaded." });
  }

  const photoUrl = `/uploads/${req.file.filename}`;
  const filePath = path.join(__dirname, "uploads", req.file.filename);

  // push into queue
  new Promise((resolve) => {
    queue.push({ photoUrl, filePath, resolve });
    if (!processing) processQueue();
  }).then((result) => {
    res.send(result); // respond when this file has been displayed
  });
});

app.get("/display_pic", (req, res) => {
  if (!lastPhoto) {
    return res.status(400).send({ error: "No recent pics found" });
  }
  res.json({ photo: lastPhoto });
});

const io = new Server(server, { cors: { origin: "*" } });
io.on("connection", (socket) => {
  socket.on("join_main_panel", () => socket.join("main-panel"));
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
