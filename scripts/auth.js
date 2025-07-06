export const SCOPES = 'https://www.googleapis.com/auth/youtube';
export let accessToken;
let tokenClient;

export function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest']
  });
}

export function gisLoaded(onAuthorized) {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      if (onAuthorized) onAuthorized();
    }
  });
  authorize();
}

export function authorize(onAuthorized) {
  tokenClient.callback = (tokenResponse) => {
    accessToken = tokenResponse.access_token;
    if (onAuthorized) onAuthorized();
  };
  tokenClient.requestAccessToken();
}

export async function ensureAuthorized() {
  if (!accessToken) {
    await new Promise(resolve => authorize(resolve));
  }
}
