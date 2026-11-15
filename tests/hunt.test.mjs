import PF from "pathfinding";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  create,
  addPlayer,
  act,
  tick,
  view,
  movePlayer,
  killer,
  rules,
  reach,
} from "../hunt.mjs";
import {
  machines,
  tables,
  panels,
  doors,
  breakWalls,
  arches,
  exitDoors,
  maps,
  fits,
  CLASSES,
  grass,
  killerSpawn,
} from "../hunt-world.mjs";
const start = 1000,
  at = 20000;
function setup(n = 8, seed = 13) {
  const r = create("Host", start, seed);
  for (let i = 1; i < n; i++) addPlayer(r, "Guest " + i, false, start);
  act(r, r.players[0], { action: "setKiller", target: r.players[1].id }, start);
  act(r, r.players[0], { action: "start" }, start);
  return r;
}
function gather(r, ...ps) {
  for (const q of r.players)
    r.positions[q.id] = { floor: 1, x: 408, y: 200, dir: "down" };
  ps.forEach(
    (p, i) =>
      (r.positions[p.id] = {
        floor: 0,
        x: 552 + i * 14,
        y: 392,
        dir: i ? "left" : "right",
      }),
  );
}
const survivors = (r) => r.players.filter((p) => p.role !== "Killer");
test("hunter closes a running chase at 18 percent advantage; final hunt and carrying retain their balance", () => {
  const r = setup(), k = killer(r), p = survivors(r)[0];
  const distance = player => {
    r.positions[player.id] = {floor: 0, x: 552, y: 392, dir: "right"};
    movePlayer(r, player, 1, 0, 0.05, at);
    return r.positions[player.id].x - 552;
  };
  const normal = distance(p);
  assert(Math.abs(normal - 4.2) < 1e-8);
  assert(Math.abs(distance(k) / normal - 1.18) < 1e-8);
  k.carrying = p.id;
  assert(Math.abs(distance(k) / normal - .85) < 1e-8);
  k.carrying = null;
  Object.values(r.machines).slice(0, r.required - 2).forEach(m => m.done = true);
  assert(Math.abs(distance(k) / normal - 1.25) < 1e-8);
});
function work(r, p, m, t, seconds) {
  r.positions[p.id] = { floor: m.floor, x: m.x, y: m.y, dir: "down" };
  for (let i = 0; i < seconds * 20; i++) {
    act(r, p, { action: "repair", object: m.id }, t + i * 50);
    tick(r, t + i * 50, 0.05);
  }
}
test("three areas, 12 machines, two separated western exits and random class bag are valid", () => {
  const r = setup();
  assert.equal(maps.length, 3);
  assert.equal(machines.length, 12);
  assert.equal(exitDoors.length, 2);
  assert.equal(exitDoors[0].floor, exitDoors[1].floor);
  assert.equal(exitDoors[0].x, exitDoors[1].x);
  assert(Math.abs(exitDoors[0].y - exitDoors[1].y) > 500);
  assert(
    [...machines, ...tables, ...panels, ...arches, ...exitDoors].every((p) =>
      fits(p.floor, p.x, p.y),
    ),
  );
  const cs = survivors(r).map((p) => p.class);
  assert(CLASSES.every((c) => cs.includes(c)));
  assert.equal(cs.filter((c) => c === "Hulk").length, 1);
  assert.equal(cs.filter((c) => c === "Magician").length, 1);
  assert.throws(() =>
    act(r, r.players[0], { action: "chooseClass", class: "Hulk" }, at),
  );
  for (const action of ["vote", "report", "taskStep"])
    assert.throws(() => act(r, r.players[0], { action }, at));
});
test("cooperative active repairs speed up; engineer helps; input expiry and movement stop work", () => {
  const r = setup(),
    [p, q] = survivors(r),
    m = machines[0];
  p.class = "Photographer";
  q.class = "Engineer";
  work(r, p, m, at, 3);
  const solo = r.machines[m.id].progress;
  assert(solo > 0);
  r.machines[m.id].progress = 0;
  r.positions[q.id] = { floor: m.floor, x: m.x + 8, y: m.y };
  for (let i = 0; i < 60; i++) {
    act(r, p, { action: "repair", object: m.id }, at + i * 50);
    act(r, q, { action: "repair", object: m.id }, at + i * 50);
    tick(r, at + i * 50, 0.05);
  }
  assert(r.machines[m.id].progress > solo * 2);
  tick(r, at + 5000, 0.05);
  assert.equal(p.repairing, null);
  act(r, p, { action: "repair", object: m.id }, at + 5100);
  movePlayer(r, p, 1, 0, 0.05, at + 5150);
  assert.equal(p.repairing, null);
});
test("ghost repairs are capped collectively and cannot finish or use powers, loot, rescue or escape", () => {
  const r = setup(),
    p = survivors(r)[0],
    m = machines[0];
  p.status = "eliminated";
  work(r, p, m, at, 160);
  assert(r.machines[m.id].progress <= 0.180001);
  r.machines[m.id].progress = 0.999;
  work(r, p, m, at + 200000, 3);
  assert.equal(r.machines[m.id].done, false);
  for (const action of ["power", "sensor", "light", "rescue", "interact"])
    assert.throws(() => act(r, p, { action, object: exitDoors[0].id }, at));
  act(r, p, { action: "ghostFloor" }, at);
  assert.equal(r.positions[p.id].floor, (m.floor + 1) % 3);
});
test("SCREAM is exactly 2000ms, live across three areas, private and includes wardrobes", () => {
  const r = setup(),
    k = killer(r),
    p = survivors(r)[0];
  p.hidden = "ward-test";
  r.positions[p.id] = { floor: 2, x: 500, y: 400, dir: "up" };
  act(r, k, { action: "power" }, at);
  assert.equal(view(r, k, at).reveals.length, 7);
  r.positions[p.id].x = 520;
  assert.equal(view(r, k, at + 1999).reveals.find((q) => q.id === p.id).x, 520);
  assert.deepEqual(view(r, k, at + 2000).reveals, []);
  assert.deepEqual(view(r, p, at).reveals, []);
  assert(!JSON.stringify(view(r, p, at)).includes(k.token));
});
test("permanent two-portal pair accepts all roles, validates placement, cooldown and owner elimination", () => {
  const r = setup(),
    p = survivors(r)[0],
    k = killer(r);
  p.class = "Magician";
  r.chests = [];
  r.positions[p.id] = { floor: 0, x: 552, y: 392, dir: "right" };
  act(r, p, { action: "power" }, at);
  // The gallery's south bay now contains its motor; place the portal on the
  // open promenade, with the same machine/door clearance rules.
  r.positions[p.id] = { floor: 1, x: 552, y: 312, dir: "down" };
  act(r, p, { action: "power" }, at + 100);
  assert.equal(r.portals.length, 2);
  assert.throws(() => act(r, p, { action: "power" }, at + 200));
  p.status = "eliminated";
  r.positions[k.id] = { ...r.portals[0] };
  act(r, k, { action: "interact", object: r.portals[0].id }, at + 300);
  tick(r, at + 1200);
  assert.equal(r.positions[k.id].floor, 1);
  assert.throws(() =>
    act(r, k, { action: "interact", object: r.portals[1].id }, at + 1300),
  );
});
test("Engineer remote door expires at exactly 1000ms and rejects occupied doorways", () => {
  const r = setup(),
    p = survivors(r)[0],
    d = doors[0];
  p.class = "Engineer";
  gather(r, p);
  act(r, p, { action: "power", door: d.id }, at);
  assert(view(r, p, at + 999).closedDoors.some((q) => q.id === d.id));
  assert(!view(r, p, at + 1000).closedDoors.some((q) => q.id === d.id));
  p.powerAt = 0;
  r.positions[p.id] = { floor: d.floor, x: d.x, y: d.y };
  assert.throws(() => act(r, p, { action: "power", door: d.id }, at + 1100));
});
test("Hulk is twelve seconds, once per match, 95 percent speed, public live GPS and immune to melee and whip", () => {
  const r = setup(),
    p = survivors(r)[0],
    k = killer(r);
  gather(r, p, k);
  p.class = "Hulk";
  act(r, p, { action: "power" }, at - 3000);
  tick(r, at);
  assert.equal(p.hulkUntil, at + 12000);
  assert.equal(view(r, k, at).hulkGPS[0].id, p.id);
  k.whip = 3;
  act(r, k, { action: "whip", direction: "left" }, at + 1);
  tick(r, at + 401);
  assert.equal(p.status, "active");
  const x = r.positions[p.id].x;
  movePlayer(r, p, 1, 0, 0.05, at + 500);
  assert(Math.abs(r.positions[p.id].x - x - 3.99) < 0.01);
  assert.equal(view(r, k, at + 11999).hulkGPS.length, 1);
  assert.equal(view(r, k, at + 12000).hulkGPS.length, 0);
  assert.throws(() => act(r, p, { action: "power" }, at + 12001));
});
test("Hulk defeats hunter for ten seconds, removes items and restores original spawn, including interruption of carry", () => {
  const r = setup(),
    p = survivors(r)[0],
    k = killer(r),
    q = survivors(r)[1];
  gather(r, p, k);
  p.class = "Hulk";
  k.keys = 2;
  k.whip = 3;
  k.carrying = q.id;
  q.status = "carried";
  q.carriedBy = k.id;
  act(r, p, { action: "power" }, at - 3000);
  tick(r, at);
  act(r, p, { action: "attack", direction: "right" }, at + 1);
  tick(r, at + 351);
  assert.equal(k.timeoutUntil, at + 10351);
  assert.equal(k.keys, 0);
  assert.equal(k.whip, 0);
  assert.equal(q.status, "downed");
  assert.throws(() => act(r, k, { action: "power" }, at + 500));
  tick(r, at + 10350);
  assert(k.timeoutUntil > 0);
  tick(r, at + 10351);
  assert.equal(k.timeoutUntil, 0);
  assert.deepEqual(r.positions[k.id], killerSpawn);
});
test("Hulk can break designated screens without creating a general wall bypass", () => {
  const r = setup(),
    p = survivors(r)[0],
    w = breakWalls[0];
  p.class = "Hulk";
  r.positions[p.id] = { floor: 2, x: w.x - 35, y: w.y, dir: "right" };
  act(r, p, { action: "power" }, at - 3000);
  tick(r, at);
  act(r, p, { action: "attack", direction: "right" }, at + 1);
  tick(r, at + 351);
  assert(r.broken.includes(w.id));
  assert.equal(r.broken.length, 1);
});
test("capture requires carrying to a physical empty table; third capture eliminates and rescue interrupts movement", () => {
  const r = setup(),
    k = killer(r),
    [p, q] = survivors(r),
    table = tables[0];
  for (let count = 1; count <= 3; count++) {
    gather(r, k, p, q);
    p.status = "downed";
    p.shieldUntil = 0;
    const t = at + count * 10000;
    p.downUntil = t + 45000;
    act(r, k, { action: "pickup", target: p.id }, t);
    tick(r, t + 600);
    assert.equal(p.status, "carried");
    r.positions[k.id] = {
      floor: table.floor,
      x: table.x,
      y: table.y,
      dir: "down",
    };
    r.positions[p.id] = { ...r.positions[k.id] };
    act(r, k, { action: "interact", object: table.id }, t + 601);
    tick(r, t + 1701);
    assert.equal(p.captures, count);
    if (count < 3) {
      assert.equal(p.status, "captured");
      r.positions[q.id] = { ...r.positions[p.id], x: r.positions[p.id].x + 10 };
      act(r, q, { action: "rescue", target: p.id }, t + 1800);
      movePlayer(r, q, 0, 1, 0.05, t + 1850);
      assert.equal(q.channel, null);
      act(r, q, { action: "rescue", target: p.id }, t + 1900);
      tick(r, t + 4100);
      assert.equal(p.status, "active");
      assert.equal(p.shieldUntil, t + 9100);
    }
  }
  assert.equal(p.status, "eliminated");
});
test("wiggle spam is throttled and successful carry escape stuns exactly 1.5 seconds", () => {
  const r = setup(),
    k = killer(r),
    p = survivors(r)[0];
  gather(r, k, p);
  p.status = "carried";
  p.carriedBy = k.id;
  k.carrying = p.id;
  for (let i = 0; i < rules.wiggleTaps; i++) {
    act(r, p, { action: "wiggle" }, at + i * rules.wiggleInterval);
    if (i < rules.wiggleTaps - 1)
      {const before=p.wiggle;act(r,p,{action:"wiggle"},at+i*rules.wiggleInterval+1);assert.equal(p.wiggle,before);}
  }
  const finish = at + (rules.wiggleTaps - 1) * rules.wiggleInterval;
  assert.equal(p.status, "active");
  assert.equal(k.carrying, null);
  assert.equal(k.stunUntil, finish + 1500);
  assert.throws(() => act(r, k, { action: "attack" }, finish + 1499));
  act(r, k, { action: "attack" }, finish + 1500);
});
test("blackout can be repaired early, three panels work, sabotage cannot instantly repeat", () => {
  const r = setup(),
    k = killer(r),
    p = survivors(r)[0];
  act(r, k, { action: "blackout" }, at + 60000);
  tick(r, at + 90000);
  assert.equal(r.dark, true);
  for (const panel of panels) {
    r.dark = true;
    r.positions[p.id] = { ...panel };
    act(r, p, { action: "interact", object: panel.id }, at + 90001);
    tick(r, at + 96001);
    assert.equal(r.dark, false);
  }
  assert.throws(() => act(r, k, { action: "blackout" }, at + 96002));
});
test("flashlight has exactly 20 cumulative seconds, no off drain and no recovery", () => {
  const r = setup(),
    p = survivors(r)[0];
  p.battery = 20000;
  act(r, p, { action: "light" }, at);
  for (let i = 1; i <= 100; i++) tick(r, at + i * 50, 0.05);
  assert.equal(p.battery, 15000);
  act(r, p, { action: "light" }, at + 5000);
  for (let i = 0; i < 100; i++) tick(r, at + 5000 + i * 50, 0.05);
  assert.equal(p.battery, 15000);
  act(r, p, { action: "light" }, at + 10000);
  for (let i = 1; i <= 300; i++) tick(r, at + 10000 + i * 50, 0.05);
  assert.equal(p.battery, 0);
  assert.equal(p.lightOn, false);
  assert.throws(() => act(r, p, { action: "light" }, at + 26000));
});
test("locked treasure is randomized and role-specific; keys cap at two and opening is interruptible", () => {
  const r = setup(),
    k = killer(r),
    p = survivors(r)[0],
    c = r.chests[0];
  r.positions[k.id] = { ...c };
  assert.throws(() => act(r, k, { action: "interact", object: c.id }, at));
  k.keys = 1;
  act(r, k, { action: "interact", object: c.id }, at);
  movePlayer(r, k, 1, 0, 0.05, at + 100);
  assert.equal(c.opened, false);
  r.positions[k.id] = { ...c };
  act(r, k, { action: "interact", object: c.id }, at + 200);
  tick(r, at + 1400);
  assert.equal(k.whip, 3);
  assert.equal(k.keys, 0);
  const key = r.keys[0];
  p.keys = 2;
  r.positions[p.id] = { ...key };
  assert.throws(() => act(r, p, { action: "interact", object: key.id }, at));
  assert.notDeepEqual(
    r.chests.map((x) => [x.x, x.y]),
    setup(8, 77).chests.map((x) => [x.x, x.y]),
  );
});
test("grass hides survivors from the hunter, with anonymous rustles and no SCREAM reveal", () => {
  const r = setup(),
    k = killer(r),
    p = survivors(r)[0],
    patch = grass[0];
  r.positions[p.id] = {
    floor: 2,
    x: (patch.x + 2) * 16 + 8,
    y: (patch.y + 2) * 16 + 8,
    dir: "right",
  };
  r.positions[k.id] = { ...r.positions[p.id], x: r.positions[p.id].x + 60 };
  assert(!view(r, k, at).avatars.some((q) => q.id === p.id));
  assert(!view(r, p, at).avatars.some((q) => q.id === k.id));
  movePlayer(r, p, 1, 0, 0.05, at + 1);
  assert(view(r, k, at + 2).rustles.length);
  assert(!JSON.stringify(view(r, k, at + 2).rustles).includes(p.id));
  act(r, k, { action: "power" }, at + 3);
  assert(!view(r, k, at + 4).reveals.some((q) => q.id === p.id));
});
test("whip shares attack recovery, hits at range, and floors or walls block attacks", () => {
  const r = setup(),
    k = killer(r),
    p = survivors(r)[0];
  gather(r, k, p);
  r.positions[p.id].x = r.positions[k.id].x + 70;
  k.whip = 3;
  act(r, k, { action: "whip", direction: "right" }, at);
  assert.throws(() => act(r, k, { action: "attack" }, at + 1));
  tick(r, at + 400);
  assert.equal(p.status, "downed");
  p.status = "active";
  p.shieldUntil = 0;
  r.positions[p.id].floor = 1;
  act(r, k, { action: "whip", direction: "right" }, at + 1500);
  tick(r, at + 1900);
  assert.equal(p.status, "active");
});
test("Hulk cannot use either open gate until returning to Scientist form", () => {
  const r=setup(),p=survivors(r)[0];p.class="Hulk";p.hulkUntil=at+12000;r.exitsOpen=true;
  for(const gate of exitDoors){
    r.positions[p.id]={floor:gate.floor,x:gate.x,y:gate.y};
    assert.throws(()=>act(r,p,{action:"interact",object:gate.id},at),/Scientist form/);
    assert.equal(p.channel,null);
  }
  const gate=exitDoors[0];r.positions[p.id]={floor:gate.floor,x:gate.x,y:gate.y};
  act(r,p,{action:"interact",object:gate.id},at+12000);tick(r,at+13800);
  assert.equal(p.status,"escaped");
});

test("physical escapes unlock together, escaped guests keep wins at ten minutes, nobody is forced to wait for a quorum", () => {
  const r = setup(),
    p = survivors(r)[0],
    e = exitDoors[0];
  r.exitsOpen = true;
  r.positions[p.id] = { ...e };
  act(r, p, { action: "interact", object: e.id }, at);
  tick(r, at + 1800);
  assert.equal(p.status, "escaped");
  assert.equal(r.phase, "hunt");
  tick(r, r.deadline);
  assert.equal(p.status, "escaped");
  assert.equal(r.phase, "ended");
  assert.equal(r.winner, "mixed");
  assert(view(r, p, r.deadline).players.find((q) => q.id === p.id).victory);
});

test("rematch resets carried victims, inventories, channels, portals, timers and one-use powers", () => {
  const r = setup(),
    k = killer(r),
    p = survivors(r)[0];
  k.carrying = p.id;
  k.whip = 6;
  p.status = "carried";
  p.carriedBy = k.id;
  p.hulkUsed = true;
  p.keys = 2;
  p.table = "table-0";
  r.phase = "ended";
  act(r, r.players[0], { action: "restart" }, at);
  act(r, r.players[0], { action: "start" }, at + 1);
  assert.equal(k.carrying, null);
  assert.equal(k.whip, 0);
  assert.equal(p.carriedBy, null);
  assert.equal(p.table, null);
  assert.equal(p.hulkUsed, false);
  assert.equal(p.keys, 0);
  assert.deepEqual(r.portals, []);
  assert.equal(p.status, "active");
});

test("bots reach collision-safe machine work positions instead of stalling one tile outside repair range", () => {
  const r = create("Host", 1000, 11);
  r.players[0].bot = true;
  r.players[0].connected = false;
  for (let i = 1; i < 8; i++) addPlayer(r, "Bot " + i, true, 1000);
  act(r, r.players[0], { action: "start" }, 1000);
  for (let t = 1050; t < 91000; t += 50) tick(r, t, 0.05);
  assert(Object.values(r.machines).some((m) => m.progress > 0.2));
});

test("dash remains cardinal and collision-checked against designated garden screens", () => {
  const r = setup(),
    p = survivors(r)[0],
    w = breakWalls[0];
  p.class = "Escape Artist";
  r.positions[p.id] = { floor: 2, x: w.x - 18, y: w.y, dir: "right" };
  act(r, p, { action: "power" }, at);
  for (let i = 0; i < 20; i++) movePlayer(r, p, 1, 0, 0.05, at + i * 20);
  assert(r.positions[p.id].x <= w.x - w.w / 2 - 3);
  assert.equal(r.positions[p.id].y, w.y);
  assert(fits(2, r.positions[p.id].x, r.positions[p.id].y));
});

test("walking into a courtyard arch transitions automatically and carries a captive with the hunter", () => {
  const r = setup(),
    k = killer(r),
    p = survivors(r)[0],
    a = arches[0];
  r.positions[k.id] = { ...a, dir: "up" };
  k.carrying = p.id;
  p.status = "carried";
  p.carriedBy = k.id;
  r.positions[p.id] = { ...a };
  movePlayer(r, k, 0, -1, 0.05, at);
  assert.equal(r.positions[k.id].floor, 2);
  assert.equal(r.positions[p.id].floor, 2);
  assert.equal(r.positions[k.id].x, r.positions[p.id].x);
});

test("motion sensors alert only survivors to nearby movement, can be destroyed and expire", () => {
  const r = setup(),
    k = killer(r),
    p = survivors(r)[0];
  gather(r, p, k);
  p.sensors = 1;
  act(r, p, { action: "sensor" }, at);
  assert.equal(p.sensors, 0);
  movePlayer(r, k, -1, 0, 0.05, at + 1);
  tick(r, at + 50);
  assert(view(r, p, at + 50).events.some((e) => e.type === "sensor"));
  assert(!view(r, k, at + 50).events.some((e) => e.type === "sensor"));
  act(r, k, { action: "interact", object: r.sensors[0].id }, at + 100);
  assert.equal(r.sensors.length, 0);
  p.sensors = 1;
  act(r, p, { action: "sensor" }, at + 200);
  tick(r, at + 60200);
  assert.equal(r.sensors.length, 0);
});

test("camera aim, charges, exact stun and global resistance prevent stun chaining", () => {
  const r = setup(),
    p = survivors(r)[0],
    k = killer(r);
  p.class = "Photographer";
  gather(r, p, k);
  act(r, p, { action: "power", direction: "left" }, at);
  assert.equal(p.flashCharges, 1);
  assert.equal(k.stunUntil, 0);
  p.powerAt = 0;
  act(r, p, { action: "power", direction: "right" }, at + 1);
  assert.equal(k.stunUntil, at + 1501);
  const resistance = k.resistUntil;
  p.powerAt = 0;
  p.flashCharges = 1;
  act(r, p, { action: "power", direction: "right" }, at + 2000);
  assert.equal(k.resistUntil, resistance);
  assert.equal(k.stunUntil, at + 1501);
  tick(r, at + 50001);
  assert(p.flashCharges >= 1);
});

test("whip cannot hit through a room wall even when its range would reach", () => {
  const r = setup(),
    k = killer(r),
    p = survivors(r)[0];
  r.positions[k.id] = { floor: 0, x: 360, y: 240, dir: "left" };
  r.positions[p.id] = { floor: 0, x: 312, y: 240, dir: "right" };
  assert(fits(0, 360, 240) && fits(0, 312, 240));
  k.whip = 3;
  act(r, k, { action: "whip", direction: "left" }, at);
  tick(r, at + 400);
  assert.equal(p.status, "active");
});

test("rapid flashlight toggling accounts for on-time even between simulation ticks", () => {
  const r = setup(),
    p = survivors(r)[0];
  p.battery = 20000;
  act(r, p, { action: "light" }, at);
  act(r, p, { action: "light" }, at + 23);
  assert.equal(p.battery, 19977);
  act(r, p, { action: "light" }, at + 1000);
  tick(r, at + 1037);
  assert.equal(p.battery, 19940);
});

test("table camping charges a protected release and another floor never counts as camping", () => {
  const r = setup(),
    k = killer(r),
    p = survivors(r)[0];
  gather(r, k, p);
  p.status = "captured";
  p.captures = 1;
  p.captureUntil = at + 60000;
  p.table = tables[0].id;
  for (let t = at; t <= at + 12100 && p.status === "captured"; t += 50)
    tick(r, t, 0.05);
  assert.equal(p.status, "active");
  assert(p.shieldUntil > at + 12000);
  p.status = "captured";
  p.camp = 0;
  p.captureUntil = at + 90000;
  r.positions[k.id].floor = 1;
  for (let t = at + 13000; t < at + 25000; t += 50) tick(r, t, 0.05);
  assert.equal(p.camp, 0);
  assert.equal(p.status, "captured");
});

test("camping either western gate leaves the other reachable from every garden entrance", () => {
  for (let i = 0; i < 2; i++) {
    const blocked = exitDoors[i],
      goal = exitDoors[1 - i],
      grid = maps[2].map((row) => [...row]);
    for (let y = 0; y < grid.length; y++)
      for (let x = 0; x < grid[y].length; x++)
        if (Math.hypot(x * 16 + 8 - blocked.x, y * 16 + 8 - blocked.y) < 70)
          grid[y][x] = 1;
    for (const a of arches.filter((a) => a.floor === 2)) {
      const path = new PF.AStarFinder({ allowDiagonal: false }).findPath(
        a.x >> 4,
        a.y >> 4,
        goal.x >> 4,
        goal.y >> 4,
        new PF.Grid(grid),
      );
      assert(path.length > 0);
    }
  }
  assert(doors.every((d) => d.floor !== 2));
});

test("disconnected captives remain captives, get autopilot and transfer host without resetting powers", () => {
  const r = setup(),
    p = r.players[0];
  p.connected = false;
  p.seen = at;
  p.status = "captured";
  p.captureUntil = at + 60000;
  p.captures = 2;
  p.hulkUsed = true;
  tick(r, at + 10001);
  assert(p.autopilot);
  assert.equal(p.status, "captured");
  tick(r, at + 15001);
  assert.notEqual(r.host, p.id);
  p.connected = true;
  tick(r, at + 15051);
  assert.equal(p.autopilot, false);
  assert.equal(p.captures, 2);
  assert.equal(p.hulkUsed, true);
});


test("backup power restores at exactly 40 seconds and cancels unfinished panel work", () => {
 const r=setup(), k=killer(r), p=survivors(r)[0], t=80000;
 act(r,k,{action:"blackout"},t);
 assert.equal(r.blackoutEndsAt,t+40000);
 tick(r,t+39999); assert.equal(r.dark,true);
 p.channel={kind:"power",started:t+39000,until:t+45000};
 tick(r,t+40000); assert.equal(r.dark,false); assert.equal(r.blackoutEndsAt,0);
 assert.equal(p.channel,null); assert(r.blackoutAt >= t+60000);
 assert.equal(view(r,p,t+40000).liveMap.length,7);
});

test("live map discloses living players only to survivors in daylight, independent of world sight", () => {
 const r=setup(), k=killer(r), p=survivors(r)[0], q=survivors(r)[1];
 r.positions[q.id]={floor:2,x:520,y:400,dir:"down"};q.hidden="wardrobe-test";
 let v=view(r,p,at);assert.equal(v.liveMap.length,7);
 assert(!v.liveMap.some(a=>a.id===k.id));
 assert.equal(v.liveMap.find(a=>a.id===q.id).floor,2);
 assert(!v.avatars.some(a=>a.id===q.id));
 assert.deepEqual(view(r,k,at).liveMap.map(a=>a.id),[k.id]);
 r.revealUntil=at+2000;
 assert.deepEqual(view(r,k,at).liveMap.map(a=>a.id),[k.id]);
 r.dark=true;
 assert.deepEqual(view(r,p,at).liveMap.map(a=>a.id),[p.id]);
 assert.deepEqual(view(r,k,at).liveMap.map(a=>a.id),[k.id]);
 r.dark=false;q.status="eliminated";assert(!view(r,p,at).liveMap.some(a=>a.id===q.id));
 q.status="escaped";assert(!view(r,p,at).liveMap.some(a=>a.id===q.id));
});


test("keys are searched inside furniture; searches are shared, bounded and cancellable",()=>{
 const r=setup(), p=survivors(r)[0],q=survivors(r)[1], d=r.drawers[0];
 assert.equal(r.keys.length,16);assert.equal(view(r,p,at).keys.length,0);
 r.positions[p.id]={floor:d.floor,x:d.x,y:d.y,dir:"down"};
 const key=r.keys.find(k=>k.drawer===d.id);
 assert.throws(()=>act(r,p,{action:"interact",object:key.id},at));
 act(r,p,{action:"interact",object:d.id},at);assert.equal(p.channel.kind,"drawer");
 tick(r,at+999);assert.equal(p.keys,0);tick(r,at+1000);assert.equal(p.keys,1);assert.equal(r.keys.length,15);
 p.keys=2;assert.throws(()=>act(r,p,{action:"interact",object:d.id},at+1100));
 p.keys=0;r.positions[p.id]={floor:(d.floor+1)%3,x:d.x,y:d.y};
 assert.throws(()=>act(r,p,{action:"interact",object:d.id},at+1200));
 r.positions[p.id]={floor:d.floor,x:d.x,y:d.y,dir:"down"};
 act(r,p,{action:"interact",object:d.id},at+1300);
 movePlayer(r,p,1,0,.1,at+1400);tick(r,at+2400);assert.equal(p.keys,0);
 // One key left: simultaneous completions cannot duplicate it.
 r.keys=r.keys.filter(k=>k.drawer!==d.id);r.keys.push({...d,id:"last-key",drawer:d.id});d.empty=false;
 for(const v of [p,q]){r.positions[v.id]={floor:d.floor,x:d.x,y:d.y,dir:"down"};act(r,v,{action:"interact",object:d.id},at+2500)}
 tick(r,at+3500);assert.equal(p.keys+q.keys,1);assert.equal(d.empty,true);
});

test("only the actual carrier receives victim wiggle progress; blackout repeat cooldown is 150s",()=>{
 const r=setup(),k=killer(r),p=survivors(r)[0],q=survivors(r)[1];
 p.status="carried";p.carriedBy=k.id;k.carrying=p.id;p.wiggle=7;
 assert.deepEqual(view(r,k,at).me.captive,{id:p.id,name:p.name,wiggle:7,goal:20});
 assert.equal(view(r,q,at).me.captive,null);assert.equal(view(r,p,at).me.captive,null);
 k.carrying=null;assert.equal(view(r,k,at).me.captive,null);
 act(r,k,{action:"blackout"},80000);assert.equal(r.blackoutAt,230000);
 tick(r,120000);assert.equal(r.dark,false);
 assert.throws(()=>act(r,k,{action:"blackout"},229999));
 act(r,k,{action:"blackout"},230000);assert.equal(r.dark,true);
});
