# Floor tile bank

Put seamless floor images here, then run `python scripts/index_floor_tiles.py` from the project folder. Rooms whose floor is drawn from the bank pick one of these images and repeat it.

Name each file for the width of floor the whole image covers, in centimetres: `white_marble_60cm.png` is one 60 cm tile, and `terrazzo_4x4_160cm.jpg` is a 4 × 4 block of 40 cm tiles. A file with no size in its name is taken to cover 40 cm.

PNG, JPG, and WebP are read. The image should tile: its left edge must meet its right edge, and its top its bottom. Use images you own or have cleared, and record where each came from in [ASSETS.md](../../ASSETS.md).

While this folder holds no images, a bank floor is drawn as plain white tile.
