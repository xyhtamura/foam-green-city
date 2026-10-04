"""Prepare user-supplied Blender models for the static walkthrough.

Run with Blender (not system Python):
  blender -b -t 2 --disable-autoexec -P scripts/prepare_polyhaven.py -- \
    --source ../3d/models --output models/polyhaven --audit-only

Paths are resolved relative to the current working directory. Run from the
project folder with --source ../3d/models --output models/polyhaven.
Original .blend files and their textures are never saved or overwritten.
"""
import argparse
import ctypes
import hashlib
import json
import os
import struct
from pathlib import Path
import sys

import bpy

DEFAULT_ASSETS = ['pot_enamel_01', 'wooden_spoon', 'plastic_crate_01',
                  'wooden_bookshelf_worn', 'vintage_day_bed',
                  'plastic_monobloc_chair_01', 'food_apple_01', 'throw_pillows_01',
                  'bananas', 'food_ginger_01', 'sweet_potato', 'office_notepads',
                  'plastic_crate_02', 'worn_metal_rack']


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if os.name == 'nt':
        ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x4000)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--assets', nargs='+', default=DEFAULT_ASSETS)
    parser.add_argument('--texture-size', type=int, default=512)
    parser.add_argument('--triangle-budget', type=int, default=3000)
    parser.add_argument('--audit-only', action='store_true')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    source, output = args.source.resolve(), args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    records = []
    for asset in args.assets:
        path = source / (asset + '_4k.blend')
        bpy.ops.wm.open_mainfile(filepath=str(path), load_ui=False)
        meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.hide_render]
        record = {'asset': asset, 'source': str(path),
                  'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                  'objects': [{'name': o.name, 'vertices': len(o.data.vertices),
                               'polygons': len(o.data.polygons),
                               'dimensions': list(o.dimensions)} for o in meshes]}
        if not args.audit_only:
            bpy.ops.object.select_all(action='DESELECT')
            total = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes)
            for obj in meshes:
                obj.hide_set(False)
                obj.hide_select = False
                obj.select_set(True)
                bpy.context.view_layer.objects.active = obj
                if total > args.triangle_budget:
                    modifier = obj.modifiers.new('Walkthrough reduction', 'DECIMATE')
                    modifier.ratio = args.triangle_budget / total
                    modifier.use_collapse_triangulate = True
                    bpy.ops.object.modifier_apply(modifier=modifier.name)
            converted, images = {}, {}
            for obj in meshes:
                for slot in obj.material_slots:
                    old = slot.material
                    if not old:
                        continue
                    if old.name not in converted:
                        image = next((n.image for n in old.node_tree.nodes
                                      if n.type == 'TEX_IMAGE' and n.image and
                                      ('diff' in n.image.name.lower() or 'albedo' in n.image.name.lower())), None) if old.use_nodes else None
                        material = bpy.data.materials.new('Walkthrough ' + old.name)
                        material.use_nodes = True
                        principled = material.node_tree.nodes.get('Principled BSDF')
                        principled.inputs['Roughness'].default_value = 1
                        principled.inputs['Metallic'].default_value = 0
                        if image:
                            if image.name not in images:
                                image.reload()
                                if max(image.size) > args.texture_size:
                                    scale = args.texture_size / max(image.size)
                                    image.scale(max(1, round(image.size[0] * scale)), max(1, round(image.size[1] * scale)))
                                # Saved derivatives belong to this project, not the source folder.
                                image.filepath_raw = str(output / (asset + '_' + str(len(images)) + '_diffuse.jpg'))
                                image.file_format = 'JPEG'
                                image.save()
                                images[image.name] = image
                            node = material.node_tree.nodes.new('ShaderNodeTexImage')
                            node.image = images[image.name]
                            material.node_tree.links.new(node.outputs['Color'], principled.inputs['Base Color'])
                        else:
                            principled.inputs['Base Color'].default_value = old.diffuse_color
                        converted[old.name] = material
                    slot.material = converted[old.name]
            target = output / (asset + '.glb')
            bpy.ops.export_scene.gltf(filepath=str(target), export_format='GLB',
                                      use_selection=True, export_apply=True,
                                      export_image_format='JPEG', export_jpeg_quality=80,
                                      export_animations=False, export_cameras=False,
                                      export_lights=False)
            data = target.read_bytes()
            chunk_length = struct.unpack_from('<I', data, 12)[0]
            gltf = json.loads(data[20:20 + chunk_length])
            triangles = sum(gltf['accessors'][primitive['indices']]['count'] // 3
                            for mesh in gltf['meshes'] for primitive in mesh['primitives'])
            if triangles > args.triangle_budget:
                raise RuntimeError(f'{asset}: exported {triangles} triangles exceeds budget')
            record.update(output=target.name, bytes=target.stat().st_size,
                          triangles=triangles,
                          textureSize=args.texture_size)
        records.append(record)
        print(json.dumps(record), flush=True)
    manifest = output / ('audit.json' if args.audit_only else 'manifest.json')
    if manifest.exists():
        previous = json.loads(manifest.read_text(encoding='utf-8'))
        replaced = {record['asset'] for record in records}
        records = [record for record in previous if record['asset'] not in replaced] + records
    manifest.write_text(
        json.dumps(records, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
