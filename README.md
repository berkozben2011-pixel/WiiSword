# Sword Duel 2.5D — Universal Controls

Local two-player sword duel with keyboard, up to two gamepads, phone motion controller, browser mouse fallback, and optional two-device Windows Raw Input in Electron.

## Controls

- Player 1 keyboard: A/D move, W attack, S defend.
- Player 2 keyboard: Left/Right move, Up attack, Down defend.
- Gamepad 1/2: first connected pad = P1, second = P2; left stick moves, right stick aims/sweeps, RT or A attacks, LT defends.
- Phone: create a room in the host settings, scan the QR/open controller link, enter the room code, choose P1 or P2. Enable motion permission and swing the phone to move the sword. On-screen left/right, attack and defend buttons are also available.
- Browser mouse: one pointer controls P1. Independent physical dual-mouse input is only available in the Windows Electron build with the native Raw Input addon.

## GitHub Pages + Render phone support

GitHub Pages can host the static game files, but it cannot run the Socket.IO server. Deploy this same repository to Render as a **Web Service**:

- Build command: `npm install`
- Start command: `npm start`

Then edit `config.js` and set `SOCKET_SERVER_URL` to your Render URL, for example `https://your-service.onrender.com` (no trailing slash). Commit and push the changed `config.js` to GitHub. Enable GitHub Pages from the repository's `main` branch / root. Open the Pages site on the host computer; create a phone room; scan the QR or open the controller link on phones. Both devices need internet access.

If the game itself is hosted on Render, `config.js` still needs the Render URL. Render's free instances may sleep when idle, so the first connection can take a little time.

## Local web development

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Windows Electron / dual physical mouse (optional)

Install Visual Studio Build Tools with **Desktop development with C++**, MSVC v143 and Windows 10/11 SDK. Then:

```bash
npm install
npm run install-native
npm run electron
```

The native addon is optional for the web version. Without it, Electron still supports keyboard and gamepads. Raw Input dual-mouse support is Windows-only.

## Important limitations

- A normal browser merges physical mouse movement into one pointer; GitHub Pages cannot independently identify two physical mice.
- Phone motion uses the phone's device-orientation sensor. HTTPS is required, and iPhone Safari asks for motion permission after tapping the sensor button. Some school Wi-Fi networks may block device-to-device access; the Render relay avoids local-network discovery but still requires internet.
- Gamepad support depends on the browser/device exposing the Gamepad API. Connect controllers before opening the game and press a button if the browser needs activation.
