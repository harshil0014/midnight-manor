import { test } from "node:test";
import assert from "node:assert/strict";
import PF from "pathfinding";
import {
  create,
  addPlayer,
  act,
  tick,
  view,
  movePlayer,
  killer,
  hunterPressure,
  clearLine,
} from "../hunt.mjs";
import {
  machines,
  doors,
  panels,
  securityTerminal,
  cameraStations,
  maps,
  spawn,
  visibilityPolygon,
} from "../hunt-world.mjs";
const t = 20000;
function setup() {
  const r = create("Host", 1000, 13);
  for (let i = 1; i < 8; i++) addPlayer(r, "Seat " + i, false, 1000);
  act(r, r.players[0], { action: "setKiller", target: r.players[1].id }, 1000);
  act(r, r.players[0], { action: "start" }, 1000);
  return r;
}
function put(r, p, a) {
  r.positions[p.id] = { floor: a.floor, x: a.x, y: a.y, dir: "right" };
}

test("last two quota repairs boost movement and melee, with walls still protecting victims", () => {
  const r = setup(),
    k = killer(r),
    p = r.players[0];
  for (const q of r.players) put(r, q, { floor: 1, x: 408, y: 200 });
  for (const m of Object.values(r.machines).slice(0, 5)) m.done = true;
  assert.equal(hunterPressure(r), false);
  put(r, k, { floor: 0, x: 552, y: 392 });
  put(r, p, { floor: 0, x: 594, y: 392 });
  act(r, k, { action: "attack", direction: "right" }, t);
  tick(r, t + 350);
  assert.equal(p.status, "active");
  put(r, k, { floor: 0, x: 552, y: 392 });
  movePlayer(r, k, 1, 0, 0.1, t + 500);
  const normal = r.positions[k.id].x - 552;
  Object.values(r.machines)[5].done = true;
  assert.equal(hunterPressure(r), true);
  assert.equal(view(r, p, t + 1000).pressure, true);
  put(r, k, { floor: 0, x: 552, y: 392 });
  movePlayer(r, k, 1, 0, 0.1, t + 1000);
  assert(r.positions[k.id].x - 552 > normal);
  put(r, k, { floor: 0, x: 552, y: 392 });
  k.attackAt = 0;
  act(r, k, { action: "attack", direction: "right" }, t + 2000);
  tick(r, t + 2350);
  assert.equal(p.status, "downed");
  const d = doors[0];
  p.status = "active";
  p.shieldUntil = 0;
  k.attackAt = 0;
  r.manualDoors[d.id] = true;
  put(r, k, { floor: d.floor, x: d.x - 20, y: d.y });
  put(r, p, { floor: d.floor, x: d.x + 20, y: d.y });
  act(r, k, { action: "attack", direction: "right" }, t + 4000);
  tick(r, t + 4350);
  assert.equal(p.status, "active");
});

test("physical doors close, block movement and sight, reopen from either side and reject crushing or remote toggles", () => {
  const r = setup(),
    p = r.players[0],
    q = r.players[2],
    d = doors[0];
  put(r, p, { floor: d.floor, x: d.x - 20, y: d.y });
  put(r, q, { floor: d.floor, x: d.x + 20, y: d.y });
  act(r, p, { action: "door", object: d.id }, t);
  assert.equal(r.manualDoors[d.id], true);
  assert.equal(
    clearLine(r, r.positions[p.id], r.positions[q.id], t, true),
    false,
  );
  movePlayer(r, p, 1, 0, 0.1, t + 100);
  assert(r.positions[p.id].x < d.x - 12);
  act(r, q, { action: "door", object: d.id }, t + 400);
  assert.equal(r.manualDoors[d.id], false);
  assert.equal(
    clearLine(r, r.positions[p.id], r.positions[q.id], t + 400, true),
    true,
  );
  put(r, p, { floor: d.floor, x: d.x, y: d.y });
  act(r, q, { action: "door", object: d.id }, t + 800);
  assert(r.pendingDoors[d.id]);
  assert.equal(r.manualDoors[d.id],false);
  put(r, q, { floor: 1, x: 408, y: 200 });
  assert.throws(() => act(r, q, { action: "door", object: d.id }, t + 1000));
  const a = { floor: d.floor, x: d.x - 20, y: d.y };
  assert(visibilityPolygon(a, 100, [d])[0].x < visibilityPolygon(a, 100)[0].x);
});

test("security requires the physical console, filters hidden/dead players and loses video during blackout", () => {
  const r = setup(),
    p = r.players[0],
    q = r.players[2];
  assert.throws(() => act(r, p, { action: "security" }, t));
  put(r, p, securityTerminal);
  act(r, p, { action: "security" }, t);
  put(r, q, { ...cameraStations[0], x: cameraStations[0].x + 12 });
  let v = view(r, p, t + 100);
  assert.equal(v.security.feeds.length, 4);
  assert(v.security.feeds[0].avatars.some((a) => a.id === q.id));
  assert.equal(view(r, q, t + 100).security, null);
  q.hidden = "wardrobe";
  assert(
    !view(r, p, t + 200).security.feeds[0].avatars.some((a) => a.id === q.id),
  );
  q.hidden = null;
  q.status = "eliminated";
  assert(
    !view(r, p, t + 200).security.feeds[0].avatars.some((a) => a.id === q.id),
  );
  r.dark = true;
  assert.deepEqual(view(r, p, t + 300).security, { offline: true, feeds: [] });
  r.dark = false;
  movePlayer(r, p, 1, 0, 0.1, t + 400);
  assert.equal(view(r, p, t + 400).security, null);
  put(r, p, securityTerminal);
  act(r, p, { action: "security" }, t + 500);
  act(r, p, { action: "close" }, t + 600);
  assert.equal(view(r, p, t + 600).security, null);
});

test("service rooms connect to the mansion and retain another route when one service door closes", () => {
  const start = spawn(0);
  for (const point of [securityTerminal, panels[0]]) {
    const relevant = doors.filter(
      (d) =>
        /Security/.test(d.title) === (point === securityTerminal) &&
        /Security|Generator/.test(d.title),
    );
    for (const shut of [null, ...relevant]) {
      const grid = new PF.Grid(maps[0]);
      if (shut)
        for (let y = 0; y < grid.height; y++)
          for (let x = 0; x < grid.width; x++)
            if (
              Math.abs(x * 16 + 8 - shut.x) < shut.w / 2 + 8 &&
              Math.abs(y * 16 + 8 - shut.y) < shut.h / 2 + 8
            )
              grid.setWalkableAt(x, y, false);
      assert(
        new PF.AStarFinder({ allowDiagonal: false }).findPath(
          point.x >> 4,
          point.y >> 4,
          start.x >> 4,
          start.y >> 4,
          grid,
        ).length,
        point.id + " blocked " + shut?.title,
      );
    }
  }
});
