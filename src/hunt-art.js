import { drawLpcFurniture } from "./lpc-furniture.js";
import { drawLpcFloor, drawLpcRug, drawLpcWall } from "./lpc-surfaces.js";
import {drawRoomAtmosphere,drawRoomWallAccent} from './room-atmosphere.js';
import {drawCourtyardGarden} from './courtyard-garden.js';
import {outlineAvatarAtlas} from './avatar-outline.js';
import { paintOutfit, outfitClasses } from "./avatar-outfits.js";
import { drawFurniture } from "./furniture.js";
import {
  W,
  H,
  TILE,
  rooms,
  objects,
  passages,
  floorRegions,
  structural,
  sightMaps,
  zoneAt,
  grass,
} from "../hunt-world.mjs";
export const ART_SCALE = 2;
export const roomThemes = {
  security: ["#ccd9dc", "#526f80"],
  electrical: ["#d9d6bc", "#84948b"],
  music: ["#e8caad", "#ac7c91"],
  dining: ["#f0d3a4", "#b98150"],
  study: ["#d6e4c0", "#7b9d78"],
  kitchen: ["#e8edd0", "#87b8b0"],
  courtyard: ["#eee2b1", "#baa17b"],
  bedroom: ["#d9d4ec", "#989ac0"],
  library: ["#e3c49b", "#ac7d53"],
  terrace: ["#c7dde5", "#7e9eae"],
  garden: ["#c8dfac", "#7c9e69"],
  gallery: ["#e8e5d3", "#9db7bd"],
  stairs: ["#e8d8b8", "#b79c78"],
  passage: ["#c9cdbf", "#98a39b"],
};
export const palettes = [
  "#d66e46",
  "#54a3a0",
  "#9673bd",
  "#dfb752",
  "#c15980",
  "#6a97be",
  "#7fa96c",
  "#db9364",
  "#5f76b5",
  "#b66eac",
  "#52a58c",
  "#bf5658",
  "#b2a55c",
  "#8e83be",
  "#d67e9c",
  "#74a7b4",
];
const roomColors = {
  security: ["#91a5ae", "#9bafb5", "#7c969e", "#b0c2c6"],
  electrical: ["#b8bfac", "#c6cab6", "#a3ad9d", "#d9dcc8"],
  music: ["#bd956e", "#c59e75", "#aa815e", "#cfad89"],
  dining: ["#d8c19b", "#e0cda9", "#c4ae88", "#ead9b8"],
  study: ["#a2b7ae", "#afc0b4", "#91a79e", "#c4cfc0"],
  kitchen: ["#e3e5d7", "#c6d3d0", "#b4c4bf", "#f1f1e2"],
  courtyard: ["#d8cfb3", "#dfd7bc", "#c7bda2", "#eee6cb"],
  bedroom: ["#cdb08c", "#d2b692", "#b69b79", "#e1caa7"],
  library: ["#b39270", "#b99977", "#987b5e", "#c9ac89"],
  terrace: ["#c5d8cf", "#c5d8cf", "#99b5b1", "#e3e9ce"],
  garden: ["#c8d0a3", "#d2d8b2", "#a7b68e", "#e0e5bd"],
  gallery: ["#d1d6d3", "#dfe1d7", "#bdc7c3", "#edf0e5"],
  grove: ["#8fb875", "#9dbf7f", "#6d945c", "#accd8b"],
  well: ["#b8b895", "#c2c2a1", "#969b78", "#d1d0b0"],
  stable: ["#bda779", "#c5b388", "#9b895e", "#daca9e"],
  lawn: ["#88b17a", "#95b982", "#6b9461", "#aed198"],
  court: ["#c7b58e", "#cfc29e", "#a99a78", "#e0d4b4"],
  stairs: ["#d8ce9e", "#d8ce9e", "#b3a67a", "#ebe1b6"],
  passage: ["#c5bda9", "#c9c2ae", "#b5ad9a", "#ddd5be"],
};
function canvas(w, h) {
  let c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
export function drawMansion(floor, architectureOnly = false) {
  const c = canvas(W * TILE * ART_SCALE, H * TILE * ART_SCALE),
    g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  g.scale(ART_SCALE, ART_SCALE);
  const rect = (x, y, w, h, color) => {
    g.fillStyle = color;
    const left = Math.round(x),
      top = Math.round(y),
      width = Math.round(w),
      height = Math.round(h);
    if (!architectureOnly) {
      g.fillRect(left, top, width, height);
      return;
    }
    // Raised trim may extend into void, but must never cover a neighboring floor.
    for (
      let ty = Math.floor(top / TILE);
      ty <= Math.floor((top + height - 1) / TILE);
      ty++
    )
      for (
        let tx = Math.floor(left / TILE);
        tx <= Math.floor((left + width - 1) / TILE);
        tx++
      ) {
        if (sightMaps[floor]?.[ty]?.[tx] === 0) continue;
        const xx = Math.max(left, tx * TILE),
          yy = Math.max(top, ty * TILE),
          right = Math.min(left + width, (tx + 1) * TILE),
          bottom = Math.min(top + height, (ty + 1) * TILE);
        if (right > xx && bottom > yy)
          g.fillRect(xx, yy, right - xx, bottom - yy);
      }
  };
  const line = (x, y, w, color) => rect(x, y, w, 1, color);
  if (!architectureOnly) rect(0, 0, W * TILE, H * TILE, "#151d29");
  if (!architectureOnly)
    for (const r of floorRegions.filter((r) => r.floor === floor)) {
      const color = roomColors[r.kind] || roomColors.passage,
        wood = ["music", "library", "bedroom"].includes(r.kind);
      for (let y = r.y; y < r.y + r.h; y++)
        for (let x = r.x; x < r.x + r.w; x++) {
          const X = x * 16,
            Y = y * 16;
          rect(X, Y, 16, 16, color[(x + y) % 2]);
          if(drawLpcFloor(g,r.kind,X,Y)) continue;
          if (floor === 2 && ["grove", "lawn"].includes(r.kind)) {
            rect(X, Y, 16, 16, color[0]);
            const seed = (x * 29 + y * 17) % 13;
            rect(X + seed, Y + 4, 2, 1, color[3]);
            rect(X + seed + 1, Y + 3, 1, 2, color[3]);
            rect(X + ((seed + 6) % 14), Y + 11, 2, 1, color[2]);
          } else if (floor === 2 && r.kind === "stable") {
            rect(X, Y, 16, 16, color[(x * 3 + y) % 2]);
            if ((x + y) % 3 === 0) {
              rect(X + 3, Y + 5, 4, 1, color[3]);
              rect(X + 8, Y + 12, 2, 1, color[2]);
            }
          } else if (wood) {
            // Two eight-pixel boards per tile, staggered joints and a restrained grain.
            for (let j = 0; j < 16; j += 8) {
              line(X, Y + j, 16, color[3]);
              line(X, Y + j + 7, 16, color[2]);
              rect(
                X + ((y * 2 + j / 8) % 2 ? 4 : 12),
                Y + j + 1,
                1,
                6,
                color[2],
              );
            }
            if ((x + y) % 4 === 0) line(X + 3, Y + 4, 4, color[2]);
          } else if (r.kind === "dining" || r.kind === "study") {
            // Parquet: alternating inset slats, rather than oversized plain squares.
            line(X, Y, 16, color[2]);
            rect(X, Y, 1, 16, color[2]);
            if ((x + y) % 2) {
              for (let j = 4; j < 16; j += 4) line(X + 1, Y + j, 14, color[2]);
              rect(X + 1, Y + 1, 14, 1, color[3]);
            } else {
              for (let j = 4; j < 16; j += 4)
                rect(X + j, Y + 1, 1, 14, color[2]);
              rect(X + 1, Y + 1, 1, 14, color[3]);
            }
          } else {
            line(X, Y, 16, color[3]);
            rect(X, Y, 1, 16, color[3]);
            line(X, Y + 15, 16, color[2]);
            rect(X + 15, Y, 1, 16, color[2]);
            if (r.kind === "courtyard" && (x + y) % 4 === 0) {
              rect(X + 7, Y + 7, 2, 2, "#d2c38d");
            }
            if (r.kind === "garden" && (x + y) % 4 === 0) {
              rect(X + 2, Y + 12, 3, 1, "#91aa7b");
              rect(X + 3, Y + 10, 1, 2, "#91aa7b");
            }
          }
        }
      rect(r.x * 16 + 2, r.y * 16 + 2, r.w * 16 - 4, 1, color[3] + "99");
      rect(
        r.x * 16 + 2,
        (r.y + r.h) * 16 - 3,
        r.w * 16 - 4,
        1,
        color[3] + "99",
      );
    }
  function rug(x, y, w, h, kind = "music") {
    if(drawLpcRug(g,x,y,w,h,kind))return;
    const color = {
      music: ["#713f5b", "#d9b680"],
      study: ["#354e46", "#b9ac78"],
      bedroom: ["#4d4d77", "#b3adbd"],
      library: ["#774c40", "#b79c63"],
      gallery: ["#a6a49b", "#dcd2b4"],
    }[kind] || ["#8b4657", "#d7ac74"];
    rect(x, y, w, h, "#4a4148");
    rect(x + 2, y + 2, w - 4, h - 4, color[1]);
    rect(x + 4, y + 4, w - 8, h - 8, color[0]);
    for (const [xx, yy] of [
      [x + 7, y + 7],
      [x + w - 12, y + 7],
      [x + 7, y + h - 12],
      [x + w - 12, y + h - 12],
    ]) {
      rect(xx, yy, 5, 5, color[1]);
      rect(xx + 1, yy + 1, 3, 3, color[0]);
      rect(xx + 2, yy + 2, 1, 1, color[1]);
    }
    // Woven borders vary by room; keep the playable task area uncluttered.
    for (let k = 8; k < w - 6; k += 8) {
      rect(x + k, y + 5, 2, 2, color[1]);
      rect(x + k, y + h - 7, 2, 2, color[1]);
    }
    for (let k = 8; k < h - 6; k += 8) {
      rect(x + 5, y + k, 2, 2, color[1]);
      rect(x + w - 7, y + k, 2, 2, color[1]);
    }
    if (kind === "bedroom") {
      for (let k = 10; k < w - 8; k += 12) {
        rect(x + k, y + 10, 2, h - 20, color[1]);
      }
      return;
    }
    if (kind === "study") {
      for (const [dx, dy] of [
        [9, 9],
        [w - 14, 9],
        [9, h - 14],
        [w - 14, h - 14],
      ]) {
        rect(x + dx, y + dy, 5, 5, color[1]);
        rect(x + dx + 1, y + dy + 1, 3, 3, color[0]);
      }
    }
    const cx = x + Math.floor(w / 2),
      cy = y + Math.floor(h / 2);
    for (let i = 0; i < 4; i++) {
      rect(cx - i * 3 - 1, cy + i * 3 - 10, 2, 2, color[1]);
      rect(cx + i * 3, cy + i * 3 - 10, 2, 2, color[1]);
      rect(cx - i * 3 - 1, cy - i * 3 + 9, 2, 2, color[1]);
      rect(cx + i * 3, cy - i * 3 + 9, 2, 2, color[1]);
    }
  }

  if(!architectureOnly)for(const r of rooms.filter(r=>r.floor===floor))drawRoomAtmosphere(g,r);

  // Only the outlines of carved rooms/corridors are walls. Void is never a floor.
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      if (!structural(x, y, floor)) continue;
      let adjacent;
      for (const [dx, dy] of [
        [0, 1],
        [1, 0],
        [-1, 0],
        [0, -1],
      ])
        if (!adjacent && sightMaps[floor]?.[y + dy]?.[x + dx] === 0)
          adjacent = zoneAt({
            floor,
            x: (x + dx + 0.5) * 16,
            y: (y + dy + 0.5) * 16,
          });
      const color = roomColors[adjacent?.kind] || roomColors.passage,
        X = x * 16,
        Y = y * 16;
      // Continuous wall bands: vertical walls must not become striped ladders.
      rect(X, Y, 16, 16, "#e6d5b5");
      const below = sightMaps[floor]?.[y + 1]?.[x] === 0,
        above = sightMaps[floor]?.[y - 1]?.[x] === 0,
        left = sightMaps[floor]?.[y]?.[x - 1] === 0,
        right = sightMaps[floor]?.[y]?.[x + 1] === 0;
      // The north wall has a raised cap and a full visible front elevation.
      if (below) {
        rect(X, Y - 12, 16, 27, "#596968");
        rect(X, Y - 11, 16, 4, "#f0edc8");
        line(X, Y - 7, 16, "#bdc6ad");
        rect(X, Y - 6, 16, 16, roomThemes[adjacent?.kind]?.[0] || "#e5dcc7");
        line(X, Y + 4, 16, "#c8baa0");
        line(X, Y + 10, 16, "#b5c2a5");
        rect(X, Y + 11, 16, 3, "#a59077");
        line(X, Y + 14, 16, "#5e8187");
        line(X, Y + 15, 16, "#586b67");
        const wallClips=architectureOnly?[{x:X,y:Y,w:16,h:14}]:null;
        if(wallClips&&sightMaps[floor]?.[y-1]?.[x]!==0)wallClips.push({x:X,y:Y-6,w:16,h:6});
        drawLpcWall(g,adjacent?.kind,X,Y-6,wallClips);
      }
      if (above) {
        line(X, Y, 16, "#64776e");
        rect(X, Y + 1, 16, 3, "#c5cfae");
        line(X, Y + 4, 16, "#ebe8c1");
      }
      if (left) {
        rect(X, Y, 5, 16, "#a7baa7");
        rect(X + 1, Y, 2, 16, "#d6dfb9");
        rect(X, Y, 1, 16, "#627b72");
      }
      if (right) {
        rect(X + 11, Y, 5, 16, "#9ab3a5");
        rect(X + 12, Y, 2, 16, "#c5d4b5");
        rect(X + 15, Y, 1, 16, "#5f7974");
      }
    }
  // Repeated room-specific paneling makes the whole interior recognizable.
  for(const r of rooms.filter(r=>r.floor===floor))for(let x=r.x;x<r.x+r.w;x++){
    if(structural(x,r.y-1,floor))drawRoomWallAccent(rect,r.kind,x*16,(r.y-1)*16,x-r.x);
  }
  // Individual jharokha windows and marigold torans identify each room threshold.
  for (const r of rooms.filter((r) => r.floor === floor)) {
    for (let x = r.x + 2; x < r.x + r.w - 1; x += 4) {
      const y = r.y - 1;
      if (!structural(x, y, floor)) continue;
      const X = x * 16,
        Y = y * 16;
      rect(X - 1, Y - 10, 18, 24, "#55424a");
      rect(X + 1, Y - 12, 14, 25, "#d8b581");
      rect(X + 3, Y - 10, 10, 20, r.kind === "terrace" ? "#172e45" : "#436475");
      rect(X+4,Y-9,2,7,"#7697a0");
      rect(X+10,Y+3,2,5,"#557c8c");
      rect(X + 7, Y - 8, 2, 18, "#b38a61");
      line(X + 3, Y + 1, 10, "#b38a61");
      rect(X - 2, Y + 12, 20, 3, "#e5c794");
      const drape={music:["#79506b","#ba8496"],bedroom:["#59698d","#91a0be"],dining:["#8d574c","#c99071"],study:["#4d756a","#8bad92"],library:["#8b704e","#c0a37a"]}[r.kind];
      if(drape){
        for(const dx of [-3,14]){rect(X+dx,Y-10,5,22,drape[0]);rect(X+dx+1,Y-9,1,19,drape[1]);rect(X+dx,Y+5,5,2,"#d8bb78");}
        rect(X-4,Y-13,24,2,"#95744d");rect(X-3,Y-12,22,1,"#e4c588");
      }
    }
  }
  if (architectureOnly) return c;
  for (const patch of grass.filter((p) => p.floor === floor))
    for (let y = patch.y; y < patch.y + patch.h; y++)
      for (let x = patch.x; x < patch.x + patch.w; x++) {
        const X = x * 16,
          Y = y * 16;
        rect(X, Y, 16, 16, "#779d62");
        for (let i = 0; i < 4; i++) {
          const dx = i * 4,
            dy = (x + y + i) % 3;
          rect(X + dx + 1, Y + 5 + dy, 2, 7, "#477b50");
          rect(X + dx, Y + 4 + dy, 1, 5, "#a9c579");
          rect(X + dx + 2, Y + 8 + dy, 2, 5, "#628d55");
        }
        rect(X + 1, Y + 14, 14, 2, "#688e56");
      }

  if (floor === 2) {
    const paving = (x, y, w, h) => {
      for (let yy = y; yy < y + h; yy++)
        for (let xx = x; xx < x + w; xx++) {
          if(drawLpcFloor(g,"passage",xx*16,yy*16))continue;
          rect(xx * 16, yy * 16, 16, 16, (xx + yy) % 2 ? "#d7c8a5" : "#cdbd97");
          rect(xx * 16, yy * 16, 16, 1, "#eee0bd");
          rect(xx * 16, yy * 16, 1, 16, "#eee0bd");
          rect(xx * 16, yy * 16 + 15, 16, 1, "#b5a781");
        }
    };
    paving(4, 20, 59, 2);
    paving(4, 30, 59, 2);
    paving(25, 3, 2, 40);
    paving(58, 3, 2, 40);
    drawCourtyardGarden(g);
    // Carved border of the open-air palace garden.
    for (let x = 5; x < 62; x += 4) {
      rect(x * 16, 3 * 16, 12, 4, "#d0c397");
      rect(x * 16, 42 * 16, 12, 4, "#d0c397");
    }
  }
  function diya(X, Y) {
    rect(X - 3, Y, 7, 2, "#75463f");
    rect(X - 2, Y + 2, 5, 1, "#cc8b52");
    rect(X, Y - 4, 2, 4, "#f1ae4c");
    rect(X, Y - 3, 1, 2, "#fff0b2");
  }
  // Brass threshold strips mark ordinary public doorways, not locked routes.
  for (const p of passages.filter(
    (p) =>
      p.floor === floor &&
      ![
        "North passage",
        "South passage",
        "East passage",
        "West passage",
        "Stair vestibule",
      ].includes(p.name),
  )) {
    const X = p.x * TILE,
      Y = p.y * TILE,
      w = p.w * TILE,
      h = p.h * TILE;
    const across =
      p.name.includes("cross-door") ||
      p.name.includes("north door") ||
      p.name.includes("south door");
    if (across) {
      rect(X + 2, Y + 2, w - 4, 2, "#c6a065");
      rect(X + 2, Y + h - 4, w - 4, 2, "#e2c799");
    } else {
      rect(X + 2, Y + 2, 2, h - 4, "#c6a065");
      rect(X + w - 4, Y + 2, 2, h - 4, "#e2c799");
    }
  }
  for (const o of objects.filter((o) => o.floor === floor)) {
    // Room-scale textiles replace the former isolated, overlapping small rugs.
    if(o.type==='rug')continue;
    let X = o.x * 16,
      Y = o.y * 16,
      w = o.w * 16,
      h = o.h * 16;
    if (o.mounted) X += 8;

    if (o.id === "tree2a" || o.id === "tree2b") {
      rect(X + 12, Y + 19, 9, 28, "#6d5541");
      rect(X + 14, Y + 20, 3, 26, "#b18a58");
      rect(X + 8, Y + 29, 8, 3, "#8e704e");
      rect(X + 18, Y + 25, 8, 3, "#8e704e");
      const crowns = [
        [8, 10, 15],
        [22, 10, 16],
        [15, -1, 15],
        [2, 0, 12],
        [28, 1, 11],
        [14, 18, 13],
      ];
      const leaf = (cx, cy, rad, col) => {
        for (let yy = -rad; yy <= rad; yy += 0.5) {
          const span = Math.floor(Math.sqrt(rad * rad - yy * yy) * 2) / 2;
          g.fillStyle = col;
          g.fillRect(X + cx - span, Y + cy + yy, span * 2 + 0.5, 0.5);
        }
      };
      for (const [xx, yy, rr] of crowns) {
        leaf(xx, yy, rr, "#3d6e50");
        leaf(xx - 1, yy - 2, rr - 2, "#648e59");
        leaf(xx - 3, yy - 4, rr - 5, "#85aa68");
      }
      for (let i = 0; i < 30; i++) {
        const xx = ((i * 13) % 38) - 2,
          yy = ((i * 7) % 28) - 8;
        rect(X + xx, Y + yy, 2, 1, i % 3 ? "#91ae6c" : "#456f50");
      }
      for (const [dx, dy] of [
        [3, 14],
        [22, 5],
        [15, 22],
      ]) {
        rect(X + dx, Y + dy, 3, 5, "#d6b26a");
        rect(X + dx, Y + dy, 2, 2, "#efcf8a");
      }
      continue;
    }
    if (drawLpcFurniture(g, o) || drawFurniture(g, o)) continue;
    if (o.type === "rug") {
      rug(X, Y, w, h, zoneAt({ floor, x: X + 8, y: Y + 8 })?.kind);
    } else if (o.type === "stairPortrait") {
      // Original pixel portraits: two distinct family elders, in matching brass frames.
      rect(X, Y - 7, 16, 23, "#624a3d");
      rect(X + 1, Y - 8, 14, 22, "#d7af63");
      rect(
        X + 3,
        Y - 6,
        10,
        18,
        o.portrait === "founder" ? "#344853" : "#66504d",
      );
      rect(X + 6, Y - 2, 5, 6, "#c99871");
      rect(
        X + 5,
        Y - 4,
        7,
        3,
        o.portrait === "founder" ? "#e3c38e" : "#45333e",
      );
      rect(
        X + 4,
        Y + 5,
        9,
        7,
        o.portrait === "founder" ? "#4c7090" : "#daa35c",
      );
      rect(X + 8, Y + 5, 2, 7, "#edc783");
      rect(X + 3, Y + 16, 10, 2, "#c5a46a");
    } else if (o.type === "painting") {
      rect(X, Y, w, h, "#6f5743");
      rect(X + 2, Y + 2, w - 4, h - 4, "#d7b778");
      rect(X + 4, Y + 4, w - 8, h - 8, "#52676b");
      rect(X + w / 2 - 3, Y + 4, 6, 6, "#c79e76");
      rect(X + w / 2 - 5, Y + 10, 10, Math.max(2, h - 14), "#704953");
    } else if (o.type === "drums") {
      for (let k = 0; k < 2; k++) {
        rect(X + k * 15 + 2, Y + 5, 12, 9, "#ac7950");
        rect(X + k * 15 + 1, Y + 2, 14, 5, "#e4d4ab");
        rect(X + k * 15 + 5, Y + 3, 6, 3, "#746b61");
        line(X + k * 15 + 3, Y + 12, 10, "#d0af7b");
      }
    } else if (o.type === "tea") {
      rect(X + w / 2 - 4, Y + 4, 8, h - 10, "#b78d50");
      rect(X + w / 2 - 6, Y + 7, 12, 10, "#d8b779");
      rect(X + w / 2 - 3, Y + 1, 6, 4, "#edcb87");
      rect(X + w / 2 + 6, Y + 10, 3, 2, "#bba16c");
      line(X + 3, Y + h - 4, w - 6, "#eee1bd");
      rect(X + 4, Y + h - 8, 5, 4, "#c2a987");
    } else if (o.type === "spices") {
      rect(X, Y + h - 4, w, 4, "#8a6045");
      for (let k = 3; k < w - 8; k += 12) {
        rect(
          X + k,
          Y + 5,
          8,
          h - 10,
          ["#b77542", "#8c9861", "#c4a269", "#906b65"][Math.floor(k / 12) % 4],
        );
        rect(X + k, Y + 2, 8, 3, "#e1bd83");
        rect(X + k + 2, Y + 8, 4, 3, "#dbc49a");
      }
    } else if (o.type === "sacks") {
      for (let k = 2; k < w - 7; k += 14) {
        rect(X + k, Y + 4, 11, h - 4, "#b7a17b");
        rect(X + k + 2, Y + 1, 7, 4, "#8b795d");
        line(X + k + 3, Y + 9, 5, "#8b795d");
      }
    } else if (o.type === "sink") {
      rect(X, Y, w, h, "#959d94");
      rect(X + 3, Y + 4, w - 6, h - 8, "#d0cbb1");
      rect(X + 6, Y + 8, w - 12, h - 17, "#567c81");
      rect(X + w / 2, Y + 1, 3, 12, "#ddd4b7");
      line(X + 7, Y + h - 13, w - 15, "#90aca3");
    } else if (["desk", "table"].includes(o.type)) {
      rect(X + 2, Y + 3, w - 4, h - 3, "#573e3c");
      rect(X, Y, w, h - 6, "#b07750");
      rect(X + 2, Y + 2, w - 4, h - 10, "#d59d67");
      line(X, Y + h - 7, w, "#e6b47b");
      rect(X + 3, Y + h - 3, 4, 5, "#63433a");
      rect(X + w - 7, Y + h - 3, 4, 5, "#63433a");
      if (o.id === "sweets") {
        for (let i = 0; i < 5; i++) {
          const px = X + ((i + 0.5) * w) / 5;
          rect(px - 4, Y + 8, 8, 4, "#af7752");
          line(px - 3, Y + 7, 6, "#d6b081");
        }
      } else {
        rect(X + 9, Y + 3, 18, 12, "#efdcad");
        line(X + 12, Y + 6, 12, "#9a7b65");
        line(X + 12, Y + 9, 10, "#9a7b65");
        rect(X + w - 14, Y + 5, 7, 7, "#566f65");
      }
    } else if (o.type === "sofa") {
      rect(X, Y, w, h - 3, "#4e414a");
      rect(X + 2, Y + 1, w - 4, h - 8, "#9a6173");
      rect(X + 4, Y + 4, w - 8, h - 14, "#c08685");
      for (let k = 0; k < o.w; k++) {
        rect(X + k * 16 + 4, Y + 7, 10, 12, "#c3a178");
        rect(X + k * 16 + 6, Y + 9, 6, 8, "#e0bb86");
      }
      rect(X, Y + 5, 4, h - 6, "#815068");
      rect(X + w - 4, Y + 5, 4, h - 6, "#815068");
      line(X, Y + h - 5, w, "#d29a84");
    } else if (o.type === "books") {
      rect(X, Y, w, h, "#58413d");
      rect(X + 2, Y + 2, w - 4, h - 4, "#956947");
      for (let k = 4; k < w - 3; k += 5) {
        rect(
          X + k,
          Y + 3,
          3,
          h - 6,
          ["#a46356", "#598385", "#cfa76d", "#8d738a"][Math.floor(k / 5) % 4],
        );
        rect(X + k, Y + 5, 3, 1, "#dec598");
      }
      line(X, Y + h - 2, w, "#c39462");
    } else if (o.type === "wardrobe") {
      rect(X, Y, w, h, "#394e68");
      rect(X + 1, Y + 1, w - 2, h - 2, "#91b9ce");
      rect(X + 3, Y + 4, w - 6, h - 7, "#668eaf");
      rect(X + 3, Y + 5, w - 6, 2, "#bcd8df");
      rect(X + w / 2 - 1, Y + 3, 2, h - 6, "#3e607c");
      rect(X + w / 2 - 4, Y + h / 2, 2, 3, "#f2d072");
      rect(X + w / 2 + 2, Y + h / 2, 2, 3, "#f2d072");
    } else if (o.type === "cabinet") {
      rect(X, Y, w, h, "#725647");
      rect(X + 2, Y + 2, w - 4, h - 4, "#d2a574");
      line(X + 2, Y + Math.floor(h / 2), w - 4, "#94714f");
      for (let k = 7; k < w - 3; k += 14)
        rect(X + k, Y + Math.floor(h / 2) - 3, 3, 2, "#f2d299");
    } else if (o.type === "piano") {
      rect(X, Y, w, h - 2, "#373340");
      rect(X + 2, Y + 2, w - 4, h - 9, "#53424b");
      rect(X + 3, Y + h - 12, w - 6, 9, "#ead5a7");
      for (let k = 5; k < w - 4; k += 7) {
        rect(X + k, Y + h - 12, 2, 5, "#332d38");
        rect(X + k + 3, Y + h - 7, 1, 4, "#a88d74");
      }
      line(X + 5, Y + 3, w - 10, "#a58258");
    } else if (o.type === "bed") {
      rect(X, Y, w, h, "#624b48");
      rect(X + 2, Y + 2, w - 4, h - 5, "#e4cfa1");
      rect(X + 5, Y + 7, w - 10, 15, "#f1dfb7");
      rect(X + 3, Y + 28, w - 6, h - 33, "#5c8e8d");
      for (let k = 7; k < w - 5; k += 8)
        rect(X + k, Y + 29, 2, h - 35, "#87b4a1");
      line(X + 3, Y + h - 8, w - 6, "#d2b46d");
    } else if (o.type === "plant") {
      rect(X + 4, Y + h - 10, 9, 9, "#b57956");
      rect(X + 3, Y + h - 12, 11, 4, "#dfa578");
      rect(X + 7, Y + 6, 2, h - 17, "#577750");
      for (let k = 0; k < 5; k++) {
        rect(
          X + (k % 2 ? 2 : 7),
          Y + k * 3,
          7,
          5,
          k % 2 ? "#789362" : "#496e59",
        );
      }
      rect(X + 7, Y + 3, 3, 2, "#ecd5b0");
    } else if (o.type === "fountain") {
      // Stepped pixel contours, with an unmistakable lotus or lily-pad silhouette.
      const pool = (inset, color) => {
        rect(
          X + 7 + inset,
          Y + inset,
          w - 14 - inset * 2,
          h - inset * 2,
          color,
        );
        rect(
          X + 3 + inset,
          Y + 4 + inset,
          w - 6 - inset * 2,
          h - 8 - inset * 2,
          color,
        );
        rect(
          X + inset,
          Y + 8 + inset,
          w - inset * 2,
          h - 16 - inset * 2,
          color,
        );
      };
      pool(0, "#6c7b83");
      pool(2, "#f1d8a5");
      pool(5, "#68a8bb");
      if (o.id === "gardenpool") {
        for (const dx of [-16, 15]) {
          rect(X + w / 2 + dx - 5, Y + h / 2 - 2, 10, 5, "#4e916e");
          rect(X + w / 2 + dx - 2, Y + h / 2 - 4, 5, 3, "#8db377");
          rect(X + w / 2 + dx, Y + h / 2 - 5, 3, 3, "#f2b4ca");
        }
      } else {
        const cx = X + w / 2,
          cy = Y + h / 2;
        rect(cx - 2, cy - 9, 4, 12, "#a76588");
        rect(cx - 5, cy - 6, 10, 10, "#dd98b0");
        rect(cx - 8, cy - 3, 16, 5, "#b97798");
        rect(cx - 5, cy, 10, 4, "#efb8c5");
        rect(cx - 1, cy - 7, 2, 7, "#ffe0bc");
      }
      line(X + 10, Y + h - 10, 7, "#b7d8cd");
      line(X + w - 17, Y + 10, 6, "#b7d8cd");
    } else if (o.type === "rangoli") {
      const cx = X + w / 2,
        cy = Y + h / 2;
      for (let i = 0; i < 7; i++) {
        const d = i * 3;
        for (const [dx, dy] of [
          [d, 18 - d],
          [-d, 18 - d],
          [d, d - 18],
          [-d, d - 18],
        ])
          rect(cx + dx - 1, cy + dy - 1, 2, 2, "#b88c91");
      }
      rect(cx - 2, cy - 2, 4, 4, "#e7bdb0");
    } else if (o.type === "stairs") {
      rect(X, Y, w, h, "#604b4a");
      for (let y = 1; y < h - 1; y += 7) {
        rect(X + 4, Y + y, w - 8, 4, "#c4af8d");
        rect(X + 4, Y + y + 4, w - 8, 2, "#8f7966");
      }
      rect(X, Y, 3, h, "#e1c28e");
      rect(X + w - 3, Y, 3, h, "#e1c28e");
      const ay = Y + (floor ? 8 : h - 8),
        ax = X + w / 2;
      rect(ax - 1, ay + (floor ? -6 : 0), 2, 7, "#f4d698");
      for (let k = 0; k < 4; k++)
        rect(ax - k, ay + (floor ? -k : k), k * 2 + 1, 1, "#f4d698");
    } else if (o.type === "mirror") {
      rect(X, Y - 23, w, h + 23, "#ad855e");
      rect(X + 3, Y - 21, w - 6, h + 18, "#496c80");
      for (let k = 5; k < w - 8; k += 16) {
        rect(X + k, Y - 19, 10, 25, "#80a7ad");
        rect(X + k + 2, Y - 17, 3, 22, "#b6c5b5");
      }
      line(X, Y + h - 2, w, "#e6c691");
    } else if (o.type === "stove") {
      rect(X, Y, w, h, "#8e9a8a");
      rect(X + 2, Y + 2, w - 4, h - 6, "#d4c5a1");
      for (let k = 8; k < w - 10; k += 24) {
        rect(X + k, Y + 4, 15, 13, "#5f6a62");
        rect(X + k + 3, Y + 6, 9, 8, "#a16d4d");
        rect(X + k + 4, Y + 4, 7, 2, "#dab67c");
      }
    } else if (o.type === "lanterns") {
      line(X, Y + 2, w, "#6a5b4c");
      for (let k = 4; k < w; k += 16) {
        rect(X + k, Y + 3, 1, 7, "#5b5146");
        rect(X + k - 3, Y + 10, 8, 12, "#d38555");
        rect(X + k - 1, Y + 11, 4, 10, "#f3ba69");
        rect(X + k, Y + 23, 1, 5, "#b26145");
      }
    } else if (o.type === "terminal") {
      rect(X, Y, w, h, "#5d4d43");
      rect(X + 4, Y + 3, w - 8, h - 7, "#9d8866");
      rect(X + w / 2 - 15, Y - 10, 30, 24, "#344750");
      rect(X + w / 2 - 12, Y - 8, 24, 18, "#73b8ae");
      for (let k = 0; k < 3; k++)
        rect(X + w / 2 - 9 + k * 7, Y - 4, 4, 8, "#a9c5a3");
      rect(X + w / 2 - 5, Y + 14, 10, 3, "#b6ae8c");
    } else if (o.type === "vent") {
      rect(X, Y + 3, w, h - 4, "#242f36");
      rect(X + 1, Y + 4, w - 2, h - 6, "#a79cba");
      for (let k = 3; k < w - 2; k += 3)
        rect(X + k, Y + 6, 1, h - 10, "#26343c");
    } else if (o.type === "clock") {
      rect(X + 1, Y - 7, w - 2, h + 7, "#674b40");
      rect(X + 3, Y - 9, w - 6, h + 8, "#b08b58");
      rect(X + 3, Y - 2, w - 6, 15, "#efd9a2");
      rect(X + 6, Y + 18, 4, 8, "#e0b767");
      rect(X + 7, Y + 14, 2, 7, "#594b40");
      rect(X, Y + h - 3, w, 3, "#d5b478");
    } else if (o.type === "fuse") {
      rect(X + 2, Y, 12, h, "#775b4b");
      rect(X + 3, Y + 2, 10, h - 4, "#e5b47e");
      rect(X + 6, Y + 7, 4, 10, "#bf794b");
      rect(X + 8, Y + 17, 2, 5, "#3e514f");
    } else if (o.type === "bell") {
      rect(X + 2, Y, 2, h, "#725b52");
      rect(X + w - 4, Y, 2, h, "#725b52");
      rect(X + 2, Y, w - 4, 2, "#725b52");
      rect(X + w / 2 - 3, Y + 2, 6, 3, "#bf8b43");
      rect(X + w / 2 - 5, Y + 5, 10, 5, "#e7b85f");
      rect(X + w / 2 - 7, Y + 10, 14, 3, "#f6d27e");
      rect(X + w / 2 - 1, Y + 13, 2, 3, "#b88443");
      rect(X + w / 2 - 3, Y + 4, 2, 6, "#ffe1a0");
    }
  }
  return c;
}
export function mansion(scene, floor) {
  const key = "mansion" + floor;
  scene.textures.addCanvas(key, drawMansion(floor));
  scene.textures.get(key).setFilter(1);
  const architecture = "architecture" + floor;
  scene.textures.addCanvas(architecture, drawMansion(floor, true));
  scene.textures.get(architecture).setFilter(1);
  return key;
}
export function people(scene) {
  // Original 32x48 sprites: readable profiles and real four-direction walk frames.
  const c = canvas(32 * 12, 48 * 16),
    g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const shade = (hex, d) =>
    "#" +
    hex
      .slice(1)
      .match(/../g)
      .map((c) =>
        Math.max(0, Math.min(255, parseInt(c, 16) + d))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  for (let i = 0; i < 16; i++)
    for (let dir = 0; dir < 4; dir++)
      for (let f = 0; f < 3; f++) {
        const X = (dir * 3 + f) * 32,
          Y = i * 48,
          bob = f === 1 ? 0 : 1;
        const r = (x, y, w, h, col) => {
          g.fillStyle = col;
          g.fillRect(X + x, Y + y + bob, w, h);
        };
        const skin = ["#c58b65", "#d7a37b", "#a97050", "#e1b08b"][i % 4],
          cloth = palettes[i],
          ink = "#30333f",
          hair = ["#342d38", "#3d3032", "#292d36"][i % 3];
        const step = f === 1 ? 0 : f === 0 ? 2 : -2,
          side = dir === 1 || dir === 2,
          left = dir === 1;
        // Separate boots, trousers, cuffs and a contrasting garment hem.
        r(8, 35, 7, 8 + Math.max(0, step), ink);
        r(18, 35, 7, 8 + Math.max(0, -step), ink);
        r(9, 37, 4, 6, shade(cloth, -64));
        r(19, 37, 4, 6, shade(cloth, -64));
        r(7, 43 + Math.max(0, step), 8, 3, "#292b38");
        r(18, 43 + Math.max(0, -step), 8, 3, "#292b38");
        r(8, 43 + Math.max(0, step), 5, 1, "#66747a");
        r(19, 43 + Math.max(0, -step), 5, 1, "#66747a");
        r(side ? 10 : 6, 21, side ? 15 : 22, 16, ink);
        r(side ? 11 : 7, 22, side ? 13 : 20, 14, cloth);
        r(side ? 12 : 8, 23, 3, 11, shade(cloth, 30));
        r(side ? 22 : 24, 24, 2, 10, shade(cloth, -28));
        r(side ? 11 : 7, 33, side ? 13 : 20, 2, "#dfc997");
        r(side ? 11 : 7, 35, side ? 13 : 20, 1, shade(cloth, -35));
        r(side ? 8 : 4, 24 - step / 2, 4, 10, shade(skin, -12));
        r(side ? 24 : 27, 24 + step / 2, 3, 10, skin);
        r(side ? 8 : 4, 23 - step / 2, 4, 4, shade(cloth, 9));
        r(side ? 24 : 27, 23 + step / 2, 3, 4, shade(cloth, -15));
        if (dir !== 3) {
          r(15, 22, 2, 10, "#edd7a4");
          for (let y = 24; y < 32; y += 3) r(16, y, 1, 1, "#7e604a");
        }
        if (i % 3 === 0) {
          r(dir === 3 ? 11 : 21, 22, 3, 12, "#e4b96a");
          r(dir === 3 ? 10 : 20, 23, 1, 10, "#fff0b5");
        }
        // Stepped hair contour and side-specific facial silhouette.
        r(side ? 10 : 7, 4, side ? 13 : 18, 2, hair);
        r(side ? 8 : 5, 6, side ? 17 : 22, 4, hair);
        r(side ? 8 : 5, 10, side ? 18 : 23, 10, hair);
        r(side ? 10 : 7, 20, side ? 14 : 18, 2, hair);
        if (dir === 3) {
          r(8, 8, 16, 10, shade(hair, 13));
          r(10, 5, 10, 2, shade(hair, 27));
          r(7, 16, 18, 3, hair);
          if (i % 3 === 0) r(14, 17, 5, 9, hair);
        } else if (side) {
          r(left ? 8 : 13, 11, 11, 10, skin);
          r(left ? 6 : 24, 15, 3, 4, skin);
          r(left ? 9 : 19, 19, 4, 3, shade(skin, -18));
          r(left ? 9 : 20, 13, 2, 3, ink);
          r(left ? 9 : 20, 13, 1, 1, "#f8e6ce");
          r(left ? 8 : 22, 19, 3, 1, "#a46454");
          r(left ? 16 : 10, 9, 7, 7, hair);
          r(left ? 19 : 10, 14, 3, 5, shade(hair, 14));
          r(11, 6, 9, 2, shade(hair, 25));
        } else {
          r(8, 10, 17, 10, skin);
          r(10, 20, 13, 3, shade(skin, -15));
          r(6, 13, 3, 5, skin);
          r(25, 13, 3, 5, shade(skin, -15));
          r(9, 10, 3, 8, shade(skin, 20));
          r(22, 12, 2, 8, shade(skin, -17));
          r(10, 13, 3, 4, ink);
          r(20, 13, 3, 4, ink);
          r(10, 13, 1, 1, "#fff0d8");
          r(20, 13, 1, 1, "#fff0d8");
          r(16, 16, 2, 2, shade(skin, -25));
          r(15, 20, 5, 1, "#925849");
          r(7, 8, 8, 4, hair);
          r(13, 7, 10, 3, hair);
          r(23, 9, 3, 5, hair);
          r(9, 6, 10, 1, shade(hair, 25));
        }
      }
  // Keep an unoutlined source for costumes, so their edge is finished once.
  const original=canvas(c.width,c.height);original.getContext('2d').drawImage(c,0,0);
  outlineAvatarAtlas(c);
  scene.textures.addSpriteSheet("people", c, {
    frameWidth: 32,
    frameHeight: 48,
  });
  scene.textures.get("people").setFilter(1);
  for (const outfit of new Set(Object.values(outfitClasses))) {
    const sheet = canvas(c.width,c.height), painter=sheet.getContext('2d');
    painter.imageSmoothingEnabled=false;painter.drawImage(original,0,0);
    for(let i=0;i<16;i++)for(let dir=0;dir<4;dir++)for(let f=0;f<3;f++)
      paintOutfit(painter,(dir*3+f)*32,i*48,outfit,dir,f);
    outlineAvatarAtlas(sheet);
    scene.textures.addSpriteSheet(`people-${outfit}`,sheet,{frameWidth:32,frameHeight:48});
    scene.textures.get(`people-${outfit}`).setFilter(1);
  }
}
