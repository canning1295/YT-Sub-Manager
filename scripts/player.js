let player;
let currentSpeed = 1;

function createPlayer(videoId) {
  if (!player) {
    player = new YT.Player('player', { width: '100%', videoId });
  } else if (videoId) {
    player.loadVideoById(videoId);
  }
}

export function loadVideo(videoId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('player_view').classList.add('active');
  if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => createPlayer(videoId);
  } else {
    createPlayer(videoId);
  }
}

function changeSpeed(delta) {
  currentSpeed = Math.min(2, Math.max(0.25, currentSpeed + delta));
  player.setPlaybackRate(currentSpeed);
  const overlay = document.getElementById('speedOverlay');
  overlay.textContent = currentSpeed.toFixed(2) + 'x';
  overlay.style.display = 'block';
  setTimeout(() => (overlay.style.display = 'none'), 1000);
}

export function initPlayerShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (!player || document.activeElement.tagName === 'INPUT') return;
    if (e.key === ' ') {
      e.preventDefault();
      const state = player.getPlayerState();
      if (state === 1) player.pauseVideo();
      else player.playVideo();
    } else if (e.key.toLowerCase() === 'a') {
      changeSpeed(-0.25);
    } else if (e.key.toLowerCase() === 's') {
      changeSpeed(0.25);
    } else if (e.key === 'ArrowUp') {
      changeSpeed(0.25);
    } else if (e.key === 'ArrowDown') {
      changeSpeed(-0.25);
    } else if (e.key === 'ArrowLeft') {
      player.seekTo(Math.max(0, player.getCurrentTime() - 5), true);
    } else if (e.key === 'ArrowRight') {
      player.seekTo(player.getCurrentTime() + 5, true);
    }
  });
}
