import { panels } from "../hunt-world.mjs";
import { routeTo } from "./hunt-navigation.js";

export const electrical = panels.map((p) => ({
  ...p,
  title: p.title || "Electrical room breaker",
}));

// Static map information only: never consult another player's hidden position.
export function nearestBreaker(position, closed = [], broken = []) {
  const local = electrical
    .filter((p) => p.floor === position.floor)
    .map((p) => ({ p, route: routeTo(position, p, closed, broken) }))
    .filter((q) => q.route.length);
  return (
    local.sort((a, b) => a.route.length - b.route.length)[0]?.p ||
    electrical.find((p) => p.floor === position.floor) ||
    electrical[0]
  );
}

export function nextTurn(position, path) {
  const q = path.find(
    (q) => Math.hypot(q.x - position.x, q.y - position.y) > 10,
  );
  if (!q) return null;
  const dx = q.x - position.x,
    dy = q.y - position.y;
  return Math.abs(dx) > Math.abs(dy)
    ? dx > 0
      ? "right"
      : "left"
    : dy > 0
      ? "down"
      : "up";
}

export function abilityGuide(p, time, phase = "hunt", unlockAt = 0) {
  const guides = {
    Photographer: [
      "◎",
      "Camera flash",
      "Face the hunter, then F / tap FLASH to stun. Aim with mouse or walking direction.",
    ],
    Magician: [
      "◉",
      "Portal pair",
      "F / tap PORTAL on clear floor. Place two; E travels between them. The hunter can use them too.",
    ],
    "Escape Artist": [
      "➜",
      "Dash",
      "Walk in your escape direction, then F / tap DASH. E at a grille opens secret routes.",
    ],
    Engineer: [
      "⚙",
      "Remote door",
      "F / tap REMOTE DOOR, then choose a door. It closes for one second. You also repair faster.",
    ],
    Hulk: [
      "◆",
      "Experimental injection",
      "F / tap INJECT once per hunt. Struggle for three seconds, then become Hulk. V opens live vitals anytime with no cooldown. Twelve seconds of protection; Q strikes the hunter or marked screens.",
    ],
  };
  const [icon, title, hint] =
    p.role === "Killer"
      ? [
          "◈",
          "SCREAM",
          "F / tap SCREAM reveals survivors outside tall grass for two seconds. R cuts power; Q strikes; E carries and chains.",
        ]
      : guides[p.class] || [
          "?",
          "Class assigned at start",
          "Your power and controls appear here when the hunt starts.",
        ];
  let reason = "";
  if (phase !== "hunt") reason = "Waiting for the hunt";
  else if (p.status !== "active")
    reason =
      p.status === "carried"
        ? "Tap E / F repeatedly to wiggle free"
        : "Unavailable while " + p.status;
  else if (p.hidden) reason = "Leave the wardrobe first";
  else if (p.channel) reason = "Finish or move to cancel your current action";
  else if (
    p.role === "Killer" &&
    time < Math.max(unlockAt, p.stunUntil || 0, p.timeoutUntil || 0)
  )
    reason = "Hunter is temporarily held";
  else if (p.hulkReadyAt > time)
    reason = "Transforming · " + Math.ceil((p.hulkReadyAt-time)/1000) + "s · brace yourself";
  else if (p.hulkUntil > time)
    reason = "HULK ACTIVE · " + Math.ceil((p.hulkUntil-time)/1000) + "s · Q to strike";
  else if (p.role !== "Killer" && p.class === "Hulk" && p.hulkUsed)
    reason = "One use spent this hunt";
  else if (
    p.role !== "Killer" &&
    p.class === "Magician" &&
    p.portalsPlaced >= 2
  )
    reason = "Both portals placed · E to travel";
  else if (p.role !== "Killer" && p.class === "Photographer" && !p.flashCharges)
    reason =
      "Film recharging" +
      (p.flashNext > time
        ? " · " + Math.ceil((p.flashNext - time) / 1000) + "s"
        : "");
  else if (p.powerAt > time)
    reason = "Recharging · " + Math.ceil((p.powerAt - time) / 1000) + "s";
  return {
    icon,
    title,
    hint,
    ready: !reason,
    status: reason || "READY · F or tap the power button",
    className: p.role === "Killer" ? "Hunter" : p.class === "Hulk" ? "Scientist" : p.class,
  };
}
