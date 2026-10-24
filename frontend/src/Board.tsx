import { useEffect, useMemo, useState } from 'react'
import type { GameState } from './socket'
import { layoutBoard } from './boardLayout'
import BoardViewport from './BoardViewport'

interface BoardProps {
  game: GameState
  playerId: string | undefined
  disabled: boolean
  onMove: (tileId: string) => void
}

export default function Board({ game, playerId, disabled, onMove }: BoardProps) {
  const { board } = game
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)')
    const update = () => setMobile(media.matches)
    media.addEventListener('change', update)
    update()
    return () => media.removeEventListener('change', update)
  }, [])
  const tiles = useMemo(() => {
    const layout = layoutBoard(board)
    if (mobile) {
      for (const tile of layout.values()) {
        [tile.x, tile.y] = [tile.y, tile.x]
        tile.rotation = -tile.rotation
      }
    }
    return layout
  }, [board, mobile])
  const starts = new Map(Object.entries(board.starts).map(([id, tileId]) => [tileId, id]))
  const xs = [...tiles.values()].map((tile) => tile.x)
  const ys = [...tiles.values()].map((tile) => tile.y)
  const padding = 1.2
  const minX = Math.min(...xs) - padding
  const minY = Math.min(...ys) - padding
  const width = Math.max(...xs) - minX + padding
  const height = Math.max(...ys) - minY + padding
  const myTurn = game.current_player === playerId && !game.winner
  const colors = Object.fromEntries(Object.keys(game.players).map((id, index) =>
    [id, `hsl(${index * 137.5 % 360} 65% 38%)`]))
  const ownTile = tiles.get(game.positions[playerId ?? ''])
  const home = ownTile ? { x: (ownTile.x - minX) * 48, y: (ownTile.y - minY) * 48 } : { x: 80, y: 80 }
  const startTiles = Object.values(board.starts).map((id) => tiles.get(id)!)
  const startBounds = {
    left: (Math.min(...startTiles.map((tile) => tile.x)) - minX) * 48 - 52,
    right: (Math.max(...startTiles.map((tile) => tile.x)) - minX) * 48 + 52,
    top: (Math.min(...startTiles.map((tile) => tile.y)) - minY) * 48 - 48,
    bottom: (Math.max(...startTiles.map((tile) => tile.y)) - minY) * 48 + 32,
  }
  return <BoardViewport home={home} startBounds={startBounds} vertical={mobile} resetKey={String(mobile)}>
      <svg className="board" viewBox={`${minX} ${minY} ${width} ${height}`}
        style={{ width: width * 48, height: height * 48 }}
        role="group" aria-labelledby="board-title board-description">
        <title id="board-title">Game board</title>
        <desc id="board-description">{mobile
          ? 'Players start in a row at the top. Paths lead down to the finish.'
          : 'Players start on the left. Paths lead to the finish on the right.'}</desc>
        {board.edges.map((edge) => {
          const source = tiles.get(edge.source)!
          const target = tiles.get(edge.target)!
          return <line key={`${edge.source}-${edge.target}`} x1={source.x} y1={source.y}
            x2={target.x} y2={target.y} className="board-edge" />
        })}
        {[...tiles.values()].map((tile) => {
          const owner = starts.get(tile.id)
          const label = tile.type === 'finish' ? 'Finish' : owner ? game.players[owner] : ''
          const selectable = !!myTurn && !disabled && game.valid_moves.includes(tile.id)
          return (
            <g key={tile.id}>
              <rect x={tile.x - 0.45} y={tile.y - 0.45}
                width={0.9} height={0.9} rx={0.12}
                transform={`rotate(${tile.rotation} ${tile.x} ${tile.y})`}
                className={`board-tile ${tile.type}${owner === playerId ? ' own-start' : ''}${selectable ? ' reachable' : ''}`}
                role={selectable ? 'button' : undefined} tabIndex={selectable ? 0 : undefined}
                aria-label={selectable ? `Move to ${label || tile.id}` : undefined}
                onClick={() => { if (selectable) onMove(tile.id) }}
                onKeyDown={(event) => {
                  if (selectable && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault()
                    onMove(tile.id)
                  }
                }}>
                <title>{label || tile.id}</title>
              </rect>
              {label && <text x={tile.x} y={tile.y - 0.65} textAnchor="middle"
                className="board-label">{label}{owner === playerId ? ' (you)' : ''}</text>}
            </g>
          )
        })}
        {Object.entries(game.positions).map(([id, tileId]) => {
          const tile = tiles.get(tileId)!
          const occupants = Object.keys(game.positions).filter((key) => game.positions[key] === tileId)
          const index = occupants.indexOf(id)
          const offset = (index - (occupants.length - 1) / 2) * Math.min(0.24, 0.5 / occupants.length)
          return <circle key={id} cx={tile.x + offset} cy={tile.y} r={0.23}
            fill={colors[id]} stroke="white" strokeWidth={0.025} pointerEvents="none">
            <title>{game.players[id]}{id === playerId ? ' (you)' : ''}</title>
          </circle>
        })}
      </svg>
  </BoardViewport>
}
