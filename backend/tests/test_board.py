import unittest

from board import generate_board


def adjacency(board):
    neighbors = {tile['id']: set() for tile in board['tiles']}
    for edge in board['edges']:
        neighbors[edge['source']].add(edge['target'])
        neighbors[edge['target']].add(edge['source'])
    return neighbors


class BoardTests(unittest.TestCase):
    def test_grid_connectivity_and_shared_cells(self):
        for count in (1, 2, 4, 10):
            for seed in range(5):
                board = generate_board([str(i) for i in range(count)], seed=seed)
                tiles = {tile['id']: tile for tile in board['tiles']}
                self.assertEqual(len(tiles), len(board['tiles']))
                self.assertEqual(len({(t['x'], t['y']) for t in tiles.values()}), len(tiles))
                self.assertTrue(all(type(t['x']) is int and type(t['y']) is int for t in tiles.values()))
                pairs = set()
                for edge in board['edges']:
                    a, b = tiles[edge['source']], tiles[edge['target']]
                    self.assertEqual(abs(a['x'] - b['x']) + abs(a['y'] - b['y']), 1)
                    pairs.add(frozenset((a['id'], b['id'])))
                self.assertEqual(len(pairs), len(board['edges']))
                neighbors = adjacency(board)
                finish = next(t['id'] for t in tiles.values() if t['type'] == 'finish')
                self.assertTrue(all(t['x'] < tiles[finish]['x']
                                    for t in tiles.values() if t['id'] != finish))
                self.assertTrue(all(tiles[t]['x'] == 0 for t in board['starts'].values()))
                seen, pending = {finish}, [finish]
                while pending:
                    for tile in neighbors[pending.pop()] - seen:
                        seen.add(tile)
                        pending.append(tile)
                self.assertEqual(seen, set(tiles))
                self.assertEqual(len(set(board['starts'].values())), count)
                self.assertTrue(all(tiles[t]['type'] == 'start' for t in board['starts'].values()))
                self.assertGreaterEqual(len(board['edges']), len(tiles))
                self.assertTrue(any(len(n) >= 3 for n in neighbors.values()))

    def test_unavoidable_shared_section(self):
        for seed in range(10):
            board = generate_board(['a', 'b', 'c'], seed=seed)
            tiles = {tile['id']: tile for tile in board['tiles']}
            neighbors = adjacency(board)
            finish = next(t['id'] for t in tiles.values() if t['type'] == 'finish')
            by_column = {}
            for tile in tiles.values():
                by_column.setdefault(tile['x'], []).append(tile['id'])
            # A sole tile in an interior column must be used by every route.
            candidates = [ids[0] for x, ids in by_column.items()
                          if len(ids) == 1 and 2 < x < tiles[finish]['x'] - 1]
            self.assertGreaterEqual(len(candidates), 2)
            for blocked in candidates:
                start = board['starts']['a']
                seen, pending = {start, blocked}, [start]
                while pending:
                    for tile in neighbors[pending.pop()] - seen:
                        seen.add(tile)
                        pending.append(tile)
                self.assertNotIn(finish, seen)

    def test_seed_and_configuration(self):
        options = dict(seed=42, max_branches=4, min_segment_length=3, max_segment_length=5)
        self.assertEqual(generate_board(['a', 'b'], **options), generate_board(['a', 'b'], **options))
        self.assertNotEqual(generate_board(['a'], seed=1), generate_board(['a'], seed=2))

    def test_invalid_parameters(self):
        for players, options in (
            ([], {}), (['a', 'a'], {}), (['a'], {'branch_length': 0}),
            (['a'], {'intersection_density': -0.1}),
            (['a'], {'overlap_probability': 1.1}),
            (['a'], {'min_segment_length': 1}),
            (['a'], {'min_segment_length': 5, 'max_segment_length': 3}),
            (['a'], {'max_branches': 1}), (['a'], {'seed': 'bad'}),
        ):
            with self.subTest(options=options), self.assertRaises(ValueError):
                generate_board(players, **options)


if __name__ == '__main__':
    unittest.main()
