const uploadButton = document.getElementById('uploadButton');
const mediaPlayer = document.getElementById('mediaPlayer');

const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
const ws = new WebSocket(`${protocol}://${location.host}`);
let isSeeking = false;
let isPlaying = false;
let isInitiator = false;

uploadButton.addEventListener('change', () => {
  const file = uploadButton.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('media', file);

    fetch('/upload', {
      method: 'POST',
      body: formData
    }).then((res) => {
      console.log('File loaded');
    }).catch((err) => {
      console.error('File loading error:', err);
    });
  }
});

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch(data.type) {
    case 'init':
      if (data.file) {
        setMediaSource(data.file);
        if (data.playbackState) {
          mediaPlayer.currentTime = data.playbackState.time;
          if (data.playbackState.playing) {
            playMedia();
          }
        }
      }
      break;
    case 'newFile':
      setMediaSource(data.file);
      break;
    case 'play':
      if (!isPlaying) {
        isInitiator = true;
        mediaPlayer.currentTime = data.time;
        playMedia();
      }
      break;
    case 'pause':
      if (isPlaying) {
        isInitiator = true;
        mediaPlayer.pause();
      }
      break;
    case 'seek':
      if (!isSeeking) {
        isInitiator = true;
        mediaPlayer.currentTime = data.time;
      }
      break;
  }
};

function setMediaSource(source) {
  mediaPlayer.src = source;
  mediaPlayer.load();
}

function playMedia() {
  const playPromise = mediaPlayer.play();
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      console.log('Autoplay blocked.', error);
    });
  }
}

mediaPlayer.addEventListener('play', () => {
  isPlaying = true;
  if (!isInitiator) {
    ws.send(JSON.stringify({ type: 'play', time: mediaPlayer.currentTime }));
  }
  isInitiator = false;
});

mediaPlayer.addEventListener('pause', () => {
  isPlaying = false;
  if (!isInitiator) {
    ws.send(JSON.stringify({ type: 'pause', time: mediaPlayer.currentTime }));
  }
  isInitiator = false;
});

mediaPlayer.addEventListener('seeking', () => {
  isSeeking = true;
});

mediaPlayer.addEventListener('seeked', () => {
  if (!isInitiator) {
    ws.send(JSON.stringify({ type: 'seek', time: mediaPlayer.currentTime }));
  }
  isSeeking = false;
  isInitiator = false;
});

mediaPlayer.addEventListener('volumechange', () => {
  if (mediaPlayer.muted === false) {
    console.log('Sound on');
  }
});
