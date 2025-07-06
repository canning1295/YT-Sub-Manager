# YT-Sub-Manager

This project provides a simple web page that allows you to manage your YouTube subscriptions. It requires a Google API Client ID and API key that must be generated in the Google Developer Console.

## Setup

1. Create an OAuth 2.0 Client ID for a Web application in the [Google Developer Console](https://console.developers.google.com/). Add your page's URL to the authorized origins.
2. Enable the **YouTube Data API v3** for your project and generate an API key.
3. Replace `YOUR_CLIENT_ID` and `YOUR_API_KEY` in `config.js` with the credentials you created.
4. Open `index.html` in a browser.

## Usage

1. Click the **Authorize** button and sign in with your Google account.
2. After authorization, a table will show all your channel subscriptions.
3. Use the **Unsubscribe** button to unsubscribe from a channel.
4. **Open** will open the channel in a new tab.
5. **DSLW** (Days Since Last Watched) uses your watch history playlist to calculate when you last watched a video from that channel. If watch history is not available, `N/A` is displayed.

**Note:** This is a small demonstration and does not include any backend services. Credentials are kept in the front-end for simplicity. Use at your own risk.
