# ChemRace - Multiplayer Organic Chemistry Game

Real-time multiplayer game for JEE organic chemistry preparation with 100+ reactions.

## Features

- **Real-time Multiplayer**: Compete with friends in live chemistry battles
- **100+ Reactions**: Comprehensive JEE syllabus coverage
- **Named Mechanisms**: Test knowledge of Aldol, Grignard, Sandmeyer, and more
- **3 Difficulty Levels**: Easy, Medium (JEE Mains), Hard (JEE Advanced)
- **Mobile Optimized**: Works perfectly on Android devices
- **PWA Support**: Install as an app on your phone

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express
- **Real-time**: Socket.IO for WebSocket connections
- **Deployment**: Render

## Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Start the server:**
```bash
npm start
```

3. **Open in browser:**
```
http://localhost:3000
```

## Deploy to Render

### Method 1: Via GitHub (Recommended)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. **Deploy on Render:**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: chemrace-multiplayer
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free
   - Click "Create Web Service"

### Method 2: Direct Upload

1. Create a new Web Service on Render
2. Choose "Deploy from Git" or upload the folder directly
3. Set the start command: `npm start`
4. Deploy!

## Environment Variables

No environment variables required for basic deployment. The app uses:
- `PORT`: Automatically set by Render (default: 3000)

## File Structure

```
chemrace/
├── server.js                 # Node.js WebSocket server
├── package.json             # Dependencies
├── organic_chem_game.html   # Main game file
└── README.md               # This file
```

## How to Play

### Solo Mode
1. Enter your name
2. Select difficulty
3. Click "Quick Play"
4. Answer questions as fast as possible!

### Multiplayer Mode
1. **Create Room:**
   - Enter your name
   - Select difficulty
   - Click "Create Room"
   - Share the room code with friends

2. **Join Room:**
   - Enter your name
   - Click "Join Room"
   - Enter the room code
   - Wait for host to start

3. **Compete:**
   - Same questions for all players
   - Faster correct answers = more points
   - 5 rounds total

## Scoring System

- **Correct Answer**: 100 points - (time taken × 3)
- **Minimum**: 20 points for correct answers
- **Incorrect**: 0 points
- **Winner**: Highest total score after 5 rounds

## Question Coverage

### Easy (15 reactions)
- Basic oxidation/reduction
- Halogenation
- Addition reactions
- Simple substitution

### Medium (35+ reactions)
- Named reactions (Aldol, Cannizzaro, Sandmeyer, etc.)
- Multi-step conversions
- Grignard reactions
- Elimination reactions

### Hard (50+ reactions)
- Advanced mechanisms (Hofmann, Beckmann, Schmidt, etc.)
- Complex multi-step pathways
- Specialty reactions (Birch, Swern, MPV, etc.)

## Mobile Installation

### Android
1. Open the game URL in Chrome
2. Tap menu (⋮) → "Install app"
3. App appears on home screen
4. Tap to play offline!

### iOS
1. Open in Safari
2. Tap Share button
3. "Add to Home Screen"
4. Launch from home screen

## Troubleshooting

### Can't connect to multiplayer
- Check internet connection
- Ensure server is running
- Try refreshing the page

### Room code not working
- Room codes expire when empty
- Check for typos (case-sensitive)
- Create a new room if needed

### Timer issues
- Each player has independent timer
- Network lag may affect synchronization
- Refresh if timer stops

## Support

For issues or questions:
- Check the console for errors (F12)
- Ensure you're using a modern browser
- Try incognito/private mode

## License

MIT License - feel free to modify and use!

## Credits

Built for JEE aspirants to master organic chemistry reactions through competitive gameplay.
