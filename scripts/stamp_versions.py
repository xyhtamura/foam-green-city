"""Give every local module import the same version stamp.

Usage:
    python scripts/stamp_versions.py          rewrite the stamps
    python scripts/stamp_versions.py --check  exit 1 if the stamps are out of date

A browser or GitHub Pages can hold an old copy of one module while serving a new
copy of another. When their exports no longer match, the page fails to load. With
one stamp on every `./name.js` import, a change to any module changes every import
URL, so a visitor gets a whole old set or a whole new set, never a mixture.

The stamp is a hash of the module sources with the stamps removed, so running this
twice changes nothing. Run it before committing a change to any root-level .js file.
"""
from pathlib import Path
import argparse
import hashlib
import re
import sys

IMPORT = re.compile(r"""((?:from|import)\s*\(?\s*)(['"])(\./[A-Za-z0-9_\-]+\.js)(?:\?v=[^'"]*)?\2""")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--check', action='store_true', help='report stale stamps without writing')
    args = parser.parse_args()
    modules = sorted(args.root.glob('*.js'))
    pages = sorted(args.root.glob('*.html'))
    texts = {path: path.read_bytes().decode('utf-8') for path in modules + pages}
    bare = {path: IMPORT.sub(lambda m: f'{m.group(1)}{m.group(2)}{m.group(3)}{m.group(2)}', text) for path, text in texts.items()}
    digest = hashlib.sha256()
    for path in modules:
        # Line endings differ between checkouts; the stamp should not.
        digest.update(path.name.encode() + b'\0' + bare[path].replace('\r\n', '\n').encode('utf-8') + b'\0')
    stamp = digest.hexdigest()[:10]
    stale = []
    for path, text in bare.items():
        stamped = IMPORT.sub(lambda m: f'{m.group(1)}{m.group(2)}{m.group(3)}?v={stamp}{m.group(2)}', text)
        if stamped != texts[path]:
            stale.append(path.name)
            if not args.check:
                path.write_bytes(stamped.encode('utf-8'))
    if args.check and stale:
        print(f'Stale version stamps (expected {stamp}) in: ' + ', '.join(stale))
        return 1
    print(f'{"PASS" if args.check else "Stamped"} {stamp}: {len(modules)} modules, {len(pages)} pages' + ('' if args.check else f', {len(stale)} files rewritten'))
    return 0


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main())
