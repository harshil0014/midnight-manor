import { test } from "node:test";
import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { io } from "socket.io-client";
import { tables } from "../hunt-world.mjs";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
test(
  "real eight-client palace hunt: private scream, co-op work, carry/wiggle, door timing, escape and resume",
  { timeout: 45000 },
  async () => {
    const child = fork(
        new URL("./fixtures/hunt-server.mjs", import.meta.url),
        ["--production"],
        {
          silent: true,
          env: {
            ...process.env,
            DAD_MODE: "hunt",
            PORT: "5205",
            HOST: "127.0.0.1",
          },
        },
      ),
      clients = [];
    let output = "",
      seq = 0;
    child.stdout.on("data", (x) => (output += x));
    child.stderr.on("data", (x) => (output += x));
    const stage = (data) =>
      new Promise((resolve, reject) => {
        const id = ++seq;
        const f = (m) => {
          if (m.id !== id) return;
          child.off("message", f);
          m.error ? reject(Error(m.error)) : resolve(m);
        };
        child.on("message", f);
        child.send({ ...data, id });
      });
    const connect = async () => {
      const s = io("http://127.0.0.1:5205", {
        transports: ["websocket"],
        forceNew: true,
      });
      clients.push(s);
      await new Promise((res, rej) => {
        s.once("connect", res);
        s.once("connect_error", rej);
      });
      s.state = null;
      s.on("state", (v) => (s.state = v));
      return s;
    };
    const cmd = (s, action, data = {}) =>
      new Promise((resolve, reject) =>
        s
          .timeout(3000)
          .emit("command", { action, ...data }, (err, r) =>
            err ? reject(err) : resolve(r),
          ),
      );
    const until = async (fn, ms = 3500) => {
      const end = Date.now() + ms;
      while (!fn() && Date.now() < end) await wait(20);
      assert(fn(), "expected live socket state");
    };
    try {
      for (let i = 0; i < 100 && !output.includes("http://"); i++)
        await wait(50);
      assert(output.includes("http://"), output);
      const host = await connect(),
        seat = await cmd(host, "create", { name: "Host" }),
        code = seat.code;
      const crew = [host];
      for (let i = 1; i < 8; i++) {
        const s = await connect();
        assert((await cmd(s, "join", { code, name: "Guest " + i })).ok);
        crew.push(s);
      }
      await until(() => host.state?.players.length === 8);
      const k = crew[1];
      await cmd(host, "setKiller", { target: k.state.me.id });
      await cmd(host, "start");
      await until(() => host.state?.phase === "hunt");
      await stage({
        code,
        op: "arrange",
        positions: {
          0: { floor: 2, x: 520, y: 400 },
          1: { floor: 0, x: 552, y: 392 },
          2: { floor: 0, x: 566, y: 392 },
        },
      });
      await until(
        () =>
          host.state.liveMap?.length === 7 && host.state.position.floor === 2,
      );
      assert.deepEqual(
        k.state.liveMap.map((p) => p.id),
        [k.state.me.id],
      );
      assert.equal(
        host.state.liveMap.find((p) => p.id === host.state.me.id).floor,
        2,
      );
      assert((await cmd(k, "blackout")).ok);
      await until(() => host.state.dark && host.state.liveMap.length === 1);
      assert.equal(host.state.liveMap[0].id, host.state.me.id);
      assert(host.state.blackoutEndsAt - host.state.serverNow > 39000);
      assert.deepEqual(
        k.state.liveMap.map((p) => p.id),
        [k.state.me.id],
      );
      await stage({ code, op: "backupSoon" });
      await until(() => !host.state.dark && host.state.liveMap.length === 7);
      assert.equal(host.state.blackoutEndsAt, 0);
      await cmd(k, "power");
      await until(() => k.state.reveals.length === 7);
      assert.equal(
        k.state.reveals.find((p) => p.id === host.state.me.id).floor,
        2,
      );
      assert.equal(host.state.reveals.length, 0);
      const end = k.state.revealUntil;
      await until(() => Date.now() > end && k.state.reveals.length === 0, 2600);
      assert.equal(k.state.revealUntil, 0);
      await stage({ code, op: "station", index: 0, station: "machine-music" });
      await stage({ code, op: "station", index: 2, station: "machine-music" });
      const before = host.state.machines[0].progress;
      for (let i = 0; i < 5; i++) {
        assert((await cmd(host, "repair", { object: "machine-music" })).ok);
        assert((await cmd(crew[2], "repair", { object: "machine-music" })).ok);
        await wait(350);
      }
      await until(() => host.state.machines[0].progress > before + 0.01);
      assert(host.state.machines[0].workers >= 2);
      await cmd(host, "close");
      await cmd(crew[2], "close");
      await until(() => !host.state.me.repairing);
      await stage({
        code,
        op: "arrange",
        positions: {
          0: { floor: 0, x: 552, y: 392 },
          1: { floor: 0, x: 566, y: 392 },
        },
      });
      const searched = await stage({ code, op: "drawer", index: 0 });
      await until(
        () =>
          host.state.me.keys === 0 &&
          host.state.drawers?.some((d) => d.id === searched.drawer),
      );
      assert.equal(host.state.keys.length, 0);
      assert(
        (await cmd(crew[3], "interact", { object: searched.drawer })).error,
      );
      assert((await cmd(host, "interact", { object: searched.drawer })).ok);
      await until(() => host.state.me.keys === 1);
      await stage({
        code,
        op: "arrange",
        positions: {
          0: { floor: 0, x: 552, y: 392 },
          1: { floor: 0, x: 566, y: 392 },
        },
      });
      await stage({ code, op: "carry", index: 0 });
      await until(() => host.state.me.status === "carried");
      await until(() => k.state.me.captive?.id === host.state.me.id);
      assert.equal(crew[2].state.me.captive, null);
      for (let i = 0; i < 20; i++) {
        assert((await cmd(host, "wiggle")).ok);
        if (i === 0) {
          assert((await cmd(host, "wiggle")).ok);
          await until(() => k.state.me.captive?.wiggle === 1);
        }
        if (i < 19) await wait(410);
      }
      await until(
        () => host.state.me.status === "active" && k.state.me.captive === null,
      );
      await until(() => k.state.me.stunUntil > Date.now());
      await wait(1600);
      await stage({ code, op: "class", index: 0, class: "Engineer" });
      assert((await cmd(host, "power", { door: "door-0" })).ok);
      await until(() => k.state.closedDoors.length > 0);
      const untilAt = k.state.closedDoors[0].until;
      await until(
        () => Date.now() > untilAt && k.state.closedDoors.length === 0,
        1400,
      );
      await stage({
        code,
        op: "arrange",
        positions: {
          0: { floor: tables[0].floor, x: tables[0].x, y: tables[0].y },
          1: { floor: 1, x: 552, y: 56 },
        },
      });
      await stage({ code, op: "table", index: 2 });
      await until(() =>
        host.state.rescues.some((p) => p.id === crew[2].state.me.id),
      );
      assert((await cmd(host, "rescue", { target: crew[2].state.me.id })).ok);
      await until(() => crew[2].state.me.status === "active");
      assert(crew[2].state.me.shieldUntil > Date.now());
      await stage({ code, op: "physicalDoor", index: 0, other: 1 });
      assert((await cmd(host, "door", { object: "door-0" })).ok);
      await until(
        () =>
          host.state.closedDoors.some((d) => d.id === "door-0" && d.manual) &&
          k.state.closedDoors.some((d) => d.id === "door-0" && d.manual),
      );
      await wait(360);
      assert((await cmd(k, "door", { object: "door-0" })).ok);
      await until(() => !host.state.closedDoors.some((d) => d.id === "door-0"));
      await stage({ code, op: "console", index: 0 });
      assert((await cmd(host, "security")).ok);
      await until(() => host.state.security?.feeds.length === 4);
      assert(
        host.state.security.feeds[0].avatars.some(
          (p) => p.id === crew[2].state.me.id,
        ),
      );
      assert.equal(crew[2].state.security, null);
      await stage({ code, op: "darkness" });
      await until(() => host.state.security?.offline === true);
      assert.equal(host.state.security.feeds.length, 0);
      assert((await cmd(host, "close")).ok);
      await stage({code,op:"damage"});
      await until(()=>k.state.machines[0].progress===.9);
      assert((await cmd(k,"damageMachine",{object:k.state.machines[0].id})).ok);
      await until(()=>k.state.me.channel?.kind==="damageMachine");
      await until(()=>host.state.machines[0].progress===.5 && k.state.machines[0].progress===.5);
      assert((await cmd(k,"damageMachine",{object:k.state.machines[0].id})).error);
      await stage({ code, op: "pressure" });
      await stage({code,op:"class",index:0,class:"Hulk"});
      await until(()=>host.state.me.class==="Hulk");
      assert((await cmd(host,"power")).ok);
      await until(()=>host.state.me.hulkReadyAt>Date.now());
      assert.equal(host.state.me.hulkUntil,0);
      await until(()=>host.state.me.hulkUntil>Date.now(),4000);
      const remaining=host.state.me.hulkUntil-Date.now();
      assert(remaining>11700 && remaining<=12000,`post-animation Hulk time: ${remaining}`);
      await stage({code,op:"stomp"});
      host.emit("input",{x:1,y:0});
      await until(()=>host.state.hulkFootstep?.seq>0 && k.state.hulkFootstep?.seq>0);
      host.emit("input",{x:0,y:0});
      assert.equal(k.state.position.floor,1);
      assert.equal(host.state.position.floor,0);
      await until(() => host.state.pressure && k.state.pressure);
      await stage({ code, op: "finish", index: 0 });
      assert((await cmd(host,"interact",{object:"north-gate"})).error);
      await stage({code,op:"endHulk",index:0});
      assert((await cmd(host, "interact", { object: "north-gate" })).ok);
      await until(() => host.state.me.status === "escaped");
      assert.equal(host.state.phase, "hunt");
      assert(host.state.players.find((p) => p.id === host.state.me.id).victory);
      assert((await cmd(host, "sensor")).error);
      const id = host.state.me.id;
      host.disconnect();
      await wait(80);
      const resumed = await connect();
      assert((await cmd(resumed, "resume", { code, token: seat.token })).ok);
      await until(() => resumed.state?.me.id === id);
      assert.equal(resumed.state.me.status, "escaped");
      const duplicate = await connect();
      assert(
        (await cmd(duplicate, "resume", { code, token: seat.token })).error,
      );
    } finally {
      for (const s of clients) s.disconnect();
      child.kill();
    }
  },
);
