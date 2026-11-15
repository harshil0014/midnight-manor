import {furniturePlan} from './room-layouts.mjs';
export const TILE = 16,
  W = 68,
  H = 48,
  SPEED = 84;
// An independent perimeter circuit connects every wing. The courtyard is a shortcut,
// never the only route between rooms. The upper storey prioritises rooms over corridors.
const roomSpecs = [
  [
    "music",
    "bedroom",
    "Music salon",
    "Guest bedroom",
    [
      [8, 8, 13, 10],
      [12, 18, 9, 5],
    ],
  ],
  [
    "dining",
    "library",
    "Banquet hall",
    "Family library",
    [
      [5, 27, 16, 10],
      [9, 37, 12, 4],
    ],
  ],
  [
    "study",
    "terrace",
    "Family study",
    "Lantern terrace",
    [
      [47, 7, 12, 12],
      [43, 7, 4, 6],
    ],
  ],
  [
    "kitchen",
    "garden",
    "Palace kitchen",
    "Conservatory",
    [
      [46, 27, 14, 12],
      [46, 23, 7, 4],
    ],
  ],
  [
    "courtyard",
    "gallery",
    "Central atrium",
    "Mirror gallery",
    [[28, 20, 11, 9]],
  ],
  ["stairs", "stairs", "Grand staircase", "Lantern landing", [[28, 3, 12, 7]]],
];
const upperOffset = 6; // Keep the staircase shaft aligned between storeys.
const upperRooms = [
  [
    [5, 5, 12, 9],
    [10, 14, 7, 3],
  ], // Bedroom and dressing alcove.
  [
    [4, 22, 13, 9],
    [8, 31, 9, 3],
  ], // Library and archive alcove.
  [
    [41, 5, 11, 10],
    [38, 5, 3, 5],
  ], // Terrace and lantern bay.
  [
    [40, 23, 12, 10],
    [40, 20, 6, 3],
  ], // Conservatory and potting bay.
  [[23, 17, 10, 8]], // Gallery: keep room space, shorten its approaches.
  [[23, 3, 10, 6]],
];
export const floorBounds = [
  { x: 0, y: 0, w: 68, h: 48 },
  { x: 6, y: 0, w: 56, h: 40 },
];
export const rooms = [0, 1].flatMap((floor) =>
  roomSpecs.map(([a, b, n, m, groundParts], i) => {
    const parts = floor
      ? upperRooms[i].map(([x, y, w, h]) => [x + upperOffset, y, w, h])
      : groundParts;
    return {
      floor,
      kind: floor ? b : a,
      name: floor ? m : n,
      x: parts[0][0],
      y: parts[0][1],
      w: parts[0][2],
      h: parts[0][3],
      rects: parts.map(([x, y, w, h]) => ({ x, y, w, h })),
    };
  }),
);
// Five-tile ground corridors and three-tile upper corridors, with shorter loops.
// Public cross-doors connect side wings independently of Escape Artist passages.
const passageSpecs = [
  ["North passage", 22, 14, 23, 5],
  ["East passage", 40, 14, 5, 21],
  ["South passage", 22, 30, 23, 5],
  ["West passage", 22, 14, 5, 21],
  ["Salon vestibule", 21, 17, 2, 3],
  ["Dining vestibule", 21, 31, 2, 3],
  ["Study vestibule", 45, 16, 2, 3],
  ["Kitchen vestibule", 45, 31, 2, 3],
  ["West wing cross-door", 17, 23, 3, 4],
  ["East wing cross-door", 49, 19, 3, 4],
  ["Stair vestibule", 32, 10, 3, 4],
  ["Courtyard north door", 32, 19, 3, 1],
  ["Courtyard south door", 32, 29, 3, 1],
  ["Courtyard west door", 27, 24, 1, 3],
  ["Courtyard east door", 39, 24, 1, 3],
];
const upperPassages = [
  ["North passage", 18, 12, 21, 3],
  ["East passage", 36, 12, 3, 17],
  ["South passage", 18, 26, 21, 3],
  ["West passage", 18, 12, 3, 17],
  ["Bedroom vestibule", 17, 12, 2, 3],
  ["Library vestibule", 17, 26, 2, 3],
  ["Terrace vestibule", 39, 12, 2, 3],
  ["Garden vestibule", 39, 26, 2, 3],
  ["West wing cross-door", 12, 17, 3, 5],
  ["East wing cross-door", 43, 15, 3, 5],
  ["Stair vestibule", 25, 9, 6, 3],
  ["Gallery north door", 27, 15, 3, 2],
  ["Gallery south door", 27, 25, 3, 1],
  ["Gallery west door", 21, 20, 2, 3],
  ["Gallery east door", 33, 20, 3, 3],
];
export const passages = [0, 1].flatMap((floor) =>
  (floor ? upperPassages : passageSpecs).map(([name, x, y, w, h]) => ({
    floor,
    name,
    x: x + (floor ? upperOffset : 0),
    y,
    w,
    h,
    kind: "passage",
  })),
);
// Compact service rooms have multiple ordinary exits, not a dead-end choke.
rooms.push(
  {
    floor: 0,
    kind: "security",
    name: "Security room",
    x: 6,
    y: 23,
    w: 10,
    h: 4,
    rects: [{ x: 6, y: 23, w: 10, h: 4 }],
  },
  {
    floor: 0,
    kind: "electrical",
    name: "Electrical room",
    x: 41,
    y: 2,
    w: 6,
    h: 5,
    rects: [{ x: 41, y: 2, w: 6, h: 5 }],
  },
);
passages.push(
  {
    floor: 0,
    name: "Security north cross-door",
    kind: "passage",
    x: 12,
    y: 22,
    w: 3,
    h: 2,
  },
  {
    floor: 0,
    name: "Security south cross-door",
    kind: "passage",
    x: 9,
    y: 26,
    w: 3,
    h: 2,
  },
  {
    floor: 0,
    name: "Security vestibule",
    kind: "passage",
    x: 16,
    y: 24,
    w: 7,
    h: 3,
  },
  {
    floor: 0,
    name: "Generator vestibule",
    kind: "passage",
    x: 39,
    y: 4,
    w: 3,
    h: 3,
  },
  {
    floor: 0,
    name: "Generator south cross-door",
    kind: "passage",
    x: 43,
    y: 6,
    w: 3,
    h: 3,
  },
);
rooms.push(
  ...[
    ["grove", "Mango grove", 4, 3, 21, 17],
    ["well", "Well pavilion", 25, 3, 17, 17],
    ["stable", "Stable court", 42, 3, 21, 17],
    ["lawn", "Lotus lawns", 4, 20, 21, 23],
    ["garden", "Garden arcade", 25, 20, 17, 23],
    ["court", "Outer courtyard", 42, 20, 21, 23],
  ].map(([kind, name, x, y, w, h]) => ({
    floor: 2,
    kind,
    name,
    x,
    y,
    w,
    h,
    rects: [{ x, y, w, h }],
  })),
);
floorBounds.push({ x: 0, y: 0, w: 68, h: 48 });
export const floorRegions = [
  ...passages,
  ...rooms.flatMap((r) => r.rects.map((rect) => ({ ...r, ...rect }))),
];
export const loopWaypointsByFloor = [
  [
    [24, 16],
    [42, 16],
    [42, 32],
    [24, 32],
  ],
  [
    [25, 13],
    [43, 13],
    [43, 27],
    [25, 27],
  ],
].map((points) =>
  points.map(([x, y]) => ({ x: x * TILE + 8, y: y * TILE + 8 })),
);
export const loopWaypoints = loopWaypointsByFloor[0];
export const stairArrival = { x: 34 * TILE + 8, y: 9 * TILE + 8 };
export const stairLandings = [
  { ...stairArrival },
  { x: 34 * TILE + 8, y: 3 * TILE + 8 },
];
export const stairFlight = {
  left: 33 * TILE,
  right: 35 * TILE,
  top: 4 * TILE,
  bottom: 9 * TILE,
};
export function onStairs(p) {
  return (
    p.floor <= 1 &&
    p.x >= stairFlight.left &&
    p.x < stairFlight.right &&
    p.y >= stairFlight.top &&
    p.y < stairFlight.bottom
  );
}
export const objects = [];
function obj(id, floor, x, y, w, h, type, label, clue) {
  objects.push({
    id,
    floor,
    x,
    y,
    w,
    h,
    type,
    label,
    clue,
    mounted: type === "fuse",
  });
}
// Ground floor: each wing has its own furniture, silhouettes and palette.
obj("piano", 0, 7, 8, 6, 2, "piano", "Interrupted playlist", "music");
obj("divan", 0, 11, 18, 5, 2, "sofa", "Silk listening divan");
obj("musicplant", 0, 6, 13, 1, 2, "plant", "Jasmine by the piano");
obj("salonrug", 0, 10, 12, 5, 3, "rug", "Woven music-room rug");
obj(
  "salonpainting",
  0,
  14,
  6,
  3,
  1,
  "painting",
  "A portrait of the former owners",
);
obj("tabla", 0, 9, 16, 2, 1, "drums", "A pair of tabla drums");
obj("sweets", 0, 8, 34, 6, 3, "table", "Silver mithai tray", "mithai");
obj("diningcabinet", 0, 5, 31, 6, 1, "cabinet", "Copper serving dishes");
obj("diningbench", 0, 9, 41, 8, 2, "sofa", "Embroidered dining bench");
obj("diningplant", 0, 17, 31, 1, 2, "plant", "Marigolds by the doorway");
obj("diningtea", 0, 16, 37, 2, 2, "tea", "A brass samovar");
obj("ledger", 0, 53, 10, 5, 2, "desk", "Aarav’s ledger", "study");
obj("books0", 0, 51, 5, 9, 1, "books", "The relief-fund records");
obj("studysofa", 0, 47, 7, 2, 2, "sofa", "Reading alcove");
obj("studyrug", 0, 52, 13, 6, 3, "rug", "Forest-green study carpet");
obj("studypainting", 0, 59, 7, 2, 1, "painting", "Aarav’s graduation portrait");
obj("studyplant", 0, 60, 13, 1, 2, "plant", "A dusty money plant");
obj("stove", 0, 50, 30, 9, 2, "stove", "Spiced tea on the range");
obj("kitchentable", 0, 53, 35, 5, 2, "table", "Saffron and cardamom");
obj("spices", 0, 50, 26, 5, 1, "spices", "Rows of spice jars");
obj("sacks", 0, 50, 28, 2, 1, "sacks", "Rice sacks in the pantry");
obj("sink", 0, 60, 34, 2, 3, "sink", "Copper pots at the sink");
obj("kitchenpots", 0, 50, 39, 4, 2, "cabinet", "Clay water pots");
obj("rangoli", 0, 31, 23, 4, 4, "rangoli", "Smudged rangoli", "courtyard");
obj("fountain", 0, 29, 21, 3, 2, "fountain", "Lotus fountain");
obj("council0", 0, 36, 27, 2, 1, "bell", "Gather the household");
obj("courtflowers", 0, 37, 21, 1, 2, "plant", "Courtyard flowers");
obj("stairs0", 0, 33, 4, 2, 5, "stairs", "Upstairs");
obj("stairurn0", 0, 29, 5, 1, 2, "plant", "A brass urn of jasmine");
obj("houseclock", 0, 28, 25, 1, 2, "clock", "Read the courtyard clock");
obj("fuse0", 0, 21, 28, 1, 2, "fuse", "Restore the lights");
// Upstairs has different landmarks, not a copy of the downstairs furnishings.
obj("bed", 1, 6, 7, 5, 5, "bed", "A guest’s silk-covered bed");
obj("wardrobe", 1, 14, 6, 3, 2, "cabinet", "Guest clothes");
obj("bedrug", 1, 12, 10, 4, 4, "rug", "Indigo bedside carpet");
obj("bedmirror", 1, 10, 17, 3, 1, "mirror", "A dressing mirror");
obj("bedtea", 1, 15, 18, 2, 2, "tea", "Two untouched cups");
obj("books1", 1, 5, 30, 12, 1, "books", "Relief-fund archives");
obj("librarydesk", 1, 7, 35, 5, 2, "desk", "An unfinished letter");
obj("libraryshelf", 1, 9, 41, 9, 1, "books", "Old family correspondence");
obj("librarychair", 1, 16, 37, 2, 2, "sofa", "An archivist’s chair");
obj("libraryrug", 1, 13, 33, 5, 3, "rug", "Worn library carpet");
obj("lanterns", 1, 52, 7, 6, 2, "lanterns", "Caught lantern ribbon", "terrace");
obj("terracebench", 1, 52, 13, 6, 2, "sofa", "Moonlit terrace bench");
obj("terraceplant", 1, 47, 6, 1, 2, "plant", "Tulsi on the balcony");
obj("terraceplant2", 1, 60, 10, 1, 2, "plant", "Night-blooming jasmine");
obj("terracetea", 1, 47, 9, 2, 1, "tea", "A cup beside a lantern");
for (let i = 0; i < 5; i++)
  obj("garden" + i, 1, 50 + i * 2, 30, 1, 2, "plant", "Night jasmine");
obj("gardenpool", 1, 54, 35, 5, 3, "fountain", "Moonlit lily pond");
obj("gardenbench", 1, 50, 39, 3, 2, "sofa", "A quiet garden bench");
obj("seedpots", 1, 50, 26, 5, 1, "spices", "Seed jars and terracotta pots");
obj("mirror", 1, 30, 20, 6, 1, "mirror", "Blurred gallery mirror", "hall");
obj("galleryrug", 1, 31, 23, 4, 4, "rug", "Ivory gallery runner");
obj("galleryportrait", 1, 37, 23, 1, 2, "painting", "The family matriarch");
obj("council1", 1, 36, 27, 2, 1, "bell", "Gather the household");
obj("stairs1", 1, 32, 4, 4, 4, "stairs", "Downstairs");
obj("stairurn1", 1, 29, 5, 1, 2, "plant", "Hanging jasmine");
obj("fuse1", 1, 21, 28, 1, 2, "fuse", "Restore the lights");
// Preserve all upstairs furnishings; only shelves and the gallery mirror are
// trimmed to fit their more efficient rooms. Coordinates below are local upstairs.
const upperObjectPositions = {
  bed: [5, 6, 5, 5],
  wardrobe: [12, 5, 3, 2],
  bedrug: [11, 8, 4, 4],
  bedmirror: [10, 14, 3, 1],
  bedtea: [14, 15, 2, 2],
  books1: [4, 25, 11, 1],
  librarydesk: [5, 29, 5, 2],
  libraryshelf: [8, 34, 7, 1],
  librarychair: [12, 31, 2, 2],
  libraryrug: [10, 27, 4, 3],
  lanterns: [43, 6, 6, 2],
  terracebench: [43, 11, 6, 2],
  terraceplant: [38, 5, 1, 2],
  terraceplant2: [50, 8, 1, 2],
  terracetea: [39, 7, 2, 1],
  gardenpool: [44, 30, 5, 3],
  gardenbench: [41, 33, 3, 2],
  seedpots: [41, 23, 5, 1],
  mirror: [23, 17, 3, 1],
  galleryrug: [26, 19, 4, 4],
  galleryportrait: [31, 19, 1, 2],
  council1: [30, 23, 2, 1],
  stairs1: [27, 4, 2, 5],
  stairurn1: [24, 5, 1, 2],
  fuse1: [17, 23, 1, 2],
};
for (let i = 0; i < 5; i++)
  upperObjectPositions["garden" + i] = [41 + i * 2, 26, 1, 2];
for (const o of objects.filter((o) => o.floor === 1)) {
  const [x, y, w, h] = upperObjectPositions[o.id];
  Object.assign(o, { x: x + upperOffset, y, w, h });
}
// Two original portraits on the shared stair wall, represented on each floor.
// Stable portrait keys allow future clues to refer to the same physical frames.
for (const floor of [0, 1])
  for (const [i, key] of ["founder", "matriarch"].entries())
    objects.push({
      id: `stair-portrait-${key}-${floor}`,
      portrait: key,
      floor,
      x: 32,
      y: 5 + i * 2,
      w: 1,
      h: 1,
      type: "stairPortrait",
      label: i
        ? "Portrait · the matriarch"
        : "Portrait · the founder",
      mounted: true,
    });
// Interactive social-deduction fixtures reuse the existing mansion and furnishings.
for (const o of objects) delete o.clue;
Object.assign(
  objects.find((o) => o.id === "wardrobe"),
  { type: "wardrobe", label: "Guest wardrobe" },
);
obj("salonwardrobe", 0, 16, 7, 1, 2, "wardrobe", "Music-room wardrobe");
obj("archivewardrobe", 1, 10, 32, 1, 2, "wardrobe", "Archive wardrobe");
Object.assign(
  objects.find((o) => o.id === "ledger"),
  { type: "terminal", label: "Security occupancy terminal" },
);
for (const [id, task] of [
  ["rangoli", "rangoli"],
  ["salonrug", "rangoli"],
  ["galleryrug", "rangoli"],
  ["sweets", "diya"],
  ["lanterns", "diya"],
  ["kitchenpots", "diya"],
])
  Object.assign(
    objects.find((o) => o.id === id),
    {
      task,
      label:
        task === "rangoli" ? "Arrange the rangoli" : "Light the five diyas",
    },
  );
const passageSpecsSocial = [
  [
    "passage-study",
    0,
    58,
    14,
    "Study passage",
    ["passage-library", "passage-kitchen"],
  ],
  [
    "passage-kitchen",
    0,
    59,
    38,
    "Kitchen passage",
    ["passage-study", "passage-garden"],
  ],
  ["passage-salon", 0, 15, 13, "Salon passage", ["passage-library"]],
  [
    "passage-library",
    1,
    20,
    32,
    "Library passage",
    ["passage-study", "passage-salon"],
  ],
  ["passage-garden", 1, 55, 34, "Conservatory passage", ["passage-kitchen"]],
];
for (const [id, floor, x, y, label, links] of passageSpecsSocial) {
  obj(id, floor, x, y, 1, 1, "vent", label);
  objects.at(-1).links = links;
}
const wingMoves = [
  [
    0,
    [
      "piano",
      "divan",
      "musicplant",
      "salonrug",
      "salonpainting",
      "tabla",
      "salonwardrobe",
      "passage-salon",
    ],
    3,
    2,
  ],
  [
    0,
    ["sweets", "diningcabinet", "diningbench", "diningplant", "diningtea"],
    1,
    -3,
  ],
  [
    0,
    [
      "ledger",
      "books0",
      "studysofa",
      "studyrug",
      "studypainting",
      "studyplant",
      "passage-study",
    ],
    -3,
    2,
  ],
  [
    0,
    [
      "stove",
      "kitchentable",
      "spices",
      "sacks",
      "sink",
      "kitchenpots",
      "passage-kitchen",
    ],
    -3,
    -3,
  ],
  [1, ["bed", "wardrobe", "bedrug", "bedmirror", "bedtea"], 1, 0],
  [
    1,
    [
      "books1",
      "librarydesk",
      "libraryshelf",
      "librarychair",
      "libraryrug",
      "archivewardrobe",
      "passage-library",
    ],
    1,
    -3,
  ],
  [
    1,
    ["lanterns", "terracebench", "terraceplant", "terraceplant2", "terracetea"],
    0,
    1,
  ],
  [
    1,
    [
      "gardenpool",
      "gardenbench",
      "seedpots",
      "passage-garden",
      ...Array.from({ length: 5 }, (_, i) => "garden" + i),
    ],
    0,
    -3,
  ],
];
for (const [floor, ids, dx, dy] of wingMoves)
  for (const o of objects.filter(
    (o) => o.floor === floor && ids.includes(o.id),
  )) {
    o.x += dx;
    o.y += dy;
  }
// Keep both mouths of the new cross-doors free of counters, shelves and seating.
Object.assign(
  objects.find((o) => o.id === "divan"),
  { x: 15, y: 21 },
);
Object.assign(
  objects.find((o) => o.id === "diningplant"),
  { x: 6, y: 35 },
);
Object.assign(
  objects.find((o) => o.id === "stove"),
  { y: 30 },
);
Object.assign(
  objects.find((o) => o.id === "spices"),
  { y: 38 },
);
Object.assign(
  objects.find((o) => o.id === "houseclock"),
  { y: 27 },
);
Object.assign(
  objects.find((o) => o.id === "books1"),
  { w: 7 },
);
Object.assign(
  objects.find((o) => o.id === "seedpots"),
  { y: 32 },
);
for (const o of objects.filter((o) => /^garden[0-4]$/.test(o.id))) o.y = 25;
// Bring the bed into handheld-RPG proportions; its collider follows the visible frame.
Object.assign(
  objects.find((o) => o.id === "bed"),
  { x: objects.find((o) => o.id === "bed").x + 1, w: 3, h: 4 },
);
// Every named room has one non-blocking grate; all twelve exits share a network.
// Group existing furnishings into usable bedside, reading and terrace seating areas.
Object.assign(objects.find(o=>o.id==='bedtea'),{x:11,y:7});
Object.assign(objects.find(o=>o.id==='librarychair'),{x:17,y:28});
Object.assign(objects.find(o=>o.id==='terracetea'),{x:49,y:10});
// Positions avoid task stations, furniture, public door mouths and the stair flight.
for (const [id, floor, x, y] of [
  ["passage-dining", 0, 18, 29],
  ["passage-courtyard", 0, 37, 24],
  ["passage-stairs-ground", 0, 37, 6],
  ["passage-bedroom", 1, 13, 12],
  ["passage-terrace", 1, 56, 7],
  ["passage-gallery", 1, 30, 21],
  ["passage-stairs-upper", 1, 37, 6],
  ["passage-grove", 2, 11, 16],
  ["passage-court", 2, 54, 35],
])
  obj(id, floor, x, y, 1, 1, "vent", "Mansion passage");
const allGrates = objects.filter((o) => o.type === "vent");
for (const grate of allGrates) {
  const room = rooms.find(
    (r) =>
      r.floor === grate.floor &&
      r.rects.some(
        (q) =>
          grate.x >= q.x &&
          grate.x < q.x + q.w &&
          grate.y >= q.y &&
          grate.y < q.y + q.h,
      ),
  );
  grate.label = room.name + " passage";
  grate.links = allGrates
    .filter((other) => other !== grate)
    .map((other) => other.id);
}
export const taskStations = objects.filter((o) => o.task),
  wardrobes = objects.filter((o) => o.type === "wardrobe"),
  passageNodes = objects.filter((o) => o.type === "vent");
// Garden landmarks are genuine furniture colliders, with broad routes around them.
for (const [id, x, y, w, h, type, label] of [
  ["well2", 31, 10, 3, 3, "fountain", "Carved stepwell"],
  ["tree2a", 15, 11, 2, 3, "plant", "Mango tree"],
  ["tree2b", 48, 9, 2, 3, "plant", "Mango tree"],
  ["gardenbench2", 12, 31, 4, 2, "sofa", "Stone garden bench"],
  ["pool2", 33, 24, 5, 4, "fountain", "Lotus fountain"],
  ["storage2", 52, 30, 3, 2, "cabinet", "Garden tools"],
  ["pots2", 45, 36, 2, 2, "tea", "Water vessels"],
])
  obj(id, 2, x, y, w, h, type, label);
obj("lawn-fountain",2,13,34,4,3,"fountain","Garden fountain");
for(const [i,x,y]of [[0,5,5],[1,22,16],[2,5,35],[3,23,38],[4,60,8],[5,61,38]])obj("courtyard-flower-"+i,2,x,y,1,2,"plant","Flower planter");
obj("security-terminal", 0, 7, 23, 4, 1, "terminal", "Surveillance console");
obj("security-shelves", 0, 14, 23, 1, 1, "books", "Camera records");
obj("generator-bank", 0, 41, 2, 2, 2, "generator", "Backup generator");
// Apply the room plan before generating collision grids and interaction points.
for (const [id,[x,y,w,h]] of Object.entries(furniturePlan)) {
  const furnishing=objects.find(o=>o.id===id);
  Object.assign(furnishing,{x,y,w,h});
}
Object.assign(objects.find(o=>o.id==='ledger'),{type:'desk',label:'Study writing desk'});
Object.assign(objects.find(o=>o.id==='librarychair'),{type:'chair',label:'Library reading chair'});
obj('study-chair',0,51,12,1,1,'chair','Writing chair');
obj('salon-chair',0,20,21,1,1,'chair','Salon lounge chair');
obj('security-chair',0,8,24,1,1,'chair','Camera operator chair');
obj('gallery-mirror-east',1,37,23,2,1,'mirror','Gallery dressing mirror');
export const grass = [
  { floor: 2, x: 9, y: 6, w: 11, h: 5 },
  { floor: 2, x: 43, y: 14, w: 13, h: 5 },
  { floor: 2, x: 8, y: 23, w: 12, h: 5 },
  { floor: 2, x: 39, y: 33, w: 10, h: 6 },
];
export const inGrass = (p) =>
  grass.some(
    (g) =>
      p.floor === g.floor &&
      p.x >= g.x * TILE &&
      p.x < (g.x + g.w) * TILE &&
      p.y >= g.y * TILE &&
      p.y < (g.y + g.h) * TILE,
  );
export const areaNames = ["Ground floor", "Upper floor", "Courtyard"];
export const arches = [
  {
    id: "west-arch",
    floor: 0,
    x: 184,
    y: 344,
    to: { floor: 2, x: 408, y: 104 },
  },
  {
    id: "east-arch",
    floor: 0,
    x: 904,
    y: 600,
    to: { floor: 2, x: 888, y: 616 },
  },
  {
    id: "grove-arch",
    floor: 2,
    x: 408,
    y: 104,
    to: { floor: 0, x: 184, y: 344 },
  },
  {
    id: "court-arch",
    floor: 2,
    x: 888,
    y: 616,
    to: { floor: 0, x: 904, y: 600 },
  },

];
export const courtyardDoors=arches;
export const sightMaps = [0, 1, 2].map((f) => {
  const grid = Array.from({ length: H }, () => Array(W).fill(1));
  for (const r of floorRegions.filter((r) => r.floor === f))
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++) grid[y][x] = 0;
  // Solid stairwell side walls keep feet on the actual flight and carry the portraits.
  if (f !== 2)
    for (const x of [32, 35]) for (let y = 4; y < 9; y++) grid[y][x] = 1;
  return grid;
});
export const floorAreas = sightMaps.map((grid) =>
  grid.reduce((sum, row) => sum + row.filter((v) => v === 0).length, 0),
);
export const maps = sightMaps.map((base, f) => {
  const grid = base.map((row) => [...row]);
  for (const o of objects.filter(
    (o) =>
      o.floor === f && !["stairs", "rug", "rangoli", "vent"].includes(o.type),
  ))
    for (let y = o.y; y < o.y + o.h; y++)
      for (let x = o.x; x < o.x + o.w; x++) grid[y][x] = 1;
  return grid;
});
export function structural(x, y, floor = 0) {
  if (sightMaps[floor]?.[y]?.[x] !== 1) return false;
  return [-1, 0, 1].some((dy) =>
    [-1, 0, 1].some((dx) => sightMaps[floor]?.[y + dy]?.[x + dx] === 0),
  );
}
export function walkable(f, x, y) {
  return maps[f]?.[Math.floor(y / TILE)]?.[Math.floor(x / TILE)] === 0;
}
export function fits(f, x, y) {
  return [
    [-4, -3],
    [4, -3],
    [-4, 3],
    [4, 3],
  ].every(([dx, dy]) => walkable(f, x + dx, y + dy));
}
// Resolve exactly one movement axis; ties retain the facing axis without zigzagging.
export function cardinal(dx, dy, dir = "down") {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return { x: 0, y: 0 };
  if (dx && dy) {
    if (
      Math.abs(dx) > Math.abs(dy) ||
      (Math.abs(dx) === Math.abs(dy) && ["left", "right"].includes(dir))
    )
      dy = 0;
    else dx = 0;
  }
  return { x: Math.sign(dx), y: Math.sign(dy) };
}
export function move(pos, dx, dy, dt) {
  const input = cardinal(dx, dy, pos.dir),
    d = SPEED * Math.min(0.05, Math.max(0, dt));
  let x = pos.x + input.x * d,
    y = pos.y + input.y * d;
  const candidate = { floor: pos.floor, x, y };
  // Walk the full flight at a measured climbing pace, with no button or scripted teleport.
  if (onStairs(pos) || onStairs(candidate)) {
    x = pos.x + input.x * d * 0.72;
    y = pos.y + input.y * d * 0.72;
  }
  // Ground access is at the foot; upper-floor access is at the head. Side walls
  // prevent skipping treads. Reversing on a flight is always possible.
  const wrongEnd =
    !onStairs(pos) &&
    onStairs({ floor: pos.floor, x, y }) &&
    ((pos.floor === 0 && input.y > 0) || (pos.floor === 1 && input.y < 0));
  if (!wrongEnd && fits(pos.floor, x, y)) {
    const wasOnFlight = onStairs(pos);
    pos.x = x;
    pos.y = y;
    if (wasOnFlight && input.y < 0 && pos.floor === 0 && y < stairFlight.top) {
      Object.assign(pos, { floor: 1, ...stairLandings[1] });
    } else if (
      wasOnFlight &&
      input.y > 0 &&
      pos.floor === 1 &&
      y >= stairFlight.bottom
    ) {
      Object.assign(pos, { floor: 0, ...stairLandings[0] });
    }
  }
  if (input.x || input.y)
    pos.dir = input.x
      ? input.x > 0
        ? "right"
        : "left"
      : input.y > 0
        ? "down"
        : "up";
}
export function los(a, b, solid = false) {
  if (a.floor !== b.floor) return false;
  const grid = (solid ? maps : sightMaps)[a.floor],
    d = Math.hypot(a.x - b.x, a.y - b.y);
  for (let t = 1; t < d; t += 2)
    if (
      grid?.[Math.floor((a.y + ((b.y - a.y) * t) / d) / TILE)]?.[
        Math.floor((a.x + ((b.x - a.x) * t) / d) / TILE)
      ] !== 0
    )
      return false;
  return true;
}
export function visionRadius(role, dark = false) {
  return dark ? (role === "Killer" ? 150 : 20) : 128;
}
export function avatarRadius(role, dark = false) {
  return dark ? (role === "Killer" ? 150 : 25) : 128;
}
export function canSee(a, b, role = "Guest", dark = false) {
  return (
    a.floor === b.floor &&
    Math.hypot(a.x - b.x, a.y - b.y) <= avatarRadius(role, dark) &&
    los(a, b)
  );
}
export function visibilityPolygon(pos, radius, extra = []) {
  const points = [],
    grid = sightMaps[pos.floor];
  for (let i = 0; i <= 160; i++) {
    const angle = (i / 160) * Math.PI * 2,
      dx = Math.cos(angle),
      dy = Math.sin(angle);
    let distance = radius;
    for (let d = 0; d < radius; d += 2)
      if (
        grid?.[Math.floor((pos.y + dy * d) / TILE)]?.[
          Math.floor((pos.x + dx * d) / TILE)
        ] !== 0 ||
        extra.some(
          (b) =>
            b.floor === pos.floor &&
            Math.abs(pos.x + dx * d - b.x) < b.w / 2 &&
            Math.abs(pos.y + dy * d - b.y) < b.h / 2,
        )
      ) {
        distance = Math.min(radius, d + 8);
        break;
      }
    points.push({ x: pos.x + dx * distance, y: pos.y + dy * distance });
  }
  return points;
}
export function nearObject(pos, o, range = 29) {
  if (pos.floor !== o.floor) return false;
  const x = Math.max(o.x * TILE, Math.min(pos.x, (o.x + o.w) * TILE)),
    y = Math.max(o.y * TILE, Math.min(pos.y, (o.y + o.h) * TILE));
  return Math.hypot(pos.x - x, pos.y - y) <= range;
}
export function canInteract(pos, o, range = 22) {
  if (!o || !nearObject(pos, o, range)) return false;
  const target = {
    floor: o.floor,
    x: o.mounted
      ? (o.x + o.w) * TILE + 1
      : Math.max(o.x * TILE + 1, Math.min(pos.x, (o.x + o.w) * TILE - 1)),
    y: Math.max(o.y * TILE + 1, Math.min(pos.y, (o.y + o.h) * TILE - 1)),
  };
  return los(pos, target);
}
export function canReach(a, b, range = 30) {
  return (
    a.floor === b.floor &&
    Math.hypot(a.x - b.x, a.y - b.y) <= range &&
    los(a, b, true)
  );
}
export function spawn(i = 0) {
  return {
    floor: 0,
    x: (30 + (i % 6)) * TILE + 8,
    y: (24 + Math.floor(i / 6) * 2) * TILE + 8,
    dir: "down",
  };
}
export function zoneAt(p) {
  const inside = (r) =>
    p.x >= r.x * TILE &&
    p.x < (r.x + r.w) * TILE &&
    p.y >= r.y * TILE &&
    p.y < (r.y + r.h) * TILE;
  return (
    rooms.find((r) => r.floor === p.floor && r.rects.some(inside)) ||
    passages.find((r) => r.floor === p.floor && inside(r))
  );
}
export function roomAt(p) {
  return zoneAt(p)?.name || "Doorway";
}
export const patrolPoints = rooms
  .flatMap((r) => {
    const candidates = [];
    for (const q of r.rects)
      for (let y = q.y + 1; y < q.y + q.h - 1; y++)
        for (let x = q.x + 1; x < q.x + q.w - 1; x++) {
          const p = { floor: r.floor, x: x * TILE + 8, y: y * TILE + 8 };
          if (fits(p.floor, p.x, p.y) && !onStairs(p)) candidates.push(p);
        }
    const cx = (r.x + r.w / 2) * TILE,
      cy = (r.y + r.h / 2) * TILE;
    return candidates
      .sort(
        (a, b) =>
          Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy),
      )
      .slice(0, 1);
  })
  .concat(
    loopWaypointsByFloor.flatMap((ps, floor) =>
      ps.map((p) => ({ ...p, floor })),
    ),
  );

// Deterministic reachable interaction points, shared by bots and validation tests.
const interactionCache = new Map();
export function interactionPoint(o) {
  if (interactionCache.has(o.id)) return interactionCache.get(o.id);
  const cx = (o.x + o.w / 2) * TILE,
    cy = (o.y + o.h / 2) * TILE,
    candidates = [];
  for (let y = Math.max(1, o.y - 2); y <= o.y + o.h + 2; y++)
    for (let x = Math.max(1, o.x - 2); x <= o.x + o.w + 2; x++) {
      const p = { floor: o.floor, x: x * TILE + 8, y: y * TILE + 8 };
      if (fits(p.floor, p.x, p.y) && canInteract(p, o, 20)) candidates.push(p);
    }
  const result = candidates.sort(
    (a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy),
  )[0];
  interactionCache.set(o.id, result);
  return result;
}
export const hidingSpots = rooms.flatMap((r) => {
  const spots = [];
  for (const q of r.rects)
    for (let y = q.y + 1; y < q.y + q.h - 1; y += 3)
      for (let x = q.x + 1; x < q.x + q.w - 1; x += 3) {
        const p = { floor: r.floor, x: x * TILE + 8, y: y * TILE + 8 };
        if (fits(p.floor, p.x, p.y) && !onStairs(p)) spots.push(p);
      }
  return spots;
});

for (const o of objects) {
  delete o.task;
  delete o.clue;
  if (o.type === "rangoli") {
    o.type = "rug";
    o.label = "Marble mosaic";
  }
}
function anchor(p) {
  if (fits(p.floor, p.x, p.y)) return p;
  const candidates = [];
  for (let dy = -4; dy <= 4; dy++)
    for (let dx = -4; dx <= 4; dx++) {
      const q = {
        floor: p.floor,
        x: (((p.x / TILE) | 0) + dx) * TILE + 8,
        y: (((p.y / TILE) | 0) + dy) * TILE + 8,
      };
      if (fits(q.floor, q.x, q.y) && !onStairs(q)) candidates.push(q);
    }
  return {
    ...p,
    ...candidates.sort(
      (a, b) =>
        Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
    )[0],
  };
}
for (const a of arches) {
  Object.assign(a, anchor(a));
  a.to = anchor(a.to);
}
export const CLASSES = [
  "Photographer",
  "Magician",
  "Escape Artist",
  "Engineer",
  "Hulk",
];
export const machines = [
  ["machine-music", "Music-room dynamo", 0, 18, 14],
  ["machine-dining", "Banquet pump", 0, 17, 36],
  ["machine-study", "Archive relay", 0, 56, 16],
  ["machine-kitchen", "Kitchen compressor", 0, 57, 37],
  ["machine-bedroom", "Guest-wing relay", 1, 20, 9],
  ["machine-library", "Library press", 1, 20, 30],
  ["machine-terrace", "Terrace generator", 1, 52, 12],
  ["machine-gallery", "Mirror-wing motor", 1, 35, 23],
  ["machine-grove", "Grove waterwheel", 2, 22, 7],
  ["machine-well", "Stepwell motor", 2, 36, 15],
  ["machine-stable", "Stable dynamo", 2, 57, 23],
  ["machine-lawn", "Lawn pump", 2, 20, 37],
].map(([id, title, floor, x, y], i) => {
  const p = anchor({ floor, x: x * TILE + 8, y: y * TILE + 8 });
  return {
    id,
    title,
    ...p,
    point: { ...p },
    number: i + 1,
    room: roomAt(p),
    kind: "machine",
  };
});
for (const m of machines) {
  m.point = [
    { floor: m.floor, x: m.x, y: m.y + 16 },
    { floor: m.floor, x: m.x + 16, y: m.y },
    { floor: m.floor, x: m.x - 16, y: m.y },
    { floor: m.floor, x: m.x, y: m.y - 16 },
  ].find((p) => fits(p.floor, p.x, p.y) && los(p, m, true)) || {
    floor: m.floor,
    x: m.x,
    y: m.y,
  };
}
export const exitDoors = [
  { id: "north-gate", title: "North-west gate", floor: 2, x: 104, y: 104 },
  { id: "south-gate", title: "South-west gate", floor: 2, x: 104, y: 632 },
];
export const tables = [
  [0, 17, 20],
  [0, 58, 33],
  [1, 22, 15],
  [1, 56, 29],
  [2, 25, 19],
  [2, 46, 24],
].map(([floor, x, y], i) => ({
  id: "table-" + i,
  title: "Exorcist Table " + (i + 1),
  ...anchor({ floor, x: x * TILE + 8, y: y * TILE + 8 }),
}));
export const panels = [
  {
    id: "power-west",
    floor: 0,
    x: 712,
    y: 80,
    title: "Electrical room breaker",
  },
];
export const doors = passages
  .filter(
    (p) => /vestibule|cross-door/.test(p.name) && p.name !== "Stair vestibule",
  )
  .map((p, i) => ({
    id: "door-" + i,
    floor: p.floor,
    x: (p.x + p.w / 2) * TILE,
    y: (p.y + p.h / 2) * TILE,
    w: p.name.includes("cross-door") ? p.w * TILE : TILE,
    h: p.name.includes("cross-door") ? TILE : p.h * TILE,
    title: p.name,
  }));
export const breakWalls = [
  { id: "garden-screen-west", floor: 2, x: 392, y: 400, w: 16, h: 96 },
  { id: "garden-screen-east", floor: 2, x: 680, y: 304, w: 16, h: 96 },
];
export const lootSites = rooms
  .filter((r) => r.kind !== "stairs")
  .flatMap((r) => {
    const ps = [];
    for (const q of r.rects)
      for (let y = q.y + 2; y < q.y + q.h - 1; y += 3)
        for (let x = q.x + 2; x < q.x + q.w - 1; x += 3) {
          const p = { floor: r.floor, x: x * TILE + 8, y: y * TILE + 8 };
          if (
            fits(p.floor, p.x, p.y) &&
            !onStairs(p) &&
            !breakWalls.some(
              (w) =>
                p.floor === w.floor &&
                Math.abs(p.x - w.x) < w.w / 2 + 12 &&
                Math.abs(p.y - w.y) < w.h / 2 + 12,
            ) &&
            !machines.some((m) => canReach(p, m, 40)) &&
            !arches.some((a) => canReach(p, a, 40))
          )
            ps.push(p);
        }
    return ps;
  });
export const huntRules = {
  match: 600000,
  warmup: 10000,
  machineWork: 160,
  machineDamage: 0.4,
  machineDamageTime: 2000,
  machineDamageCooldown: 45000,
  machineDamageProtection: 60000,
  ghostMachineCap: 0.18,
  scream: 2000,
  screamCooldown: 45000,
  attackCooldown: 1800,
  flashCooldown: 7000,
  flashRecharge: 50000,
  stun: 1500,
  stunResistance: 8000,
  hulk: 12000,
  hulkWindup: 3000,
  hulkSpeed: 0.95,
  hulkStepDistance: 18,
  hulkTimeout: 10000,
  door: 1000,
  doorCooldown: 25000,
  capture: 60000,
  captureLimit: 3,
  wiggleTaps: 20,
  wiggleInterval: 400,
  campRelease: 12000,
  rescueShield: 5000,
  blackoutCooldown: 150000,
  blackoutDuration: 40000,
  hunterSpeed: 1.18,
  pressureSpeed: 1.25,
  pressureRange: 46,
  powerWork: 6000,
};
export const killerSpawn = { floor: 1, x: 552, y: 56, dir: "down" };
export function huntRadius(p, dark) {
  return p.role === "Killer"
    ? 144
    : dark
      ? p.lightOn && p.battery > 0
        ? 88
        : 30
      : 144;
}
export const servicePassages = ["passage-kitchen", "passage-garden"];
export function passageDestinations(p, o) {
  const choices=p.role !== "Killer" && p.class === "Escape Artist" ? o.links : servicePassages.includes(o.id) ? servicePassages.filter(id=>id!==o.id) : [];
  return (choices||[]).filter(id=>{const dest=objects.find(q=>q.id===id);return dest&&(dest.floor===2)===(o.floor===2);});
}

// Searches use existing solid desks/cabinets; no new path blockers.
export const drawerSites = objects
  .filter((o) => ["cabinet", "desk", "table", "terminal"].includes(o.type))
  .map((o) => ({
    id: "drawer-" + o.id,
    object: o.id,
    title: roomAt(interactionPoint(o)) + " drawers",
    ...interactionPoint(o),
  }));

export const securityTerminal = {
  id: "security-terminal",
  ...interactionPoint(objects.find((o) => o.id === "security-terminal")),
};
export const cameraStations = [
  {
    id: "cam-music",
    name: "Music salon",
    floor: 0,
    x: 248,
    y: 232,
    w: 160,
    h: 112,
  },
  {
    id: "cam-west",
    name: "West hall",
    floor: 0,
    x: 392,
    y: 392,
    w: 144,
    h: 112,
  },
  {
    id: "cam-gallery",
    name: "Mirror gallery",
    floor: 1,
    x: 544,
    y: 336,
    w: 144,
    h: 112,
  },
  {
    id: "cam-garden",
    name: "Courtyard well",
    floor: 2,
    x: 552,
    y: 232,
    w: 176,
    h: 128,
  },
];
export function nearDoor(a, d, range = 40) {
  if (a.floor !== d.floor) return false;
  const b = {
    floor: d.floor,
    x: Math.max(d.x - d.w / 2, Math.min(a.x, d.x + d.w / 2)),
    y: Math.max(d.y - d.h / 2, Math.min(a.y, d.y + d.h / 2)),
  };
  return Math.hypot(a.x - b.x, a.y - b.y) <= range && los(a, b, true);
}
