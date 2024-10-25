// app.js
const express = require('express');
const path = require('path');
const multer  = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();

let currentFile = null;
let playbackState = {
  playing: false,
  time: 0,
  updatedAt: Date.now()
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'current' + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));

app.use(bodyParser.json());

app.post('/upload', upload.single('media'), (req, res) => {
  console.log('File loaded:', req.file.filename);
  currentFile = '/uploads/' + req.file.filename + '?t=' + Date.now();
  playbackState = {
    playing: false,
    time: 0,
    updatedAt: Date.now()
  };
  res.status(200).send('File loaded');
});

app.get('/state', (req, res) => {
  res.json({
    file: currentFile,
    playbackState: playbackState
  });
});

app.post('/update', (req, res) => {
  const data = req.body;
  console.log('Update:', data);
  playbackState = {
    playing: data.playing,
    time: data.time,
    updatedAt: Date.now()
  };
  res.status(200).send('Updated');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
