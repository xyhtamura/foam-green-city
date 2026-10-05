"""Check that every asset the page loads is tracked by git, so it exists on GitHub Pages.

Usage: python scripts/check_published_assets.py

The repository ignores everything it does not whitelist, and Windows does not care
about letter case, so a file can load locally and return 404 once published. This
reads the asset paths out of the JavaScript and index.html and compares them, with
exact case, against `git ls-files`. Exit status 1 lists what is missing.
"""
from pathlib import Path
import argparse
import re
import subprocess
import sys


def referenced(root: Path) -> set[str]:
    sources = [p for p in root.glob('*.js')] + [root / 'index.html']
    text = '\n'.join(p.read_text(encoding='utf-8') for p in sources)
    refs = set()
    for match in re.finditer(r"""['"`]([^'"`\n]*?\.(?:png|jpg|jpeg|webp|glb|ttf|otf|woff2?))['"`]""", text):
        path = match.group(1)
        if '${' in path or path.startswith(('http', '..')) or path == '.glb':
            continue
        # Bare sprite names are resolved against models/ by spriteMat().
        refs.add(path if '/' in path else 'models/' + path)
    # Kenney models are named in loader lists rather than by path.
    for block in re.findall(r"await Promise\.all\(\[(.*?)\]\s*\.map\(async n", text, flags=re.S):
        refs.update(f'models/GLTF format/{name}.glb' for name in re.findall(r"'([A-Za-z0-9]+)'", block))
    for _, name in re.findall(r"\['(\w+)','(wall\w+)'\]", text):
        refs.add(f'models/GLTF format/{name}.glb')
    model_assets = (root / 'model-assets.js').read_text(encoding='utf-8')
    refs.update(f'models/polyhaven/{name}.glb' for name in re.findall(r"file:'([a-z0-9_]+)'", model_assets))
    # Sprite materials built from two-part names, e.g. spriteMat('2d/wiring/wireline.png').
    return {r for r in refs if not r.startswith('models/wire')}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    listed = subprocess.run(['git', '-c', 'core.quotepath=off', 'ls-files'], cwd=args.root, capture_output=True, check=True)
    tracked = set(listed.stdout.decode('utf-8').splitlines())
    lower = {path.lower(): path for path in tracked}
    refs = referenced(args.root)
    missing = sorted(r for r in refs if r not in tracked)
    for path in missing:
        other = lower.get(path.lower())
        print(f'NOT PUBLISHED: {path}' + (f' (tracked as {other}: letter case differs)' if other else ''))
    if missing:
        print(f'{len(missing)} of {len(refs)} referenced assets are not tracked by git.')
        return 1
    print(f'PASS {len(refs)} referenced assets are tracked by git with matching case.')
    return 0


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main())
