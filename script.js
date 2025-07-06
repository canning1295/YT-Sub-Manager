const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const API_KEY = 'YOUR_API_KEY';
const SCOPES = 'https://www.googleapis.com/auth/youtube';

let tokenClient;
let accessToken;
let player;
let currentSpeed = 1;
const watchHistoryMap = {};

function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({ apiKey: API_KEY, discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'] });
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      document.getElementById('signin').style.display = 'none';
      loadWatchHistory().then(() => {
        loadSubscriptions();
        document.getElementById('nav_subs').click();
      });
    },
  });
}

function authorize() {
  tokenClient.requestAccessToken();
}

document.getElementById('authorize_button').onclick = authorize;

document.getElementById('nav_player').onclick = () => showView('player_view');
document.getElementById('nav_subs').onclick = () => { showView('subs_view'); loadSubscriptions(); };
document.getElementById('nav_search').onclick = () => showView('search_view');
document.getElementById('nav_recommended').onclick = () => { showView('recommended_view'); };
document.getElementById('toggleSidebar').onclick = () => document.getElementById('sidebar').classList.toggle('collapsed');

document.getElementById('search_button').onclick = searchVideos;
document.getElementById('load_recommended').onclick = loadRecommended;

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function createPlayer(videoId) {
  if (!player) {
    player = new YT.Player('player', {
      width: '100%',
      videoId: videoId,
    });
  } else if (videoId) {
    player.loadVideoById(videoId);
  }
}

function loadVideo(videoId) {
  showView('player_view');
  if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => createPlayer(videoId);
  } else {
    createPlayer(videoId);
  }
}

document.addEventListener('keydown', (e) => {
  if (!player || document.activeElement.tagName === 'INPUT') return;
  if (e.key === ' ') {
    e.preventDefault();
    const state = player.getPlayerState();
    if (state === 1) player.pauseVideo();
    else player.playVideo();
  } else if (e.key.toLowerCase() === 'a') {
    changeSpeed(0.25);
  } else if (e.key.toLowerCase() === 's') {
    changeSpeed(-0.25);
  }
});

function changeSpeed(delta) {
  currentSpeed = Math.min(2, Math.max(0.25, currentSpeed + delta));
  player.setPlaybackRate(currentSpeed);
  const overlay = document.getElementById('speedOverlay');
  overlay.textContent = currentSpeed.toFixed(2) + 'x';
  overlay.style.display = 'block';
  setTimeout(() => overlay.style.display = 'none', 1000);
}

async function loadSubscriptions() {
  const tableBody = document.querySelector('#subs_table tbody');
  tableBody.innerHTML = '';
  let nextPageToken = null;
  do {
    const response = await gapi.client.youtube.subscriptions.list({
      part: 'snippet',
      mine: true,
      maxResults: 50,
      pageToken: nextPageToken,
    });
    response.result.items.forEach((item) => {
      const channelId = item.snippet.resourceId.channelId;
      const channelTitle = item.snippet.title;
      const subscriptionId = item.id;
      const tr = document.createElement('tr');
      const nameTd = document.createElement('td');
      nameTd.textContent = channelTitle;
      const unsubTd = document.createElement('td');
      const button = document.createElement('button');
      button.textContent = 'Unsubscribe';
      button.onclick = () => unsubscribe(subscriptionId, tr);
      unsubTd.appendChild(button);
      const linkTd = document.createElement('td');
      const link = document.createElement('a');
      link.href = `https://www.youtube.com/channel/${channelId}`;
      link.textContent = 'Open';
      link.target = '_blank';
      linkTd.appendChild(link);
      const dslwTd = document.createElement('td');
      const lastWatched = watchHistoryMap[channelId];
      dslwTd.textContent = lastWatched ? Math.floor((Date.now() - new Date(lastWatched)) / (1000 * 60 * 60 * 24)) : 'N/A';
      tr.appendChild(nameTd);
      tr.appendChild(unsubTd);
      tr.appendChild(linkTd);
      tr.appendChild(dslwTd);
      tableBody.appendChild(tr);
    });
    nextPageToken = response.result.nextPageToken;
  } while (nextPageToken);
}

async function unsubscribe(subscriptionId, row) {
  await gapi.client.youtube.subscriptions.delete({ id: subscriptionId });
  row.remove();
}

async function loadWatchHistory() {
  try {
    const response = await gapi.client.youtube.playlistItems.list({
      part: 'snippet,contentDetails',
      playlistId: 'HL',
      maxResults: 50,
    });
    response.result.items.forEach((item) => {
      const channelId = item.snippet.videoOwnerChannelId || item.snippet.channelId;
      const watchedAt = item.snippet.publishedAt;
      if (!watchHistoryMap[channelId] || new Date(watchedAt) > new Date(watchHistoryMap[channelId])) {
        watchHistoryMap[channelId] = watchedAt;
      }
    });
  } catch (err) {
    console.error('Could not load watch history', err);
  }
}

async function searchVideos() {
  const q = document.getElementById('search_query').value;
  const tableBody = document.querySelector('#search_results tbody');
  tableBody.innerHTML = '';
  if (!q) return;
  const resp = await gapi.client.youtube.search.list({
    part: 'snippet',
    q,
    type: 'video',
    maxResults: 10,
  });
  resp.result.items.forEach(item => {
    const tr = document.createElement('tr');
    const thumbTd = document.createElement('td');
    const img = document.createElement('img');
    img.src = item.snippet.thumbnails.default.url;
    thumbTd.appendChild(img);
    const titleTd = document.createElement('td');
    titleTd.textContent = item.snippet.title;
    const channelTd = document.createElement('td');
    channelTd.textContent = item.snippet.channelTitle;
    tr.appendChild(thumbTd);
    tr.appendChild(titleTd);
    tr.appendChild(channelTd);
    tr.onclick = () => loadVideo(item.id.videoId);
    tableBody.appendChild(tr);
  });
}

async function loadRecommended() {
  const tableBody = document.querySelector('#recommended_table tbody');
  tableBody.innerHTML = '';
  const videos = [];
  let nextPageToken = null;
  do {
    const subs = await gapi.client.youtube.subscriptions.list({
      part: 'snippet',
      mine: true,
      maxResults: 50,
      pageToken: nextPageToken,
    });
    for (const item of subs.result.items) {
      const channelId = item.snippet.resourceId.channelId;
      const res = await gapi.client.youtube.search.list({
        part: 'snippet',
        channelId,
        order: 'date',
        maxResults: 1,
        type: 'video',
      });
      const vidItem = res.result.items[0];
      if (vidItem) {
        videos.push({
          channelTitle: item.snippet.title,
          videoId: vidItem.id.videoId,
          title: vidItem.snippet.title,
          publishedAt: vidItem.snippet.publishedAt,
          thumb: vidItem.snippet.thumbnails.default.url,
        });
      }
    }
    nextPageToken = subs.result.nextPageToken;
  } while (nextPageToken);

  const ids = videos.map(v => v.videoId).join(',');
  if (ids) {
    const statsResp = await gapi.client.youtube.videos.list({
      part: 'statistics',
      id: ids,
    });
    const statsMap = {};
    statsResp.result.items.forEach(s => {
      statsMap[s.id] = s.statistics;
    });
    videos.forEach(v => v.stats = statsMap[v.videoId] || {});
  }

  videos.sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  videos.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${v.channelTitle}</td>
      <td><img src="${v.thumb}"></td>
      <td>${v.title}</td>
      <td>${new Date(v.publishedAt).toLocaleDateString()}</td>
      <td>${v.stats.viewCount || ''}</td>
      <td>${v.stats.likeCount || ''}</td>
      <td>${v.stats.dislikeCount || ''}</td>
      <td>${v.stats.commentCount || ''}</td>
    `;
    tr.onclick = () => loadVideo(v.videoId);
    tableBody.appendChild(tr);
  });
}

window.addEventListener('load', () => {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = gisLoaded;
  document.body.appendChild(script);
  gapiLoaded();
});
