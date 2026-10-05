"""Rebuild cutout metadata after renames: python scripts/index_raw_objects.py.

Reads PNG dimensions without changing supplied images. Wall electrical cutouts
are excluded until the renderer supports wall mounting.
"""
from pathlib import Path
import argparse
import json
import struct

# Real-world size of each cutout in metres: ('h', height) or ('w', width) of the image as supplied.
# Flat garments and papers are measured across; upright objects by height.
REAL_SIZE = {
    'athletic_shorts_black': ('w', 0.42), 'jeans_blue': ('w', 0.48), 'tshirt_red': ('w', 0.55),
    'envelope_kraft': ('w', 0.24), 'intermediate_pad': ('w', 0.15), 'intermediate_pad_cover': ('w', 0.15), 'yellowpad': ('w', 0.216),
    'backpack_olive': ('h', 0.45), 'teddy_bear_blue': ('h', 0.40), 'teddy_bear_brown': ('h', 0.40),
    'batya_green': ('w', 0.50), 'orocan_drawer_chest': ('h', 1.05), 'orocan_icebox_15l': ('h', 0.33),
    'hydrangea_blue_potted': ('h', 0.50), 'hydrangea_pink_pair': ('h', 0.34), 'sunflower_arrangement': ('h', 0.46),
    'cooking_pot_black_handles': ('w', 0.30), 'cooking_pot_wire_handles': ('w', 0.30), 'stockpot_stainless': ('w', 0.28), 'frying_pan_stainless': ('w', 0.28),
    'sunny_pitcher_pink': ('h', 0.25), 'sunny_pitcher_turquoise': ('h', 0.25), 'tumbler_plastic_blue': ('h', 0.13),
    'bagoong_alamang_jar': ('h', 0.12), 'ube_halaya_jar': ('h', 0.11),
    'ligo_sardines_green': ('h', 0.09), 'ligo_sardines_red': ('h', 0.09),
    'datu_puti_vinegar': ('h', 0.27), 'mang_tomas_sarsa': ('h', 0.23),
    'silverswan_suka_flat_bottle': ('h', 0.19), 'silverswan_suka_round_bottle': ('h', 0.20), 'silverswan_suka_tall_bottle': ('h', 0.27),
    'silverswan_suka_pouch_1l': ('h', 0.24), 'silverswan_suka_pouch_small': ('h', 0.14), 'silverswan_suka_set': ('w', 0.30),
    'silverswan_toyo_1l_bottle': ('h', 0.27), 'silverswan_toyo_small_bottle': ('h', 0.17), 'silverswan_toyo_gallon': ('h', 0.30),
    'silverswan_toyo_pouch_1l': ('h', 0.24), 'silverswan_toyo_pouch_small': ('h', 0.14), 'silverswan_toyo_set': ('w', 0.30),
    'surf_jug': ('h', 0.33), 'surf_pouch': ('h', 0.20), 'zonrox_colorsafe': ('h', 0.27), 'zonrox_original': ('h', 0.27),
}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    aliases = dict(zip(['sunny_pitcher_pink','sunny_pitcher_turquoise','orocan_drawer_chest','orocan_icebox_15l','stockpot_stainless','cooking_pot_black_handles','cooking_pot_wire_handles','intermediate_pad','intermediate_pad_cover','frying_pan_stainless','yellowpad'], ['rawPitcherPink','rawPitcherBlue','rawDrawers','rawCooler','rawPotSilver','rawPotGlass','rawPotLid','rawIntermediatePad','rawPadCover','rawFryingPan','rawYellowPad']))
    entries, unsized, skipped = [], [], []
    for path in sorted((args.root / '2d/raw objects').glob('*.png')):
        name = path.stem
        if name in ('wall_outlet_duplex_white','receptacle_box_surface'):
            continue
        if name[0].isdigit():
            # Unnamed captures are not part of the set until someone names and sizes them.
            skipped.append(name)
            continue
        data = path.read_bytes()
        if data[:8] != b'\x89PNG\r\n\x1a\n':
            raise ValueError(f'Not a PNG: {path}')
        width, height = struct.unpack('>II', data[16:24])
        aspect = height / width
        floor = name.startswith(('orocan','batya','backpack','teddy','hydrangea','sunflower','surf_jug','zonrox'))
        flat = name in ('yellowpad','intermediate_pad','intermediate_pad_cover','envelope_kraft','jeans_blue','tshirt_red','athletic_shorts_black')
        mode = 'floor' if floor else 'flat' if flat else 'table'
        rooms = ['sala','bedroom'] if flat or name.startswith(('teddy','backpack')) else ['sala','kitchen']
        if name.startswith(('surf','zonrox','batya')):
            rooms = ['bathroom','kitchen','bare']
        if name.startswith('orocan'):
            rooms = ['sala','bedroom','kitchen','bare']
        if name in REAL_SIZE:
            axis, metres = REAL_SIZE[name]
            size = metres if axis == 'w' else metres / aspect
        else:
            # An unlisted cutout falls back to a generic size; add it to REAL_SIZE.
            size = (0.65 if 'drawer' in name else 0.4) if floor else min(0.3, 0.43/aspect)
            unsized.append(name)
        garment = name in ('jeans_blue','tshirt_red','athletic_shorts_black')
        entries.append(dict(id=aliases.get(name,'raw'+''.join(part.title() for part in name.split('_'))),file='2d/raw objects/'+path.name,aspect=aspect,width=size,mode=mode,rooms=rooms,**({'tabletop':False} if garment else {})))   # a garment at full size does not fit a tabletop
    target = args.root / 'raw-object-assets.js'
    source = target.read_text(encoding='utf-8')
    # Keep everything after the generated table, whatever functions it holds.
    renderer = source[source.index('];', source.index('export const RAW_OBJECTS=')) + 2:].lstrip()
    target.write_text('// User-supplied cutouts; generated by scripts/index_raw_objects.py.\nexport const RAW_OBJECTS='+json.dumps(entries, indent=2)+';\n\n'+renderer, encoding='utf-8')
    print(f'Indexed {len(entries)} cutouts; two electrical wall cutouts deferred.')
    if skipped:
        print('Skipped unnamed files:', ', '.join(skipped))
    if unsized:
        print('No real size recorded, generic size used:', ', '.join(unsized))

if __name__ == '__main__':
    main()
