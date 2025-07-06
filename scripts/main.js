import { gapiLoaded, gisLoaded } from './auth.js';
import { loadSubscriptions, searchVideos, loadSubscriptionVideos, loadWatchHistory } from './api.js';
import { loadVideo, initPlayerShortcuts } from './player.js';

function showView(id) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

document.getElementById('nav_player').onclick = () => showView('player_view');
document.getElementById('nav_subs').onclick = () => {
  showView('subs_view');
  loadSubscriptions();
};
document.getElementById('nav_search').onclick = () => showView('search_view');
document.getElementById('nav_subscriptions').onclick = () => {
  showView('subscriptions_view');
};
document.getElementById('toggleSidebar').onclick = () =>
  document.getElementById('sidebar').classList.toggle('collapsed');

document.getElementById('search_button').onclick = searchVideos;
document.getElementById('load_subscriptions').onclick = loadSubscriptionVideos;
document.getElementById('show_more_subs').onclick = () => loadSubscriptionVideos(true);

initPlayerShortcuts();

window.addEventListener('load', () => {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = () =>
    gisLoaded(() => {
      loadWatchHistory().then(() => {
        loadSubscriptions();
        loadSubscriptionVideos();
        document.getElementById('nav_subscriptions').click();
      });
    });
  document.body.appendChild(script);
  gapiLoaded();
});

// expose loadVideo for inline onclick handlers
window.loadVideo = loadVideo;
window.getTranscript = (id) => {
  import('./api.js').then((m) => m.getTranscript(id));
};
