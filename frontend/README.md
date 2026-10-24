# Pixies frontend

```bash
npm install
npm run dev
```

Set `VITE_BACKEND_URL` in `.env` (see `.env.example`). The default is
`http://localhost:8000`. Restart Vite after changing it.
Start the backend separately with `uv run uvicorn main:app --reload` from `backend/`.
Use `http://localhost:5173` for the frontend, which the backend allows by default.

Enter a nickname to create a room or join with a room code. Open another tab to
join as another player. The host can start the game. All players then see the same SVG board generated
by the backend. Player lists and host changes
update automatically. Disconnecting leaves the room; join again after reconnecting.

- `src/socket.ts`: Socket.IO client and room types.
- `src/useRoom.ts`: Connection, room state, and backend events.
- `src/App.tsx`: Room form and lobby.
- `src/Game.tsx`: Game page and SVG rendering of backend tiles and edges.

Build: `npm run build`. Lint: `npm run lint`.
