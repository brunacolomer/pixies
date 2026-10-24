import asyncio
import os

import socketio

import rooms
import game

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=os.getenv(
        'CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'
    ).split(','),
)
# Keep state changes and broadcasts ordered across concurrent clients.
room_lock = asyncio.Lock()


async def handle_event(sid, data, action, event='room_updated', enter=False):
    if not isinstance(data, dict):
        return {'ok': False, 'error': 'Payload must be an object.'}
    async with room_lock:
        try:
            room = action()
        except ValueError as error:
            return {'ok': False, 'error': str(error)}
        if enter:
            await sio.enter_room(sid, room.code)
        state = room.snapshot()
        await sio.emit(event, state, to=room.code)
        return {'ok': True, 'room': state}


@sio.event
async def create_room(sid, data=None):
    return await handle_event(
        sid, data, lambda: rooms.create_room(sid, data.get('nickname')), enter=True
    )


@sio.event
async def join_room(sid, data=None):
    return await handle_event(
        sid, data,
        lambda: rooms.join_room(sid, data.get('code'), data.get('nickname')),
        enter=True,
    )


@sio.event
async def start_game(sid, data=None):
    return await handle_event(
        sid, {} if data is None else data,
        lambda: rooms.start_game(sid), event='game_started',
    )


async def remove_player(sid):
    async with room_lock:
        room = rooms.leave_room(sid)
        if room is not None:
            await sio.leave_room(sid, room.code)
            if room.players:
                await sio.emit('room_updated', room.snapshot(), to=room.code)
    return {'ok': True}


@sio.event
async def roll_dice(sid, data=None):
    return await handle_event(
        sid, {} if data is None else data,
        lambda: rooms.play(sid, game.roll_dice),
    )


@sio.event
async def move_piece(sid, data=None):
    return await handle_event(
        sid, data, lambda: rooms.play(sid, game.move_piece, data.get('tile_id')),
    )


@sio.event
async def leave_room(sid, data=None):
    return await remove_player(sid)


@sio.event
async def disconnect(sid, reason):
    await remove_player(sid)
