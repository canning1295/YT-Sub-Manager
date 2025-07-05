const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const API_KEY = 'YOUR_API_KEY';
const SCOPES = 'https://www.googleapis.com/auth/youtube';
let tokenClient;
let gapiInited = false;
let accessToken;

function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({ apiKey: API_KEY, discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'] });
  gapiInited = true;
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      document.getElementById('signin').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      loadWatchHistory().then(loadSubscriptions);
    },
  });
}

function authorize() {
  tokenClient.requestAccessToken();
}

document.getElementById('authorize_button').onclick = authorize;

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

    const items = response.result.items;
    items.forEach((item) => {
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
      if (lastWatched) {
        const days = Math.floor((Date.now() - new Date(lastWatched)) / (1000 * 60 * 60 * 24));
        dslwTd.textContent = days;
      } else {
        dslwTd.textContent = 'N/A';
      }

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

const watchHistoryMap = {};

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

window.addEventListener('load', () => {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = gisLoaded;
  document.body.appendChild(script);
  gapiLoaded();
});
