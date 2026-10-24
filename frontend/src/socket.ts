import { io } from 'socket.io-client'

export interface Tile {
  id: string
  x: number
  y: number
  type: 'start' | 'normal' | 'finish'
}

export interface Board {
  tiles: Tile[]
  edges: { source: string; target: string }[]
  starts: Record<string, string>
}

export interface GameState {
  board: Board
  players: Record<string, string>
  positions: Record<string, string>
  turn_order: string[]
  current_player: string | null
  die: number | null
  valid_moves: string[]
  winner: string | null
  message: string
}

export interface Room {
  code: string
  host_id: string
  players: Record<string, string>
  started: boolean
  game_state: GameState | null
}

export type RoomResponse =
  | { ok: true; room?: Room }
  | { ok: false; error: string }

export const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', {
  autoConnect: false,
})
