import PF from "pathfinding";
import {emitSound,footMaterial,audibleSounds,doorSound} from './hunt-sound.mjs';
import {
  maps,
  objects,
  wardrobes,
  passageNodes,
  TILE,
  W,
  H,
  SPEED,
  move,
  cardinal,
  canInteract,
  los,
  fits,
  spawn,
  roomAt,
  interactionPoint,
  stairLandings,
  stairFlight,
  onStairs,
  patrolPoints,
  CLASSES,
  machines,
  exitDoors,
  tables,
  panels,
  doors,
  breakWalls,
  arches,
  lootSites,
  drawerSites,
  nearDoor,
  securityTerminal,
  cameraStations,
  inGrass,
  huntRules as rules,
  huntRadius,
  killerSpawn,
  passageDestinations,
} from "./hunt-world.mjs";
export { rules };
const uid = () => crypto.randomUUID(),
  pos = (r, p) => r.positions[p.id],
  ghost = (p) => p.status === "eliminated",
  active = (p) => p.status === "active",
  remaining = (p) => !["eliminated", "escaped", "lost"].includes(p.status);
export function random(r) {
  r.seed = (r.seed + 0x6d2b79f5) | 0;
  let t = r.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle(r, a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random(r) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const clean = (n) => {
  n = String(n || "")
    .trim()
    .slice(0, 24);
  if (!n) throw Error("Enter a name.");
  return n;
};
function player(name, index, bot, now) {
  return {
    id: uid(),
    token: uid(),
    name: clean(name),
    bot,
    connected: !bot,
    seen: now,
    role: "Survivor",
    class: null,
    status: "active",
    alive: true,
    input: { x: 0, y: 0 },
    inputAt: 0,
    channel: null,
    repairing: null,
    feedback: null,
    damageAt: 0,
    captures: 0,
    hidden: null,
    shieldUntil: 0,
    stunUntil: 0,
    timeoutUntil: 0,
    resistUntil: 0,
    attackAt: 0,
    powerAt: 0,
    ventAt: 0,
    flashCharges: 2,
    flashNext: 0,
    hulkUsed: false,
    hulkUntil: 0,
    hulkReadyAt: 0,
    portalsPlaced: 0,
    keys: 0,
    sensors: 0,
    whip: 0,
    battery: 0,
    hadLight: false,
    lightOn: false,
    lightLast: 0,
    wiggle: 0,
    lastWiggle: -Infinity,
    camp: 0,
    lastMove: now,
    nav: null,
    carrying: null,
    carriedBy: null,
    table: null,
    downUntil: 0,
    captureUntil: 0,
    hideUntil: 0,
    hideAt: 0,
    dashUntil: 0,
    boostUntil: 0,
    archAt: 0,
    death: null,
    repairAt: 0,
    memory: null,
    patrol: null,
    goal: null,
    stairRoute: null,
    portalTry: 0,
    searchAt: 0,
  };
}
export function create(
  name,
  now = Date.now(),
  seed = Math.floor(Math.random() * 1e9),
) {
  const p = player(name, 0, false, now);
  return {
    mode: "hunt",
    code: uid().slice(0, 8).toUpperCase(),
    host: p.id,
    players: [p],
    positions: { [p.id]: spawn(0) },
    phase: "lobby",
    seed,
    round: 0,
    speed: 1,
    lastActive: now,
    phaseAt: now,
    events: [],
    eventSeq: 0,
    machines: {},
    portals: [],
    closedDoors: {},
    manualDoors: {},
    pendingDoors: {},
    doorAt: {},
    pressureAnnounced: false,
    broken: [],
    sensors: [],
    chests: [],
    keys: [],
    drawers: [],
    rustles: [],
    stats: {
      hits: 0,
      captures: 0,
      rescues: 0,
      wiggles: 0,
      escaped: 0,
      repairs: 0,
      hulkDefeats: 0,
    },
    revealUntil: 0,
    dark: false,
    blackoutEndsAt: 0,
    blackoutAt: 0,
  };
}
export function addPlayer(r, name, bot = false, now = Date.now()) {
  if (r.phase !== "lobby" || r.players.length >= 12)
    throw Error("The hunt has begun or the lobby is full.");
  name = clean(name);
  if (r.players.some((p) => p.name.toLowerCase() === name.toLowerCase()))
    throw Error("Choose a different name.");
  const p = player(name, r.players.length, bot, now);
  r.players.push(p);
  r.positions[p.id] = spawn(r.players.length - 1);
  return p;
}
export function hunterPressure(r) {
  return (
    r.phase === "hunt" &&
    Object.values(r.machines).filter((m) => m.done).length >=
      Math.max(1, (r.required || 8) - 2)
  );
}
function doorReach(r, a, d, now) {
  if (!nearDoor(a, d)) return false;
  const b = {
    floor: d.floor,
    x: Math.max(d.x - d.w / 2, Math.min(a.x, d.x + d.w / 2)),
    y: Math.max(d.y - d.h / 2, Math.min(a.y, d.y + d.h / 2)),
  };
  return clearLine(r, a, b, now, true, d.id);
}
export const killer = (r) => r.players.find((p) => p.id === r.killerId);
const event = (r, type, text, now, data = {}) => {
  r.events.push({ seq: ++r.eventSeq, type, text, at: now, ...data });
  r.events = r.events.slice(-32);
};
const notify = (p, text) => (p.toast = text);
const confirm=(p,kind,now)=>{p.feedback={kind,at:now,seq:(p.feedback?.seq||0)+1};};
const clear = (p, interruptTransformation = true) => {
  if (interruptTransformation) p.hulkReadyAt = 0;
  p.channel = null;
  p.repairing = null;
  p.session = null;
  p.watching = false;
};
function blockers(r, now) {
  return [
    ...doors.filter(
      (d) => r.manualDoors?.[d.id] || (r.closedDoors[d.id] || 0) > now,
    ),
    ...breakWalls.filter((w) => !r.broken.includes(w.id)),
  ];
}
const movementBlocks = (r, now) => [
  ...blockers(r, now),
  ...machines.map((m) => ({ ...m, w: 16, h: 14 })),
];
const intersects = (p, b, pad = 0) =>
  p.floor === b.floor &&
  Math.abs(p.x - b.x) < b.w / 2 + pad &&
  Math.abs(p.y - b.y) < b.h / 2 + pad;
export function clearLine(r, a, b, now, solid = false, ignoreDoor = null) {
  if (!los(a, b, solid)) return false;
  const bs = blockers(r, now).filter((d) => d.id !== ignoreDoor),
    d = Math.hypot(a.x - b.x, a.y - b.y);
  for (let t = 0; t < d; t += 3)
    if (
      bs.some((w) =>
        intersects(
          {
            floor: a.floor,
            x: a.x + ((b.x - a.x) * t) / d,
            y: a.y + ((b.y - a.y) * t) / d,
          },
          w,
        ),
      )
    )
      return false;
  return true;
}
export const reach = (r, a, b, d, now) =>
  a.floor === b.floor &&
  Math.hypot(a.x - b.x, a.y - b.y) <= d &&
  clearLine(r, a, b, now, true);
function see(r, p, q, now) {
  const a = pos(r, p);
  return (
    a.floor === q.floor &&
    Math.hypot(a.x - q.x, a.y - q.y) <= huntRadius(p, r.dark) &&
    clearLine(r, a, q, now)
  );
}
function eligible(r, p, now) {
  return (
    r.phase === "hunt" &&
    active(p) &&
    !p.hidden &&
    !p.channel &&
    !p.hulkReadyAt &&
    !(
      p.role === "Killer" &&
      (now < r.unlockAt || now < p.stunUntil || now < p.timeoutUntil)
    )
  );
}
function start(r, now) {
  if (r.players.length < 2) throw Error("Invite a friend or bot first.");
  r.killerId =
    r.requestedKiller ||
    r.players.find((p) => p.bot)?.id ||
    r.players[Math.floor(random(r) * r.players.length)].id;
  Object.assign(r, {
    phase: "hunt",
    phaseAt: now,
    deadline: now + rules.match,
    unlockAt: now + rules.warmup,
    revealUntil: 0,
    screamAt: now + rules.warmup,
    blackoutAt: now + 60000,
    dark: false,
    blackoutEndsAt: 0,
    exitsOpen: false,
    required: Math.min(8, Math.max(3, r.players.length)),
    winner: null,
    reason: "",
    events: [],
    eventSeq: 0,
    portals: [],
    closedDoors: {},
    manualDoors: {},
    pendingDoors: {},
    doorAt: {},
    pressureAnnounced: false,
    broken: [],
    sensors: [],
    rustles: [],
    powerProgress: 0,
  });
  r.round++;
  r.machines = Object.fromEntries(
    machines.map((m) => [
      m.id,
      { id: m.id, progress: 0, ghostWork: 0, done: false },
    ]),
  );
  r.stats = {
    hits: 0,
    captures: 0,
    rescues: 0,
    wiggles: 0,
    escaped: 0,
    repairs: 0,
    hulkDefeats: 0,
  };
  const bag = shuffle(r, CLASSES),
    extra = shuffle(r, ["Photographer", "Engineer", "Escape Artist"]);
  let n = 0;
  for (const [i, p] of r.players.entries()) {
    const fresh = player(p.name, i, p.bot, now);
    for (const k of [
      "id",
      "token",
      "name",
      "bot",
      "connected",
      "seen",
      "socket",
    ])
      delete fresh[k];
    Object.assign(p, fresh, {
      role: p.id === r.killerId ? "Killer" : "Survivor",
    });
    p.class = p.role === "Killer" ? null : bag[n] || extra[(n - 5) % 3];
    if (p.role !== "Killer") n++;
    r.positions[p.id] = p.role === "Killer" ? { ...killerSpawn } : spawn(i);
    p.preference = Object.fromEntries(
      machines.map((m) => [m.id, random(r) * 180]),
    );
  }
  const sites = shuffle(r, lootSites);
  r.chests = sites
    .slice(0, 10)
    .map((p, i) => ({ id: "chest-" + i, ...p, opened: false }));
  r.drawers = shuffle(r, drawerSites).map((d) => ({
    ...d,
    empty: false,
    openUntil: 0,
  }));
  r.keys = Array.from({ length: 16 }, (_, i) => ({
    ...r.drawers[i % r.drawers.length],
    id: uid(),
    drawer: r.drawers[i % r.drawers.length].id,
  }));
  event(
    r,
    "start",
    "The hunter is known. Repair machines, rescue friends, escape the manor.",
    now,
  );
}
function release(r, p, now, why) {
  const carrier = r.players.find((q) => q.carrying === p.id);
  if (carrier) carrier.carrying = null;
  clear(p);
  Object.assign(p, {
    status: "active",
    alive: true,
    hidden: null,
    table: null,
    carriedBy: null,
    camp: 0,
    shieldUntil: now + rules.rescueShield,
    boostUntil: now + 2000,
    nav: null,
  });
  r.stats.rescues++;
  event(r, "rescue", `${p.name} is free · ${why}`, now);
}
function drop(r, k, now) {
  if (!k.carrying) return;
  const t = r.players.find((p) => p.id === k.carrying);
  k.carrying = null;
  if (t) {
    Object.assign(t, {
      status: "downed",
      carriedBy: null,
      downUntil: now + 45000,
    });
    r.positions[t.id] = { ...pos(r, k) };
  }
}
function eliminate(r, p, now) {
  const k = r.players.find((q) => q.carrying === p.id);
  if (k) k.carrying = null;
  clear(p);
  Object.assign(p, {
    status: "eliminated",
    alive: false,
    hidden: null,
    carriedBy: null,
    table: null,
    lightOn: false,
    death: { id: uid(), at: now },
  });
  event(r, "eliminated", `${p.name} became a wandering spirit.`, now);
}
function capture(r, k, p, table, now) {
  if (r.players.some((q) => q.table === table.id && q.status === "captured"))
    return;
  clear(p);
  k.carrying = null;
  Object.assign(p, {
    status: "captured",
    carriedBy: null,
    table: table.id,
    captures: p.captures + 1,
    captureUntil: now + rules.capture,
    camp: 0,
  });
  r.positions[p.id] = {
    floor: table.floor,
    x: table.x,
    y: table.y,
    dir: "down",
  };
  r.stats.captures++;
  if (p.captures >= 3) eliminate(r, p, now);
  else
    event(
      r,
      "capture",
      `${p.name} is chained to an Exorcist Table (${p.captures}/3).`,
      now,
    );
}
function attack(r, p, b, now, whip = false) {
  if (now < p.attackAt || p.channel)
    throw Error("Recover before attacking again.");
  if (p.role !== "Killer" && !(p.class === "Hulk" && now < p.hulkUntil))
    throw Error("You cannot attack.");
  if (p.carrying) throw Error("Put down your captive before attacking.");
  if (whip && (p.role !== "Killer" || !p.whip)) throw Error("No whip charges.");
  if (whip) {
    p.whip--;
    r.stats.whipAttacks = (r.stats.whipAttacks || 0) + 1;
  }
  const direction = ["up", "down", "left", "right"].includes(b.direction)
    ? b.direction
    : pos(r, p).dir;
  p.attackAt = now + (whip ? 1400 : rules.attackCooldown);
  p.repairing = null;
  p.channel = {
    kind: "strike",
    started: now,
    until: now + (whip ? 400 : 350),
    direction,
    whip,
    pos: { ...pos(r, p) },
  };
}
function defeat(r, k, now) {
  drop(r, k, now);
  clear(k);
  k.keys = 0;
  k.whip = 0;
  k.sensors = 0;
  k.lightOn = false;
  k.battery = 0;
  k.timeoutUntil = now + rules.hulkTimeout;
  k.stunUntil = 0;
  k.attackAt = k.timeoutUntil;
  k.hidden = null;
  r.revealUntil = 0;
  r.stats.hulkDefeats++;
  event(
    r,
    "hulk-defeat",
    "The hunter was defeated. Ten seconds in darkness, then a return to the original spawn.",
    now,
  );
}
function power(r, p, b, now) {
  if (p.role === "Killer") {
    if (now < r.screamAt) throw Error("SCREAM is recharging.");
    r.screamAt = now + rules.screamCooldown;
    r.revealUntil = now + 2000;
    event(
      r,
      "scream",
      "SCREAM · survivors outside tall grass are exposed for two seconds.",
      now,
    );
    return;
  }
  if (p.class === "Photographer") {
    if (now < p.powerAt || p.flashCharges < 1)
      throw Error("Your flash is recharging.");
    p.flashCharges--;
    if (!p.flashNext) p.flashNext = now + rules.flashRecharge;
    p.powerAt = now + rules.flashCooldown;
    const d = ["up", "down", "left", "right"].includes(b.direction)
        ? b.direction
        : pos(r, p).dir,
      v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d],
      a = pos(r, p),
      k = killer(r),
      c = pos(r, k),
      distance = Math.hypot(c.x - a.x, c.y - a.y),
      dot = ((c.x - a.x) * v[0] + (c.y - a.y) * v[1]) / (distance || 1);
    event(r, "flash", `${p.name}'s camera flashes.`, now, {
      floor: a.floor,
      x: a.x,
      y: a.y,
      direction: d,
    });
    if (
      !k.timeoutUntil &&
      distance <= 100 &&
      dot >= 0.57 &&
      reach(r, a, c, 100, now) &&
      now >= k.resistUntil
    ) {
      drop(r, k, now);
      clear(k);
      k.stunUntil = now + rules.stun;
      k.resistUntil = now + rules.stunResistance;
      notify(
        p,
        "Flash landed. The hunter resists further flashes for eight seconds.",
      );
      confirm(p,'stun',now);
      confirm(k,'stunned',now);
    } else {
      confirm(p,distance<=100&&dot>=.57&&reach(r,a,c,100,now)&&now<k.resistUntil?'resisted':'miss',now);
    }
    return;
  }
  if (p.class === "Magician") {
    if(r.portals.some(q=>q.owner===p.id&&(q.floor===2)!==(pos(r,p).floor===2)))throw Error("Use a courtyard door. A portal pair must stay entirely inside or entirely outside.");
    if (p.portalsPlaced >= 2)
      throw Error("Both permanent portals are already placed.");
    const a = pos(r, p);
    if (
      onStairs(a) ||
      !fits(a.floor, a.x, a.y) ||
      [
        ...machines,
        ...exitDoors,
        ...tables,
        ...arches,
        ...panels,
        ...r.chests,
      ].some(
        (q) => q.floor === a.floor && Math.hypot(q.x - a.x, q.y - a.y) < 42,
      ) ||
      doors.some((d) => intersects(a, d, 20)) ||
      r.portals.some(
        (q) => q.floor === a.floor && Math.hypot(q.x - a.x, q.y - a.y) < 56,
      ) ||
      blockers(r, now).some((w) => intersects(a, w, 20))
    )
      throw Error(
        "Place it on open floor away from doors, machines, chests and tables.",
      );
    r.portals.push({ id: uid(), owner: p.id, ...a, number: ++p.portalsPlaced });
    event(
      r,
      "portal",
      `${p.name} placed a permanent portal (${p.portalsPlaced}/2). Everyone can use the pair.`,
      now,
    );
    return;
  }
  if (p.class === "Escape Artist") {
    if (now < p.powerAt) throw Error("Dash is recharging.");
    r.stats.dashes = (r.stats.dashes || 0) + 1;
    p.dashUntil = now + 420;
    p.powerAt = now + 12000;
    return;
  }
  if (p.class === "Engineer") {
    if (now < p.powerAt) throw Error("Door control is recharging.");
    const d = doors.find((d) => d.id === b.door);
    if (!d) throw Error("Choose a door on the remote-control map.");
    if (r.players.some((q) => remaining(q) && intersects(pos(r, q), d, 6)))
      throw Error("Someone is in the doorway. It will not close on them.");
    r.stats.doorClosures = (r.stats.doorClosures || 0) + 1;
    r.closedDoors[d.id] = now + 1000;
    p.powerAt = now + rules.doorCooldown;
    event(r, "door", "An Engineer closed a door for one second.", now);
    return;
  }
  if (p.class === "Hulk") {
    if (p.hulkUsed)
      throw Error("Your ultimate has already been used this match.");
    p.hulkUsed = true;
    p.repairing = null;
    p.hulkReadyAt = now + rules.hulkWindup;
    event(
      r,
      "injection",
      `${p.name} uses an experimental injection. The transformation is beginning…`,
      now,
    );
  }
}
export function act(r, p, b, now = Date.now()) {
  r.lastActive = now;
  if (!b || typeof b.action !== "string") throw Error("Invalid command.");
  if (b.action === "addBot") {
    if (p.id !== r.host) throw Error("Only the host can invite bots.");
    return addPlayer(
      r,
      [
        "Asha",
        "Kabir",
        "Rohan",
        "Tara",
        "Dev",
        "Noor",
        "Mira",
        "Arjun",
        "Leela",
        "Ravi",
        "Ishaan",
      ].find((n) => !r.players.some((p) => p.name === n)) ||
        "Guest " + r.players.length,
      true,
      now,
    );
  }
  if (b.action === "setKiller") {
    if (
      p.id !== r.host ||
      r.phase !== "lobby" ||
      !r.players.some((p) => p.id === b.target)
    )
      throw Error("Only the host may pick the hunter in the lobby.");
    r.requestedKiller = b.target;
    return;
  }
  if(b.action==='setSpeed'){
    if(p.id!==r.host||r.phase!=='lobby')throw Error('Only the host can change movement speed in the lobby.');
    if(![.75,1,1.25,1.5,1.75,2].includes(b.speed))throw Error('Choose a movement speed from 0.75× to 2×.');
    r.speed=b.speed;
    return;
  }
  if (b.action === "start") {
    if (p.id !== r.host || r.phase !== "lobby")
      throw Error("Only the host may start.");
    start(r, now);
    return;
  }
  if (b.action === "restart") {
    if (p.id !== r.host || r.phase !== "ended")
      throw Error("Wait for the host to open another lobby.");
    const keep={code:r.code,host:r.host,players:r.players,round:r.round,seed:r.seed,speed:r.speed||1,requestedKiller:r.requestedKiller};
    const fresh=create(p.name,now,r.seed);
    for(const [i,q]of keep.players.entries()){
      const identity=Object.fromEntries(['id','token','name','bot','connected','seen','socket'].filter(k=>k in q).map(k=>[k,q[k]]));
      const reset=player(q.name,i,q.bot,now);
      for(const k of Object.keys(q))delete q[k];
      Object.assign(q,reset,identity,{input:{x:0,y:0},inputAt:0});
    }
    for(const k of Object.keys(r))delete r[k];
    Object.assign(r,fresh,keep,{positions:Object.fromEntries(keep.players.map((q,i)=>[q.id,spawn(i)]))});
    return;
  }
  if (b.action === "close") {
    clear(p, false);
    return;
  }
  if (r.phase !== "hunt") throw Error("Start a hunt first.");
  if (b.action === "ghostFloor" && ghost(p)) {
    pos(r, p).floor = (pos(r, p).floor + 1) % 3;
    return;
  }
  if (b.action === "wiggle" && p.status === "carried") {
    if (now - p.lastWiggle < rules.wiggleInterval)
      return;
    p.lastWiggle = now;
    p.wiggle++;
    if (p.wiggle >= rules.wiggleTaps) {
      const k = r.players.find((q) => q.id === p.carriedBy);
      if (k) {
        clear(k);
        k.carrying = null;
        k.stunUntil = now + 1500;
        k.resistUntil = now + 8000;
      }
      release(r, p, now, "wiggled free");
      r.stats.wiggles++;
    }
    return;
  }
  if (b.action === "repair" && ghost(p)) {
    const m = machines.find((m) => m.id === b.object);
    if (!m || !reach(r, pos(r, p), m, 27, now) || r.machines[m.id].done)
      throw Error("Visit an unfinished machine.");
    p.repairing = m.id;
    p.repairAt = now;
    return;
  }
  if (ghost(p) || p.status === "escaped" || p.status === "lost")
    throw Error(
      "Spirits may only move and lend limited machine repairs. Escaped guests have finished.",
    );
  if (!active(p))
    throw Error("Wiggle while carried, or wait for a teammate rescue.");
  if (p.watching && b.action !== "security") p.watching = false;
  if (p.hidden && b.action === "leave") {
    p.hidden = null;
    p.hideAt = now + 18000;
    return;
  }
  if (!eligible(r, p, now)) throw Error("Finish your current action first.");
  if (b.action === "attack" || b.action === "whip") {
    attack(r, p, b, now, b.action === "whip");
    return;
  }
  if (b.action === "power") {
    power(r, p, b, now);
    return;
  }
  if (b.action === "door") {
    const d = doors.find((d) => d.id === (b.object || b.door));
    if (!d || !doorReach(r, pos(r, p), d, now))
      throw Error("Stand beside the door to operate it.");
    if ((r.closedDoors[d.id] || 0) > now)
      throw Error("The remote latch releases in a moment.");
    if (now < (r.doorAt?.[d.id] || 0)) throw Error("The door is still moving.");
    r.pendingDoors ||= {};
    if(r.pendingDoors[d.id]){delete r.pendingDoors[d.id];notify(p,'Door stays open.');return;}
    const close = !r.manualDoors?.[d.id];
    if (
      close &&
      r.players.some(
        (q) =>
          !["eliminated", "escaped", "lost"].includes(q.status) &&
          intersects(pos(r, q), d, 6),
      )
    )
    {
      r.pendingDoors[d.id]=now+4000;
      clear(p);
      notify(p,'Door will close behind you.');
      return;
    }
    r.manualDoors ||= {};
    r.doorAt ||= {};
    r.manualDoors[d.id] = close;
    r.doorAt[d.id] = now + 200;
    emitSound(r,doorSound(d),d,now);
    clear(p);
    return;
  }
  if (b.action === "security") {
    if (p.carrying || !reach(r, pos(r, p), securityTerminal, 27, now))
      throw Error("Use the physical console in the Security room.");
    clear(p);
    p.watching = true;
    p.input = { x: 0, y: 0 };
    return;
  }

  if (b.action === "blackout") {
    if (p.role !== "Killer" || now < r.blackoutAt || r.dark)
      throw Error("Electricity sabotage is not ready.");
    r.dark = true;
    r.blackoutEndsAt = now + rules.blackoutDuration;
    r.powerProgress = 0;
    r.blackoutAt = now + rules.blackoutCooldown;
    event(
      r,
      "blackout",
      "The mansion loses power for up to 40 seconds. Repair any electrical panel to restore it sooner.",
      now,
    );
    return;
  }
  if (b.action === "light") {
    if (p.role === "Killer" || p.battery <= 0)
      throw Error("Your flashlight battery is dead or unavailable.");
    drainLight(p, now);
    p.lightOn = p.battery > 0 && !p.lightOn;
    p.lightLast = now;
    return;
  }
  if (b.action === "sensor") {
    if (p.role === "Killer" || !p.sensors)
      throw Error("No motion sensor in your inventory.");
    const a = pos(r, p);
    if (onStairs(a)) throw Error("Place sensors off the stairs.");
    r.sensors.push({
      id: uid(),
      owner: p.id,
      ...a,
      until: now + 60000,
      alertAt: 0,
    });
    p.sensors--;
    return;
  }
  if (b.action === "drop") {
    if (!p.carrying) throw Error("You are not carrying anyone.");
    drop(r, p, now);
    return;
  }
  if (b.action === "pickup") {
    if (p.role !== "Killer" || p.carrying)
      throw Error("Only a free hunter can carry.");
    const t = r.players.find((q) => q.id === b.target && q.status === "downed");
    if (!t || !reach(r, pos(r, p), pos(r, t), 25, now))
      throw Error("Reach the downed survivor.");
    p.channel = {
      kind: "pickup",
      target: t.id,
      started: now,
      until: now + 600,
      pos: { ...pos(r, p) },
    };
    return;
  }
  if (b.action === "rescue") {
    if (p.role === "Killer") throw Error("Only survivors can rescue.");
    const t = r.players.find(
      (q) => q.id === b.target && ["downed", "captured"].includes(q.status),
    );
    if (!t || !reach(r, pos(r, p), pos(r, t), 28, now))
      throw Error("Reach your teammate.");
    p.channel = {
      kind: "rescue",
      target: t.id,
      started: now,
      until: now + 2200,
      pos: { ...pos(r, p) },
    };
    p.repairing = null;
    return;
  }
  if (b.action === "travel") {
    const s = passageNodes.find((o) => o.id === b.object),
      d = passageNodes.find((o) => o.id === b.destination);
    if (
      !s ||
      !d ||
      !passageDestinations(p, s).includes(d.id) ||
      !canInteract(pos(r, p), s, 24) ||
      now < p.ventAt ||
      p.carrying
    )
      throw Error("That passage is not available.");
    p.channel = {
      kind: "travel",
      started: now,
      until: now + 1400,
      destination: interactionPoint(d),
      pos: { ...pos(r, p) },
    };
    emitSound(r,'hatch',pos(r,p),now);
    p.ventAt = now + 25000;
    return;
  }
  if (b.action === "damageMachine") {
    const m = machines.find(m => m.id === b.object), o = m && r.machines[m.id];
    if (p.role !== "Killer" || p.carrying || !m || !o || o.done || o.progress <= 0 ||
        !reach(r, pos(r, p), m, 27, now))
      throw Error("Stand beside an unfinished machine with repair progress.");
    if (now < (p.damageAt || 0)) throw Error("Machine damage is cooling down.");
    if (now < (o.damageProtectedUntil || 0)) throw Error("That machine is protected from repeat damage.");
    p.repairing = null;
    p.channel = {kind:"damageMachine", object:m.id, started:now, until:now+rules.machineDamageTime, pos:{...pos(r,p)}};
    return;
  }
  if (b.action === "repair") {
    const m = machines.find((m) => m.id === b.object);
    if (
      p.role === "Killer" ||
      !m ||
      !reach(r, pos(r, p), m, 27, now) ||
      r.machines[m.id].done
    )
      throw Error("Stand at an unfinished machine.");
    p.repairing = m.id;
    p.repairAt = now;
    const direction=cardinal(m.x-pos(r,p).x,m.y-pos(r,p).y,pos(r,p).dir);
    if(direction.x||direction.y)pos(r,p).dir=direction.x?(direction.x>0?'right':'left'):(direction.y>0?'down':'up');
    return;
  }
  if (b.action === "interact") {
    const a = pos(r, p),
      gate = exitDoors.find((e) => e.id === b.object);
    if (gate) {
      if (now < p.hulkUntil || p.hulkReadyAt)
        throw Error("Return to Scientist form before escaping.");
      if (p.role === "Killer" || !r.exitsOpen || !reach(r, a, gate, 26, now))
        throw Error("Reach an unlocked exit.");
      p.channel = {
        kind: "escape",
        started: now,
        until: now + 1800,
        pos: { ...a },
        object: gate.id,
      };
      p.repairing = null;
      return;
    }
    const table = tables.find((t) => t.id === b.object);
    if (table) {
      const victim = r.players.find((q) => q.id === p.carrying);
      if (
        p.role !== "Killer" ||
        !victim ||
        !reach(r, a, table, 26, now) ||
        r.players.some((q) => q.table === table.id && q.status === "captured")
      )
        throw Error("Carry a survivor to an empty table.");
      p.channel = {
        kind: "chain",
        started: now,
        until: now + 1100,
        pos: { ...a },
        object: table.id,
        target: victim.id,
      };
      return;
    }
    const panel = panels.find((t) => t.id === b.object);
    if (panel) {
      if (p.role === "Killer" || !r.dark || !reach(r, a, panel, 26, now))
        throw Error("Reach any electrical panel during blackout.");
      p.channel = {
        kind: "power",
        started: now,
        until: now + rules.powerWork / (p.class === "Engineer" ? 1.5 : 1),
        pos: { ...a },
        object: panel.id,
      };
      return;
    }
    const portal = r.portals.find((q) => q.id === b.object),
      mate =
        portal &&
        r.portals.find((q) => q.owner === portal.owner && q.id !== portal.id);
    if (portal && mate) {
      if (
        !reach(r, a, portal, 22, now) ||
        (portal.floor===2)!==(mate.floor===2) ||
        now < p.ventAt ||
        blockers(r, now).some((w) => intersects(mate, w, 6))
      )
        throw Error("Portal is not available yet.");
      r.stats.portalTrips = (r.stats.portalTrips || 0) + 1;
      p.ventAt = now + 8000;
      p.channel = {
        kind: "portal",
        started: now,
        until: now + 900,
        pos: { ...a },
        destination: { floor: mate.floor, x: mate.x, y: mate.y },
      };
      emitSound(r,'hatch',pos(r,p),now);
      return;
    }
    const drawer = (r.drawers || []).find((d) => d.id === b.object);
    if (drawer) {
      const furniture = objects.find((o) => o.id === drawer.object);
      if (drawer.empty || p.keys >= 2 || !canInteract(a, furniture, 24))
        throw Error("Reach a stocked drawer; carry at most two keys.");
      const edge = {
        floor: furniture.floor,
        x: Math.max(
          furniture.x * TILE,
          Math.min(a.x, (furniture.x + furniture.w) * TILE),
        ),
        y: Math.max(
          furniture.y * TILE,
          Math.min(a.y, (furniture.y + furniture.h) * TILE),
        ),
      };
      if (!clearLine(r, a, edge, now, true))
        throw Error("Reach the drawer without a wall or door between you.");
      p.channel = {
        kind: "drawer",
        started: now,
        until: now + 1000,
        pos: { ...a },
        object: drawer.id,
      };
      return;
    }
    const chest = r.chests.find((c) => c.id === b.object);
    if (chest) {
      if (chest.opened || !p.keys || !reach(r, a, chest, 25, now))
        throw Error("A locked chest needs a key.");
      p.channel = {
        kind: "chest",
        started: now,
        until: now + 1200,
        pos: { ...a },
        object: chest.id,
      };
      return;
    }
    const sensor = r.sensors.find((s) => s.id === b.object);
    if (sensor && p.role === "Killer") {
      if (!reach(r, a, sensor, 22, now))
        throw Error("Reach the motion sensor.");
      r.sensors = r.sensors.filter((s) => s !== sensor);
      notify(p, "Sensor destroyed.");
      return;
    }
    const o = wardrobes.find((o) => o.id === b.object);
    if (o && canInteract(a, o, 24)) {
      if (p.role === "Killer") {
        p.channel = {
          kind: "search",
          started: now,
          until: now + 1200,
          pos: { ...a },
          object: o.id,
        };
        return;
      }
      if (
        now < (p.hideAt || 0) ||
        r.players.some(
          (q) =>
            q.hidden === o.id ||
            (q.channel?.object === o.id && q.channel.kind === "hide"),
        )
      )
        throw Error("Wardrobe is occupied or recovering.");
      p.channel = {
        kind: "hide",
        started: now,
        until: now + 800,
        pos: { ...a },
        object: o.id,
      };
      return;
    }
    throw Error("Approach something you can use.");
  }
  throw Error("That action is not part of the mansion hunt.");
}
export function movementMultiplier(r,p,now){
  let ratio=ghost(p) ? 1.25
    : p.status==='downed' ? .25
    : p.carrying ? .85*(hunterPressure(r)?rules.pressureSpeed/1.12:1)
    : p.role==='Killer' ? (hunterPressure(r)?rules.pressureSpeed:rules.hunterSpeed)
    : now<p.hulkUntil ? rules.hulkSpeed
    : now<p.dashUntil ? 2.2
    : now<p.boostUntil ? 1.25 : 1;
  if(p.channel?.kind==='strike')ratio*=.55;
  return ratio*(r.speed||1);
}
export function rescueAssist(r,target,now){
  if(!['downed','captured'].includes(target.status))return null;
  const q=r.players.find(q=>active(q)&&q.role!=='Killer'&&q.channel?.kind==='rescue'&&q.channel.target===target.id&&now<q.channel.until&&reach(r,pos(r,q),pos(r,target),28,now));
  return q?{started:q.channel.started,until:q.channel.until}:null;
}
export function movePlayer(r, p, dx, dy, dt, now = Date.now()) {
  if (
    r.phase === "ended" ||
    !Number.isFinite(dx) ||
    !Number.isFinite(dy) ||
    ["captured", "carried", "escaped", "lost"].includes(p.status) ||
    p.hidden || p.hulkReadyAt ||
    (p.role === "Killer" &&
      ((now < r.unlockAt && r.phase === "hunt") ||
        now < p.stunUntil ||
        now < p.timeoutUntil)) ||
    (p.channel && ["portal", "travel", "arch"].includes(p.channel.kind))
  )
    return;
  const a = pos(r, p),
    v = cardinal(dx, dy, a.dir);
  if (!v.x && !v.y) return;
  p.watching = false;
  if (p.channel?.kind !== "strike") p.channel = null;
  p.repairing = null;
  const ratio=movementMultiplier(r,p,now);
  let time = Math.min(0.1, Math.max(0, dt)) * ratio;
  const before = { ...a };
  if (ghost(p)) {
    a.x = Math.max(8, Math.min(W * TILE - 8, a.x + v.x * SPEED * time));
    a.y = Math.max(8, Math.min(H * TILE - 8, a.y + v.y * SPEED * time));
  } else
    while (time > 0) {
      const part = Math.min(0.025, time),
        next = { ...a };
      move(next, v.x, v.y, part);
      if (!movementBlocks(r, now).some((w) => intersects(next, w, 4)))
        Object.assign(a, next);
      time -= part;
    }
  if (Math.hypot(a.x - before.x, a.y - before.y) > 0.1) {
    if(active(p)&&!p.hidden&&!(now<p.hulkUntil)){
      p.soundDistance=(p.soundDistance||0)+Math.hypot(a.x-before.x,a.y-before.y);
      if(p.soundDistance>=20&&now-(p.soundAt||0)>=180){emitSound(r,footMaterial(a),a,now);p.soundDistance=0;p.soundAt=now;}
    }
    if (now < p.hulkUntil && active(p)) {
      p.hulkStepDistance = (p.hulkStepDistance || 0) + Math.hypot(a.x-before.x,a.y-before.y);
      if (now-(p.lastHulkStep || 0) >= 180 &&
          (now-(p.lastHulkStep || 0) > 500 || p.hulkStepDistance >= rules.hulkStepDistance)) {
        r.hulkFootstep = {seq:(r.hulkFootstep?.seq || 0)+1,at:now};
        p.lastHulkStep=now;p.hulkStepDistance=0;
      }
    } else p.hulkStepDistance=0;
    p.lastMove = now;
    r.lastActive = now;
    if (inGrass(a)) {
      const cell = {
        floor: a.floor,
        x: ((a.x / 16) | 0) * 16 + 8,
        y: ((a.y / 16) | 0) * 16 + 8,
      };
      const old = r.rustles.find(
        (q) => q.floor === cell.floor && q.x === cell.x && q.y === cell.y,
      );
      if (old) old.until = now + 650;
      else r.rustles.push({ ...cell, until: now + 650 });
    }
    if (p.carrying) {
      const t = r.players.find((q) => q.id === p.carrying);
      if (t) r.positions[t.id] = { ...a };
    }
  }
  if (!ghost(p) && now > (p.archAt || 0)) {
    const arch = arches.find((q) => reach(r, a, q, 10, now));
    if (arch) {
      emitSound(r,'doorWood',a,now);
      Object.assign(a, arch.to);
      emitSound(r,'doorWood',a,now);
      p.archAt = now + 1700;
      p.nav = null;
      if (p.carrying) {
        const carried = r.players.find((q) => q.id === p.carrying);
        if (carried) r.positions[carried.id] = { ...a };
      }
    }
  }
}
function strike(r, p, c, now) {
  const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[
      c.direction
    ],
    a = pos(r, p),
    hulk = p.role !== "Killer",
    range = c.whip
      ? 88
      : p.role === "Killer" && hunterPressure(r)
        ? rules.pressureRange
        : 36;
  const candidates = r.players.filter(
    (q) =>
      q !== p &&
      active(q) &&
      !q.hidden &&
      (hulk ? q.role === "Killer" : q.role !== "Killer") &&
      now >= q.shieldUntil &&
      now >= q.hulkUntil &&
      !(q.role === "Killer" && now < q.timeoutUntil) &&
      !q.channel?.kind?.match(/portal|travel|arch/) &&
      reach(r, a, pos(r, q), range, now),
  );
  const target = candidates
    .filter((q) => {
      const b = pos(r, q),
        d = Math.hypot(b.x - c.pos.x, b.y - c.pos.y);
      return (
        d <= 10 ||
        ((b.x - c.pos.x) * v[0] + (b.y - c.pos.y) * v[1]) / (d || 1) >=
          (c.whip ? 0.78 : 0.3)
      );
    })
    .sort(
      (x, y) =>
        Math.hypot(a.x - pos(r, x).x, a.y - pos(r, x).y) -
        Math.hypot(a.x - pos(r, y).x, a.y - pos(r, y).y),
    )[0];
  const brokenBefore=r.broken.length;
  if (hulk) {
    for (const w of breakWalls.filter(
      (w) =>
        !r.broken.includes(w.id) &&
        w.floor === a.floor &&
        Math.hypot(w.x - a.x, w.y - a.y) <= 56 &&
        los(a, w) &&
        (w.x - a.x) * v[0] + (w.y - a.y) * v[1] >= 0,
    )) {
      r.broken.push(w.id);
      event(r, "wall", "A destructible garden screen shatters.", now);
    }
    if (target) defeat(r, target, now);
  } else if (target) {
    clear(target);
    target.hidden = null;
    target.status = "downed";
    target.downUntil = now + 45000;
    target.hulkUntil = 0;
    target.shieldUntil = now + 700;
    r.stats.hits++;
    event(
      r,
      "down",
      `${target.name} is down. Find them before the hunter does.`,
      now,
    );
  }
  event(
    r,
    c.whip ? "whip" : "strike",
    target ? "A strike connects." : "A strike misses.",
    now,
    { ...a, direction: c.direction },
  );
  confirm(p,target||r.broken.length>brokenBefore?'hit':'miss',now);
}
function advance(r, p, now) {
  const c = p.channel;
  if (!c || now < c.until) return;
  p.channel = null;
  if (c.kind === "damageMachine") {
    const m = machines.find(m => m.id === c.object), o = m && r.machines[m.id];
    if (r.phase !== "hunt" || !active(p) || p.role !== "Killer" || p.carrying ||
        p.hidden || now < p.stunUntil || now < p.timeoutUntil || !o || o.done || o.progress <= 0 ||
        now < (p.damageAt || 0) || now < (o.damageProtectedUntil || 0) ||
        !reach(r,pos(r,p),m,27,now) || pos(r,p).floor !== c.pos.floor ||
        Math.hypot(pos(r,p).x-c.pos.x,pos(r,p).y-c.pos.y)>2) return;
    const before = o.progress;
    o.progress = Math.max(0, before-rules.machineDamage);
    p.damageAt = now+rules.machineDamageCooldown;
    o.damageProtectedUntil = now+rules.machineDamageProtection;
    o.damagedAt = now;
    event(r,"machineDamage",`${m.title} damaged · ${Math.round(before*100)}% → ${Math.round(o.progress*100)}%.`,now,{...m});
    return;
  }
  if (c.kind === "strike") {
    strike(r, p, c, now);
    return;
  }
  if (c.kind === "pickup") {
    const t = r.players.find((q) => q.id === c.target);
    if (t?.status === "downed" && reach(r, pos(r, p), pos(r, t), 28, now)) {
      p.carrying = t.id;
      clear(t);
      t.status = "carried";
      t.carriedBy = p.id;
      t.wiggle = 0;
      t.lastWiggle = now - rules.wiggleInterval;
      r.positions[t.id] = { ...pos(r, p) };
    }
    return;
  }
  if (c.kind === "chain") {
    const t = r.players.find((q) => q.id === p.carrying),
      table = tables.find((t) => t.id === c.object);
    if (t && table && reach(r, pos(r, p), table, 28, now))
      capture(r, p, t, table, now);
    return;
  }
  if (c.kind === "rescue") {
    const t = r.players.find((q) => q.id === c.target);
    if (
      t &&
      ["downed", "captured"].includes(t.status) &&
      reach(r, pos(r, p), pos(r, t), 30, now)
    )
      release(r, t, now, "rescued by " + p.name);
    return;
  }
  if (c.kind === "power") {
    if (r.dark) {
      r.dark = false;
      r.blackoutEndsAt = 0;
      r.blackoutAt = Math.max(r.blackoutAt, now + 20000);
      event(r, "power", "The electrical system is restored.", now);
    }
    return;
  }
  if (["portal", "travel", "arch"].includes(c.kind)) {
    if (
      fits(c.destination.floor, c.destination.x, c.destination.y) &&
      !blockers(r, now).some((w) => intersects(c.destination, w, 5))
    ) {
      Object.assign(pos(r, p), c.destination, { dir: "down" });
      emitSound(r,'hatch',pos(r,p),now);
      p.archAt = now + 1700;
      p.nav = null;
      if (p.carrying) {
        const t = r.players.find((q) => q.id === p.carrying);
        r.positions[t.id] = { ...pos(r, p) };
      }
    }
    return;
  }
  if (c.kind === "escape") {
    if (r.exitsOpen && !(now < p.hulkUntil) && !p.hulkReadyAt) {
      p.status = "escaped";
      p.alive = false;
      p.lightOn = false;
      r.stats.escaped++;
      event(
        r,
        "escape",
        `${p.name} escaped. Their individual victory is secured.`,
        now,
      );
    }
    return;
  }
  if (c.kind === "hide") {
    if (!r.players.some((q) => q.hidden === c.object)) {
      p.hidden = c.object;
      p.hideUntil = now + 10000;
    }
    return;
  }
  if (c.kind === "search") {
    const t = r.players.find((q) => q.hidden === c.object);
    if (t) {
      t.hidden = null;
      t.hideAt = now + 18000;
      t.shieldUntil = now + 600;
    }
    p.attackAt = Math.max(p.attackAt, now + 600);
    return;
  }
  if (c.kind === "drawer") {
    const drawer = (r.drawers || []).find((d) => d.id === c.object);
    const object = drawer && objects.find((o) => o.id === drawer.object);
    if (
      !drawer ||
      drawer.empty ||
      p.keys >= 2 ||
      !canInteract(pos(r, p), object, 24)
    )
      return;
    const a = pos(r, p),
      edge = {
        floor: object.floor,
        x: Math.max(
          object.x * TILE,
          Math.min(a.x, (object.x + object.w) * TILE),
        ),
        y: Math.max(
          object.y * TILE,
          Math.min(a.y, (object.y + object.h) * TILE),
        ),
      };
    if (!clearLine(r, a, edge, now, true)) return;
    const key = r.keys.find((k) => k.drawer === drawer.id);
    if (!key) {
      drawer.empty = true;
      return;
    }
    r.keys = r.keys.filter((k) => k !== key);
    p.keys++;
    drawer.empty = !r.keys.some((k) => k.drawer === drawer.id);
    drawer.openUntil = now + 1600;
    emitSound(r,'drawer',pos(r,p),now);
    notify(p, "Drawer opened · brass key found. Keys " + p.keys + "/2.");
    return;
  }
  if (c.kind === "chest") {
    const chest = r.chests.find((q) => q.id === c.object);
    if (!chest || chest.opened || !p.keys) return;
    chest.opened = true;
    p.keys--;
    r.stats.lootOpened = (r.stats.lootOpened || 0) + 1;
    if (p.role === "Killer") {
      p.whip = Math.min(6, p.whip + 3);
      notify(p, "Whip found · three longer-range attacks. X to lash.");
    } else if (!p.hadLight && random(r) < 0.55) {
      p.hadLight = true;
      p.battery = 20000;
      notify(p, "Flashlight found · twenty seconds total battery. L toggles.");
    } else {
      p.sensors = Math.min(2, p.sensors + 1);
      notify(p, "Motion sensor found · B places it for sixty seconds.");
    }
    return;
  }
}
function drainLight(p, now) {
  if (p.lightOn) {
    p.battery = Math.max(0, p.battery - Math.max(0, now - p.lightLast));
    p.lightLast = now;
    if (!p.battery) p.lightOn = false;
  }
}
function update(r, now, dt) {
  const k = killer(r);
  if (k.timeoutUntil && now >= k.timeoutUntil) {
    k.timeoutUntil = 0;
    r.positions[k.id] = { ...killerSpawn };
    k.archAt = now + 2000;
    event(r, "return", "The hunter returns at the original spawn.", now);
  }
  for (const p of r.players) {
    if (p.hulkReadyAt && now >= p.hulkReadyAt) {
      p.hulkReadyAt = 0;
      if (active(p) && !p.hidden) {
        p.hulkUntil = now + rules.hulk;
        p.hulkStepDistance = 0;p.lastHulkStep = 0;
        event(r,"hulk",`${p.name} has transformed! Hulk is active for twelve seconds.`,now);
      }
    }
    if (p.flashCharges < 2 && p.flashNext && now >= p.flashNext) {
      p.flashCharges++;
      p.flashNext = p.flashCharges < 2 ? now + rules.flashRecharge : 0;
    }
    drainLight(p, now);
    if (p.hidden && now >= p.hideUntil) {
      p.hidden = null;
      p.hideAt = now + 18000;
    }
    advance(r, p, now);
    if (p.status === "downed" && now >= p.downUntil)
      release(r, p, now, "recovered from being left downed");
    if (p.status === "captured") {
      const camp =
        now >= k.timeoutUntil &&
        pos(r, k).floor === pos(r, p).floor &&
        Math.hypot(pos(r, k).x - pos(r, p).x, pos(r, k).y - pos(r, p).y) <=
          105 &&
        clearLine(r, pos(r, k), pos(r, p), now);
      if (camp) {
        p.camp +=
          dt *
          1000 *
          (r.players.some(
            (q) =>
              q !== p &&
              q.role !== "Killer" &&
              active(q) &&
              reach(r, pos(r, k), pos(r, q), 70, now),
          )
            ? 0.35
            : 1);
        p.captureUntil += dt * 1000;
      } else p.camp = Math.max(0, p.camp - dt * 200);
      if (p.camp >= rules.campRelease)
        release(r, p, now, "the hunter camped the table");
      else if (now >= p.captureUntil) eliminate(r, p, now);
    }
    if (p.repairing) {
      const m = machines.find((m) => m.id === p.repairing);
      if (
        now - (p.repairAt || 0) > 1100 ||
        !m ||
        !reach(r, pos(r, p), m, 29, now) ||
        (!active(p) && !ghost(p)) ||
        p.hidden ||
        p.channel ||
        r.machines[m.id].done
      )
        p.repairing = null;
    }
  }
  for (const m of machines) {
    const o = r.machines[m.id];
    if (o.done) continue;
    const workers = r.players.filter(
        (p) => p.repairing === m.id && active(p) && p.role !== "Killer",
      ),
      spirits = r.players.filter((p) => p.repairing === m.id && ghost(p));
    let rate = workers.length
      ? Math.min(2.8, 1 + (workers.length - 1) * 0.65) +
        workers.filter((p) => p.class === "Engineer").length * 0.45
      : 0;
    const g = (Math.min(spirits.length * 0.2, 0.4) * dt) / rules.machineWork,
      ghostGain = Math.max(
        0,
        Math.min(g, rules.ghostMachineCap - o.ghostWork, 0.99 - o.progress),
      );
    o.ghostWork += ghostGain;
    o.progress = Math.min(
      1,
      o.progress + (rate * dt) / rules.machineWork + ghostGain,
    );
    if (o.progress >= 1) {
      o.done = true;
      r.stats.repairs++;
      for (const p of r.players) if (p.repairing === m.id) p.repairing = null;
      event(
        r,
        "machine",
        `${m.title} repaired (${r.stats.repairs}/${r.required}).`,
        now,
      );
      if (r.stats.repairs >= r.required && !r.exitsOpen) {
        r.exitsOpen = true;
        event(
          r,
          "exits",
          "BOTH WESTERN GATES ARE OPEN. Reach either exit to secure your own escape.",
          now,
        );
      }
    }
  }
  r.sensors = r.sensors.filter((s) => s.until > now);
  for (const s of r.sensors)
    if (
      now >= s.alertAt &&
      now - k.lastMove < 200 &&
      now >= k.timeoutUntil &&
      reach(r, s, pos(r, k), 110, now)
    ) {
      s.alertAt = now + 3000;
      event(
        r,
        "sensor",
        "MOTION SENSOR · hunter movement near " + roomAt(s),
        now,
        { sensor: s.id },
      );
    }
  r.rustles = r.rustles.filter((q) => q.until > now);
  r.events = r.events.filter((e) => now - e.at < 10000);
}
export function checkWin(r, now = Date.now()) {
  if (r.phase !== "hunt") return !!r.winner;
  const survivors = r.players.filter((p) => p.role !== "Killer");
  if (now >= r.deadline) {
    for (const p of survivors.filter(remaining)) {
      p.status = "lost";
      p.alive = false;
      clear(p);
    }
    r.reason =
      "Ten minutes expired. Escaped survivors keep their victories; everyone still inside loses.";
  } else if (survivors.some(remaining)) return false;
  else
    r.reason =
      "The hunt is over. Escaped survivors keep their individual victories.";
  r.phase = "ended";
  const n = survivors.filter((p) => p.status === "escaped").length;
  r.winner =
    n === survivors.length ? "survivors" : n === 0 ? "killer" : "mixed";
  for (const p of r.players) clear(p);
  event(r, "end", r.reason, now);
  return true;
}
// Reuse PathFinding.js A* and the existing physical stair flight, adding public garden arches.
function pathStep(r, p, target, dt, now) {
  const a = pos(r, p);
  if (now >= p.ventAt) {
    const portal = r.portals.find(
      (q) =>
        reach(r, a, q, 22, now) &&
        r.portals.some(
          (m) =>
            m.owner === q.owner &&
            m.id !== q.id &&
            ((m.floor === target.floor && a.floor !== target.floor) ||
              (m.floor === a.floor &&
                Math.hypot(m.x - target.x, m.y - target.y) + 80 <
                  Math.hypot(a.x - target.x, a.y - target.y))),
        ),
    );
    if (portal) {
      try {
        act(r, p, { action: "interact", object: portal.id }, now);
      } catch {}
      if (p.channel) return;
    }
  }
  if (a.floor !== target.floor && (a.floor === 2 || target.floor === 2)) {
    const choices = arches.filter((x) => x.floor === a.floor);
    const arch = choices.sort(
      (x, y) =>
        (x.to.floor === target.floor ? 0 : 500) +
        Math.hypot(a.x - x.x, a.y - x.y) -
        ((y.to.floor === target.floor ? 0 : 500) +
          Math.hypot(a.x - y.x, a.y - y.y)),
    )[0];
    if (arch) {

      target = { ...arch };
    }
  }
  const different = a.floor !== target.floor,
    entry = stairLandings[a.floor];
  if (different && a.floor < 2) {
    if (p.stairRoute?.from !== a.floor)
      p.stairRoute = { from: a.floor, reached: false };
    if (onStairs(a) || Math.hypot(a.x - entry.x, a.y - entry.y) < 5)
      p.stairRoute.reached = true;
  } else p.stairRoute = null;
  const approach = different && !p.stairRoute?.reached,
    goal =
      different && a.floor < 2
        ? { floor: a.floor, ...stairLandings[approach ? a.floor : 1 - a.floor] }
        : target,
    key = [
      a.floor,
      goal.x >> 4,
      goal.y >> 4,
      r.broken.join(","),
      blockers(r, now)
        .filter((d) => d.id?.startsWith("door-"))
        .map((d) => d.id)
        .sort()
        .join(","),
    ].join(":");
  if (
    !p.nav ||
    !p.nav.path.length ||
    (p.nav.key !== key && now - p.nav.at > 400)
  ) {
    const grid = new PF.Grid(maps[a.floor]);
    if (
      a.floor < 2 &&
      (approach || (!different && !onStairs(a) && !onStairs(goal)))
    )
      for (let y = 4; y < 9; y++)
        for (let x = 33; x < 35; x++) grid.setWalkableAt(x, y, false);
    for (const b of movementBlocks(r, now).filter((b) => b.floor === a.floor))
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
          if (x >= 0 && y >= 0 && x < W && y < H)
            grid.setWalkableAt(x, y, false);
    grid.setWalkableAt(a.x >> 4, a.y >> 4, true);
    const path = new PF.AStarFinder({ allowDiagonal: false }).findPath(
      a.x >> 4,
      a.y >> 4,
      goal.x >> 4,
      goal.y >> 4,
      grid,
    );
    p.nav = {
      key,
      at: now,
      path: path.map(([x, y]) => ({ x: x * 16 + 8, y: y * 16 + 8 })),
    };
  }
  const next = p.nav.path[0];
  if (next) {
    const dx = next.x - a.x,
      dy = next.y - a.y,
      d = Math.max(Math.abs(dx), Math.abs(dy));
    if (d < 1) p.nav.path.shift();
    else
      movePlayer(
        r,
        p,
        dx,
        dy,
        Math.min(
          dt,
          d /
            (SPEED * movementMultiplier(r,p,now)),
        ),
        now,
      );
  }
}
function bots(r, now, dt) {
  const k = killer(r);
  for (const p of r.players.filter((p) => p.bot || p.autopilot)) {
    const a = pos(r, p),
      cmd = (b) => {
        try {
          act(r, p, b, now);
        } catch {}
      };
    if (["escaped", "lost", "captured"].includes(p.status)) continue;
    if (p.status === "carried") {
      cmd({ action: "wiggle" });
      continue;
    }
    if (p.status === "downed") {
      continue;
    }
    if (ghost(p)) {
      const m = machines
        .filter(
          (m) =>
            !r.machines[m.id].done &&
            r.machines[m.id].ghostWork < rules.ghostMachineCap,
        )
        .sort(
          (x, y) =>
            (x.floor === a.floor ? 0 : 500) +
            Math.hypot(x.x - a.x, x.y - a.y) -
            ((y.floor === a.floor ? 0 : 500) +
              Math.hypot(y.x - a.x, y.y - a.y)),
        )[0];
      if (m) {
        if (m.floor !== a.floor) cmd({ action: "ghostFloor" });
        else if (reach(r, a, m, 26, now))
          cmd({ action: "repair", object: m.id });
        else movePlayer(r, p, m.x - a.x, m.y - a.y, dt, now);
      }
      continue;
    }
    if (
      p.channel ||
      p.hidden ||
      (p.role === "Killer" &&
        (now < r.unlockAt || now < p.stunUntil || now < p.timeoutUntil))
    )
      continue;
    const shut = doors.find(
      (d) =>
        r.manualDoors?.[d.id] &&
        !(r.closedDoors[d.id] > now) &&
        doorReach(r, a, d, now),
    );
    if (shut) {
      cmd({ action: "door", object: shut.id });
      continue;
    }
    const key = (r.drawers || []).find(
      (q) =>
        !q.empty &&
        canInteract(
          a,
          objects.find((o) => o.id === q.object),
          24,
        ),
    );
    if (key && p.keys < 2 && !p.carrying) {
      cmd({ action: "interact", object: key.id });
      continue;
    }
    const loot = r.chests.find((c) => !c.opened && reach(r, a, c, 25, now));
    if (loot && p.keys && !p.carrying) {
      cmd({ action: "interact", object: loot.id });
      continue;
    }
    if (p.role === "Killer") {
      if (p.carrying) {
        const target = tables
          .filter(
            (t) =>
              !r.players.some(
                (q) => q.table === t.id && q.status === "captured",
              ),
          )
          .sort(
            (x, y) =>
              (x.floor === a.floor ? 0 : 900) +
              Math.hypot(a.x - x.x, a.y - x.y) -
              ((y.floor === a.floor ? 0 : 900) +
                Math.hypot(a.x - y.x, a.y - y.y)),
          )[0];
        if (target) {
          if (reach(r, a, target, 25, now))
            cmd({ action: "interact", object: target.id });
          else pathStep(r, p, target, dt, now);
        }
        continue;
      }
      if (now >= r.screamAt) cmd({ action: "power" });
      if (now >= r.blackoutAt && !r.dark) cmd({ action: "blackout" });
      const down = r.players
        .filter(
          (q) =>
            q.role !== "Killer" &&
            q.status === "downed" &&
            !inGrass(pos(r,q)) &&
            see(r, p, pos(r, q), now),
        )
        .sort(
          (x, y) =>
            Math.hypot(a.x - pos(r, x).x, a.y - pos(r, x).y) -
            Math.hypot(a.x - pos(r, y).x, a.y - pos(r, y).y),
        )[0];
      if (down) {
        if (reach(r, a, pos(r, down), 25, now))
          cmd({ action: "pickup", target: down.id });
        else pathStep(r, p, pos(r, down), dt, now);
        continue;
      }
      const targets = r.players
        .filter(
          (q) =>
            q.role !== "Killer" &&
            active(q) &&
            !q.hidden &&
            !inGrass(pos(r,q)) && (now < r.revealUntil || see(r,p,pos(r,q),now)),
        )
        .sort(
          (x, y) =>
            (pos(r, x).floor === a.floor ? 0 : 900) +
            Math.hypot(a.x - pos(r, x).x, a.y - pos(r, x).y) -
            ((pos(r, y).floor === a.floor ? 0 : 900) +
              Math.hypot(a.x - pos(r, y).x, a.y - pos(r, y).y)),
        );
      const target = targets.find((q) => now >= q.hulkUntil);
      if (target) {
        p.memory = { ...pos(r, target), until: now + 3000 };
        const t = pos(r, target),
          direction =
            Math.abs(t.x - a.x) > Math.abs(t.y - a.y)
              ? t.x > a.x
                ? "right"
                : "left"
              : t.y > a.y
                ? "down"
                : "up";
        if (reach(r, a, t, p.whip ? 75 : 30, now) && now >= p.attackAt)
          cmd({ action: p.whip ? "whip" : "attack", direction });
        else pathStep(r, p, t, dt, now);
        continue;
      }
      if (p.channel?.kind === "damageMachine") continue;
      const vulnerable = machines.find(m => !r.machines[m.id].done && r.machines[m.id].progress >= 0.25 &&
        now >= (r.machines[m.id].damageProtectedUntil || 0) && reach(r,a,m,27,now));
      if (vulnerable && now >= (p.damageAt || 0)) {
        cmd({action:"damageMachine",object:vulnerable.id});
        if (p.channel?.kind === "damageMachine") continue;
      }
      if (p.memory && now < p.memory.until) {
        pathStep(r, p, p.memory, dt, now);
        continue;
      }
      const hiding = wardrobes.find((o) => canInteract(a, o, 22));
      if (hiding && now > (p.searchAt || 0)) {
        cmd({ action: "interact", object: hiding.id });
        p.searchAt = now + 10000;
        continue;
      }
      if (!p.patrol || reach(r, a, p.patrol, 20, now) || now > p.patrolUntil) {
        p.patrol = shuffle(r, [
          ...machines,
          ...r.chests.filter((c) => !c.opened),
          ...(r.drawers || []).filter((d) => !d.empty),
        ])[0];
        p.patrolUntil = now + 12000;
      }
      pathStep(r, p, p.patrol, dt, now);
      continue;
    }
    const danger =
      now >= k.timeoutUntil &&
      see(r, p, pos(r, k), now) &&
      reach(r, a, pos(r, k), 105, now);
    if (danger) {
      p.repairing = null;
      p.nav = null;
      if (p.class === "Engineer" && now >= p.powerAt) {
        const d = doors.find(
          (d) => d.floor === a.floor && Math.hypot(d.x - a.x, d.y - a.y) < 65,
        );
        if (d) cmd({ action: "power", door: d.id });
      }
      if (p.class === "Escape Artist" && now >= p.ventAt) {
        const source = passageNodes.find((o) => canInteract(a, o, 24));
        if (source) {
          const dest = passageNodes
            .filter((o) => o.id !== source.id)
            .sort(
              (x, y) =>
                (x.floor === pos(r, k).floor ? 0 : -800) -
                Math.hypot(x.x * 16 - pos(r, k).x, x.y * 16 - pos(r, k).y) -
                ((y.floor === pos(r, k).floor ? 0 : -800) -
                  Math.hypot(y.x * 16 - pos(r, k).x, y.y * 16 - pos(r, k).y)),
            )[0];
          cmd({ action: "travel", object: source.id, destination: dest.id });
          if (p.channel) continue;
        }
      }
      const t = pos(r, k),
        direction =
          Math.abs(t.x - a.x) > Math.abs(t.y - a.y)
            ? t.x > a.x
              ? "right"
              : "left"
            : t.y > a.y
              ? "down"
              : "up";
      if (p.class === "Hulk" && !p.hulkUsed) cmd({ action: "power" });
      if (now < p.hulkUntil) {
        if (reach(r, a, t, 34, now) && now >= p.attackAt)
          cmd({ action: "attack", direction });
        else pathStep(r, p, t, dt, now);
        continue;
      }
      if (p.class === "Photographer" && p.flashCharges && now >= p.powerAt)
        cmd({ action: "power", direction });
      if (p.class === "Escape Artist" && now >= p.powerAt)
        cmd({ action: "power" });
      const next = [
        [0, 1],
        [1, 0],
        [-1, 0],
        [0, -1],
      ]
        .map(([dx, dy]) => ({
          dx,
          dy,
          floor: a.floor,
          x: a.x + dx * 16,
          y: a.y + dy * 16,
        }))
        .filter(
          (q) =>
            fits(q.floor, q.x, q.y) &&
            !blockers(r, now).some((w) => intersects(q, w, 4)),
        )
        .sort(
          (x, y) =>
            Math.hypot(y.x - t.x, y.y - t.y) - Math.hypot(x.x - t.x, x.y - t.y),
        )[0];
      if (next) movePlayer(r, p, next.dx, next.dy, dt, now);
      continue;
    }
    if (r.dark && p.battery > 0 && !p.lightOn) cmd({ action: "light" });
    if (p.sensors && random(r) < 0.001) cmd({ action: "sensor" });
    if (
      p.class === "Magician" &&
      p.portalsPlaced < 2 &&
      now > (p.portalTry || 0)
    ) {
      cmd({ action: "power" });
      p.portalTry = now + 12000;
    }
    const nearbyKey = (r.drawers || []).find(
      (q) =>
        !q.empty &&
        canInteract(
          a,
          objects.find((o) => o.id === q.object),
          24,
        ),
    );
    if (nearbyKey && p.keys < 2) {
      cmd({ action: "interact", object: nearbyKey.id });
      continue;
    }
    const chest = r.chests.find((c) => !c.opened && reach(r, a, c, 25, now));
    if (chest && p.keys) {
      cmd({ action: "interact", object: chest.id });
      continue;
    }
    const rescue = r.players
      .filter(
        (q) =>
          q !== p &&
          ["captured", "downed"].includes(q.status) &&
          !r.players.some(
            (s) => s.channel?.kind === "rescue" && s.channel.target === q.id,
          ),
      )
      .sort(
        (x, y) =>
          (pos(r, x).floor === a.floor ? 0 : 1000) +
          Math.hypot(a.x - pos(r, x).x, a.y - pos(r, x).y) -
          ((pos(r, y).floor === a.floor ? 0 : 1000) +
            Math.hypot(a.x - pos(r, y).x, a.y - pos(r, y).y)),
      )[0];
    if (rescue) {
      if (reach(r, a, pos(r, rescue), 27, now))
        cmd({ action: "rescue", target: rescue.id });
      else pathStep(r, p, pos(r, rescue), dt, now);
      continue;
    }
    if (r.dark && p.class === "Engineer") {
      const panel = panels
        .filter((q) => q.floor === a.floor)
        .sort(
          (x, y) =>
            Math.hypot(x.x - a.x, x.y - a.y) - Math.hypot(y.x - a.x, y.y - a.y),
        )[0];
      if (panel && reach(r, a, panel, 26, now)) {
        cmd({ action: "interact", object: panel.id });
        continue;
      }
    }
    if (r.exitsOpen) {
      const gate = [...exitDoors].sort(
        (x, y) =>
          Math.hypot(a.x - x.x, a.y - x.y) - Math.hypot(a.x - y.x, a.y - y.y),
      )[0];
      if (reach(r, a, gate, 25, now))
        cmd({ action: "interact", object: gate.id });
      else pathStep(r, p, gate, dt, now);
      continue;
    }
    if (p.repairing) {
      cmd({ action: "repair", object: p.repairing });
      continue;
    }
    if (!p.goal || r.machines[p.goal]?.done) {
      p.goal = machines
        .filter((m) => !r.machines[m.id].done)
        .sort(
          (x, y) =>
            (x.floor === a.floor ? 0 : 500) +
            Math.hypot(a.x - x.x, a.y - x.y) +
            (p.preference[x.id] || 0) +
            r.players.filter((q) => q.repairing === x.id).length * 90 -
            ((y.floor === a.floor ? 0 : 500) +
              Math.hypot(a.x - y.x, a.y - y.y) +
              (p.preference[y.id] || 0) +
              r.players.filter((q) => q.repairing === y.id).length * 90),
        )[0]?.id;
    }
    const m = machines.find((m) => m.id === p.goal);
    if (m) {
      if (reach(r, a, m, 26, now)) cmd({ action: "repair", object: m.id });
      else pathStep(r, p, m.point, dt, now);
    }
  }
}
export function tick(r, now = Date.now(), dt = 0.05) {
  for(const [id,until]of Object.entries(r.pendingDoors||{})){
    const d=doors.find(d=>d.id===id);
    if(!d||until<=now||r.phase!=='hunt'){delete r.pendingDoors[id];continue;}
    if(!r.players.some(q=>!['eliminated','escaped','lost'].includes(q.status)&&intersects(pos(r,q),d,6))){
      r.manualDoors ||= {};r.doorAt ||= {};r.manualDoors[id]=true;r.doorAt[id]=now+200;delete r.pendingDoors[id];emitSound(r,doorSound(d),d,now);
    }
  }
  const host = r.players.find((p) => p.id === r.host);
  if (!host?.connected && now - (host?.seen || 0) > 15000) {
    const next = r.players.find((p) => p.connected && !p.bot);
    if (next) r.host = next.id;
  }
  if (r.phase !== "hunt") return;
  if (hunterPressure(r) && !r.pressureAnnounced) {
    r.pressureAnnounced = true;
    event(
      r,
      "pressure",
      "FINAL HUNT · two repairs or fewer remain. The hunter is faster and strikes farther.",
      now,
    );
  }
  for (const p of r.players)
    if (
      p.watching &&
      (!active(p) ||
        p.hidden ||
        p.carrying ||
        !reach(r, pos(r, p), securityTerminal, 29, now))
    )
      p.watching = false;
  if (r.dark && r.blackoutEndsAt && now >= r.blackoutEndsAt) {
    r.dark = false;
    r.blackoutEndsAt = 0;
    r.blackoutAt = Math.max(r.blackoutAt, now + 20000);
    for (const q of r.players)
      if (q.channel?.kind === "power") q.channel = null;
    event(
      r,
      "power",
      "Backup power restored the lights after 40 seconds.",
      now,
    );
  }
  dt = Math.min(0.1, Math.max(0, dt));
  for (const p of r.players)
    p.autopilot = !p.bot && !p.connected && now - p.seen > 10000;
  update(r, now, dt);
  bots(r, now, dt);
  checkWin(r, now);
}
export function view(r, p, now = Date.now()) {
  const a = pos(r, p),
    k =
      r.phase === "lobby"
        ? r.players.find((q) => q.id === r.requestedKiller) ||
          r.players.find((q) => q.bot) ||
          r.players[0]
        : killer(r),
    hunter = p.role === "Killer",
    scream = hunter && r.phase === "hunt" && now < r.revealUntil,
    observe = (q) => !(hunter && now < p.timeoutUntil) && see(r, p, q, now),
    hulkGPS = r.players
      .filter((q) => now < q.hulkUntil && active(q) && !(hunter && inGrass(pos(r,q))))
      .map((q) => ({
        id: q.id,
        name: q.name,
        until: q.hulkUntil,
        ...pos(r, q),
      }));
  const avatars = r.players
    .filter(
      (q) =>
        q === p ||
        active(q) ||
        ["downed", "carried", "captured"].includes(q.status),
    )
    .filter(
      (q) =>
        q === p ||
        (!q.hidden &&
          !(q.role === "Killer" && now < q.timeoutUntil) &&
          observe(pos(r, q)) &&
          (!inGrass(pos(r,q)) || (q.role!=="Killer" && p.role!=="Killer"))),
    )
    .filter((q) => pos(r, q).floor === a.floor)
    .map((q) => ({
      id: q.id,
      name: q.name,
      index: r.players.indexOf(q),
      role: q.role,
      class: q.class,
      status: q.status,
      ...pos(r, q),
      shieldUntil: q.shieldUntil,
      stunUntil: q.stunUntil,
      hulkUntil: q.hulkUntil,
      hulkReadyAt: q.hulkReadyAt || 0,
      carrying: !!q.carrying,
      repairing: q.repairing,
      resistUntil: q.resistUntil,
      travelling: q.channel&&['travel','portal'].includes(q.channel.kind)?{started:q.channel.started,until:q.channel.until}:null,
      grass: inGrass(pos(r,q)),
      captures: q.captures,
      assist: rescueAssist(r,q,now),
      strike:
        q.channel?.kind === "strike"
          ? {
              direction: q.channel.direction,
              whip: q.channel.whip,
              until: q.channel.until,
              started: q.channel.started,
              range: q.channel.whip ? 88 : q.role==='Killer'&&hunterPressure(r) ? rules.pressureRange : 36,
            }
          : null,
    }));
  const result = {
    mode: "hunt",
    code: r.code,
    host: r.host,
    speed: r.speed || 1,
    round: r.round,
    results: r.phase==='ended' ? {...r.stats} : null,
    phase: r.phase,
    serverNow: now,
    phaseAt: r.phaseAt,
    unlockAt: r.unlockAt || 0,
    deadline: r.deadline || 0,
    winner: r.winner,
    reason: r.reason || "",
    position: { ...a },
    roomName: roomAt(a),
    dark: r.dark,
    blackoutEndsAt: r.dark ? r.blackoutEndsAt || 0 : 0,
    // Live-map disclosure is explicit and separate from world avatar visibility.
    // Survivors see living teammates (including hiding teammates) only in daylight; never the hunter.
    // The hunter receives only their own map pin, even with SCREAM active.
    liveMap: r.players
      .filter(
        (q) =>
          q === p ||
          (!hunter &&
            q.role !== "Killer" &&
            !r.dark &&
            r.phase === "hunt" &&
            ["active", "downed", "carried", "captured"].includes(q.status)),
      )
      .map((q) => ({
        id: q.id,
        name: q.name,
        role: q.role,
        status: q.status,
        ...pos(r, q),
      })),
    killer: k ? { id: k.id, name: k.name, index: r.players.indexOf(k) } : null,
    avatars,
    revealUntil: scream ? r.revealUntil : 0,
    reveals: scream
      ? r.players
          .filter((q) => q.role !== "Killer" && remaining(q) && !inGrass(pos(r,q)))
          .map((q) => ({
            id: q.id,
            name: q.name,
            status: q.status,
            ...pos(r, q),
          }))
      : [],
    sounds: ghost(p) ? [] : audibleSounds(r,a,now,(a,b)=>clearLine(r,a,b,now)),
    hulkGPS,
    hulkFootstep: r.phase === "hunt" && hulkGPS.length && now-(r.hulkFootstep?.at || 0)<500 ? r.hulkFootstep : null,
    machines: machines.map((m) => ({
      ...m,
      progress: (!hunter || observe(m) ? r.machines[m.id]?.progress : 0) || 0,
      done: !!r.machines[m.id]?.done,
      damagedAt: (!hunter || observe(m)) ? r.machines[m.id]?.damagedAt || 0 : 0,
      damaging: observe(m) && r.players.some(q => q.channel?.kind === "damageMachine" && q.channel.object === m.id),
      damageProtectedUntil: (!hunter || observe(m)) ? r.machines[m.id]?.damageProtectedUntil || 0 : 0,
      workers:
        !hunter || observe(m)
          ? r.players.filter((q) => q.repairing === m.id && active(q)).length
          : 0,
      ghostWork: r.machines[m.id]?.ghostWork || 0,
    })),
    completed: Object.values(r.machines).filter((m) => m.done).length,
    required: r.required || Math.min(8, Math.max(3, r.players.length)),
    exitsOpen: !!r.exitsOpen,
    exits: exitDoors,
    escaped: r.players.filter((p) => p.status === "escaped").length,
    tables: tables.map((t) => ({
      ...t,
      occupied: r.players.some(
        (q) => q.table === t.id && q.status === "captured",
      ),
    })),
    closedDoors: doors
      .filter((d) => r.manualDoors?.[d.id] || r.closedDoors[d.id] > now)
      .map((d) => ({
        id: d.id,
        manual: !!r.manualDoors?.[d.id],
        until: r.closedDoors[d.id] || 0,
      })),
    pendingDoors:Object.keys(r.pendingDoors||{}),
    pressure: hunterPressure(r),
    security:
      p.watching &&
      active(p) &&
      !p.hidden &&
      !p.carrying &&
      reach(r, a, securityTerminal, 29, now)
        ? {
            offline: r.dark,
            feeds: r.dark
              ? []
              : cameraStations.map((c) => ({
                  ...c,
                  chests: r.chests.filter(
                    (q) =>
                      q.floor === c.floor &&
                      Math.abs(q.x - c.x) <= c.w / 2 &&
                      Math.abs(q.y - c.y) <= c.h / 2 &&
                      clearLine(r, c, q, now),
                  ),
                  avatars: r.players
                    .filter(
                      (q) =>
                        !["eliminated", "escaped", "lost"].includes(q.status) &&
                        !q.hidden &&
                        !(q.role === "Killer" && now < q.timeoutUntil) &&
                        pos(r, q).floor === c.floor &&
                        Math.abs(pos(r, q).x - c.x) <= c.w / 2 &&
                        Math.abs(pos(r, q).y - c.y) <= c.h / 2 &&
                        clearLine(r, c, pos(r, q), now) &&
                        (!inGrass(pos(r,q)) || (!hunter && q.role!=="Killer")),
                    )
                    .map((q) => ({
                      id: q.id,
                      name: q.name,
                      index: r.players.indexOf(q),
                      grass: inGrass(pos(r,q)),
                      class: q.class,
                      role: q.role,
                      status: q.status,
                      dir: pos(r, q).dir,
                      moving: now - q.lastMove < 180,
                      ...pos(r, q),
                    })),
                })),
          }
        : null,
    broken: r.broken,
    portals: r.portals,
    keys: [],
    drawers: (r.drawers || [])
      .filter(
        (d) =>
          observe(d) ||
          canInteract(
            a,
            objects.find((o) => o.id === d.object),
            24,
          ),
      )
      .map((d) => ({
        id: d.id,
        object: d.object,
        floor: d.floor,
        x: d.x,
        y: d.y,
        empty: d.empty,
        openUntil: d.openUntil,
      })),
    chests: r.chests.filter(observe),
    sensors: r.sensors
      .filter((s) => (hunter ? observe(s) : true))
      .map((s) => ({ ...s, triggered: s.alertAt > now })),
    rustles: r.rustles.filter((q) => q.until > now && observe(q)),
    rescues: !hunter
      ? r.players
          .filter((q) => ["downed", "captured", "carried"].includes(q.status))
          .map((q) => ({
            id: q.id,
            name: q.name,
            status: q.status,
            ...pos(r, q),
            until: q.status === "captured" ? q.captureUntil : q.downUntil,
          }))
      : [],
    events: r.events.filter(
      (e) =>
        (!["flash", "strike", "whip"].includes(e.type) || observe(e)) &&
        (e.type !== "sensor" || !hunter),
    ),
    players: r.players.map((q) => ({
      id: q.id,
      name: q.name,
      bot: q.bot || q.autopilot,
      online: q.connected,
      role:
        r.phase === "lobby" ? (k?.id === q.id ? "Killer" : "Survivor") : q.role,
      class: r.phase === "lobby" ? null : q.class,
      status: q.status,
      captures: q.captures,
      victory: q.status === "escaped",
    })),
    danger:
      !hunter && k && now >= k.timeoutUntil && a.floor === pos(r, k).floor
        ? Math.max(
            0,
            Math.min(
              3,
              4 -
                Math.floor(
                  Math.hypot(a.x - pos(r, k).x, a.y - pos(r, k).y) / 45,
                ),
            ),
          )
        : 0,
    me: {
      id: p.id,
      name: p.name,
      index: r.players.indexOf(p),
      role: r.phase === "lobby" ? "Survivor" : p.role,
      feedback:p.feedback&&now-p.feedback.at<1200?{...p.feedback}:null,
      class: p.class,
      status: p.status,
      captures: p.captures,
      hidden: !!p.hidden,
      flashCharges: p.flashCharges,
      flashNext: p.flashNext,
      powerAt: hunter ? r.screamAt || 0 : p.powerAt,
      blackoutAt: r.blackoutAt,
      attackAt: p.attackAt,
      ventAt: p.ventAt,
      hulkUsed: p.hulkUsed,
      hulkUntil: p.hulkUntil,
      hulkReadyAt: p.hulkReadyAt || 0,
      portalsPlaced: p.portalsPlaced,
      shieldUntil: p.shieldUntil,
      stunUntil: p.stunUntil,
      resistUntil: p.resistUntil,
      timeoutUntil: p.timeoutUntil || 0,
      keys: p.keys,
      sensors: p.sensors,
      whip: p.whip,
      battery: p.battery,
      lightOn: p.lightOn,
      wiggle: p.wiggle,
      wiggleReadyAt:p.lastWiggle+rules.wiggleInterval,
      wiggleGoal: rules.wiggleTaps,
      watching: !!p.watching,
      carrying: p.carrying,
      captive:
        hunter && p.carrying
          ? (() => {
              const q = r.players.find(
                (q) =>
                  q.id === p.carrying &&
                  q.carriedBy === p.id &&
                  q.status === "carried",
              );
              return q
                ? {
                    id: q.id,
                    name: q.name,
                    wiggle: q.wiggle,
                    goal: rules.wiggleTaps,
                  }
                : null;
            })()
          : null,
      carriedBy: p.carriedBy,
      repairing: p.repairing,
      damageAt: p.damageAt || 0,
      camp: p.camp,
      captureUntil: p.captureUntil,
      downUntil: p.downUntil,
      assist: rescueAssist(r,p,now),
      channel: p.channel
        ? {
            kind: p.channel.kind,
            started: p.channel.started,
            until: p.channel.until,
          }
        : null,
      death: p.death && now - p.death.at < 5000 ? p.death : null,
    },
    toast: p.toast || null,
  };
  p.toast = null;
  return result;
}
