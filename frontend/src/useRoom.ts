import { useEffect, useState } from 'react'
import { socket } from './socket'
import type { Room, RoomResponse } from './socket'

type RoomEvent = 'create_room' | 'join_room' | 'leave_room' | 'start_game' | 'roll_dice' | 'move_piece'

export function useRoom() {
  const [room, setRoom] = useState<Room | null>(null)
  const [connected, setConnected] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function onConnect() {
      setConnected(true)
      setError('')
    }
    function onDisconnect() {
      setConnected(false)
      setRoom(null)
      setError('Connection lost. Join a room again once connected.')
    }
    function onConnectError() {
      setError('Cannot connect to the server.')
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('room_updated', setRoom)
    socket.on('game_started', setRoom)
    socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('room_updated', setRoom)
      socket.off('game_started', setRoom)
      socket.disconnect()
    }
  }, [])

  async function send(event: RoomEvent, payload = {}) {
    if (!socket.connected || pending) return
    setPending(true)
    setError('')
    try {
      const response: RoomResponse = await socket.timeout(5000).emitWithAck(event, payload)
      if (!response.ok) {
        setError(response.error)
      } else if (event === 'leave_room') {
        setRoom(null)
      } else if (response.room) {
        setRoom(response.room)
      }
      return response
    } catch {
      // Reset membership if the server's acknowledgement never arrives.
      socket.disconnect()
      socket.connect()
      setError('Request failed. Please join a room again.')
    } finally {
      setPending(false)
    }
  }

  return { room, connected, pending, error, send, playerId: socket.id }
}
