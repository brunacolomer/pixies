import type { Board } from './socket'

// Display geometry only. Preserve every tile, connection and local detour.
export function layoutBoard(board: Board) {
  const bottom = Math.max(...board.tiles.map((tile) => tile.y))
  const left = Math.min(...board.tiles.map((tile) => tile.x))
  const right = Math.max(...board.tiles.map((tile) => tile.x))
  const span = Math.max(1, right - left)
  const height = bottom - Math.min(...board.tiles.map((tile) => tile.y))
  // Fade the lane stagger at both ends. Reserve enough horizontal space that
  // tapering cannot fold a path backward or compress its last few tiles.
  const horizontalSpacing = Math.max(1.5, 1.2 + height * 0.85 * Math.PI / span)
  const base = new Map(board.tiles.map((tile) => [tile.id, {
    ...tile,
    x: (tile.x - left) * horizontalSpacing
      + (bottom - tile.y) * 0.85 * Math.sin(Math.PI * (tile.x - left) / span),
    y: tile.y * 1.5,
    rotation: 0,
  }]))
  const display = new Map([...base].map(([id, tile]) => [id, { ...tile }]))
  const neighbors = new Map(board.tiles.map((tile) => [tile.id, [] as string[]]))
  for (const edge of board.edges) {
    neighbors.get(edge.source)!.push(edge.target)
    neighbors.get(edge.target)!.push(edge.source)
  }
  function trace(id: string, next: string) {
    const points = []
    let previous = id
    let current = next
    for (let step = 0; step < 3; step++) {
      points.push(base.get(current)!)
      const links = neighbors.get(current)!
      if (links.length !== 2 || base.get(current)!.type !== 'normal') break
      const following = links.find((link) => link !== previous)!
      previous = current
      current = following
    }
    while (points.length < 3) points.push(points[points.length - 1])
    return points
  }
  for (const [id, tile] of display) {
    const links = neighbors.get(id)!
    if (links.length !== 2 || tile.type !== 'normal') continue
    const points = [...trace(id, links[0]).reverse(), base.get(id)!, ...trace(id, links[1])]
    const weights = [1, 6, 15, 20, 15, 6, 1]
    const dx = points.reduce((sum, point, i) => sum + (point.x - tile.x) * weights[i], 0) / 64
    const dy = points.reduce((sum, point, i) => sum + (point.y - tile.y) * weights[i], 0) / 64
    // Round locally without collapsing a whole U-shaped route onto a line.
    // Bound displacement so rounded squares cannot bunch up at junctions.
    const amount = Math.min(1, 0.18 / (Math.hypot(dx, dy) || 1))
    tile.x += dx * amount
    tile.y += dy * amount
  }
  for (const [id, tile] of display) {
    const links = neighbors.get(id)!
    if (links.length !== 2 || tile.type !== 'normal') continue
    const a = display.get(links[0])!
    const b = display.get(links[1])!
    const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI
    tile.rotation = ((angle + 225) % 90) - 45
  }
  return display
}
