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
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

let queue = [];
let processing = false;
let lastPhoto = null;
let lastPhotoPath = null;

function processNext(io) {
  if (processing) return; // already working
  if (queue.length === 0) return;

  processing = true;
  const { photoUrl, filePath, resolve } = queue.shift();

  // delete previous file if you don't want to keep
  if (lastPhotoPath) {
    fs.unlink(lastPhotoPath, (err) => {
      if (err) console.error("Failed to delete old photo:", err);
    });
  }

  lastPhoto = photoUrl;
  lastPhotoPath = filePath;

  // emit to main panel
  io.to("main-panel").emit("display_photo", photoUrl);

  // wait for ack from main panel before resolving + moving on
  const ackHandler = () => {
    resolve({ success: true, url: photoUrl });
    processing = false;
    processNext(io); // continue with next in queue
  };

  // attach one-time listener for ack
  io.once("photo_displayed", ackHandler);
}

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: "No file uploaded." });
  }

  const photoUrl = `/uploads/${req.file.filename}`;
  const filePath = path.join(__dirname, "uploads", req.file.filename);

  new Promise((resolve) => {
    queue.push({ photoUrl, filePath, resolve });
    processNext(io); // try to process if idle
  }).then((result) => res.send(result));
});

app.get("/display_pic", (req, res) => {
  if (!lastPhoto) {
    return res.status(400).send({ error: "No recent pics found" });
  }
  res.json({ photo: lastPhoto });
});

const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("join_main_panel", () => {
    socket.join("main-panel");
  });

  // main panel must call this when it finishes loading an image
  socket.on("photo_loaded", () => {
    io.emit("photo_displayed"); // trigger ack for current
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
