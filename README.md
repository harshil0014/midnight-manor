# Midnight Manor

A top-down multiplayer mansion hunt. One known hunter, five survivor classes, two mansion floors and a courtyard. Repair machines, rescue friends and reach the gates. Play with friends or bots.

## Run locally

Use Node.js 22 or newer.

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:5174/. Host a hunt, invite friends or fill seats with bots, then start. WASD/arrows move; hold E to repair/interact; F activates your power; M opens the map. Touch controls appear on phones.

Room state is held in memory; restarting the server ends current rooms. The default host is loopback. A public deployment needs a suitable Node/Socket.IO host and its assigned PORT. This repository contains the current hunt mode only.

## Verify

```sh
npm test
npm run build
npm run simulate -- 23
```

Tests include server-authoritative rules, multiplayer privacy, movement, powers, doors, rescue, machines, rematches and room routes. Network tests use an IPC-only fixture; there is no public staging endpoint.

## Credits

Third-party libraries and licensed art are reused with attribution. See ASSET-CREDITS.md, THIRD-PARTY-NOTICES.txt and the complete component credits/license texts in public/assets/. No proprietary game sprites or ROM data are included.
