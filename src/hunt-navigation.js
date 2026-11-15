import PF from "pathfinding";
import {
  maps,
  TILE,
  onStairs,
  stairLandings,
  stairFlight,
  arches,
  doors,
  breakWalls,
  machines,
} from "../hunt-world.mjs";
// Shared mansion geometry and the existing PathFinding.js cardinal A* implementation.
export function routeTo(pos, target, closed = [], broken = []) {
  if (!target || !maps[pos.floor]) return [];
  if (pos.floor === 1 && target.floor === 2)target={floor:0,...stairLandings[0]};
  if (pos.floor !== target.floor && (pos.floor === 2 || target.floor === 2))
    target = arches
      .filter((a) => a.floor === pos.floor)
      .sort(
        (a, b) =>
          (a.to.floor === target.floor ? 0 : 700) +
          Math.hypot(a.x - pos.x, a.y - pos.y) -
          ((b.to.floor === target.floor ? 0 : 700) +
            Math.hypot(b.x - pos.x, b.y - pos.y)),
      )[0];
  target = target.point || target;
  const stairs = pos.floor !== target.floor,
    entry = stairLandings[pos.floor],
    climbing =
      stairs &&
      (onStairs(pos) || Math.hypot(pos.x - entry.x, pos.y - entry.y) < 13),
    goal = stairs ? (climbing ? stairLandings[1 - pos.floor] : entry) : target;
  const grid = new PF.Grid(maps[pos.floor]);
  if (pos.floor < 2 && !onStairs(pos) && !climbing)
    for (let y = stairFlight.top / TILE; y < stairFlight.bottom / TILE; y++)
      for (let x = stairFlight.left / TILE; x < stairFlight.right / TILE; x++)
        grid.setWalkableAt(x, y, false);
  for (const b of [
    ...doors.filter((d) => closed.some((c) => c.id === d.id)),
    ...breakWalls.filter((w) => !broken.includes(w.id)),
    ...machines.map((m) => ({ ...m, w: 16, h: 14 })),
  ].filter((b) => b.floor === pos.floor))
    for (
      let y = Math.floor((b.y - b.h / 2) / 16);
      y < Math.ceil((b.y + b.h / 2) / 16);
      y++
    )
      for (
        let x = Math.floor((b.x - b.w / 2) / 16);
        x < Math.ceil((b.x + b.w / 2) / 16);
        x++
      )
        if (x >= 0 && y >= 0 && x < grid.width && y < grid.height)
          grid.setWalkableAt(x, y, false);
  grid.setWalkableAt(pos.x >> 4, pos.y >> 4, true);
  return new PF.AStarFinder({ allowDiagonal: false })
    .findPath(pos.x >> 4, pos.y >> 4, goal.x >> 4, goal.y >> 4, grid)
    .map(([x, y]) => ({ floor: pos.floor, x: x * TILE + 8, y: y * TILE + 8 }));
}
