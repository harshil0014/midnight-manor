import { W, H, TILE, structural, los, visionRadius } from "../hunt-world.mjs";
const wallTiles = [0, 1].map((floor) => {
  const cells = [];
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++)
      if (structural(x, y, floor)) cells.push({ x: x * TILE, y: y * TILE });
  return cells;
});
// Only an empty architectural overlay is exposed, never the room behind a wall.
// Blackouts use their exact ordinary light mask with no extra architectural view.
export function visibleWallFaces(pos, dark = false) {
  if (dark) return [];
  const radius = visionRadius("Guest", false),
    faces = [];
  for (const tile of wallTiles[pos.floor] || []) {
    const near = {
      floor: pos.floor,
      x: Math.max(tile.x - 1, Math.min(tile.x + TILE + 1, pos.x)),
      y: Math.max(tile.y - 1, Math.min(tile.y + TILE + 1, pos.y)),
    };
    if (Math.hypot(near.x - pos.x, near.y - pos.y) > radius || !los(pos, near))
      continue;
    faces.push({ x: tile.x - 2, y: tile.y - 14, w: TILE + 4, h: TILE + 15 });
  }
  return faces;
}
