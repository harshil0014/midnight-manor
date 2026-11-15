import { test } from "node:test";
import assert from "node:assert/strict";
import { objects } from "../hunt-world.mjs";
import { setLpcFurniture, drawLpcFurniture } from "../src/lpc-furniture.js";
test("LPC mappings use valid atlas crops, pixel-aligned half-pixels and preserve gameplay footprints", () => {
  const previous = globalThis.document;
  const image = { width: 512, height: 1024 };
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({
        drawImage() {},
        getImageData() {
          return { data: [] };
        },
        putImageData() {},
      }),
    }),
  };
  const seen = new Set();
  let sprites = 0;
  try {
    setLpcFurniture({ wood: image, dark: image, fabric: image,house:{width:512,height:512} });
    for (const o of objects) {
      const before = structuredClone(o);
      const g = {
        imageSmoothingEnabled: true,
        set fillStyle(c) {
          assert.match(c, /^#[0-9a-f]{6}$/i);
        },
        fillRect(x, y, w, h) {
          assert([x, y, w, h].every(Number.isFinite));
          assert(w > 0 && h > 0, o.id);
          assert(
            [x, y, w, h].every((v) => Number.isInteger(v * 2)),
            o.id,
          );
        },
        drawImage(im, sx, sy, sw, sh, x, y, w, h) {
          assert(sx >= 0 && sy >= 0 && sx + sw <= (im.width||512) && sy + sh <= (im.height||1024), o.id);
          assert([sx, sy, sw, sh, x, y, w, h].every(Number.isFinite));
          assert(w > 0 && h > 0 && sw > 0 && sh > 0, o.id);
          sprites++;
        },
      };
      if (drawLpcFurniture(g, o)) {
        seen.add(o.type);
        assert.equal(g.imageSmoothingEnabled, false);
      }
      assert.deepEqual(o, before);
    }
    for (const type of [
      "bed",
      "piano",
      "wardrobe",
      "books",
      "sofa",
      "table",
      "terminal",
      "stove",
      "sink",
      "plant",
      "painting",
    ])
      assert(seen.has(type), type);
    assert(sprites > 60);
  } finally {
    setLpcFurniture(null);
    globalThis.document = previous;
  }
});
