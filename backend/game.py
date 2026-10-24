import secrets
from dataclasses import dataclass, field


@dataclass
class GameState:
    board: dict
    players: dict[str, str]
    positions: dict[str, str] = field(default_factory=dict)
    turn_order: list[str] = field(default_factory=list)
    current_player: str | None = None
    die: int | None = None
    valid_moves: list[str] = field(default_factory=list)
    winner: str | None = None
    message: str = ''

    def __post_init__(self):
        self.positions = self.board['starts'].copy()
        self.turn_order = list(self.players)
        self.current_player = self.turn_order[0]


def reachable_tiles(board, start, steps):
    """Follow undirected edges without revisiting tiles; finish ends a move."""
    neighbors = {tile['id']: [] for tile in board['tiles']}
    finishes = {tile['id'] for tile in board['tiles'] if tile['type'] == 'finish'}
    for edge in board['edges']:
        neighbors[edge['source']].append(edge['target'])
        neighbors[edge['target']].append(edge['source'])
    reachable = set()
    pending = [(start, steps, {start})]
    while pending:
        tile, remaining, visited = pending.pop()
        if remaining == 0:
            reachable.add(tile)
        elif tile not in finishes:
            for neighbor in neighbors[tile]:
                if neighbor not in visited:
                    pending.append((neighbor, remaining - 1, visited | {neighbor}))
    return sorted(reachable)


def validate_turn(game, sid):
    if game.winner is not None:
        raise ValueError('The game has ended.')
    if game.current_player != sid:
        raise ValueError('It is not your turn.')


def advance_turn(game):
    index = game.turn_order.index(game.current_player)
    game.current_player = game.turn_order[(index + 1) % len(game.turn_order)]
    game.die = None
    game.valid_moves = []


def roll_dice(game, sid):
    validate_turn(game, sid)
    if game.die is not None:
        raise ValueError('Choose a highlighted tile before rolling again.')
    game.die = secrets.randbelow(6) + 1
    game.valid_moves = reachable_tiles(game.board, game.positions[sid], game.die)
    game.message = f'{game.players[sid]} rolled {game.die}.'
    if not game.valid_moves:
        game.message += ' No valid moves. Turn skipped.'
        advance_turn(game)


def move_piece(game, sid, tile_id):
    validate_turn(game, sid)
    if game.die is None:
        raise ValueError('Roll the die first.')
    if not isinstance(tile_id, str) or tile_id not in reachable_tiles(
        game.board, game.positions[sid], game.die
    ):
        raise ValueError('Choose a tile reachable in exactly the rolled number of steps.')
    captured = [player for player, position in game.positions.items()
                if player != sid and position == tile_id]
    for player in captured:
        game.positions[player] = game.board['starts'][player]
    game.positions[sid] = tile_id
    game.valid_moves = []
    game.die = None
    finish = next(tile for tile in game.board['tiles'] if tile['id'] == tile_id)
    if finish['type'] == 'finish':
        game.winner = sid
        game.current_player = None
        game.message = f'{game.players[sid]} wins!'
    else:
        game.message = f'{game.players[sid]} moved.'
        advance_turn(game)
    if captured:
        names = ', '.join(game.players[player] for player in captured)
        game.message += f' Captured: {names}. Back to start.'


def remove_player(game, sid):
    if sid not in game.turn_order:
        return
    if game.current_player == sid:
        advance_turn(game)
    game.turn_order.remove(sid)
    game.positions.pop(sid, None)
    if not game.turn_order:
        game.current_player = None
