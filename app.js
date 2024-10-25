const express = require('express');
const http = require('http');
const path = require('path');
const multer  = require('multer');
const WebSocket = require('ws');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'current' + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let currentFile = null;
let playbackState = {
  playing: false,
  time: 0
};

app.use(express.static('public'));

app.post('/upload', upload.single('media'), (req, res) => {
  console.log('File loaded:', req.file.filename);
  currentFile = '/uploads/' + req.file.filename;
  playbackState = {
    playing: false,
    time: 0
  };
  broadcast(JSON.stringify({ type: 'newFile', file: currentFile }));
  res.status(200).send('File loaded');
});

wss.on('connection', (ws) => {
  console.log('Connected');

  ws.send(JSON.stringify({ type: 'init', file: currentFile, playbackState }));

  ws.on('message', (message) => {
    console.log('Connected:', message);
    const data = JSON.parse(message);
    switch(data.type) {
      case 'play':
      case 'pause':
      case 'seek':
        playbackState = {
          playing: data.type === 'play',
          time: data.time
        };
        broadcast(JSON.stringify({
          type: data.type,
          time: data.time
        }), ws);
        break;
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function broadcast(data, exclude) {
  wss.clients.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Started ${PORT}`);
});
