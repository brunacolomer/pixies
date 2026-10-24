import random


def generate_board(
    player_ids: list[str],
    branch_length: int = 10,
    *,
    intersection_density: float = 0.85,
    overlap_probability: float = 0.8,
    min_segment_length: int = 2,
    max_segment_length: int = 6,
    max_branches: int = 5,
    branching_probability: float = 0.75,
    route_length_variation: float = 0.65,
    seed: int | None = None,
) -> dict:
    """Generate adjacent grid tiles with shared junctions and orthogonal bends.

    branch_length counts segment columns (minimum six). Segment lengths count
    intermediate horizontal tiles, excluding endpoints. Pass a seed to reproduce a board.
    Otherwise each game receives a new layout. Coordinate crossings alone do not join
    routes: only shared tile IDs and explicit edges establish connectivity.
    """
    if not player_ids:
        raise ValueError('At least one player is required.')
    if len(set(player_ids)) != len(player_ids):
        raise ValueError('Player IDs must be unique.')
    if type(branch_length) is not int or branch_length < 1:
        raise ValueError('Branch length must be a positive integer.')
    for name, value in (
        ('intersection_density', intersection_density),
        ('overlap_probability', overlap_probability),
        ('branching_probability', branching_probability),
        ('route_length_variation', route_length_variation),
    ):
        if not isinstance(value, (int, float)) or not 0 <= value <= 1:
            raise ValueError(f'{name} must be between 0 and 1.')
    if (type(min_segment_length) is not int or type(max_segment_length) is not int
            or not 2 <= min_segment_length <= max_segment_length):
        raise ValueError('Segment lengths must be integers with 2 <= min <= max.')

    if type(max_branches) is not int or max_branches < 2:
        raise ValueError('max_branches must be an integer of at least 2.')
    if seed is not None and type(seed) is not int:
        raise ValueError('seed must be an integer or None.')

    rng = random.Random(seed)
    cells = {}
    edges = {}
    starts = {}

    def tile_at(x, y, kind='normal'):
        # A coordinate always identifies exactly one shared tile.
        if (x, y) not in cells:
            cells[x, y] = {'id': f'tile_{x}_{y}', 'x': x, 'y': y, 'type': kind}
        if kind != 'normal':
            cells[x, y]['type'] = kind
        return cells[x, y]['id']

    def connect_line(x1, y1, x2, y2):
        """Add every cell along one horizontal or vertical grid line."""
        dx = (x2 > x1) - (x2 < x1)
        dy = (y2 > y1) - (y2 < y1)
        previous = tile_at(x1, y1)
        for step in range(1, abs(x2 - x1) + abs(y2 - y1) + 1):
            current = tile_at(x1 + step * dx, y1 + step * dy)
            key = tuple(sorted((previous, current)))
            edges[key] = {'source': previous, 'target': current}
            previous = current

    lane_spacing = min_segment_length + 1
    start_rows = [index * lane_spacing for index in range(len(player_ids))]
    center = start_rows[len(start_rows) // 2]
    for player, row in zip(player_ids, start_rows):
        starts[player] = tile_at(0, row, 'start')
        connect_line(0, row, 2, row)

    x = 2
    rows = start_rows
    column_count = max(6, branch_length)
    shared_column = rng.randrange(1, column_count - 2)
    branch_count = 2
    base_length = rng.randint(min_segment_length, max_segment_length)
    for column in range(column_count):
        if column == shared_column:
            next_rows = [center]
        else:
            if rng.random() < branching_probability:
                branch_count = rng.randint(2, max_branches)
            if rng.random() < intersection_density:
                branch_count = max(2, branch_count - 1)
            if rng.random() < overlap_probability:
                branch_count = max(2, branch_count - 1)
            # Nearby lanes share the same vertical spine at each boundary.
            next_rows = [center + (index - branch_count // 2) * lane_spacing
                         for index in range(branch_count)]
        connect_line(x, min(rows + next_rows), x, max(rows + next_rows))
        length = base_length
        if rng.random() < route_length_variation:
            length = rng.randint(min_segment_length, max_segment_length)
        next_x = x + length + 1
        for row in next_rows:
            connect_line(x, row, next_x, row)
        x, rows = next_x, next_rows

    # Gather approaches before a short final stretch, keeping finish far right.
    connect_line(x, min(rows + [center]), x, max(rows + [center]))
    connect_line(x, center, x + 2, center)
    tile_at(x + 2, center, 'finish')
    return {'tiles': list(cells.values()), 'edges': list(edges.values()), 'starts': starts}
