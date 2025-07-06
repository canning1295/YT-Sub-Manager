import { accessToken, ensureAuthorized } from './auth.js';
import { loadVideo } from './player.js';

const watchHistoryMap = {};
let subsWindowEnd = new Date();
let subsWindowStart = new Date();
subsWindowStart.setDate(subsWindowEnd.getDate() - 3);
let subsVideos = [];

export async function loadSubscriptions() {
  await ensureAuthorized();
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
      dslwTd.textContent = lastWatched
        ? Math.floor((Date.now() - new Date(lastWatched)) / (1000 * 60 * 60 * 24))
        : 'N/A';
      tr.appendChild(nameTd);
      tr.appendChild(unsubTd);
      tr.appendChild(linkTd);
      tr.appendChild(dslwTd);
      tableBody.appendChild(tr);
    });
    nextPageToken = response.result.nextPageToken;
  } while (nextPageToken);
}

export async function unsubscribe(subscriptionId, row) {
  await ensureAuthorized();
  await gapi.client.youtube.subscriptions.delete({ id: subscriptionId });
  row.remove();
}

export async function loadWatchHistory() {
  await ensureAuthorized();
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

export async function searchVideos() {
  await ensureAuthorized();
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
  resp.result.items.forEach((item) => {
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

export async function loadSubscriptionVideos(append = false) {
  await ensureAuthorized();
  const tableBody = document.querySelector('#subscriptions_table tbody');
  if (!append) {
    subsVideos = [];
    tableBody.innerHTML = '';
    subsWindowEnd = new Date();
    subsWindowStart = new Date();
    subsWindowStart.setDate(subsWindowEnd.getDate() - 3);
  }

  const windowVideos = [];
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
        type: 'video',
        publishedAfter: subsWindowStart.toISOString(),
        publishedBefore: subsWindowEnd.toISOString(),
        maxResults: 50,
      });
      res.result.items.forEach((vidItem) => {
        windowVideos.push({
          channelTitle: item.snippet.title,
          videoId: vidItem.id.videoId,
          title: vidItem.snippet.title,
          publishedAt: vidItem.snippet.publishedAt,
          thumb: vidItem.snippet.thumbnails.default.url,
        });
      });
    }
    nextPageToken = subs.result.nextPageToken;
  } while (nextPageToken);

  subsVideos.push(...windowVideos);

  const ids = windowVideos.map((v) => v.videoId);
  const statsMap = {};
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50).join(',');
    const statsResp = await gapi.client.youtube.videos.list({
      part: 'statistics',
      id: chunk,
    });
    statsResp.result.items.forEach((s) => {
      statsMap[s.id] = s.statistics;
    });
  }
  windowVideos.forEach((v) => (v.stats = statsMap[v.videoId] || {}));
  subsVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  windowVideos.forEach((v) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${v.channelTitle}</td>
      <td><img src="${v.thumb}"></td>
      <td>${v.title}</td>
      <td>${new Date(v.publishedAt).toLocaleDateString()}</td>
      <td>${v.stats.viewCount || ''}</td>
      <td>${v.stats.likeCount || ''}</td>
      <td><button onclick="event.stopPropagation(); getTranscript('${v.videoId}')">Get Transcript</button></td>
      <td>${v.stats.commentCount || ''}</td>
    `;
    tr.onclick = () => loadVideo(v.videoId);
    tableBody.appendChild(tr);
  });

  subsWindowEnd = new Date(subsWindowStart);
  subsWindowStart.setDate(subsWindowEnd.getDate() - 3);

  localStorage.setItem('subscriptions_cache', JSON.stringify({ timestamp: Date.now(), videos: subsVideos }));
}

export async function getTranscript(videoId) {
  await ensureAuthorized();
  try {
    const listResp = await gapi.client.youtube.captions.list({
      part: 'id',
      videoId,
    });
    if (listResp.result.items && listResp.result.items.length) {
      const captionId = listResp.result.items[0].id;
      const url = `https://www.googleapis.com/youtube/v3/captions/${captionId}?tfmt=srt&alt=media&access_token=${accessToken}`;
      window.open(url, '_blank');
    } else {
      alert('No transcript available');
    }
  } catch (err) {
    console.error('Transcript error', err);
    alert('Failed to fetch transcript');
  }
}
