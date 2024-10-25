const uploadButton = document.getElementById('uploadButton');
const mediaPlayer = document.getElementById('mediaPlayer');

let currentFile = null;
let lastPlaybackState = {
  playing: false,
  time: 0,
  updatedAt: 0
};
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
      console.error('E:', err);
    });
  }
});

function getState() {
  fetch('/state')
    .then(response => response.json())
    .then(data => {
      if (data.file !== currentFile) {
        currentFile = data.file;
        setMediaSource(currentFile);
      }

      if (data.playbackState.updatedAt > lastPlaybackState.updatedAt) {
        lastPlaybackState = data.playbackState;
        if (!isInitiator) {
          synchronizePlayback(lastPlaybackState);
        } else {
          isInitiator = false;
        }
      }
    })
    .catch(error => {
      console.error('Ошибка при получении состояния:', error);
    });
}

function updateState() {
  const state = {
    playing: !mediaPlayer.paused,
    time: mediaPlayer.currentTime
  };
  fetch('/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(state)
  })
    .then(response => {
      isInitiator = false;
    })
    .catch(error => {
      console.error('E:', error);
    });
}

function synchronizePlayback(state) {
  const timeDifference = Math.abs(mediaPlayer.currentTime - state.time);

  if (timeDifference > 1) {
    mediaPlayer.currentTime = state.time;
  }

  if (state.playing && mediaPlayer.paused) {
    mediaPlayer.play().catch(() => {});
  } else if (!state.playing && !mediaPlayer.paused) {
    mediaPlayer.pause();
  }
}

function setMediaSource(source) {
  mediaPlayer.src = source;
  mediaPlayer.load();

  mediaPlayer.onloadedmetadata = () => {
    if (lastPlaybackState) {
      mediaPlayer.currentTime = lastPlaybackState.time;
      if (lastPlaybackState.playing) {
        mediaPlayer.play().catch(() => {});
      }
    }
  };
}

mediaPlayer.addEventListener('play', () => {
  isInitiator = true;
  updateState();
});

mediaPlayer.addEventListener('pause', () => {
  isInitiator = true;
  updateState();
});

mediaPlayer.addEventListener('seeked', () => {
  isInitiator = true;
  updateState();
});

getState();

setInterval(getState, 500);
