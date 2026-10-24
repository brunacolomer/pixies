import { useEffect, useRef, useState } from 'react'
import type { GameState, Room, RoomResponse } from './socket'
import Board from './Board'
import Dice from './Dice'

interface GameProps {
  room: Room
  game: GameState
  playerId: string | undefined
  connected: boolean
  pending: boolean
  error: string
  onLeave: () => void
  onRoll: () => Promise<RoomResponse | undefined>
  onMove: (tileId: string) => void
}

export default function Game({ room, game, playerId, connected, pending, error, onLeave, onRoll, onMove }: GameProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [lastDie, setLastDie] = useState<number | null>(game.die)
  const rollLock = useRef(false)
  const menu = useRef<HTMLDialogElement>(null)
  const myTurn = game.current_player === playerId && !game.winner
  useEffect(() => {
    if (menuOpen) menu.current?.showModal()
    else menu.current?.close()
  }, [menuOpen])

  async function roll() {
    if (rollLock.current || pending || !myTurn || game.die !== null) return
    rollLock.current = true
    setRolling(true)
    const started = performance.now()
    try {
      const response = await onRoll()
      // A short shake, with no client-generated random faces.
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, 450 - (performance.now() - started))))
      if (response?.ok) {
        const state = response.room?.game_state
        // Skipped turns clear `die`; the existing server message retains it.
        const skippedRoll = state?.message.match(/ rolled ([1-6])\. No valid moves\. Turn skipped\.$/)
        setLastDie(state?.die ?? (skippedRoll ? Number(skippedRoll[1]) : null))
      }
    } finally {
      rollLock.current = false
      setRolling(false)
    }
  }
  const status = game.winner ? `${game.players[game.winner]} wins!`
    : rolling ? 'Rolling…' : myTurn ? game.die !== null ? 'Tap a highlighted tile' : 'Tap the die to roll'
    : `Waiting for ${game.players[game.current_player ?? ''] ?? 'players'}`

  return <main className="game-screen">
    <header className="game-header">
      <strong role="status">{game.winner ? 'Game over' : myTurn ? 'Your turn' : `${game.players[game.current_player ?? '']}’s turn`}</strong>
      <code>{room.code}</code>
      <button className="secondary icon-button" aria-label="Open game menu" aria-haspopup="dialog"
        onClick={() => setMenuOpen(true)}>☰</button>
    </header>
    <Board game={game} playerId={playerId} disabled={!connected || pending || rolling || menuOpen} onMove={onMove} />
    <footer className="game-controls">
      <Dice value={rolling ? lastDie : game.die ?? lastDie} rolling={rolling}
        disabled={!connected || pending || !myTurn || game.die !== null || !!game.winner} onRoll={() => { void roll() }} />
      <div className="game-feedback">
        <strong role="status">{status}</strong>
        {error ? <p className="error" role="alert">{error}</p> : game.message && <p>{game.message}</p>}
      </div>
    </footer>
    <dialog ref={menu} className="game-menu" onCancel={() => setMenuOpen(false)} onClose={() => setMenuOpen(false)}>
      <div className="menu-heading"><h2>Room {room.code}</h2>
        <button className="secondary icon-button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>×</button></div>
      <p>{connected ? 'Connected' : 'Disconnected'}</p>
      <ul className="players">
        {Object.entries(room.players).map(([id, name]) => <li key={id}>
          <span>{name}{id === playerId ? ' (you)' : ''}</span>
          {id === game.current_player && <span className="badge">Current turn</span>}
        </li>)}
      </ul>
      <button className="secondary" disabled={pending} onClick={onLeave}>Leave game</button>
    </dialog>
  </main>
}
