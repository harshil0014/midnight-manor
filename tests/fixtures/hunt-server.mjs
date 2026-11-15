// IPC-only test seam. There are no staging endpoints in the public game server.
import { rooms } from "../../server.mjs";
import {
  machines,
  tables,
  exitDoors,
  doors,
  securityTerminal,
  cameraStations,
} from "../../hunt-world.mjs";
process.on("message", (m) => {
  try {
    const r = rooms.get(m.code),
      at = Date.now();
    if (!r) throw Error("Room missing");
    if (m.op === "arrange") {
      r.unlockAt = 0;
      r.screamAt = 0;
      r.blackoutAt = 0;
      r.revealUntil = 0;
      r.deadline = at + 120000;
      r.dark = false;
      r.manualDoors = {};
      for (const [i, p] of r.players.entries()) {
        Object.assign(p, {
          channel: null,
          repairing: null,
          hidden: null,
          status: "active",
          shieldUntil: 0,
          stunUntil: 0,
          resistUntil: 0,
          attackAt: 0,
          powerAt: 0,
          timeoutUntil: 0,
          hulkUntil: 0,
          hulkUsed: false,
          carrying: null,
          carriedBy: null,
          captures: 0,
          wiggle: 0,
          lastWiggle: 0,
          ventAt: 0,
          portalsPlaced: 0,
        });
        r.positions[p.id] = { floor: 1, x: 408 + i * 2, y: 200, dir: "down" };
      }
      for (const [i, p] of Object.entries(m.positions || {}))
        r.positions[r.players[+i].id] = { dir: "right", ...p };
    }
    if(m.op==="console"){
      r.positions[r.players[m.index].id]={...securityTerminal};
      r.positions[r.players[2].id]={floor:cameraStations[0].floor,x:cameraStations[0].x+12,y:cameraStations[0].y};
    }
    if(m.op==="physicalDoor"){
      const d=doors[0];for(const [i,sign]of [[m.index,-1],[m.other,1]])r.positions[r.players[i].id]={floor:d.floor,x:d.x+sign*20,y:d.y};
    }
    if(m.op==="pressure")for(const v of Object.values(r.machines).slice(0,r.required-2)){v.done=true;v.progress=1;}
    if(m.op==="darkness"){r.dark=true;r.blackoutEndsAt=at+40000;}
    if(m.op==="stomp"){
      const p=r.players[0],k=r.players.find(q=>q.role==="Killer");
      p.class="Hulk";p.hulkUntil=at+5000;p.hidden=null;p.channel=null;
      r.positions[p.id]={floor:0,x:552,y:392,dir:"right"};
      r.positions[k.id]={floor:1,x:552,y:56,dir:"down"};
    }
    if(m.op==="damage"){
      const station=machines[0],k=r.players.find(p=>p.role==="Killer");
      r.machines[station.id].done=false;r.machines[station.id].progress=.9;
      r.machines[station.id].damageProtectedUntil=0;k.damageAt=0;k.channel=null;k.stunUntil=0;k.timeoutUntil=0;
      r.positions[k.id]={...station.point};
    }
    if (m.op === "backupSoon") r.blackoutEndsAt = at + 400;
    if (m.op === "drawer") {
      const d = r.drawers[0];
      r.positions[r.players[m.index].id] = {
        floor: d.floor,
        x: d.x,
        y: d.y,
        dir: "up",
      };
      r.players[m.index].keys = 0;
    }
    if (m.op === "class") r.players[m.index].class = m.class;
    if (m.op === "endHulk") r.players[m.index].hulkUntil = at;
    if (m.op === "carry") {
      const k = r.players.find((p) => p.role === "Killer"),
        p = r.players[m.index];
      k.carrying = p.id;
      p.carriedBy = k.id;
      p.status = "carried";
      r.positions[p.id] = { ...r.positions[k.id] };
    }
    if (m.op === "station") {
      const a = machines.find((q) => q.id === m.station);
      r.positions[r.players[m.index].id] = { ...a.point, dir: "down" };
    }
    if (m.op === "finish") {
      for (const o of Object.values(r.machines).slice(0, r.required)) {
        o.done = true;
        o.progress = 1;
      }
      r.exitsOpen = true;
      r.positions[r.players[m.index].id] = {
        ...exitDoors[m.exit || 0],
        dir: "left",
      };
    }
    if (m.op === "table") {
      const p = r.players[m.index];
      p.status = "captured";
      p.table = tables[0].id;
      p.captureUntil = at + 60000;
      r.positions[p.id] = { ...tables[0] };
    }
    for (const q of r.players) {
      const a = r.positions[q.id];
      r.positions[q.id] = {
        floor: a.floor,
        x: a.x,
        y: a.y,
        dir: a.dir || "down",
      };
    }
    process.send?.({ id: m.id, ok: true, drawer: r.drawers?.[0]?.id });
  } catch (e) {
    process.send?.({ id: m.id, error: e.message });
  }
});
