# Home Page Plan for Personal YouTube Video Viewer

This plan describes how to design and implement the main page for a single-page application (SPA) that acts as a personal YouTube video viewer. The goal is to combine subscription management, searching YouTube, recommended videos from subscribed channels, and a video player with keyboard shortcuts. The existing "YT Subscription Manager" code will serve as the base for the "Manage Subs" portion.

## 1. High-Level Features

1. **Left Navigation Menu**
   - Collapsible sidebar on the left of the app window.
   - Links to the following views:
     - **Home/Player** – shows the embedded video player and currently selected video.
     - **Manage Subs** – existing subscription management interface.
     - **Search** – search form for searching all of YouTube.
     - **Recommended** – list of recommended videos from subscribed channels.
   - The sidebar should collapse/expand with a toggle icon (hamburger/arrow).

2. **Main Content Area**
   - Displays one of the views above based on user selection.
   - All views load dynamically without a full page refresh.

3. **Recommended Videos Table**
   - Populated with videos downloaded from all subscribed channels.
   - Sorted by video publish date in descending order.
   - Columns in order:
     1. **Channel Name**
     2. **Video Thumbnail**
     3. **Video Name**
     4. **Video Date**
     5. **Views**
     6. **Likes**
     7. **Dislikes** (if available via API)
     8. **Total Comments**
   - Clicking a table row opens that video in the player view.

4. **Video Player Page**
   - Initially displayed within the app window at the full width of the main content area.
   - Ability to toggle full-screen mode.
   - Keyboard shortcuts:
     - **Space** – play/pause.
     - **A** – increase playback speed by 0.25x (up to a sensible max such as 2x).
     - **S** – decrease playback speed by 0.25x (down to a min of 0.25x).
   - When speed changes, briefly overlay the current playback speed on the player (e.g., small text in a corner that fades after a second).

5. **Search Page**
   - Input box for searching all of YouTube.
   - Display results in a list or table with video thumbnails and titles.
   - Clicking a result loads it into the player.

6. **Persistence & Data Loading**
   - Use existing OAuth flow to access the YouTube Data API.
   - For recommended videos: for each subscribed channel, fetch the latest videos (e.g., using `search.list` with `channelId` or `activities.list`).
   - Combine these results into one list, sort by publish date, then render the table.
   - Optionally store fetched video metadata in memory or `localStorage` to reduce API calls.

## 2. Layout and Style Approach

- Use a flexible CSS layout (CSS Grid or Flexbox) to create the left nav and main content area.
- The sidebar should have a fixed width when expanded and a narrow width (or hide entirely) when collapsed.
- The main area should take the remaining width and hold the view container where different pages (player, subs, search, recommended) are swapped in/out using JavaScript.
- Each view can be wrapped in its own `<div>` that is hidden/shown as the user navigates.

## 3. Detailed Implementation Steps

1. **Structure the HTML**
   - Add a sidebar `<nav>` with buttons/links for each page.
   - Create `<div>` containers for Player, Manage Subs (existing table), Search, and Recommended.
   - Include a button/icon for collapsing the sidebar.

2. **Navigation Logic**
   - Attach click handlers to sidebar links.
   - Use JavaScript to toggle visibility of the corresponding view container while hiding others.
   - Preserve state (e.g., currently loaded video or search results) when switching views.

3. **Build the Recommended Videos Feature**
   - After user authorization, fetch the list of subscriptions (already handled).
   - For each subscription, use the YouTube API to retrieve recent uploads:
     - `search.list` with `channelId` or `activities.list` with `uploads` playlist.
     - Store video metadata: id, title, thumbnail URL, publish date, view/like/dislike counts, comment count (from `videos.list`).
   - Merge all videos into one array and sort by publish date descending.
   - Render this data into a table matching the required column order.
   - Add event listeners on each row to load the video in the player view when clicked.

4. **Search Page Implementation**
   - Provide an input field and a search button.
   - Call the YouTube search API with the user query.
   - Display results similarly to the recommended table (thumbnail, title, etc.).
   - Allow clicking a result to play the video.

5. **Player Implementation**
   - Use the YouTube IFrame Player API.
   - Initialize the player in the Player view container when the page loads or when a video is selected.
   - Add custom keyboard listeners for space, "A", and "S" keys to control playback.
   - Implement logic to display a small overlay showing the current speed whenever it changes (fades out after a brief delay).
   - Provide a full-screen toggle button. When clicked, call the IFrame API's `requestFullscreen` or use the standard Fullscreen API.
   - Ensure the player scales to the width of the main content container when not in full-screen.

6. **Integrating Manage Subs**
   - Reuse the current table and functions from `script.js` in the Manage Subs view.
   - Ensure the existing authorize flow still triggers when the app loads or when necessary for API requests.

7. **General SPA Considerations**
   - Keep state (like the list of videos and current player settings) in a central JavaScript object or use a framework/library if desired (though not required).
   - Use event delegation for dynamic content, especially for tables that are re-rendered.
   - Consider error handling for API failures and display user-friendly messages.

8. **Optional Enhancements**
   - Dark/light theme toggle.
   - Pagination or lazy loading for large recommended video lists.
   - Search history or quick filters for videos by channel.
   - Keyboard shortcut hints in the UI.

## 4. Summary

This plan outlines building a unified single-page application with a collapsible navigation menu, a video player with keyboard shortcuts, subscription management, a search interface, and a recommended videos list. By leveraging the YouTube Data API and the existing subscription manager code, you can create a robust personal YouTube viewer that keeps your favorite channels organized and easily accessible.

