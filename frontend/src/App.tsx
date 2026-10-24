import { useState } from 'react'
import { useRoom } from './useRoom'
import Game from './Game'
import './App.css'

function App() {
  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState('')
  const { room, connected, pending, error, send, playerId } = useRoom()
  const disabled = !connected || pending
  const isHost = room?.host_id === playerId

  if (room?.game_state) {
    return <Game room={room} game={room.game_state} playerId={playerId}
      connected={connected} pending={pending} error={error}
      onLeave={() => { void send('leave_room') }}
      onRoll={() => send('roll_dice')}
      onMove={(tileId) => { void send('move_piece', { tile_id: tileId }) }} />
  }

  return (
    <main className="lobby">
      <header>
        <h1>Pixies</h1>
        <p role="status">{connected ? 'Connected' : 'Connecting…'}</p>
      </header>
      {error && <p className="error" role="alert">{error}</p>}
      {room ? (
        <section aria-labelledby="room-title">
          <h2 id="room-title">Room <code>{room.code}</code></h2>
          <p>Share this code with your friends.</p>
          <ul className="players">
            {Object.entries(room.players).map(([id, name]) => (
              <li key={id}>
                <span>{name}{id === playerId && ' (you)'}</span>
                {id === room.host_id && <span className="badge">Host</span>}
              </li>
            ))}
          </ul>
          {room.started ? (
            <p role="status">Game started!</p>
          ) : isHost ? (
            <button disabled={disabled} onClick={() => send('start_game')}>Start game</button>
          ) : (
            <p role="status">Waiting for the host to start the game…</p>
          )}
          <button className="secondary" disabled={disabled} onClick={() => send('leave_room')}>
            Leave room
          </button>
        </section>
      ) : (
        <form onSubmit={(event) => {
          event.preventDefault()
          void send('join_room', { nickname: nickname.trim(), code: code.trim() })
        }}>
          <label htmlFor="nickname">Nickname</label>
          <input id="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)}
            maxLength={30} required autoComplete="nickname" />
          <button type="button" disabled={disabled || !nickname.trim()}
            onClick={() => send('create_room', { nickname: nickname.trim() })}>
            Create room
          </button>
          <div className="divider">or join a room</div>
          <label htmlFor="code">Room code</label>
          <input id="code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())}
            maxLength={6} required autoComplete="off" spellCheck={false} />
          <button type="submit" disabled={disabled || !nickname.trim() || !code.trim()}>Join room</button>
        </form>
      )}
    </main>
  )
}

export default App
