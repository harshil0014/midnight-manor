// Interior plan in world tiles. Room shells and public exits stay aligned across
// renderer, collisions, drawers and bot navigation through hunt-world.mjs.
export const furniturePlan = {
  piano:[9,9,6,2], divan:[13,22,4,1], tabla:[13,18,2,1],
  musicplant:[9,15,1,2], salonpainting:[17,8,3,1],
  sweets:[10,31,6,3], diningcabinet:[6,28,7,1],
  diningbench:[11,39,6,1], diningtea:[18,34,2,1],
  ledger:[50,10,5,2], books0:[48,7,9,1], studyplant:[57,8,1,2],
  stove:[47,27,9,2], sink:[57,27,2,2], kitchentable:[50,32,4,2],
  kitchenpots:[47,37,4,1], spices:[53,38,3,1], sacks:[46,24,2,1],
  bed:[12,6,3,4], bedtea:[16,6,1,1], bedmirror:[18,15,3,1],
  books1:[11,22,9,1], librarydesk:[12,25,4,2], librarychair:[13,27,1,1],
  libraryshelf:[15,32,6,1],
  lanterns:[49,6,6,1], terracebench:[49,9,4,1], terracetea:[54,9,1,1],
  garden0:[47,23,1,2], garden1:[49,23,1,2], garden2:[51,23,1,2],
  garden3:[53,23,1,2], garden4:[55,23,1,2],
  gardenpool:[50,27,4,3], gardenbench:[47,31,2,1], seedpots:[53,32,4,1],
  mirror:[29,18,2,1], galleryportrait:[37,17,1,2], council1:[30,24,2,1],
};

// Furnishing zones replace generic centered rugs: the bed, performance area,
// dining table and desk each have their own appropriately sized textile.
export const furnishingRugs = {
  music:[8.5,11.5,8,6], dining:[9,30,8,5], study:[49,9,7,5],
  bedroom:[11.5,5.5,5.5,6], library:[11.5,24,6,5],
};

// Broad unbroken movement lanes through the main furnished rooms. These are
// validated as walkable space, not invisible barriers or movement assistance.
export const roomLanes = [
  [0,'Music salon',17,11,2,7],
  [0,'Banquet hall',18,29,3,5],
  [0,'Family study',47,14,3,5],
  [0,'Palace kitchen',46,29,4,7],
  [1,'Guest bedroom',16,10,7,2],
  [1,'Family library',17,23,3,6],
  [1,'Lantern terrace',47,10,9,2],
  [1,'Conservatory',46,27,4,3],
  [1,'Mirror gallery',31,20,6,3],
];
