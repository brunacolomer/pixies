import secrets
import string
from dataclasses import asdict, dataclass, field

from board import generate_board
from game import GameState
import game


@dataclass
class Room:
    code: str
    host_id: str
    players: dict[str, str] = field(default_factory=dict)
    started: bool = False
    game_state: GameState | None = None

    def snapshot(self):
        return asdict(self)


rooms: dict[str, Room] = {}
player_rooms: dict[str, str] = {}


def validate_player(sid, nickname):
    if sid in player_rooms:
        raise ValueError('Leave your current room first.')
    if not isinstance(nickname, str) or not 1 <= len(nickname.strip()) <= 30:
        raise ValueError('Nickname must contain 1 to 30 characters.')
    return nickname.strip()


def create_room(sid, nickname):
    nickname = validate_player(sid, nickname)
    while True:
        code = ''.join(secrets.choice(string.ascii_uppercase) for _ in range(6))
        if code not in rooms:
            break
    room = Room(code=code, host_id=sid, players={sid: nickname})
    rooms[code] = room
    player_rooms[sid] = code
    return room


def join_room(sid, code, nickname):
    nickname = validate_player(sid, nickname)
    if not isinstance(code, str):
        raise ValueError('Room code must be a string.')
    room = rooms.get(code.strip().upper())
    if room is None:
        raise ValueError('Room not found.')
    if room.started:
        raise ValueError('The game has already started.')
    if nickname.casefold() in (name.casefold() for name in room.players.values()):
        raise ValueError('Nickname is already taken in this room.')
    room.players[sid] = nickname
    player_rooms[sid] = room.code
    return room


def leave_room(sid):
    code = player_rooms.pop(sid, None)
    if code is None:
        return None
    room = rooms[code]
    if room.game_state is not None:
        game.remove_player(room.game_state, sid)
    del room.players[sid]
    if not room.players:
        del rooms[code]
    elif room.host_id == sid:
        room.host_id = next(iter(room.players))
    return room


def start_game(sid):
    code = player_rooms.get(sid)
    if code is None:
        raise ValueError('Join a room first.')
    room = rooms[code]
    if room.host_id != sid:
        raise ValueError('Only the host can start the game.')
    if room.started:
        raise ValueError('The game has already started.')
    room.game_state = GameState(
        board=generate_board(list(room.players)),
        players=room.players.copy(),
    )
    room.started = True
    return room


def play(sid, action, *args):
    code = player_rooms.get(sid)
    if code is None:
        raise ValueError('Join a room first.')
    room = rooms[code]
    if room.game_state is None:
        raise ValueError('The game has not started.')
    action(room.game_state, sid, *args)
    return room
