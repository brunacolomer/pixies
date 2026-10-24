# Multiplayer backend

FastAPI and python-socketio with rooms stored in memory.

```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```

`GET /` returns a health check. Socket.IO uses `/socket.io`.
Use one worker: rooms disappear on restart and are not shared between processes.
Browser origins default to `http://localhost:5173` and `http://127.0.0.1:5173`.
Set `CORS_ORIGINS` to a comma-separated list to change them.

## Events

| Client event | Payload | Behavior |
| --- | --- | --- |
| `create_room` | `{nickname: "Ada"}` | Create a room and become host. |
| `join_room` | `{code: "ABCDEF", nickname: "Ben"}` | Join before the game starts. |
| `leave_room` | None | Leave the current room. |
| `start_game` | None | Host starts the game. |

Acknowledgements return `{ok: true, room: ...}` or `{ok: false, error: "..."}`.
Leaving returns only `{ok: true}`.

The server broadcasts `room_updated` on joins and departures, and `game_started`
when the host starts. Both contain the full room:

```json
{
  "code": "ABCDEF",
  "host_id": "socket-id",
  "players": {"socket-id": "Ada"},
  "started": false,
  "game_state": null
}
```

Players use their connection ID (`socket.id` in JS). Each connection may join
one room. Nicknames must contain 1–30 characters and be unique within the room
(case-insensitive). Room codes are case-insensitive. Disconnecting removes the
player; reconnecting requires joining again. When the host leaves, the earliest
remaining player becomes host. Empty rooms are deleted. A host can start alone.
Each player has one piece. Turns follow the player order at game start.

Starting generates a board, saves it in `room.game_state.board`, and includes the game state
in the `game_started` broadcast and acknowledgement. It stays in room snapshots
afterward. Player starts on the left feed into shared routes and a finish on the far right.
`generate_board(player_ids)` supports any positive player count.

`game_state` contains `board` and a `players` snapshot mapping connection IDs to
nicknames at game start. It is stored in memory on the room and included in both
`game_started` and later `room_updated` snapshots.

The board contains:

- `tiles`: objects with `id`, `x`, `y`, and `type` (`start`, `normal`, `finish`).
- `edges`: undirected connections with `source` and `target` tile IDs, listed once.
- `starts`: a mapping from player connection IDs to their outer start tile IDs.

Players start on the left in vertically stacked rows. Each branch runs horizontally
with unit tile spacing, and its final edge connects to the shared finish on the right.
Rows are spaced 1.5 units apart. Starts assign
initial tiles only; movement follows graph edges, without predefined player routes.
The board is generated once at game start and remains unchanged if a player leaves.

Example using JavaScript's `socket.io-client`:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000');
socket.on('room_updated', console.log);
socket.on('game_started', console.log);
socket.on('connect', () => {
  socket.emit('create_room', { nickname: 'Ada' }, console.log);
});
// Another client: socket.emit('join_room', {code: 'ABCDEF', nickname: 'Ben'}, console.log);
// Host: socket.emit('start_game', console.log);
// Any player: socket.emit('leave_room', console.log);
```

## Turns and movement

- `roll_dice` (no payload): the current player rolls a server-generated die (1–6).
- `move_piece` (`{tile_id: "..."}`): move to a server-approved destination.

Both return the usual room acknowledgement and broadcast `room_updated`.
Game state includes `positions`, `turn_order`, `current_player`, `die`,
`valid_moves`, `winner`, and a short `message` for the latest action.

Moves follow undirected edges for exactly the rolled number of steps, without
revisiting tiles during a move. Finish is terminal: it must be reached on the
last step. With no legal destination, the turn is automatically skipped.
After a move the next player rolls; reaching finish ends the game. Disconnected
players lose their piece and are removed from the turn order. Remaining players
continue; no automatic winner is declared for departures.

## Board generation options

Configure `generate_board(...)` in `board.py` (or pass options from its call in
`rooms.py`). These affect the layout only; movement rules stay the same.

| Parameter | Default | Effect |
| --- | --- | --- |
| `branch_length` | `10` | Number of segment columns, minimum 6. |
| `max_branches` | `5` | Maximum simultaneous routes after the player starts. |
| `branching_probability` | `0.75` | How often a column chooses a new route count. |
| `intersection_density` | `0.85` | Higher values favor merging into fewer routes. |
| `overlap_probability` | `0.8` | Higher values further concentrate routes into shared sections. |
| `route_length_variation` | `0.65` | How often corridors choose independent lengths. |
| `min_segment_length` / `max_segment_length` | `2` / `6` | Intermediate tiles between junctions. |
| `seed` | `None` | Fresh layout each game; use an integer to reproduce one. |

Every board includes an unavoidable shared corridor at a variable position.
Routes can split again afterward and reach the finish through several entrances.
All connections preserve vertical order; graphical crossings do not create tiles.

## Grid layout

Tiles now occupy unique integer `(x, y)` cells. Every edge joins orthogonal
neighbors exactly one cell apart. Horizontal lanes are separated by empty rows;
vertical spines supply visible tiles for bends, merges, and splits. Shared cells
always reuse their tile ID. Segment length settings control horizontal runs;
vertical connectors add their own playable spaces. Dice and movement still count
one step per edge. The frontend keeps tiles readable at 36 pixels per cell and
lets the board scroll instead of shrinking wide boards to fit.
