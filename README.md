# CB-O-Mat

A Vue 3 single-page application using Pinia for state management that processes IRC chat logs to generate reports on player activity. This tool helps analyze gameplay sessions, track players, and generate statistics based on chat interactions.

## Features

- **Log Input**: Paste a chat log or upload a text file.
- **Parsing**: Extracts structured game sections (Intro, Check-in, Start, Action, End).
- **Player Tracking**: Detects players from check-in, recognizes nickname changes.
- **Statistics**: Displays number of posts per player and message length distribution.
- **Filtering**: Allows filtering or highlighting posts from specific players.

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/)
- [Vue 3](https://vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)

### Setup
1. Clone this repository:
   ```sh
   git clone <your-private-repo-url>
   ```
2. Navigate to the project folder:
   ```sh
   cd irc-game-log-analyzer
   ```
3. Install dependencies:
   ```sh
   npm install
   ```
4. Run the development server:
   ```sh
   npm run dev
   ```

## Usage
1. Upload or paste an IRC game session chat log.
2. View the parsed log with highlighted sections.
3. Analyze player data and statistics.
4. Filter messages by player.

## Project Structure
```
cb-o-mat/
│── src/
│   ├── components/
│   ├── stores/gameLogStore.js
│   ├── App.vue
│   ├── main.js
│── public/
│── package.json
│── README.md
```

## License
This project is private and not intended for public distribution.
