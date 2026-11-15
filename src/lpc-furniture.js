// LPC furniture by bluecarrot16, Basto, Sharm, William Thompson, Reemax,
// Janna/Lilius/Jannax. Sources, full credits and licenses: public/assets/lpc/.
// Atlas files are unmodified; fabric recolors are generated at runtime.
let wood,
  house,
  containers,
  dark,
  fabrics = {};
export function setLpcFurniture(images) {
  wood = images?.wood;
  house = images?.house;
  containers = images?.containers;
  dark = images?.dark;
  fabrics = { gold: images?.fabric };
  if (!images?.fabric) return;
  for (const [name, tint] of Object.entries({
    jade: [77, 140, 123],
    plum: [146, 83, 112],
    blue: [81, 127, 166],
  })) {
    const c = document.createElement("canvas");
    c.width = images.fabric.width;
    c.height = images.fabric.height;
    const g = c.getContext("2d");
    g.drawImage(images.fabric, 0, 0);
    const pixels = g.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const [r, green, b, a] = pixels.data.slice(i, i + 4);
      if (a && r > 95 && r > green && green > b && r - b > 30) {
        const value = (r * 0.3 + green * 0.59 + b * 0.11) / 150;
        for (let j = 0; j < 3; j++)
          pixels.data[i + j] = Math.min(255, Math.round(tint[j] * value));
      }
    }
    g.putImageData(pixels, 0, 0);
    fabrics[name] = c;
  }
}

export function drawLpcFurniture(g, o) {
  if (!wood || !dark || !fabrics.gold) return false;
  const X = o.x * 16 + (o.mounted ? 8 : 0),
    Y = o.y * 16,
    w = o.w * 16,
    h = o.h * 16;
  g.imageSmoothingEnabled = false;
  const sprite = (image, sx, sy, sw, sh, x, y, dw, dh) =>
    g.drawImage(image, sx, sy, sw, sh, X + x, Y + y, dw, dh);
  const r = (x, y, a, b, c) => {
    g.fillStyle = c;
    g.fillRect(
      X + Math.round(x * 2) / 2,
      Y + Math.round(y * 2) / 2,
      Math.round(a * 2) / 2,
      Math.round(b * 2) / 2,
    );
  };
  const chair = (x, y, back = false) =>
    sprite(wood, back ? 416 : 384, 480, 32, 32, x, y, 16, 16);
  const book = (x, y) => {
    r(x, y, 21, 12, "#514334");
    r(x + 1, y, 9, 10, "#fbefd0");
    r(x + 11, y, 9, 10, "#e8d9af");
    r(x + 10, y, 1, 11, "#af9472");
    for (let j = 3; j < 9; j += 2) {
      r(x + 3, y + j, 5, 1, "#a49c83");
      r(x + 13, y + j, 5, 1, "#a49c83");
    }
  };
  const counter = () => {
    for (let x = 0; x < w; x += 16)
      sprite(wood, 96, 12, 32, 52, x, 0, Math.min(16, w - x), h);
  };
  switch (o.type) {
    case "chair":
      chair(0,0);
      return true;
    case "generator":
      if (!house) return false;
      sprite(house, 288, 224, 64, 96, 0, -8, w, h + 8);
      return true;
    case "spices":
      if (!house) return false;
      sprite(house, 224, 128, 96, 32, 0, -4, w, h + 4);
      return true;
    case "sacks":
      if (!house) return false;
      sprite(house, 192, 192, 32, 32, 0, 0, w, h);
      return true;
    case "tea":
      if (!house) return false;
      sprite(house, 320, 64, 32, 32, 0, 0, w, h);
      return true;
    case "clock":
      if (!house) return false;
      sprite(house, 64, 320, 32, 64, 0, -8, w, h + 8);
      return true;

    case "fountain": {
      if (o.id !== "well2") return false;
      // Original masonry well with a wooden winding frame and visible bucket.
      const cx = w / 2,
        cy = h / 2;
      const oval = (x, y, rx, ry, c) => {
        for (let yy = -ry; yy <= ry; yy += 0.5) {
          const span =
            Math.floor(
              Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))) * rx * 2,
            ) / 2;
          r(x - span, y + yy, span * 2 + 0.5, 0.5, c);
        }
      };
      oval(cx, cy + 11, w / 2 - 2, 10, "#637d77");
      r(3, cy, w - 6, 12, "#9ba79a");
      for (let yy = cy + 2; yy < cy + 12; yy += 4) {
        r(4, yy, w - 8, 0.5, "#d1d0b4");
        for (let xx = 8 + (yy % 8); xx < w - 4; xx += 10)
          r(xx, yy - 3, 0.5, 3, "#758e86");
      }
      oval(cx, cy, w / 2 - 1, 10, "#7c8b7c");
      oval(cx, cy - 1, w / 2 - 3, 8, "#d6c6a0");
      oval(cx, cy - 1, w / 2 - 7, 5.5, "#3f747f");
      r(cx - 6, cy - 2, 8, 0.5, "#8fc2c2");
      r(cx + 3, cy, 5, 0.5, "#8fc2c2");
      for (const xx of [5, w - 8]) {
        r(xx, 0, 3, cy + 5, "#755b41");
        r(xx, 0.5, 1, cy + 3, "#c4a06a");
      }
      r(3, 1, w - 6, 4, "#77583b");
      r(4, 1, w - 8, 1, "#d2af78");
      r(cx - 1, 5, 1, cy - 8, "#e2d1a0");
      r(cx - 4, cy - 7, 7, 6, "#5b6560");
      r(cx - 3, cy - 6, 5, 4, "#b8bda3");
      r(cx - 3, cy - 7, 5, 1, "#efe4ba");
      return true;
    }
    case "plant": {
      const cx = w / 2,
        base = h - 10;
      r(cx - 4, base + 2, 8, 8, "#895b42");
      r(cx - 3, base + 3, 6, 6, "#bf8357");
      r(cx - 5, base, 10, 3, "#d8a16d");
      r(cx - 4, base, 8, 1, "#efd1a0");
      r(cx - 2, base + 4, 1, 4, "#e4b78a");
      r(cx - 3, base + 8, 6, 1, "#6d5141");
      r(cx - 0.5, 4, 1, base - 2, "#53734b");
      const leaf = (x, y, flip) => {
        for (let row = 0; row < 9; row++) {
          const width = [2, 4, 6, 8, 9, 8, 6, 4, 2][row] / 2;
          r(
            x - width / 2 + (flip ? row : -row) * 0.23,
            y + row * 0.5,
            width,
            0.5,
            row < 4 ? "#88a966" : "#4c7d59",
          );
        }
        r(x - 0.5, y + 2, 1, 2, "#b0c789");
      };
      for (let j = 0; j < 4; j++) {
        const yy = 4 + j * 4;
        leaf(cx - 3, yy, false);
        leaf(cx + 3, yy - 2, true);
      }
      if (/flower|dining|urn/.test(o.id))
        for (const [dx, dy] of [
          [-4, 4],
          [2, 2],
          [0, 9],
        ]) {
          r(cx + dx, dy, 3, 3, "#deb875");
          r(cx + dx + 0.5, dy + 0.5, 2, 2, "#fff0bd");
          r(cx + dx + 1, dy + 1, 1, 1, "#b27850");
        }
      return true;
    }
    case "painting": {
      r(0, 0, w, h, "#5b4b41");
      r(1, 1, w - 2, h - 2, "#c7a06b");
      r(2, 2, w - 4, h - 4, "#eccb8f");
      r(3, 3, w - 6, h - 6, "#537589");
      r(3, 3, w - 6, 1, "#7c9ba7");
      for (let x = 3; x < w - 3; x++) {
        const hill = Math.floor(Math.sin(x * 0.28) * 2 + h * 0.45);
        if (hill < h - 4) r(x, hill, 1, h - 3 - hill, "#718b80");
        const near = Math.floor(Math.sin(x * 0.19 + 2) * 2 + h * 0.65);
        if (near < h - 4) r(x, near, 1, h - 3 - near, "#3f655f");
      }
      r(w - 9, 4, 3, 3, "#ead5a0");
      r(1, h - 2, w - 2, 1, "#8e6c4c");
      return true;
    }
    case "books":
      for (let x = 0; x < w; x += 16)
        sprite(o.floor ? dark : wood, 352, 128, 32, 64, x, -16, 16, h + 16);
      return true;
    case "wardrobe":
      sprite(wood, 192, 352, 64, 64, 0, -8, w, h + 8);
      // A separate brass latch is readable at interaction distance.
      r(Math.floor(w/2)-2,10,4,5,"#634e3b");
      r(Math.floor(w/2)-1,11,2,3,"#e4c77e");
      r(Math.floor(w/2)-3,14,6,6,"#eac16b");
      r(Math.floor(w/2)-2,14,4,1,"#ffe2a0");
      r(Math.floor(w/2),16,1,3,"#574a3c");
      return true;
    case "piano":
      sprite(dark, 80, 832, 64, 96, 4, -14, w - 8, h + 14);
      return true;
    case "bed":
      sprite(fabrics.blue, 128, 480, 64, 96, 0, 0, w, h);

      return true;
    case "sofa": {
      const fabric = /divan/.test(o.id)
        ? fabrics.plum
        : /study|library|garden/.test(o.id)
          ? fabrics.jade
          : fabrics.blue;
      if (w <= 32) sprite(fabric, 32, 128, 32, 32, 0, -4, w, h + 4);
      else {
        sprite(fabric, 128, 224, 12, 32, 0, 0, 8, h);
        for (let x = 8; x < w - 8; x += 16)
          sprite(fabric, 144, 224, 16, 32, x, 0, Math.min(16, w - 8 - x), h);
        sprite(fabric, 180, 224, 12, 32, w - 8, 0, 8, h);
      }
      return true;
    }
    case "table":
    case "desk":
      if (o.id === "sweets") {
        for (const x of [10, w - 26]) chair(x, 0, true);
        sprite(wood, 128, 176, 96, 80, 8, 8, w - 16, h - 12);
        for (const x of [10, w - 26]) chair(x, h - 16);
        // A simple runner, porcelain plates and glasses, not decorative dots.
        r(Math.floor(w / 2) - 5, 13, 10, h - 24, "#799c9a");
        for (const x of [24, w - 32]) {
          r(x, 19, 9, 6, "#f5e9c9");
          r(x + 2, 20, 5, 3, "#bcc7bf");
          r(x + 11, 17, 3, 5, "#bdced0");
        }
      } else {
        sprite(wood, 128, 304, 64, 48, 0, 0, w, h);
        if(o.id==='kitchentable'){
          // A preparation surface belongs in a kitchen, rather than another ledger.
          r(8,4,25,13,'#be9561');r(9,5,23,11,'#e3bf86');
          for(const [x,y]of [[14,7],[20,10],[26,6]]){r(x,y,4,3,'#6b965b');r(x+1,y-1,2,2,'#a8bd74');}
          r(37,5,2,12,'#5c554a');r(39,5,4,8,'#c3d0cb');r(40,5,2,7,'#eff0d5');
          r(w-24,7,7,5,'#ad6146');r(w-22,6,3,2,'#718e52');
        }else{
          if (house) sprite(house, 288, 64, 32, 32, 8, 1, 20, 16);
          else book(8, 4);
          if(o.id==='librarydesk'){r(34,3,13,3,'#784c49');r(35,2,11,1,'#e6d5a7');r(37,7,14,3,'#47726e');r(38,6,12,1,'#e6d5a7');}
          if(o.id==='ledger'){r(36,7,5,5,'#334b4c');r(38,3,1,6,'#d5b683');r(38,2,4,2,'#eee0bb');}
        }
        r(w - 14, 7, 6, 6, "#eff0d4");
        r(w - 12, 8, 3, 2, "#815a45");
      }
      return true;
    case "cabinet":
      if (o.id === "kitchenpots" && house) {
        for (let x = 0; x < w; x += 32)
          sprite(wood, 64, 304, 64, 48, x, 0, Math.min(32, w - x), h);
        sprite(house, 224, 96, 64, 32, 2, -9, w - 4, 16);
        return true;
      }
      for (let x = 0; x < w; x += 32)
        sprite(wood, 64, 304, 64, 48, x, -4, Math.min(32, w - x), h + 4);
      return true;
    case "stove":
      counter();
      sprite(wood, 224, 12, 32, 52, Math.floor(w / 2) - 16, 0, 32, h);
      return true;
    case "sink":
      sprite(wood, 192, 12, 32, 52, 0, 0, w, h);
      return true;
    case "mirror":
      if(w<=32){
        // Small dressing bays get one complete mirror, never a clipped second.
        sprite(wood,96,608,32,64,0,-20,w,h+20);
        return true;
      }
      for (let x = 0; x < w; x += 24)
        sprite(wood, 96, 608, 32, 64, x, -20, Math.min(24, w - x), h + 20);
      return true;
    case "terminal":
      sprite(dark, 128, 304, 64, 48, 0, 0, w, h);
      r(Math.floor(w / 2) - 15, -6, 30, 23, "#364c60");
      r(Math.floor(w / 2) - 13, -4, 26, 17, "#81b4b3");
      for (let i = 0; i < 2; i++)
        for (let j = 0; j < 2; j++)
          {r(Math.floor(w/2)-11+i*12,-2+j*7,10,6,"#325b6a");
          r(Math.floor(w/2)-10+i*12,j*7,8,2,"#92c7b7");
          r(Math.floor(w/2)-10+i*12,2+j*7,3,1,"#e3d293");}
      r(Math.floor(w / 2) - 3, 17, 6, 3, "#4d6471");
      r(Math.floor(w / 2) - 15, 21, 30, 5, "#bdc9c1");
      for (let x = 0; x < 7; x++)
        r(Math.floor(w / 2) - 12 + x * 4, 23, 2, 1, "#667a85");
      return true;
    default:
      return false;
  }
}
