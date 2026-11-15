import Phaser from "phaser";
import {paintFocus} from './interaction-focus.js';
import {SpatialAudio} from './spatial-audio.js';
import {drawChaseFeedback} from './chase-presentation.js';
import {updateMatchAtmosphere,resultsSummary} from './match-atmosphere.js';
import {updateLootLabels} from './loot-readability.js';
import {updateHuntDetails} from './propnight-details.js';
const spatialAudio=new SpatialAudio();
import { collectFeedback, paintFeedback, feedbackScale, feedbackAngle } from "./hunt-feedback.js";
let feedbackEffects = [];
const reducedFeedback = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
import { canvasGraphics as cameraGraphics } from "./canvas-graphics.js";
import { avatarTexture, classLabel } from "./avatar-outfits.js";
import { drawRadar, radarStatus } from "./hunt-radar.js";
let atlasFloor = null;
let lastHulkFootstep = 0, lastHulkSiren = 0;
import { io } from "socket.io-client";
import { setLpcFurniture } from "./lpc-furniture.js";
import { setLpcSurfaces } from "./lpc-surfaces.js";
import { ART_SCALE, mansion, people, roomThemes } from "./hunt-art.js";
import { setFurnitureAtlas } from "./sprite-furniture.js";
import { visibleWallFaces } from "./hunt-walls.js";
import {
  objects,
  W,
  H,
  TILE,
  canReach,
  canInteract,
  cardinal,
  visibilityPolygon,
  floorBounds,
  onStairs,
  wardrobes,
  passageNodes,
  rooms,
  passages,
  CLASSES,
  machines,
  panels,
  nearDoor,
  securityTerminal,
  cameraStations,
  doors,
  breakWalls,
  arches,
  areaNames,
  huntRadius,
  huntRules as rules,
  servicePassages,
  passageDestinations,
} from "../hunt-world.mjs";
import {
  electrical,
  nearestBreaker,
  nextTurn,
  abilityGuide,
} from "./hunt-guidance.js";
import { routeTo } from "./hunt-navigation.js";
import { drawHuntProps } from "./hunt-props.js";
import { showDeathAnimation, deathAnimationActive } from "./death-scene.js";
import "./style.css";
import "./social.css";
import "./handheld.css";
import "./death-scene.css";
import "./survival.css";
import "./hunt.css";
import "./illustrated-hunt.css";
import "./manor-home.css";
import {homeMarkup, GAME_NAME} from "./manor-home.js";
document.title = GAME_NAME;
const $ = (s) => document.querySelector(s),
  app = $("#app"),
  socket = io(),
  seatKey = "haveli-hunt-seat";
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const html = (e, s) => {
  if (e && e.innerHTML !== s) e.innerHTML = s;
};
let state,
  scene,
  game,
  panel = "",
  panelSignature = "",
  keys = {},
  touch = { x: 0, y: 0 },
  axis = "y",
  tracked = null,
  localPassage = null,
  daylightTrack = null,
  wasDark = false,
  path = [],
  navKey = "",
  lastEvent = 0,
  packetAt = 0,
  lastDeath = "",
  aim = "down",
  sound = true,
  audio = null,
  noticeTimer,
  repairHeld = null,
  lastRepair = 0;
const ghost = () => state?.me.status === "eliminated",
  now = () => (state ? state.serverNow + performance.now() - packetAt : 0),
  revealActive = () => state?.me.role === "Killer" && state.revealUntil > now(),
  cooldown = (t) => Math.max(0, Math.ceil((t - now()) / 1000));
const info = {
  Photographer: [
    "CAMERA FLASH",
    "Face the hunter or aim with your mouse. F flashes along a clear cone. Two charges replenish. The hunter resists repeat stuns for eight seconds.",
  ],
  Magician: [
    "TWO PERMANENT PORTALS",
    "F places one portal on open floor. Exactly two; neither can move. Once paired, EVERYONE can use them with E, including the hunter.",
  ],
  "Escape Artist": [
    "DASH & PASSAGES",
    "F dashes in your walking direction. E at a grille opens the passage network. Walls stop dashes.",
  ],
  Engineer: [
    "REPAIR & REMOTE DOORS",
    "Repair 45% faster. F opens remote door controls: choose any eligible door to close for exactly one second. 25-second cooldown.",
  ],
  Hulk: [
    "INJECTION + LIVE VITALS",
    "V opens live vitals anytime with no cooldown, including blackouts. F starts a three-second struggling transformation, then grants twelve full seconds as Hulk. You cannot move or attack during the wind-up. Invulnerable, 5% slower than normal survivors, Q attacks the hunter or breaks marked garden screens. Your GPS is visible to the hunter outside tall grass. A defeated hunter loses loot and spends ten seconds in darkness before respawning. One use; no after-effects.",
  ],
};
function toast(t) {
  const e = $("#hunt-toast");
  if (!e) return;
  e.textContent = t;
  e.hidden = false;
  if (!reducedFeedback()) e.animate?.([{opacity:0.3},{opacity:1}],{duration:140});
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => (e.hidden = true), 3000);
}
function unlockAudio() {
  if (!sound) return;
  try {
    audio ??= new AudioContext();
    audio.resume();
  } catch {}
}
function tone(kind) {
  if (!sound || !audio) return;
  const o = audio.createOscillator(),
    g = audio.createGain(),
    t = audio.currentTime;
  o.type = kind === "scream" ? "sawtooth" : "triangle";
  o.frequency.setValueAtTime(kind === "scream" ? 180 : 620, t);
  o.frequency.exponentialRampToValueAtTime(
    kind === "scream" ? 45 : 820,
    t + 0.7,
  );
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  o.connect(g);
  g.connect(audio.destination);
  o.start(t);
  o.stop(t + 0.9);
}
function hulkSound(footstep) {
  if (!sound || !audio || audio.state !== "running") return;
  const o=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;
  o.type=footstep?"triangle":"sine";
  o.frequency.setValueAtTime(footstep?72:380,t);
  if(footstep)o.frequency.exponentialRampToValueAtTime(30,t+.15);
  else {o.frequency.linearRampToValueAtTime(600,t+.32);o.frequency.linearRampToValueAtTime(380,t+.7);}
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(footstep ? 0.08 : 0.025,t+.02);
  gain.gain.exponentialRampToValueAtTime(.0001,t+(footstep ? 0.18 : 0.75));
  o.connect(gain);gain.connect(audio.destination);o.start(t);o.stop(t+(footstep ? 0.2 : 0.8));
}
function command(action, data = {}) {
  return new Promise((resolve) =>
    socket.timeout(5000).emit("command", { action, ...data }, (err, r) => {
      if (err) {
        toast("Connection interrupted.");
        return resolve(false);
      }
      if (r?.error) {
        toast(r.error);
        return resolve(false);
      }
      if (r?.token)
        sessionStorage.setItem(
          seatKey,
          JSON.stringify({ code: r.code, token: r.token }),
        );
      resolve(true);
    }),
  );
}
function entrance() {
  app.innerHTML = homeMarkup(!!sessionStorage.getItem(seatKey));
  $("#hunt-host").onsubmit = (e) => {
    e.preventDefault();
    unlockAudio();
    command("create", { name: $("#hunt-name").value });
  };
  $("#hunt-join").onsubmit = (e) => {
    e.preventDefault();
    if (!$("#hunt-name").value.trim()) return toast("Enter your name first.");
    unlockAudio();
    command("join", {
      name: $("#hunt-name").value,
      code: $("#hunt-code").value,
    });
  };
  $("#hunt-resume").onclick = () => {
    unlockAudio();
    command("resume", JSON.parse(sessionStorage.getItem(seatKey)));
  };
  const c = new URLSearchParams(location.search).get("room");
  if (c) $("#hunt-code").value = c;
}
function shell() {
  app.innerHTML = `<div class="hunt-app palace-app objectives-folded"><header class="hunt-header"><a href="/" class="hunt-brand"><b class="manor-hud-mark" aria-hidden="true">M</b><span>MIDNIGHT MANOR<small>REPAIR · RESCUE · ESCAPE</small></span></a><div class="hunter-public" id="hunter-public"></div><div class="hunt-room"><b id="hunt-room"></b><button id="copy-hunt" aria-label="Copy invite">↗</button></div><span id="hunt-connection">● Connected</span><button id="hunt-sound" aria-label="Toggle sound">Sound on</button><button data-panel="help" aria-label="How to play">?</button></header><div class="hunt-status"><span id="hunt-goal"></span><div class="hunt-progress"><i id="hunt-progress"></i></div><b id="hunt-evac"></b><time id="hunt-clock"></time></div><main class="hunt-stage"><div id="hunt-world" tabindex="0" aria-label="Midnight Manor. Arrows move, E interacts, F ability, Q strike."></div><button id="fold-objectives" class="hunt-task-tab" aria-expanded="false">Machines ▾</button><div class="hunt-location" id="hunt-location"></div><span id="hunt-hulk-timer" hidden></span><span id="hunt-pressure" hidden>FINAL HUNT · hunter faster + longer reach</span><span id="hunt-dark" hidden>BLACKOUT</span><div id="hunt-danger" class="hunt-danger"></div><aside id="hunt-objectives"></aside><div id="hunt-notice" hidden></div><div id="hunt-channel" hidden></div><div id="hunt-carry-meter" hidden aria-label="Carried survivor wiggle progress"></div><button id="hunt-track" aria-label="Track a machine"></button><div id="hunt-context"></div><button id="hunt-radar" aria-label="Open full map"><span id="hunt-radar-status"></span><canvas id="hunt-radar-canvas" width="600" height="400" aria-label="Live nearby player minimap"></canvas><small>YOU ▲ · PLAYERS ● · T CAPTURE · K DRAWERS · C CHEST · D COURTYARD</small></button><aside id="hunt-ability-card" aria-label="Your power"></aside><div id="hunt-route-hint" aria-live="polite"></div><div class="hunt-actions">${[
    ["use", "E", "Use"],
    ["power", "F", "Ability"],
    ["attack", "Q", "Strike"],
    ["blackout", "R", "Cut power"],
    ["item", "L", "Light"],
    ["sensor", "B", "Sensor"],
    ["whip", "X", "Whip"],
    ["ghost-floor", "G", "Other area"],
  ]
    .map(
      ([id, k, label]) =>
        `<button id="hunt-${id}" data-key="${k}">${label}</button>`,
    )
    .join(
      "",
    )}</div><div class="hunt-pad"><button data-move="up" aria-label="Move up">▲</button><div><button data-move="left" aria-label="Move left">◀</button><button data-move="down" aria-label="Move down">▼</button><button data-move="right" aria-label="Move right">▶</button></div></div><div id="scream-map" hidden></div><div id="hunter-timeout" hidden><b>THE HUNTER IS DEFEATED</b><span></span><small>Returning to the original spawn</small></div></main><nav class="hunt-toolbar"><span id="hunt-self"></span><button data-panel="objectives">Machines</button><button data-panel="map">Map · M</button><button id="hunt-vitals" data-panel="vitals" hidden>Vitals · V</button><button data-panel="team">Players</button><button data-panel="ability">My ability</button><span id="hunt-inventory"></span></nav></div><div id="hunt-drawer" hidden></div><div id="hunt-toast" hidden></div><div id="hunt-disconnected" hidden>Connection lost. Reconnecting…</div><div id="hunt-feedback-screen" aria-hidden="true"></div><div id="hulk-alarm" hidden aria-label="Hulk transformation alarm"><b>⚠ HULK IS LOOSE</b></div>`;
  $("#copy-hunt").onclick = async () => {
    const link = location.origin + "/?room=" + state.code;
    try {
      await navigator.clipboard.writeText(link);
      toast("Invite copied.");
    } catch {
      toast(link);
    }
  };
  $("#hunt-sound").onclick = () => {
    sound = !sound;
    $("#hunt-sound").textContent = sound ? "Sound on" : "Sound off";
    unlockAudio();
  };
  document
    .querySelectorAll("[data-panel]")
    .forEach((b) => (b.onclick = () => openPanel(b.dataset.panel)));
  $("#fold-objectives").onclick = () => {
    const f = $(".hunt-app").classList.toggle("objectives-folded");
    $("#fold-objectives").setAttribute("aria-expanded", String(!f));
  };
  $("#hunt-use").onpointerdown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    use(true);
  };
  $("#hunt-use").onpointerup = $("#hunt-use").onpointercancel = stopRepair;
  $("#hunt-use").onclick = (e) => {
    if (!e.detail) use(false);
  };
  $("#hunt-power").onclick = power;
  $("#hunt-attack").onclick = () => command("attack", { direction: aim });
  $("#hunt-blackout").onclick = () => command("blackout");
  $("#hunt-whip").onclick = () => command("whip", { direction: aim });
  $("#hunt-item").onclick = () => command("light");
  $("#hunt-sensor").onclick = () => command("sensor");
  $("#hunt-ghost-floor").onclick = () => command("ghostFloor");
  $("#hunt-track").onclick = () => openPanel("objectives");
  document.querySelectorAll("[data-move]").forEach((b) => {
    b.onpointerdown = (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      stopRepair();
      touch = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 },
      }[b.dataset.move];
      aim = b.dataset.move;
      sendInput();
    };
    b.onpointerup = b.onpointercancel = () => {
      touch = { x: 0, y: 0 };
      sendInput();
    };
  });
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "hunt-world",
    backgroundColor: "#17212b",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoRound: true,
      autoCenter: matchMedia("(max-width:700px)").matches
        ? Phaser.Scale.CENTER_HORIZONTALLY
        : Phaser.Scale.CENTER_BOTH,
      width: matchMedia("(max-width:700px)").matches ? 320 : 480,
      height: matchMedia("(max-width:700px)").matches ? 560 : 320,
    },
    scene: HuntScene,
    audio: { noAudio: true },
    render: { antialias: false },
  });
  // Resize the logical viewport too, so rotating a phone never leaves a tiny
  // landscape game floating in a tall empty canvas.
  const viewport = matchMedia("(max-width:700px)");
  viewport.onchange = () => {
    game.scale.autoCenter = viewport.matches ? Phaser.Scale.CENTER_HORIZONTALLY : Phaser.Scale.CENTER_BOTH;
    game.scale.setGameSize(viewport.matches ? 320 : 480, viewport.matches ? 560 : 320);
  };
}
function doorAction(d){return {action:"door",object:d.id,label:(state.pendingDoors||[]).includes(d.id)?"Keep door open":state.closedDoors.some(q=>q.id===d.id)?"Open door":"Close door"};}
function context() {
  if (!state) return;
  const p = state.me,
    a = state.position;
  if (p.status === "carried")
    return {
      action: "wiggle",
      label: "Wiggle · " + p.wiggle + "/" + p.wiggleGoal,
    };
  if (p.hidden) return { action: "leave", label: "Leave wardrobe" };
  if (p.status !== "active" && !ghost()) return;
  if (ghost()) {
    const m = state.machines.find((m) => !m.done && canReach(a, m, 27));
    return m
      ? { action: "repair", object: m.id, label: "Spirit repair · hold E" }
      : null;
  }
  const nearbyDoor=doors.filter(d=>nearDoor(a,d)).sort((x,y)=>Math.hypot(Math.max(0,Math.abs(a.x-x.x)-x.w/2),Math.max(0,Math.abs(a.y-x.y)-x.h/2))-Math.hypot(Math.max(0,Math.abs(a.x-y.x)-y.w/2),Math.max(0,Math.abs(a.y-y.y)-y.h/2)))[0];
  if(nearbyDoor&&Math.abs(a.x-nearbyDoor.x)<nearbyDoor.w/2+8&&Math.abs(a.y-nearbyDoor.y)<nearbyDoor.h/2+8)return doorAction(nearbyDoor);
  if (p.role === "Killer") {
    if (p.carrying) {
      const t = state.tables.find((t) => !t.occupied && canReach(a, t, 26));
      if (t)
        return {
          action: "interact",
          object: t.id,
          label: "Chain at table · 1.1s",
        };
      const portal = state.portals.find(
        (q) =>
          canReach(a, q, 22) &&
          state.portals.filter((m) => m.owner === q.owner).length === 2,
      );
      if (portal)
        return {
          action: "interact",
          object: portal.id,
          label: "Carry through portal",
        };
      return {action:"drop",label:"Put survivor down"};
    }
    const t = state.avatars.find(
      (q) => q.status === "downed" && canReach(a, q, 25),
    );
    if (t) return { action: "pickup", target: t.id, label: "Carry survivor" };
    const s = state.sensors.find((q) => canReach(a, q, 22));
    if (s) return { action: "interact", object: s.id, label: "Destroy sensor" };
    const m = state.machines.find(m => !m.done && m.progress > 0 && canReach(a,m,27));
    if (m) {
      const wait = Math.max(cooldown(p.damageAt),cooldown(m.damageProtectedUntil));
      return wait ? {action:"damageInfo",label:`Damage unavailable · ${wait}s`} :
        {action:"damageMachine",object:m.id,label:`Damage machine · −40% · stay still 2s`};
    }
  } else {
    const t = state.rescues.find(
      (q) =>
        q.id !== p.id &&
        ["downed", "captured"].includes(q.status) &&
        canReach(a, q, 28),
    );
    if (t) return { action: "rescue", target: t.id, label: "Rescue " + t.name };
    const e = state.exitsOpen && state.exits.find((e) => canReach(a, e, 26));
    if (e && now() < p.hulkUntil)
      return {action:"escapeInfo",label:`Return to Scientist form to escape · ${Math.ceil((p.hulkUntil-now())/1000)}s`};
    if (e)
      return {
        action: "interact",
        object: e.id,
        label: "Escape · stay still 1.8s",
      };
    const panel = state.dark && panels.find((q) => canReach(a, q, 26));
    if (panel)
      return {
        action: "interact",
        object: panel.id,
        label:
          "Reset breaker · press E, stay still " +
          (p.class === "Engineer" ? "4" : "6") +
          " seconds",
      };
    const m = state.machines.find((m) => !m.done && canReach(a, m, 27));
    if (m)
      return {
        action: "repair",
        object: m.id,
        label: "Repair " + m.title + " · hold E",
      };
  }
  if (canReach(a, securityTerminal, 27) && !p.carrying)
    return {
      action: "security",
      label: "Watch security cameras · remain at console",
    };
  if(nearbyDoor)return doorAction(nearbyDoor);
  const chest = state.chests.find((c) => !c.opened && canReach(a, c, 25));
  if (chest && p.keys)
    return {
      action: "interact",
      object: chest.id,
      label: "Open treasure chest",
    };
  const drawer = (state.drawers || []).find((d) =>
    canInteract(
      a,
      objects.find((o) => o.id === d.object),
      24,
    ),
  );
  if (drawer)
    return {
      action: drawer.empty || p.keys >= 2 ? "drawerInfo" : "interact",
      object: drawer.id,
      label: drawer.empty
        ? "Drawers empty"
        : p.keys >= 2
          ? "Key pouch full (2/2) · open a chest"
          : "Search drawers · stay still 1s",
    };
  if (chest)
    return {
      action: "drawerInfo",
      object: chest.id,
      label: "Locked chest · search furniture drawers for a key",
    };
  const portal = state.portals.find(
    (q) =>
      canReach(a, q, 22) &&
      state.portals.filter((x) => x.owner === q.owner).length === 2,
  );
  if (portal)
    return { action: "interact", object: portal.id, label: "Use portal" };
  const ward = wardrobes.find((o) => canInteract(a, o, 24));
  if (ward)
    return {
      action: "interact",
      object: ward.id,
      label: p.role === "Killer" ? "Search wardrobe" : "Hide · ten seconds",
    };
  const vent = passageNodes.find(
    (o) => canInteract(a, o, 24) && passageDestinations(p, o).length,
  );
  if (vent)
    return {
      action: "passage",
      object: vent.id,
      label: servicePassages.includes(vent.id)
        ? "Service hatch"
        : "Secret passage",
    };
}
function stopRepair() {
  if (repairHeld) {
    repairHeld = null;
    command("close");
  }
}
function clearInput() {
  keys = {};
  touch = { x: 0, y: 0 };
  stopRepair();
  sendInput();
}
function use(held = false) {
  if (!state || panel) return;
  const c = context();
  if (!c) return toast("Approach a machine, key, chest, teammate or passage.");
  if (["drawerInfo","damageInfo","escapeInfo"].includes(c.action)) return toast(c.label);
  if (c.action === "passage") {
    localPassage = c.object;
    panel = "passage";
    panelSignature = "";
    renderPanel();
    return;
  }
  if (c.action === "repair") {
    if (held) {
      repairHeld = c.object;
      lastRepair = performance.now();
      command("repair", { object: c.object });
    } else toast("Hold E or hold the Repair button to work.");
    return;
  }
  const { action, label, ...data } = c;
  command(action, data);
}
function power() {
  if (!state) return;
  if (state.me.class === "Hulk" && state.me.role !== "Killer" && ["map","vitals","objectives","ability","team"].includes(panel)) {
    panel = ""; panelSignature = ""; renderPanel(); clearInput();
  }
  if (panel) return;
  if (state.me.status === "carried") return command("wiggle");
  if (state.me.class === "Engineer" && state.me.role !== "Killer")
    return openPanel("doors");
  command("power", { direction: aim });
}
function openPanel(name) {
  if(name === "vitals" && (state?.me.class !== "Hulk" || state.me.role === "Killer")) return;
  if (panel === "security" && name !== "security") command("close");
  if (panel === "security" && name === "security") command("close");
  clearInput();
  panel = panel === name ? "" : name;
  panelSignature = "";
  renderPanel();
}
function track(id) {
  tracked = id;
  navKey = "";
  panel = "";
  renderPanel();
  updateTracking();
}
function trackTarget() {
  return (
    state.rescues.find((q) => q.id === tracked) ||
    state.exits.find((q) => q.id === tracked) ||
    state.machines.find((q) => q.id === tracked) ||
    state.tables.find((q) => q.id === tracked) ||
    electrical.find((q) => q.id === tracked)
  );
}
function updateTracking() {
  const me = state.me;
  if (state.dark && !wasDark && me.role !== "Killer") {
    daylightTrack = tracked;
    tracked = nearestBreaker(
      state.position,
      state.closedDoors,
      state.broken,
    ).id;
    navKey = "";
  } else if (!state.dark && wasDark) {
    if (electrical.some((q) => q.id === tracked)) tracked = daylightTrack;
    navKey = "";
  }
  wasDark = state.dark;
  if (me.status !== "active" || (me.role === "Killer" && !me.carrying)) {
    path = [];
    $("#hunt-route-hint").hidden = true;
    $("#hunt-track").hidden = true;
    return;
  }
  const options = me.carrying
    ? state.tables.filter((q) => !q.occupied)
    : state.exitsOpen
      ? state.exits
      : state.machines.filter((q) => !q.done);
  if (
    !trackTarget() ||
    state.machines.some((q) => q.id === tracked && q.done) ||
    (state.exitsOpen && state.machines.some((q) => q.id === tracked)) ||
    (me.carrying && !state.tables.some((q) => q.id === tracked))
  )
    tracked = [...options].sort(
      (x, y) =>
        (x.floor === state.position.floor ? 0 : 700) +
        Math.hypot(x.x - state.position.x, x.y - state.position.y) -
        ((y.floor === state.position.floor ? 0 : 700) +
          Math.hypot(y.x - state.position.x, y.y - state.position.y)),
    )[0]?.id;
  const target = trackTarget(),
    key = [
      tracked,
      state.position.floor,
      state.position.x >> 3,
      state.position.y >> 3,
      state.closedDoors
        .map((q) => q.id)
        .sort()
        .join(","),
      state.broken.length,
    ].join(":");
  if (key !== navKey) {
    navKey = key;
    path = routeTo(state.position, target, state.closedDoors, state.broken);
  }
  const breaker = electrical.some((q) => q.id === tracked);
  $("#hunt-route-hint").hidden = state.phase !== "hunt" || !target || !!me.hulkReadyAt || now() < me.hulkUntil || state.pressure;
  const turn = nextTurn(state.position, path);
  $("#hunt-route-hint").textContent = target
    ? (state.dark && breaker ? "⚡ LIGHTS OUT · " : "") +
      (turn
        ? { up: "↑", down: "↓", left: "←", right: "→" }[turn] +
          " Follow the arrow"
        : "Approach the marked object")
    : "";
  $("#hunt-track").hidden = state.phase !== "hunt";
  html(
    $("#hunt-track"),
    `<b>${esc(target?.title || target?.name || "Explore")}</b><small>${target?.floor !== state.position.floor ? "Follow gold trail → " + areaNames[target?.floor] : "Gold trail · " + (breaker ? "E, stay still " + (me.class === "Engineer" ? "4" : "6") + "s to reset lights" : me.carrying ? "E to chain" : state.exitsOpen ? "E to escape" : "hold E to repair")}</small>`,
  );
}
function updateUI(previous) {
  spatialAudio.update(state,audio,sound);
  updateHuntDetails(state,track,kind=>{if(sound)spatialAudio.play(audio,{kind,volume:.7});});
  if(sound&&previous?.code===state.code&&state.me.status==='carried'&&state.me.wiggle>previous.me.wiggle)spatialAudio.play(audio,{kind:'tap',volume:.5});
  updateMatchAtmosphere(previous,state,classLabel(state.me.class));
  if(sound&&previous&&previous.code===state.code&&previous.round===state.round&&state.phase==='hunt'&&previous.dark!==state.dark)spatialAudio.play(audio,{kind:state.dark?'powerOff':'powerOn',volume:.8});
  const effectNow=performance.now();
  if(previous?.code!==state.code || previous?.phase==='lobby')feedbackEffects=[];
  for(const effect of collectFeedback(previous,state)){
    if(effect.hud){
      const screen=$("#hunt-feedback-screen");
      if(screen && !reducedFeedback()){
        screen.style.borderColor={danger:'#e39c87',good:'#b9d8a0',loot:'#e9cb83',power:'#bda8d9'}[effect.kind]||'#c5ddce';
        screen.animate?.([{opacity:0},{opacity:.45,offset:.2},{opacity:0}],{duration:effect.duration});
      }
    } else feedbackEffects.push({...effect,at:effectNow});
  }
  feedbackEffects=feedbackEffects.filter(e=>effectNow<e.at+e.duration).slice(-48);

  const hulkAlarm = state.phase === "hunt" && state.hulkGPS.length > 0;
  $("#hulk-alarm").hidden = !hulkAlarm;
  if (previous?.code !== state.code || previous?.phase !== state.phase) lastHulkFootstep = 0;
  if (hulkAlarm && state.serverNow - lastHulkSiren > 950) {
    lastHulkSiren = state.serverNow; hulkSound(false);
  }
  const step = state.hulkFootstep;
  if (hulkAlarm && step && step.seq !== lastHulkFootstep && state.serverNow-step.at<400) {
    lastHulkFootstep=step.seq;
    const shell = document.querySelector('.hunt-app');
    shell.classList.remove('hulk-stomp'); void shell.offsetWidth;
    shell.classList.add('hulk-stomp'); hulkSound(true);
  }

  $("#hunt-vitals").hidden = state.me.class !== "Hulk" || state.me.role === "Killer";
  $("#hunt-radar").hidden = false;
  $("#hunt-radar").onclick = () => openPanel("map");
  $("#hunt-radar-status").textContent = radarStatus(state);
  drawRadar($("#hunt-radar-canvas"), state);
  const p = state.me,
    t = now();
  if (
    (previous?.phase === "lobby" && state.phase === "hunt") ||
    (previous?.phase === "ended" && state.phase === "lobby")
  ) {
    lastEvent = 0;
    tracked = null;
    daylightTrack = null;
    wasDark = false;
    panelSignature = "";
  }
  $(".hunt-app").dataset.phase = state.phase;
  $(".hunt-app").dataset.role = p.role;
  $("#hunt-room").textContent = state.code;
  $("#hunter-public").textContent =
    "HUNTER · " + (state.killer?.name || "unknown");
  $("#hunt-location").textContent =
    areaNames[state.position.floor] +
    " · " +
    (onStairs(state.position) ? "Grand staircase" : state.roomName);
  $("#hunt-pressure").hidden = !state.pressure || state.phase !== "hunt";
  if (state.me.watching && state.security && panel !== "security") {
    clearInput();
    panel = "security";
    panelSignature = "";
  }
  if (panel === "security" && !state.me.watching) {
    panel = "";
    panelSignature = "";
  }
  $("#hunt-dark").hidden = !state.dark;
  $("#hunt-dark").textContent =
    "BLACKOUT · backup in " + cooldown(state.blackoutEndsAt) + "s";
  $("#hunt-goal").textContent = state.exitsOpen
    ? "TWO EXITS OPEN"
    : state.completed + "/" + state.required + " MACHINES";
  $("#hunt-progress").style.width =
    Math.min(100, (state.completed / state.required) * 100) + "%";
  $("#hunt-evac").textContent = state.escaped + " escaped";
  $("#hunt-self").textContent =
    state.phase === "lobby"
      ? "Classes are randomly assigned at start"
      : p.role === "Killer"
        ? "HUNTER · everyone knows you"
        : p.name + " · " + classLabel(p.class) + " · " + p.status.toUpperCase();
  $("#hunt-inventory").textContent =
    state.phase === "lobby"
      ? ""
      : `Keys ${p.keys}/2 · ${p.role === "Killer" ? "Whip " + p.whip : "Sensors " + p.sensors + " · Battery " + (p.battery / 1000).toFixed(1) + "s"}`;
  $("#hunt-danger").hidden =
    p.role === "Killer" || p.status !== "active" || state.phase !== "hunt";
  $("#hunt-danger").dataset.level = state.danger;
  $("#hunt-danger").textContent = [
    "Quiet footsteps",
    "Hunter nearby",
    "Danger · keep moving",
    "RUN · hunter close",
  ][state.danger];
  const c = context(),
    ready =
      state.phase === "hunt" &&
      (p.status === "active" || ghost() || p.status === "carried") &&
      !p.channel && !p.hulkReadyAt &&
      !(
        p.role === "Killer" &&
        (t < state.unlockAt || t < p.stunUntil || t < p.timeoutUntil)
      );
  $("#hunt-use").disabled = !ready || !c || ["drawerInfo","escapeInfo"].includes(c.action);
  $("#hunt-use").textContent =
    p.status === "carried"
      ? "Wiggle"
      : p.hidden
        ? "Leave"
        : c?.action === "repair"
          ? "Hold to repair"
          : c?.action === "rescue"
            ? "Rescue"
            : c?.action === "pickup"
              ? "Carry"
              : p.carrying
                ? "Chain / drop"
                : c
                  ? electrical.some((q) => q.id === c.object)
                    ? "⚡ Fix lights"
                    : c.label.split(" · ")[0]
                  : "Use";
  $("#hunt-context").textContent =
    p.status === "captured"
      ? "Chained · teammates must rescue you. Camping charges a free release."
      : p.status === "downed"
        ? "Downed · crawl toward a friend. The hunter must carry you to a table."
        : p.status === "escaped"
          ? "YOU ESCAPED · your individual victory is secured."
          : ghost()
            ? "Spirit · hold E at machines for limited repairs. G changes area."
            : c
              ? c.action === "drawerInfo"
                ? c.label
                : "[E] " + c.label
              : p.role === "Killer"
                ? "Q strike · F SCREAM · R blackout · X whip"
                : "Repair machines · rescue friends · find treasure";
  $("#hunt-power").hidden =
    ghost() || ["escaped", "lost", "downed", "captured"].includes(p.status);
  $("#hunt-power").disabled =
    p.status === "carried"
      ? false
      : !ready ||
        p.hidden ||
        t < p.powerAt ||
        (p.class === "Photographer" && !p.flashCharges) ||
        (p.class === "Hulk" && p.hulkUsed) ||
        (p.class === "Magician" && p.portalsPlaced >= 2);
  const powerName =
    p.status === "carried"
      ? "Wiggle"
      : p.role === "Killer"
        ? "SCREAM"
        : p.class === "Photographer"
          ? "Flash · " + p.flashCharges
          : p.class === "Magician"
            ? "Portal · " + (2 - p.portalsPlaced) + " left"
            : p.class === "Escape Artist"
              ? "Dash"
              : p.class === "Engineer"
                ? "Remote door"
                : p.hulkUsed
                  ? "Injection used"
                  : "Inject";
  $("#hunt-power").textContent =
    (p.hulkReadyAt ? "Transforming…" : t < p.hulkUntil ? "HULK · " + Math.ceil((p.hulkUntil-t)/1000) + "s" : powerName) + (cooldown(p.powerAt) ? " · " + cooldown(p.powerAt) + "s" : "");
  const guide = abilityGuide(p, t, state.phase, state.unlockAt);
  $("#hunt-ability-card").hidden = state.phase !== "hunt";
  html(
    $("#hunt-ability-card"),
    `<span>${esc(guide.className)} · YOUR POWER</span><b>${guide.icon} ${esc(guide.title)}</b><small>${esc(guide.hint)}</small><strong class="${guide.ready ? "ready" : ""}">${esc(guide.status)}</strong>${p.role==='Killer'&&p.resistUntil>t?`<em class="flash-resistance">FLASH RESISTANCE · ${Math.ceil((p.resistUntil-t)/1000)}s</em>`:''}`,
  );
  $("#hunt-power").title = guide.hint + " " + guide.status;
  $("#hunt-hulk-timer").hidden = !(p.hulkReadyAt || t < p.hulkUntil);
  $("#hunt-hulk-timer").textContent = p.hulkReadyAt ? "TRANSFORMING · " + Math.max(0,Math.ceil((p.hulkReadyAt-t)/1000)) + "s" : "HULK ACTIVE · " + Math.max(0,Math.ceil((p.hulkUntil-t)/1000)) + "s · Q STRIKE";
  $("#hunt-attack").hidden = p.role !== "Killer" && !(t < p.hulkUntil);
  $("#hunt-attack").disabled =
    !ready || cooldown(p.attackAt) > 0 || !!p.carrying;
  $("#hunt-attack").textContent =
    "Strike" + (cooldown(p.attackAt) ? " · " + cooldown(p.attackAt) + "s" : "");
  $("#hunt-blackout").hidden = p.role !== "Killer";
  $("#hunt-blackout").disabled =
    !ready || state.dark || cooldown(p.blackoutAt) > 0;
  $("#hunt-blackout").textContent =
    "Cut power" +
    (cooldown(p.blackoutAt) ? " · " + cooldown(p.blackoutAt) + "s" : "");
  $("#hunt-whip").hidden = p.role !== "Killer" || !p.whip;
  $("#hunt-whip").disabled = !ready || cooldown(p.attackAt) > 0 || !!p.carrying;
  $("#hunt-item").hidden = p.role === "Killer" || p.battery <= 0;
  $("#hunt-item").textContent =
    (p.lightOn ? "Light off" : "Light on") +
    " · " +
    Math.ceil(p.battery / 1000) +
    "s";
  $("#hunt-item").disabled = p.status !== "active";
  $("#hunt-sensor").hidden = !p.sensors || p.role === "Killer";
  $("#hunt-sensor").disabled = !ready || p.status !== "active";
  $("#hunt-ghost-floor").hidden = !ghost();
  html(
    $("#hunt-objectives"),
    `<span class="eyebrow">${state.exitsOpen ? "WESTERN ESCAPES" : "REPAIR ANY " + state.required}</span>${state.dark && p.role !== "Killer" ? electrical.map((q) => `<button data-track="${q.id}"><b>⚡</b><span>${esc(q.title)}<small>${areaNames[q.floor]} · restore lights</small></span></button>`).join("") : ""}${(state.exitsOpen ? state.exits : state.machines).map((m) => `<button data-track="${m.id}" class="${tracked === m.id ? "tracked" : ""}"><b>${m.number || "↗"}</b><span>${esc(m.title)}<small>${areaNames[m.floor]} ${m.number ? "· " + Math.floor(m.progress * 100) + "%" : ""}</small></span></button>`).join("")}`,
  );
  $("#hunt-objectives")
    .querySelectorAll("[data-track]")
    .forEach((b) => (b.onclick = () => track(b.dataset.track)));
  updateTracking();
  if (state.phase === "lobby") panel = "lobby";
  else if (previous?.phase === "lobby") panel = "";
  if (state.phase === "ended" && previous?.phase !== "ended") panel = "end";
  renderPanel();
  if (panel === "map") drawRadar($("#hunt-atlas"), state, atlasFloor ?? state.position.floor, true);
  if (state.toast) toast(state.toast);
  for (const e of state.events.filter((e) => e.seq > lastEvent)) {
    lastEvent = Math.max(lastEvent, e.seq);
    if (state.serverNow - e.at > 3500) continue;
    toast(e.type === "start" ? "The hunt is on. Repair. Rescue. Escape." : e.text);
    if (e.type === "scream") tone("scream");
    else if (["machine", "rescue", "escape", "hulk"].includes(e.type))
      tone("success");
  }
  if (p.death && p.death.id !== lastDeath) {
    lastDeath = p.death.id;
    clearInput();
    showDeathAnimation({
      sheet: scene?.textures.get("people").getSourceImage(),
      index: p.index,
      survival: true,
      hunt: true,
      cellScale: 2,
    });
  }
}
function mapMarkup(floor, pins = [], live = false) {
  return `<svg viewBox="0 0 ${W * TILE} ${H * TILE}" class="hunt-map" aria-label="${areaNames[floor]} map"><rect width="100%" height="100%" fill="#17212b"/>${passages
    .filter((r) => r.floor === floor)
    .map(
      (r) =>
        `<rect x="${r.x * 16}" y="${r.y * 16}" width="${r.w * 16}" height="${r.h * 16}" fill="#526b69"/>`,
    )
    .join("")}${rooms
    .filter((r) => r.floor === floor)
    .map(
      (r) =>
        r.rects
          .map(
            (q) =>
              `<rect x="${q.x * 16}" y="${q.y * 16}" width="${q.w * 16}" height="${q.h * 16}" fill="${floor === 2 ? "#719366" : roomThemes[r.kind]?.[1] || "#918c72"}" stroke="#bdc9ac" stroke-width="2"/>`,
          )
          .join("") +
        `<text x="${(r.x + r.w / 2) * 16}" y="${(r.y + r.h / 2) * 16}" text-anchor="middle" font-size="15" fill="#f3edce">${esc(r.name)}</text>`,
    )
    .join("")}${(live ? [] : state.machines)
    .filter((m) => m.floor === floor)
    .map(
      (m) =>
        `<text x="${m.x}" y="${m.y}" font-size="23" text-anchor="middle" fill="${m.done ? "#c5e7b1" : "#ffdc83"}">${m.done ? "✓" : m.number}</text>`,
    )
    .join("")}${(live ? [] : electrical)
    .filter((q) => q.floor === floor)
    .map(
      (q) =>
        `<rect x="${q.x - 13}" y="${q.y - 15}" width="26" height="26" fill="#f2b856" stroke="#342f2b" stroke-width="3"/><text x="${q.x}" y="${q.y + 5}" text-anchor="middle" font-size="24" fill="#292f36">⚡</text><text x="${q.x}" y="${q.y - 22}" text-anchor="middle" font-size="17" fill="#ffe0a0">ELECTRICAL</text>`,
    )
    .join("")}${(live ? [] : arches)
    .filter((a) => a.floor === floor)
    .map(
      (a) =>
        `<rect x="${a.x - 7}" y="${a.y - 7}" width="14" height="14" fill="#b49162"/>`,
    )
    .join("")}${(live ? [] : state.exits)
    .filter((e) => e.floor === floor)
    .map(
      (e) =>
        `<rect x="${e.x - 13}" y="${e.y - 13}" width="26" height="26" fill="${state.exitsOpen ? "#efce75" : "#8b8172"}"/><text x="${e.x}" y="${e.y - 20}" font-size="20" text-anchor="middle" fill="#fff0b9">EXIT</text>`,
    )
    .join("")}${(live ? [] : state.portals)
    .filter((q) => q.floor === floor)
    .map((q) => `<circle cx="${q.x}" cy="${q.y}" r="11" fill="#aa8bd5"/>`)
    .join("")}${pins
    .filter((p) => p.floor === floor)
    .map(
      (p) =>
        `<circle cx="${p.x}" cy="${p.y}" r="13" fill="${p.id === state.me.id ? "#ffe59d" : p.role === "Killer" ? "#ee857e" : p.until ? "#afdf82" : "#80d7d0"}"/><text x="${p.x}" y="${p.y - 16}" text-anchor="middle" font-size="19" fill="#fff2c8">${esc(p.name)}</text>`,
    )
    .join(
      "",
    )}${!live && state.position.floor === floor ? `<circle cx="${state.position.x}" cy="${state.position.y}" r="8" fill="#f4f1cb"/>` : ""}</svg>`;
}
function injectionButton() {
  return state.me.class === "Hulk" && state.me.role !== "Killer" && state.me.status === "active" && state.phase === "hunt" && !state.me.hulkUsed
    ? '<button data-inject class="primary">Inject · F · Hulk for 12s</button>' : '';
}
function renderPanel() {
  if (!state || !$("#hunt-drawer")) return;
  const d = $("#hunt-drawer");
  d.hidden = !panel;
  if (!panel) return;
  const sig = JSON.stringify([
    panel,
    state.phase,
    state.speed,
    state.host,
    state.players,
    state.me.class,
    state.me.powerAt,
    state.completed,
    state.dark,
    panel === "security" ? state.security?.offline : null,
    panel === "map" ? [atlasFloor, state.position.floor] : [],
    state.closedDoors,
    revealActive() ? state.reveals : [],
    state.hulkGPS,
    localPassage,
  ]);
  if (sig === panelSignature) return;
  panelSignature = sig;
  let body = "";
  if (panel === "lobby")
    body = `<span class="eyebrow">MIDNIGHT MANOR · THE LOBBY</span><h2>Who makes it outside?</h2><p>One public hunter. Five survivor classes assigned randomly. Repair machines, rescue friends, escape within ten minutes. Every escape is an individual victory.</p><div class="class-choices">${CLASSES.map((c) => `<div><b>${classLabel(c)}</b><small>${info[c][0]}</small></div>`).join("")}</div><div class="lobby-guests">${state.players.map((p) => `<div><b>${String(state.players.indexOf(p)+1).padStart(2,"0")} · ${esc(p.name)}${p.id === state.me.id ? " · you" : ""}</b><span>${p.bot ? "BOT" : p.online ? "CONNECTED" : "RECONNECTING"} · ${p.role === "Killer" ? "HUNTER" : "random survivor"}</span>${state.host === state.me.id ? `<button data-killer="${p.id}" class="${state.killer?.id === p.id ? "selected" : ""}">Make hunter</button>` : ""}</div>`).join("")}</div>${state.host === state.me.id ? `<div class="lobby-actions"><button id="hunt-add-bot" ${state.players.length >= 12 ? "disabled" : ""}>+ Invite a bot</button><button id="hunt-fill" ${state.players.length >= 8 ? "disabled" : ""}>Fill to 8 players</button><button id="hunt-start" class="primary" ${state.players.length < 2 ? "disabled" : ""}>Start the hunt →</button></div>` : "<p>Waiting for the host.</p>"}`;
  if(panel==='lobby')body=body.replace('<div class="class-choices">',`<label class="hunt-speed-setting" for="hunt-speed"><b>Movement speed</b><select id="hunt-speed" ${state.host===state.me.id?'':'disabled'}>${[.75,1,1.25,1.5,1.75,2].map(n=>`<option value="${n}" ${(state.speed||1)===n?'selected':''}>${n}×${n===1?' · Normal':''}</option>`).join('')}</select><small>Scales everyone together, including hunter, carrying and powers. Timers stay the same.</small></label><div class="class-choices">`);
  if (panel === "map") {
    const limited = state.dark && state.me.role !== "Killer";
    const f = limited ? state.position.floor : atlasFloor ?? state.position.floor;
    body = `${injectionButton()}<h2>Mansion map</h2><p>${state.me.role === "Killer" ? "Hunter tracking · only your own position." : limited ? "BLACKOUT · only a small nearby area and your own marker. Other players are hidden." : "Gold arrow: you · teal: teammates. The hunter never appears on your map."}</p><div class="atlas-tabs">${areaNames.map((name,i)=>`<button data-atlas-floor="${i}" ${limited?"disabled":""} class="${f===i?'selected':''}">${name}${state.position.floor===i?' · YOU':''}</button>`).join('')}<button id="atlas-follow">My area ↗</button></div><canvas id="hunt-atlas" width="1200" height="760" aria-label="${areaNames[f]} full player map"></canvas><small>T: capture table · K: key drawers · C: chest in sight · D: courtyard door. Drawer markers show locations, not remaining keys. M / Escape closes this map.</small>`;
  }
  if (panel === "vitals")
    body = `${injectionButton()}<span class="eyebrow">SCIENTIST · LIVE VITALS</span><h2>Keep a pulse on your team.</h2><p>Always available · no cooldown · works during blackouts. Reports condition, not location.</p><div class="vitals-grid">${state.players.map(p=>`<section data-condition="${p.status}"><b>${esc(p.name)}${p.id===state.me.id?' · YOU':''}</b><span class="vital-pulse" aria-hidden="true">${['eliminated','lost'].includes(p.status)?'────────':'──╱╲─╱╲──'}</span><strong>${esc({active:'ALIVE',downed:'DOWNED',carried:'CARRIED',captured:'CAPTURED',eliminated:'DEAD',lost:'LOST',escaped:'ESCAPED'}[p.status]||p.status.toUpperCase())}</strong></section>`).join('')}</div>`;
  if (panel === "security")
    body = `<span class="eyebrow">SECURITY ROOM · LIVE CAMERAS</span><h2>Keep an eye on the manor.</h2><p>Stay at the console. Close this screen to leave. Feeds lose power during a blackout; hidden players and spirits do not appear.</p>${state.security?.offline ? '<div class="camera-offline">NO SIGNAL · BLACKOUT</div>' : `<div class="security-feeds">${cameraStations.map((c) => `<section><b>● LIVE · ${esc(c.name)}</b><canvas width="352" height="256" data-camera="${c.id}" aria-label="${esc(c.name)} live security feed"></canvas></section>`).join("")}</div>`}`;
  if (panel === "objectives")
    body = `<span class="eyebrow">${state.completed}/${state.required} MACHINES</span><h2>${state.dark ? "Lights out? Find a breaker." : state.exitsOpen ? "Both gates are open. Escape." : "Your task: repair machines"}</h2><p>⚡ Electrical: press E beside a breaker, then remain still for ${state.me.class === "Engineer" ? "4" : "6"} seconds. The Electrical room breaker restores the whole mansion sooner; backup power returns automatically after 40 seconds. This is separate from machine progress.</p><div class="objective-grid electrical-list">${electrical.map((q) => `<button data-track="${q.id}"><b>⚡ ${esc(q.title)}</b><small>${areaNames[q.floor]} · ${state.dark ? "TRACK LIGHT REPAIR →" : "power is working"}</small></button>`).join("")}</div><p>Main task: follow a numbered gold marker to a machine and HOLD E (or hold the Repair button). There is no puzzle. More hands repair faster. Moving stops work; progress stays. Engineer repairs faster. Ghosts together contribute at most 18% per machine and cannot finish it.</p><div class="objective-grid">${(state.exitsOpen ? state.exits : state.machines).map((m) => `<button data-track="${m.id}" data-done="${!!m.done}" data-here="${m.floor === state.position.floor}"><b>${m.number || "↗"} ${esc(m.title)} ${m.done ? "✓ DONE" : ""}</b><small>${areaNames[m.floor]}${m.floor === state.position.floor ? " · YOUR AREA" : ""}${m.number ? " · " + Math.floor(m.progress * 100) + "%" : ""}</small>${m.number ? `<span class="task-meter" aria-hidden="true"><i style="width:${Math.max(0,Math.min(100,m.progress*100))}%"></i></span>` : ""}</button>`).join("")}</div>`;
  if (panel === "team")
    body = `<h2>Players</h2><p>Two table captures can be rescued. The third eliminates. Every escaped survivor keeps their victory.</p>${state.players.map((p) => `<div class="survival-guest"><b>${String(state.players.indexOf(p)+1).padStart(2,"0")} · ${esc(p.name)}</b><span>${p.role === "Killer" ? "HUNTER" : classLabel(p.class)} · ${p.status} · ${p.captures}/3 ${p.victory ? "· WON" : ""}</span>${state.rescues.some((q) => q.id === p.id) ? `<button data-track="${p.id}">Find & rescue →</button>` : ""}</div>`).join("")}`;
  if (panel === "ability")
    body = `<h2>${ghost() ? "Wandering spirit" : state.me.role === "Killer" ? "SCREAM & CAPTURE" : info[state.me.class]?.[0] || "A random survival trick"}</h2><p>${ghost() ? "Fly through walls. G changes area. Hold E at machines for limited repair work. No powers, items, rescue or escape." : state.me.role === "Killer" ? "F reveals survivors outside tall grass for EXACTLY two seconds. Q downs. E carries, then chains at an empty Exorcist Table. Captives wiggle while carried. R sabotages lights; the Electrical room breaker restores them. X uses a looted whip." : info[state.me.class]?.[1] || "Your class is assigned when the hunt starts."}</p>`;
  if (panel === "doors")
    body = `<h2>One second changes a chase.</h2><p>Select any eligible door. It reopens after exactly one second. Occupied doorways cannot close. 25-second cooldown.</p><div class="objective-grid">${doors.map((q) => `<button data-door="${q.id}" ${cooldown(state.me.powerAt) ? "disabled" : ""}><b>${esc(q.title)}</b><small>${areaNames[q.floor]}</small></button>`).join("")}</div>`;
  if (panel === "passage") {
    const o = objects.find((o) => o.id === localPassage);
    body = `<h2>Behind the walls</h2><p>Entry and exit take time. Everyone can use the kitchen/conservatory hatch pair.</p><div class="passage-options">${passageDestinations(
      state.me,
      o,
    )
      .map((id) => {
        const q = objects.find((o) => o.id === id);
        return `<button data-travel="${id}">${esc(q.label)} · ${areaNames[q.floor]}</button>`;
      })
      .join("")}</div>`;
  }
  if (panel === "help")
    body = `<h2>Run. Repair. Rescue.</h2><p>One known hunter. Random survivor classes. Hold E at machines; co-op repairs are faster. Repair the shared quota to unlock both western courtyard gates. Physically reach either gate and E to escape. Your escape is your win. At ten minutes everyone still inside loses.</p><p>Q: hunter strike. E: carry downed survivors to Exorcist Tables. While carried, repeatedly tap E/F to wiggle. Filling the meter frees you and stuns the hunter for exactly 1.5 seconds. First and second table captures can be rescued; third eliminates. Camping charges prisoner freedom.</p><p>F: class power. Photographer flashes; Magician places two permanent public portals; Escape Artist dashes; Engineer closes any eligible door for one second; Scientist uses a one-use injection to become Hulk for twelve seconds and V reads live vitals without a cooldown and Q defeats the hunter or breaks marked screens. Hulk GPS is public. The hunter can run away.</p><p>Tall grass makes survivors translucent to teammates and hides them from the hunter. Movement rustles it. Search desk and cabinet drawers with E to find keys. Keys open chests. L toggles a flashlight with twenty seconds total battery; B places a sensor; X uses a hunter whip. E opens and closes physical doors. The Security room console shows four camera feeds. E beside an unfinished machine damages it by 40 percentage points after two stationary seconds (45-second cooldown; 60-second machine protection). Finished machines are safe. R sabotages electricity; sabotage recharges every 150 seconds. Visit the Electrical room and repair its breaker to restore it sooner; otherwise backup power returns after 40 seconds.</p><p>WASD/arrows move · E use/hold repair · F power · M map · N machines · G ghost area. Touch buttons support the same controls. Stairs are walked automatically; two ground-floor doors connect the courtyard. Ghost repairs are capped and cannot finish machines.</p><p class="art-credits">Furniture: LPC Wooden Furniture by bluecarrot16, Baŝto, Sharm, William Thompson, Reemax, Janna/Lilius/Jannax (CC-BY-SA 4.0); upholstery by bluecarrot16 and Sharm (CC-BY 4.0). <a href="/assets/lpc/CREDITS.md" target="_blank" rel="noopener">Full artwork credits and licenses (including LPC Containers and House Interiors)</a>.</p>`;
  if (panel === "end")
    body = `<span class="eyebrow">THE HUNT IS OVER</span><h2>${state.me.status === "escaped" ? "You made it outside." : state.me.role === "Killer" ? (state.escaped ? "Some slipped away." : "The manor claimed them.") : "You did not escape."}</h2><p>${esc(state.reason)}</p>${resultsSummary(state)}<div class="end-survivors">${state.players.map((p) => `<div><b>${String(state.players.indexOf(p)+1).padStart(2,"0")} · ${esc(p.name)}</b><small>${p.role === "Killer" ? "HUNTER" : p.victory ? "ESCAPED · WON" : ({lost:"Did not escape",eliminated:"Eliminated",captured:"Captured",downed:"Downed",active:"Still inside"}[p.status] || "Did not escape")}</small></div>`).join("")}</div>${state.host === state.me.id ? '<button id="hunt-rematch" class="primary">Rematch · same group →</button>' : "<p>Waiting for the host.</p>"}`;
  d.innerHTML = `<div class="hunt-card ${["lobby", "map", "end", "security"].includes(panel) ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${panel}">${panel === "lobby" ? "" : '<button class="hunt-close" aria-label="Close panel">×</button>'}${body}</div>`;
  if (panel === "map") {
    drawRadar($("#hunt-atlas"), state, atlasFloor ?? state.position.floor, true);
    d.querySelectorAll('[data-atlas-floor]').forEach(b => b.onclick = () => {
      atlasFloor = Number(b.dataset.atlasFloor); panelSignature = ""; renderPanel();
    });
    $("#atlas-follow").onclick = () => { atlasFloor = null; panelSignature = ""; renderPanel(); };
  }
  d.querySelector("[data-inject]")?.addEventListener("click", power);
  d.querySelector(".hunt-close")?.addEventListener("click", () =>
    openPanel(panel),
  );
  d.querySelectorAll("[data-track]").forEach(
    (b) => (b.onclick = () => track(b.dataset.track)),
  );
  d.querySelectorAll("[data-killer]").forEach(
    (b) =>
      (b.onclick = () => command("setKiller", { target: b.dataset.killer })),
  );
  const speed=d.querySelector('#hunt-speed');
  if(speed)speed.onchange=()=>command('setSpeed',{speed:Number(speed.value)});
  d.querySelectorAll("[data-door]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (await command("power", { door: b.dataset.door })) openPanel(panel);
      }),
  );
  d.querySelectorAll("[data-travel]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (
          await command("travel", {
            object: localPassage,
            destination: b.dataset.travel,
          })
        )
          openPanel(panel);
      }),
  );
  if ($("#hunt-add-bot")) $("#hunt-add-bot").onclick = () => command("addBot");
  if ($("#hunt-fill"))
    $("#hunt-fill").onclick = async () => {
      for (let i = state.players.length; i < 8; i++)
        if (!(await command("addBot"))) break;
    };
  if ($("#hunt-start"))
    $("#hunt-start").onclick = () => {
      unlockAudio();
      command("start");
    };
  if ($("#hunt-rematch")) $("#hunt-rematch").onclick = () => command("restart");
}

// The existing Phaser scene and its pixel-perfect mansion renderer are appended below.

class HuntScene extends Phaser.Scene {
  preload() {
    this.load.image("lpc-materials", "/assets/lpc/haveli-materials.png");
    this.load.image("animated-door", "/assets/lpc/animated-doors.png");
    this.load.image(
      "lpc-containers",
      "/assets/lpc/containers/container-v4_2/container.png",
    );
    this.load.image(
      "lpc-house",
      "/assets/lpc/house/LPC_house_interior/interior.png",
    );
    this.load.image("lpc-wood", "/assets/lpc/blonde-wood.png");
    this.load.image("lpc-dark", "/assets/lpc/dark-wood.png");
    this.load.image("lpc-fabric", "/assets/lpc/upholstery.png");
    this.load.image("interior-art", "/assets/kenney/interior.png");
  }
  create() {
    scene = this;
    setLpcSurfaces({materials:this.textures.get("lpc-materials").getSourceImage()});
    setFurnitureAtlas(
      this.textures.exists("interior-art")
        ? this.textures.get("interior-art").getSourceImage()
        : null,
    );
    setLpcFurniture({
      house: this.textures.get("lpc-house").getSourceImage(),
      containers: this.textures.get("lpc-containers").getSourceImage(),
      wood: this.textures.get("lpc-wood").getSourceImage(),
      dark: this.textures.get("lpc-dark").getSourceImage(),
      fabric: this.textures.get("lpc-fabric").getSourceImage(),
    });
    this.textures.addAtlas(
      "loot-imported",
      this.textures.get("lpc-containers").getSourceImage(),
      {
        frames: {
          closed: { frame: { x: 64, y: 256, w: 64, h: 32 } },
          open: { frame: { x: 64, y: 320, w: 64, h: 32 } },
        },
      },
    );
    this.textures.addAtlas(
      "drawer-imported",
      this.textures.get("lpc-wood").getSourceImage(),
      { frames: { front: { frame: { x: 64, y: 320, w: 64, h: 16 } } } },
    );
    this.lootArt = new Map();
    this.textures.addAtlas(
      "doors-imported",
      this.textures.get("animated-door").getSourceImage(),
      {
        frames: {
          open: { frame: { x: 28, y: 16, w: 8, h: 64 } },
          half: { frame: { x: 30, y: 115, w: 19, h: 61 } },
          ajar: { frame: { x: 31, y: 216, w: 29, h: 56 } },
          closed: { frame: { x: 32, y: 288, w: 32, h: 48 } },
        },
      },
    );
    this.doorArt = new Map();
    this.courtyardDoorArt = new Map();
    people(this);
    mansion(this, 0);
    mansion(this, 1);
    mansion(this, 2);
    this.floor = -1;
    this.actors = new Map();
    this.background = this.add
      .image(0, 0, "mansion0")
      .setOrigin(0)
      .setScale(1 / ART_SCALE);
    this.markers = this.add.graphics().setDepth(900);
    this.feedbackGraphics = this.add.graphics().setDepth(1950);
    this.focusGraphics = this.add.graphics().setDepth(1949);
    this.machineBadges = machines.map((m) => ({
      m,
      label: this.add
        .text(m.x, m.y - 27, String(m.number), {
          fontFamily: "monospace",
          fontSize: "7px",
          fontStyle: "bold",
          resolution: 2,
          color: "#ffe3a0",
          backgroundColor: "#364550",
          padding: { x: 2, y: 1 },
        })
        .setOrigin(0.5)
        .setDepth(901),
    }));
    this.pings = this.add.graphics().setDepth(2200);
    this.ownGear = this.add.graphics().setDepth(2102);
    this.fog = this.add.graphics().setDepth(2000);
    this.sight = this.make.graphics({ x: 0, y: 0 });
    const mask = this.sight.createGeometryMask();
    mask.setInvertAlpha(true);
    this.fog.setMask(mask);
    this.architecture = this.add
      .image(0, 0, "architecture0")
      .setScale(1 / ART_SCALE)
      .setOrigin(0)
      .setDepth(2002);
    this.wallMask = this.make.graphics({ x: 0, y: 0 });
    this.architecture.setMask(this.wallMask.createGeometryMask());
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setZoom(2);
    this.input.on('pointerdown',pointer=>{
      if(!state||panel||state.phase!=='hunt'||state.me.status!=='active'||state.me.hidden||state.me.channel||state.me.hulkReadyAt)return;
      const point=this.cameras.main.getWorldPoint(pointer.x,pointer.y);
      const d=doors.filter(d=>nearDoor(state.position,d)&&Math.abs(point.x-d.x)<Math.max(14,d.w/2)+8&&Math.abs(point.y-d.y)<Math.max(18,d.h/2)+10).sort((a,b)=>Math.hypot(point.x-a.x,point.y-a.y)-Math.hypot(point.x-b.x,point.y-b.y))[0];
      if(d)command('door',{object:d.id});
    });
    this.input.on("pointermove", (pointer) => {
      if (state?.me.class !== "Photographer" || panel) return;
      const me = this.actors.get(state.me.id);
      if (!me) return;
      const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y),
        dx = world.x - state.position.x,
        dy = world.y - state.position.y;
      aim =
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? "right"
            : "left"
          : dy > 0
            ? "down"
            : "up";
    });
  }
  update(time, delta) {
    if (!state) return;
    const pos = state.position,
      t = now(),
      me = state.me;
    if (this.floor !== pos.floor) {
      this.floor = pos.floor;
      this.background.setTexture("mansion" + pos.floor);
      this.architecture.setTexture("architecture" + pos.floor);
      const bounds = floorBounds[pos.floor];
      this.cameras.main.setBounds(
        bounds.x * TILE,
        bounds.y * TILE,
        bounds.w * TILE,
        bounds.h * TILE,
      );
    }
    const ids = new Set(state.avatars.map((a) => a.id));
    for (const [id, a] of this.actors)
      if (!ids.has(id)) {
        a.sprite.destroy();
        a.label.destroy();
        this.actors.delete(id);
      }
    for (const p of state.avatars) {
      let a = this.actors.get(p.id);
      if (!a) {
        a = {
          sprite: this.add
            .sprite(p.x, p.y, "people", p.index * 12 + 1)
            .setOrigin(0.5, 0.88),
          label: this.add
            .text(p.x, p.y, `${String(p.index + 1).padStart(2, "0")} · ${p.name}`, {
              fontFamily: "Segoe UI, sans-serif",
              resolution: 2,
              fontSize: "5px",
              stroke: "#14232d",
              strokeThickness: 2,
              color: p.role === "Killer" ? "#ffb5a3" : "#f7e9bd",
              backgroundColor: "#24343d00",
              padding: { x: 1, y: 1 },
            })
            .setOrigin(0.5, 0),
        };
        this.actors.set(p.id, a);
      }
      const dx = p.x - a.sprite.x,
        dy = p.y - a.sprite.y,
        moving = Math.hypot(dx, dy) > 0.6,
        d = cardinal(dx, dy, p.dir);
      if (Math.hypot(dx, dy) > 60 || p.floor !== this.floor) {
        a.sprite.setPosition(p.x, p.y);
      } else if (d.x) a.sprite.x += dx * Math.min(1, delta / 55);
      else a.sprite.y += dy * Math.min(1, delta / 55);
      const own = p.id === me.id,
        down = ["downed", "captured"].includes(p.status),
        dir = { down: 0, left: 1, right: 2, up: 3 }[p.dir] || 0;
      const travel=p.travelling&&!reducedFeedback()?Math.max(0,Math.min(1,(t-p.travelling.started)/(p.travelling.until-p.travelling.started))):0;
      const popScale=feedbackScale(feedbackEffects,p.id,performance.now(),reducedFeedback())*(1-travel*.25);
      a.sprite
        .setTexture(t < p.hulkUntil ? "people" : avatarTexture(p))
        .setScale(popScale * (t < p.hulkUntil ? 0.7 : p.hulkReadyAt ? 0.5 + Math.max(0,1-(p.hulkReadyAt-t)/rules.hulkWindup)*0.13 + Math.sin(time/45)*0.015 : 0.5))
        .setTint(p.hulkReadyAt && Math.floor(time/95)%2 ? 0xa5db93 : 0xffffff)
        .setFrame(
          p.index * 12 + dir * 3 + (moving ? Math.floor(time / 120 * (state.speed||1)) % 3 : 1),
        )
        .setAngle(down ? 90 : p.hulkReadyAt ? Math.sin(time/35)*7 : feedbackAngle(feedbackEffects,p.id,performance.now(),reducedFeedback()))
        .setAlpha(["escaped", "eliminated"].includes(p.status) ? 0.38 : (p.grass ? .48 : 1)*(1-travel*.65))
        .setDepth(own ? 2100 : p.y)
        .setVisible(!(own && me.hidden));
      a.label
        .setPosition(a.sprite.x, a.sprite.y - (t < p.hulkUntil ? 38 : 29))
        .setDepth(1000)
        .setAlpha(p.grass ? .48 : 1).setVisible(!own && !state.dark);
    }
    const own = this.actors.get(me.id);
    if (own) this.cameras.main.centerOn(own.sprite.x, own.sprite.y);
    const g = this.markers;
    g.clear();
    this.ownGear.clear();
    drawHuntProps(this, state, time, now(), reducedFeedback());
    const lootKeys = new Set();
    for (const c of state.chests.filter((c) => c.floor === pos.floor)) {
      lootKeys.add(c.id);
      let image = this.lootArt.get(c.id);
      if (!image) {
        image = this.add
          .image(c.x, c.y, "loot-imported", c.opened ? "open" : "closed")
          .setOrigin(0.5, 0.7)
          .setDisplaySize(30, 22)
          .setDepth(902);
        this.lootArt.set(c.id, image);
      }
      if(c.opened && image.frame.name === "closed" && !reducedFeedback())
        this.tweens.add({targets:image,displayHeight:25,duration:90,yoyo:true,ease:"Sine.easeOut"});
      image.setFrame(c.opened ? "open" : "closed");
    }
    for (const d of (state.drawers || []).filter(
      (d) => d.floor === pos.floor,
    )) {
      const o = objects.find((o) => o.id === d.object);
      if (!o) continue;
      lootKeys.add(d.id);
      let image = this.lootArt.get(d.id);
      if (!image) {
        image = this.add
          .image(
            (o.x + o.w / 2) * TILE,
            (o.y + o.h) * TILE - (d.empty || d.openUntil > t ? 0 : 5),
            "drawer-imported",
            "front",
          )
          .setDisplaySize(Math.min(30, o.w * 16 - 4), 10)
          .setDepth(902);
        if(d.openUntil>t && !reducedFeedback())this.tweens.add({targets:image,y:image.y+2,duration:120,yoyo:true});
        this.lootArt.set(d.id, image);
      }
      image.setPosition((o.x+o.w/2)*TILE,(o.y+o.h)*TILE-(d.empty||d.openUntil>t?0:5)).setTint(d.empty?0xaaa798:0xffffff);
    }
    for (const [id, image] of this.lootArt)
      if (!lootKeys.has(id)) {
        image.destroy();
        this.lootArt.delete(id);
      }
    updateLootLabels(this,state);
    for (const { m, label } of this.machineBadges) {
      const status = state.machines.find((q) => q.id === m.id);
      label.setVisible(m.floor === pos.floor);
      label.setText(status?.done ? "✓" : String(m.number));
      label.setColor(status?.done ? "#b5d7aa" : "#ffe3a0");
    }
    for (const d of doors) {
      let art = this.doorArt.get(d.id);
      const closed = state.closedDoors.some((q) => q.id === d.id);
      if (!art) {
        const image = this.add
          .image(d.x, d.y, "doors-imported", "open")
          .setOrigin(0, 1)
          .setDepth(903);
        art = { image, closed, amount: closed ? 1 : 0 };
        this.doorArt.set(d.id, art);
      }
      if (art.closed !== closed) {
        art.closed = closed;
        this.tweens.add({
          targets: art,
          amount: closed ? 1 : 0,
          duration: 220,
        });
      }
      const frame =
        art.amount > 0.85
          ? "closed"
          : art.amount > 0.5
            ? "ajar"
            : art.amount > 0.15
              ? "half"
              : "open";
      const span = Math.max(d.w, d.h),
        ratio =
          frame === "closed"
            ? 1
            : frame === "ajar"
              ? 0.9
              : frame === "half"
                ? 0.6
                : 0.15;
      art.image
        .setFrame(frame)
        .setVisible(d.floor === pos.floor)
        .setDisplaySize(span * ratio, 28);
      if (d.w > d.h) art.image.setAngle(0).setPosition(d.x - d.w / 2, d.y + 8);
      else art.image.setAngle(90).setPosition(d.x - 8, d.y - d.h / 2);
    }
    for(const d of arches){
      let art=this.courtyardDoorArt.get(d.id);
      if(!art){art={amount:1,image:this.add.image(d.x,d.y+7,'doors-imported','closed').setOrigin(.5,1).setDepth(903),open:false,label:this.add.text(d.x,d.y+21,d.floor===2?'MANSION':'COURTYARD',{fontFamily:'monospace',fontSize:'5px',resolution:2,backgroundColor:'#354d4d',color:'#e4d4a9',padding:{x:2,y:1}}).setOrigin(.5,0).setDepth(950)};this.courtyardDoorArt.set(d.id,art);}
      const open=d.floor===pos.floor&&state.avatars.some(p=>p.floor===d.floor&&Math.hypot(p.x-d.x,p.y-d.y)<45);
      if(open!==art.open){art.open=open;this.tweens.add({targets:art,amount:open?0:1,duration:180});}
      const frame=art.amount>.85?'closed':art.amount>.5?'ajar':art.amount>.15?'half':'open';
      art.image.setFrame(frame).setDisplaySize(frame==='closed'?25:frame==='ajar'?20:frame==='half'?13:5,31).setVisible(d.floor===pos.floor);
      art.label.setVisible(d.floor===pos.floor);
    }
    // Public, readable class gear and an unmistakable hunter cowl; no hidden roles.
    for (const p of state.avatars.filter(
      (p) => p.status === "active" && !(p.id === me.id && me.hidden),
    )) {
      const a = this.actors.get(p.id),
        gear = p.id === me.id ? this.ownGear : g,
        x = Math.round(a.sprite.x),
        y = Math.round(a.sprite.y),
        rect = (dx, dy, w, h, c) =>
          gear.fillStyle(c,p.grass ? .48 : 1).fillRect(x + dx, y + dy, w, h);
      if (p.role === "Killer") {
        rect(-6, -21, 12, 10, 0x493040);
        rect(-4, -19, 8, 6, 0x6d4050);
        rect(-3, -17, 2, 1, 0xf1d6aa);
        rect(2, -17, 2, 1, 0xf1d6aa);
        rect(-7, -11, 14, 3, 0x974e5d);
      } else if (t < p.hulkUntil) {
        rect(-10, -17, 20, 13, 0x6f9d6f);
        rect(-13, -14, 5, 11, 0x8cba7b);
        rect(8, -14, 5, 11, 0x8cba7b);
        rect(-6, -28, 12, 10, 0x95b980);
      } else if (p.class === "Photographer") {
        rect(4, -12, 6, 5, 0x495866);
        rect(5, -11, 4, 3, 0xb3c2b4);
        rect(6, -10, 2, 2, 0x4b7182);
      }
    }
    if (me.role !== "Killer" && !ghost())
      for (const q of path)
        if (q.floor === pos.floor) {
          g.fillStyle(0x71603b).fillRect(q.x - 2, q.y - 1, 4, 3);
          g.fillStyle(0xe9cc7b).fillRect(q.x - 1, q.y - 1, 2, 2);
        }

    for (const p of state.avatars) {
      if (p.shieldUntil > t)
        g.lineStyle(1, 0xcee4b0).strokeRect(p.x - 8, p.y - 23, 16, 26);
      if (p.stunUntil > t)
        for (let i = 0; i < 3; i++)
          g.fillStyle(0xece0a2).fillRect(
            p.x - 9 + i * 8,
            p.y - 28 + (i % 2 ? 2 : 0),
            3,
            3,
          );
    }
    if (
      me.class === "Photographer" &&
      me.role !== "Killer" &&
      me.status === "active" &&
      !panel
    ) {
      const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[
        aim
      ];
      g.lineStyle(1, 0xe6dcaa, 0.65).lineBetween(
        pos.x,
        pos.y - 8,
        pos.x + v[0] * 23,
        pos.y - 8 + v[1] * 23,
      );
    }
    for (const e of state.events.filter(
      (e) => e.type === "flash" && e.floor === pos.floor && t - e.at < 220,
    )) {
      g.lineStyle(2, 0xffe3a5, 0.7);
      const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[
        e.direction
      ];
      g.lineBetween(
        e.x,
        e.y - 8,
        e.x + v[0] * 55 + v[1] * 20,
        e.y - 8 + v[1] * 55 + v[0] * 20,
      ).lineBetween(
        e.x,
        e.y - 8,
        e.x + v[0] * 55 - v[1] * 20,
        e.y - 8 + v[1] * 55 - v[0] * 20,
      );
    }
    drawChaseFeedback(g,state,t,reducedFeedback());
    paintFocus(this.focusGraphics,state,context());
    paintFeedback(this.feedbackGraphics,feedbackEffects,performance.now(),pos.floor,reducedFeedback());
    this.fog
      .clear()
      .fillStyle(0x17212b)
      .fillRect(0, 0, W * TILE, H * TILE);
    this.sight.clear();
    const polygon = visibilityPolygon(
      pos,
      huntRadius(me, state.dark),
      doors.filter((d) => state.closedDoors.some((q) => q.id === d.id)),
    );
    this.sight
      .fillStyle(0xffffff)
      .beginPath()
      .moveTo(polygon[0].x, polygon[0].y);
    for (const q of polygon.slice(1)) this.sight.lineTo(q.x, q.y);
    this.sight.closePath().fillPath();
    this.architecture.setVisible(!state.dark);
    this.wallMask.clear();
    if (!state.dark) {
      this.wallMask.fillStyle(0xffffff);
      for (const f of visibleWallFaces(pos))
        this.wallMask.fillRect(f.x, f.y, f.w, f.h);
    }
    if (this.wasRevealing !== revealActive()) {
      this.wasRevealing = revealActive();
      if (panel === "map") {
        panelSignature = "";
        renderPanel();
      }
    }
    this.pings.clear();
    if (
      me.status === "active" &&
      state.phase === "hunt" &&
      !(me.role === "Killer" && !me.carrying)
    ) {
      const turn = nextTurn(pos, path);
      if (turn) {
        const [dx, dy] = {
          up: [0, -1],
          down: [0, 1],
          left: [-1, 0],
          right: [1, 0],
        }[turn];
        const x = Math.round(pos.x + dx * 22),
          y = Math.round(pos.y - 7 + dy * 22);
        this.pings
          .lineStyle(3, 0x292f38)
          .beginPath()
          .moveTo(x - dx * 5, y - dy * 5)
          .lineTo(x + dx * 4, y + dy * 4)
          .strokePath();
        this.pings
          .fillStyle(state.dark ? 0xffcf70 : 0xf6e6a5)
          .fillTriangle(
            x + dx * 7,
            y + dy * 7,
            x - dx * 2 + dy * 5,
            y - dy * 2 - dx * 5,
            x - dx * 2 - dy * 5,
            y - dy * 2 + dx * 5,
          );
      }
    }
    if (revealActive()) {
      for (const q of [...state.reveals, ...state.hulkGPS].filter(
        (q) => q.floor === pos.floor,
      )) {
        this.pings.lineStyle(1, 0xffa38d).strokeCircle(q.x, q.y - 7, 11);
        this.pings.fillStyle(0xffc39e).fillRect(q.x - 1, q.y - 28, 2, 7);
      }
    }
    const scream = $("#scream-map");
    scream.hidden = !revealActive() && !state.hulkGPS.length;
    if (!scream.hidden)
      html(
        scream,
        `<b>${revealActive() ? "SCREAM · " + Math.max(0, (state.revealUntil - t) / 1000).toFixed(1) + "s" : "HULK LIVE GPS"}</b><div>${areaNames.map((n, f) => `<section><small>${n}</small>${mapMarkup(f, [...(revealActive() ? state.reveals : []), ...state.hulkGPS])}</section>`).join("")}</div>`,
      );
    $("#hunt-notice").hidden = true;
    $("#hunt-clock").textContent =
      state.phase === "hunt"
        ? t < state.unlockAt
          ? "HEAD START · " + cooldown(state.unlockAt) + "s"
          : Math.floor(Math.ceil(Math.max(0, state.deadline - t) / 1000) / 60) +
            ":" +
            String(
              Math.ceil(Math.max(0, state.deadline - t) / 1000) % 60,
            ).padStart(2, "0")
        : state.phase === "lobby"
          ? "LOBBY"
          : "DAWN";
    $("#hunt-dark").textContent =
      "BLACKOUT · backup in " + cooldown(state.blackoutEndsAt) + "s";
    renderSecurityFeeds(this, state, time);
    renderChannels(state, t);
  }
}
function renderChannels(s, t) {
  const p = s.me,
    c = p.channel,
    m = p.repairing && s.machines.find((m) => m.id === p.repairing);
  $("#hunt-channel").hidden =
    !p.hulkReadyAt && !c && !m && !["carried", "captured", "downed"].includes(p.status);
  if (p.hulkReadyAt)
    html($("#hunt-channel"),`<b>INJECTION · TRANSFORMING</b><div><i style="width:${Math.max(0,Math.min(100,100*(1-(p.hulkReadyAt-t)/rules.hulkWindup)))}%"></i></div><small>Struggling… twelve seconds of Hulk begin when this completes.</small>`);
  else if(p.assist)
    html($('#hunt-channel'),`<b>HELP IS HERE · BEING RESCUED</b><div><i style="width:${Math.max(0,Math.min(100,100*(t-p.assist.started)/(p.assist.until-p.assist.started)))}%"></i></div><small>Your teammate is freeing you.</small>`);
  else if (m)
    html(
      $("#hunt-channel"),
      `<b>${ghost() ? "SPIRIT REPAIR · capped contribution" : "REPAIRING · " + m.workers + " workers"}</b><div><i style="width:${m.progress * 100}%"></i></div><small>${Math.floor(m.progress * 100)}% · keep holding E · move to stop</small>`,
    );
  else if (c)
    html(
      $("#hunt-channel"),
      `<b>${esc({ damageMachine: "Damaging machine · −40%", strike: "Strike committed", pickup: "Lifting survivor", chain: "Chaining at table", rescue: "Rescuing teammate", power: "Restoring electricity", escape: "Escaping the manor", chest: "Unlocking treasure", drawer: "Searching drawers", portal: "Through the portal", arch: "Through the arch", travel: "Through the passage", hide: "Entering wardrobe", search: "Searching wardrobe" }[c.kind] || c.kind)}</b><div><i style="width:${Math.max(0, Math.min(100, ((t - c.started) / (c.until - c.started)) * 100))}%"></i></div><small>${c.kind === "strike" ? "Committed strike · you can move slowly" : ["portal", "travel", "arch"].includes(c.kind) ? "Travelling…" : "Moving cancels"}</small>`,
    );
  else if (p.status === "carried")
    html(
      $("#hunt-channel"),
      `<b>WIGGLE · TAP E / F</b><div><i style="width:${(p.wiggle / p.wiggleGoal) * 100}%"></i></div><small>${p.wiggle}/${p.wiggleGoal} · ${t>=p.wiggleReadyAt?'TAP NOW':'Good tap…'} · escape stuns hunter 1.5s</small>`,
    );
  else if (p.status === "captured")
    html(
      $("#hunt-channel"),
      `<b>CHAINED · ${p.captures}/3 · ${cooldown(p.captureUntil)}s</b><div><i style="width:${Math.min(100, (p.camp / rules.campRelease) * 100)}%"></i></div><small>${p.camp ? "Hunter camping · freedom charging" : "A teammate must rescue you"}</small>`,
    );
  else if (p.status === "downed")
    html(
      $("#hunt-channel"),
      "<b>DOWNED · crawl to a teammate</b><small>The hunter must carry you to a table.</small>",
    );
  const captive = p.captive;
  $("#hunt-carry-meter").hidden = !captive;
  if (captive)
    html(
      $("#hunt-carry-meter"),
      `<b>${esc(captive.name)} · WIGGLING FREE</b><div><i style="width:${Math.min(100, (captive.wiggle / captive.goal) * 100)}%"></i></div><small>${captive.wiggle}/${captive.goal} · reach a table before they escape</small>`,
    );
  $("#hunter-timeout").hidden = !(p.role === "Killer" && t < p.timeoutUntil);
  if (!$("#hunter-timeout").hidden)
    $("#hunter-timeout span").textContent = cooldown(p.timeoutUntil) + "s";
}
function sendInput() {
  if (!state || !socket.connected) return;
  const editing =
      panel ||
      deathAnimationActive() ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName),
    dx = editing
      ? 0
      : touch.x ||
        (keys.d || keys.ArrowRight ? 1 : 0) -
          (keys.a || keys.ArrowLeft ? 1 : 0),
    dy = editing
      ? 0
      : touch.y ||
        (keys.s || keys.ArrowDown ? 1 : 0) - (keys.w || keys.ArrowUp ? 1 : 0);
  socket.emit("input", cardinal(dx, dy, axis === "x" ? "right" : "down"));
}
setInterval(() => {
  sendInput();
  if (repairHeld && performance.now() - lastRepair > 450) {
    lastRepair = performance.now();
    command("repair", { object: repairHeld });
  }
}, 50);
window.addEventListener("keydown", (e) => {
  if (
    ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) ||
    deathAnimationActive()
  )
    return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keys[k] = true;
  if (e.key.startsWith("Arrow")) e.preventDefault();
  if (
    [
      "a",
      "d",
      "ArrowLeft",
      "ArrowRight",
      "w",
      "s",
      "ArrowUp",
      "ArrowDown",
    ].includes(k)
  ) {
    stopRepair();
    axis = ["a", "d", "ArrowLeft", "ArrowRight"].includes(k) ? "x" : "y";
    aim = {
      a: "left",
      d: "right",
      w: "up",
      s: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    }[k];
  }
  sendInput();
  if (e.repeat) return;
  if (k === "Escape") {
    if (panel !== "lobby") openPanel(panel);
    return;
  }
  if (k === "v" && state?.me.class === "Hulk" && state.me.role !== "Killer") { openPanel("vitals"); return; }
  if (k === "f" && state?.me.class === "Hulk" && state.me.role !== "Killer") { power(); return; }
  if(k==='m'&&panel==='map'){openPanel('map');return;}
  if (panel) return;
  if (k === "e") use(true);
  if (k === "f") power();
  if (k === "q") command("attack", { direction: aim });
  if (k === "x") command("whip", { direction: aim });
  if (k === "r" && state?.me.role === "Killer") command("blackout");
  if (k === "l") command("light");
  if (k === "b") command("sensor");
  if (k === "g" && ghost()) command("ghostFloor");
  if (k === "m") openPanel("map");
  if (k === "n") openPanel("objectives");
});
window.addEventListener("keyup", (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  delete keys[k];
  if (k === "e") stopRepair();
  sendInput();
});
window.addEventListener("blur", clearInput);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearInput();
});
socket.on("connect", () => {
  if ($("#hunt-connection")) $("#hunt-connection").textContent = "● Connected";
  if ($("#hunt-disconnected")) $("#hunt-disconnected").hidden = true;
  if (state) {
    const seat = JSON.parse(sessionStorage.getItem(seatKey) || "null");
    if (seat) command("resume", seat);
  }
});
socket.on("disconnect", () => {
  clearInput();
  if ($("#hunt-disconnected")) $("#hunt-disconnected").hidden = false;
});
socket.on("state", (s) => {
  const prev = state;
  state = s;
  packetAt = performance.now();
  if (!prev) shell();
  if (
    repairHeld &&
    (!["active", "eliminated"].includes(s.me.status) ||
      s.machines.find((m) => m.id === repairHeld)?.done)
  )
    repairHeld = null;
  updateUI(prev);
});
entrance();

function renderSecurityFeeds(scene, s, time) {
  if (time - (scene.lastSecurityFrame || 0) < 100) return;
  scene.lastSecurityFrame = time;
  if (panel !== "security" || !s.security || s.security.offline) return;
  for (const feed of s.security.feeds) {
    const canvas = document.querySelector(`[data-camera="${feed.id}"]`);
    if (!canvas) continue;
    const g = canvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.fillStyle = "#121f2a";
    g.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / feed.w, canvas.height / feed.h),
      ox = (canvas.width - feed.w * scale) / 2,
      oy = (canvas.height - feed.h * scale) / 2;
    g.save();
    g.translate(ox, oy);
    g.scale(scale, scale);
    g.translate(-feed.x + feed.w / 2, -feed.y + feed.h / 2);
    const poly = visibilityPolygon(
      feed,
      110,
      doors.filter((d) => s.closedDoors.some((q) => q.id === d.id)),
    );
    g.beginPath();
    g.moveTo(poly[0].x, poly[0].y);
    for (const p of poly.slice(1)) g.lineTo(p.x, p.y);
    g.closePath();
    g.clip();
    const map = scene.textures.get("mansion" + feed.floor).getSourceImage();
    g.drawImage(map, 0, 0, map.width / ART_SCALE, map.height / ART_SCALE);
    drawHuntProps(
      { markers: cameraGraphics(g) },
      { ...s, position: { floor: feed.floor } },
      time,
      s.serverNow,
      reducedFeedback(),
    );
    const loot = scene.textures.get("lpc-containers").getSourceImage();
    for (const c of feed.chests || [])
      g.drawImage(
        loot,
        64,
        c.opened ? 320 : 256,
        64,
        32,
        c.x - 12,
        c.y - 12,
        25,
        18,
      );
    for (const d of doors.filter((d) => d.floor === feed.floor)) {
      const image = scene.doorArt.get(d.id)?.image;
      if (!image) continue;
      const f = image.frame;
      g.save();
      g.translate(image.x, image.y);
      g.rotate(image.rotation);
      g.drawImage(
        f.source.image,
        f.cutX,
        f.cutY,
        f.cutWidth,
        f.cutHeight,
        0,
        -image.displayHeight,
        image.displayWidth,
        image.displayHeight,
      );
      g.restore();
    }
    for (const p of feed.avatars) {
      g.save();g.globalAlpha=p.grass ? .48 : 1;
      const sheet = scene.textures.get(avatarTexture(p)).getSourceImage();
      const dir = { down: 0, left: 1, right: 2, up: 3 }[p.dir] || 0,
        frame = dir * 3 + (p.moving ? Math.floor(time / 120 * (s.speed||1)) % 3 : 1);
      g.drawImage(
        sheet,
        frame * 32,
        p.index * 48,
        32,
        48,
        Math.round(p.x - 8),
        Math.round(p.y - 21),
        16,
        24,
      );
      g.fillStyle = p.role === "Killer" ? "#f49480" : "#cce2d2";
      g.fillRect(p.x - 2, p.y + 3, 4, 1);g.restore();
    }
    g.restore();
  }
}
