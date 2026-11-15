# Midnight Manor furniture artwork

Wooden furniture: "LPC Wooden Furniture" by bluecarrot16, Baŝto, Lanea Zimmerman (Sharm), William Thompson, Tuomo Untinen (Reemax), Janna/Lilius/Jannax.
https://opengameart.org/content/lpc-wooden-furniture
Selected license: CC-BY-SA 4.0 (as offered by the source page). Full upstream component attribution, including Guido Bos, is preserved in credits/CREDITS-furniture.txt. The source atlas PNGs are unmodified.

Upholstery: "[LPC] Upholstery" by bluecarrot16 and Lanea Zimmerman (Sharm).
https://opengameart.org/content/lpc-upholstery
https://opengameart.org/content/lpc-interior-castle-tiles
Selected license: CC-BY 4.0. The source PNG is unmodified. Jade, plum and blue recolors are generated at runtime in src/lpc-furniture.js; the adapted artwork is shared under CC-BY 4.0 with the same attribution.

The mappings in src/lpc-furniture.js arrange and scale these sprites to existing gameplay footprints. Original terrain, rugs, portraits, plants, game props and character artwork are implemented separately. No Pokemon or Among Us assets are included.

License texts are included beside this file. Full original credit archive is retained as credits-furniture.zip.


## Additional imported artwork (2026-11-14)

[LPC] Containers by bluecarrot16, Lanea Zimmerman (Sharm), William Thompson, Tuomo Untinen (Reemax), Evert, Buch, Blarumyrran, n2liquid, Jetrel, Guido Bos, Hyptosis, Bonsaiheldin, NaRNeRZz, PriorBlue, Jerom, 7Soul, and Wolthera van Hövell tot Westerflier (TheraHedwig).
https://opengameart.org/content/lpc-containers
CC-BY-SA 4.0. Unmodified source archive and complete mandatory credits: containers/container-v4_2/CREDITS-container.txt. Chests are cropped/scaled from the source atlas in the client; no chest art was redrawn.

[LPC] House interior and decorations, by Tuomo Untinen (Reemax), with Sharm, Hyptosis, daneeklu, William Thompson, wulax, makrohn, and all contributors listed in house/LPC_house_interior/credits.txt (including caeles and Manuel Riecke). Full upstream credits are retained verbatim in that file.
https://opengameart.org/content/lpc-house-interior-and-decorations
CC-BY-SA 3.0. Unmodified source archive and atlas. Imported dishes, sacks, vessels, paper piles and clock are arranged/scaled on existing furniture surfaces. The artwork adaptations retain their respective CC-BY-SA licenses.


Animated door leaves: "LPC Animated Doors", original wood/dungeon doors by Lanea Zimmerman (Sharm), animation submitted by Xenodora. Selected license CC-BY 3.0. Unmodified source: animated-doors.png. https://opengameart.org/content/lpc-animated-doors . Cropped animation frames are mapped to the existing doorway spans.

## LPC Floors (graphics polish, 2026-11-14)

Unmodified `floors.png` and `floors-source.zip` from [LPC Floors](https://opengameart.org/content/lpc-floors). By bluecarrot16, Lanea Zimmerman (Sharm), William Thompson (William.Thompsonj), Hyptosis, SpiderDave, Cougarmint, Stephen Challener (Redshrike), Bonsaiheldin, Tyler Olsen (Roots), Jetrel, jestan, the Open Surge team, Gaurav Munjal, Reemax, Silveira Neto, bleutailfly, Casper Nilsson, NaRNeRZz, Buch, keith karnage, Arthur Carvalho, Guilherme Vieira (n2liquid), and Chris Hamons (maintainer). Selected license: CC-BY-SA 4.0. Complete component credits are preserved verbatim in `floors-credits.txt`; license text in `CC-BY-SA-4.0.txt`. `src/lpc-surfaces.js` composes atlas crops and nine-slice rugs into existing map footprints. Adaptations retain CC-BY-SA 4.0.

## LPC Walls (graphics polish, 2026-11-14)

Unmodified `walls.png` and `walls-source.zip` from [LPC Walls](https://opengameart.org/content/lpc-walls). By bluecarrot16, Lanea Zimmerman (Sharm), Daniel Armstrong (HughSpectrum), William Thompson (William.Thompsonj), Hyptosis, Zabin, Daniel Cook, Guido Bos, SpiderDave, Cougarmint, Stephen Challener (Redshrike), Matthew Nash, Wolthera van Hövell tot Westerflier (TheraHedwig), Reemax, bleutailfly, NaRNeRZz, Sir Spummington, Casper Nilsson, and KnoblePersona. Selected license: CC-BY-SA 3.0. Complete component credits in `walls-credits.txt`, license in `CC-BY-SA-3.0.txt`. Atlas crops are composed as wall finishes inside existing structural boundaries; adaptations retain CC-BY-SA 3.0.

The normal game loads only `haveli-materials.png` (a 256x384 crop sheet, generated reproducibly by `scripts/compile-materials.py`). The packed sheet contains separately identifiable floor/rug crops from LPC Floors (CC-BY-SA 4.0) and wall crops from LPC Walls (CC-BY-SA 3.0). Original full atlases, source archives, and their complete credits remain included above. Cropping and packing do not replace the component attributions or license notices.
