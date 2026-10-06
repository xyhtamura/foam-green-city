"""Make page-sized copies of the fabric and banig patterns and list them: python scripts/index_fabrics.py

Reads every PNG under tela/ and banig/, which hold the patterns as supplied or generated,
up to 1254 px and 4 MB each, and are not published. Writes a 256 px copy of each to
2d/fabric/<kind>/, and fabric-assets.js listing them. Only the copies are tracked, so the
page loads about 4 MB of patterns in all, not 146 MB, and a pattern costs about a third
of a megabyte on the graphics card.

Usage:
  python scripts/index_fabrics.py            rebuild copies that are missing or older than their source
  python scripts/index_fabrics.py --force    rebuild every copy
"""
from pathlib import Path
import argparse
import json
import re
import sys

from PIL import Image

SIZE = 256
COLOURS = 96

# Patterns kept out of the page, with the reason. Names are source paths under the root.
EXCLUDE = {}

# Patterns redrawn as flat triangles before they are copied, with the reason. The redrawing keeps
# a print's colours and loses its figures. It uses F:/xyh/fgcphotos/lowpoly.py, the tool that made
# the wall photos, which is outside this repository; it is needed only to rebuild these copies.
LOWPOLY = {
    'tela/kids/2026-10-06 16-58-08.png': 'figures resemble a commercial cartoon character',
    'tela/graphic/2026-10-06 17-33-18.png': 'motif resembles a fashion house monogram',
}
LOWPOLY_POINTS = 1400


def redrawn(image, root):
    import numpy as np
    tool = root.parent / 'fgcphotos'
    if not (tool / 'lowpoly.py').is_file():
        raise SystemExit(f'Redrawing needs {tool / "lowpoly.py"}, which is missing.')
    sys.path.insert(0, str(tool))
    from lowpoly import extract_points, render_low_poly
    # Worked at 512 px with a wrapped border, so the triangles carry across the tile's edges.
    pad = 128
    pixels = np.pad(np.array(image.resize((512, 512), Image.LANCZOS)), ((pad, pad), (pad, pad), (0, 0)), mode='wrap')
    np.random.seed(20261006)
    points = extract_points(pixels, num_points=int(LOWPOLY_POINTS * 2.25), edge_weight=0.8, min_dist=4)
    return Image.fromarray(render_low_poly(pixels, points)[0][pad:-pad, pad:-pad])

# How large one repeat of the pattern is in the room, in metres, by folder.
REPEAT = {
    'banig': 0.5, 'gingham': 0.32, 'polka_dots': 0.4, 'ticking_stripes': 0.3, 'cabana_pinstripes': 0.45,
    'kurtina_slub_stripes': 0.45, 'plaid_madras': 0.5, 'ditsy_floral': 0.45, 'retro_waves': 0.45,
}
DEFAULT_REPEAT = 0.6


def slug(kind: str, path: Path, base: Path) -> str:
    parts = list(path.relative_to(base).with_suffix('').parts)
    name = parts[-1]
    stamp = re.fullmatch(r'\d{4}-\d{2}-\d{2} (\d{2})-(\d{2})-(\d{2})', name)
    if stamp:
        # A dated capture is named for its folder and time of day.
        name = ''.join(stamp.groups())
        parts = parts[:-1] + [(parts[-2] if len(parts) > 1 else kind) + '_' + name] if len(parts) > 1 else [kind + '_' + name]
    else:
        parts = parts[-1:]
    return re.sub(r'[^a-z0-9_]+', '_', '_'.join(parts).lower()).strip('_')


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args()
    root = args.root
    entries, written, held, redone = [], 0, [], []
    for kind in ('tela', 'banig'):
        base = root / kind
        out_dir = root / '2d' / 'fabric' / kind
        out_dir.mkdir(parents=True, exist_ok=True)
        keep = set()
        for path in sorted(base.rglob('*.png')):
            relative = path.relative_to(root).as_posix()
            if relative in EXCLUDE:
                held.append(f'{relative}: {EXCLUDE[relative]}')
                continue
            name = slug(kind, path, base)
            target = out_dir / (name + '.png')
            if target.name in keep:
                raise SystemExit(f'Two patterns would share the name {target.name}: {relative}')
            keep.add(target.name)
            if args.force or not target.exists() or target.stat().st_mtime < path.stat().st_mtime:
                image = Image.open(path).convert('RGB')
                if relative in LOWPOLY:
                    image = redrawn(image, root)
                    redone.append(f'{relative}: {LOWPOLY[relative]}')
                image = image.resize((SIZE, SIZE), Image.LANCZOS)
                image.quantize(COLOURS, method=Image.MEDIANCUT, dither=Image.NONE).save(target, optimize=True)
                written += 1
            folder = path.parent.name if path.parent != base else kind
            group = 'banig' if kind == 'banig' else folder
            entries.append(dict(id=name, file=target.relative_to(root).as_posix(), kind=kind, group=folder,
                                repeat=REPEAT.get(group, DEFAULT_REPEAT)))
        for stale in out_dir.glob('*.png'):
            if stale.name not in keep:
                stale.unlink()
                print('Removed', stale.relative_to(root).as_posix())
    target = root / 'fabric-assets.js'
    target.write_text('// Fabric and banig patterns; generated by scripts/index_fabrics.py from tela/ and banig/.\n'
                      '// repeat is the size of one repeat of the pattern in the room, in metres.\n'
                      'export const FABRICS=' + json.dumps(entries, indent=1) + ';\n', encoding='utf-8')
    size = sum((root / e['file']).stat().st_size for e in entries)
    print(f'Listed {len(entries)} patterns ({sum(e["kind"] == "tela" for e in entries)} tela, '
          f'{sum(e["kind"] == "banig" for e in entries)} banig); wrote {written} copies; {size / 1e6:.1f} MB in all.')
    for line in held:
        print('Held back,', line)
    for line in redone:
        print('Redrawn as triangles,', line)


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    main()
