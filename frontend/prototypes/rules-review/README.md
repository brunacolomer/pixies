# Game workshop prototype

A standalone React + TypeScript prototype. Its own package, HTML entry, styles, and data live here; nothing imports the existing app or backend.

## Preview in VS Code

1. Install the current Node.js LTS release from https://nodejs.org if needed. It includes npm. Restart VS Code after installing.
2. Open this repository in VS Code, then choose **Terminal → New Terminal**.
3. From the repository root, run:

   ```sh
   cd frontend/prototypes/rules-review
   npm install
   npm run dev
   ```

4. Open the Local URL printed by Vite in your browser (usually http://127.0.0.1:5173). If another app uses that port, use the URL Vite actually prints. This prototype lives at `/` on its own development server.
5. Keep the terminal running. Saved changes refresh the page. Press **Ctrl+C** to stop.

Optional production check, from this directory:

```sh
npm run build
npm run preview
```

`npm install` creates dependencies and a lockfile only in this prototype directory. `dist/` and `node_modules/` are ignored here. No backend, accounts, API keys, or environment variables are needed.

## Try it

- Read and mark the five game rules reviewed.
- Open **Board tiles**, inspect the ordered board preview, then edit a tile's title, type, action, challenge, or penalty.
- In the editor, add or remove details with arbitrary labels. Save changes; that item must be reviewed again. Cancel leaves it unchanged.
- Add a custom board tile and review it. New tiles append to the board order.
- Review every rule and tile to enable **Confirm rules & start**. This only shows a confirmation; it does not create a real game.
- Use **Reset sample** to restore the draft after confirming. Refreshing also clears everything.
- Check a narrow browser window and use Tab, Shift+Tab, and Escape in editors.

## Change the structure later

- `sample-data.ts`: types and factory for the entire sample game. Each rule/tile has a stable ID, title, category string, editable fields, and review status.
- `main.tsx`: review state, editor, board preview, and simulated start. Both rules and tiles use the same editor.
- `style.css`: standalone responsive styling. Fonts optionally load from Google Fonts; system fonts work offline.

The `fields` array accepts arbitrary details, so future AI output is not tied to fixed action/challenge/penalty properties. Tile categories also accept any string. The frontend assumes no AI API response format; a future integration can translate responses into `GameDraft`. Review status is local UI state, not a real multiplayer approval mechanism.

Not implemented: persistence, synchronization, per-player approvals, tile deletion/reordering, AI generation, or actual gameplay. These can be decided separately when the game design is ready.

## Verification note

The creation environment had no `npm` or Node.js executable, so the build and browser interactions could not be executed there. Run the commands and interaction checks above locally before integrating this prototype.
