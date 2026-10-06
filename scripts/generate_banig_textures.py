"""Generate procedural Banig (Philippine woven sleeping mat) pattern textures for Foam Green City.

Models patterns off authentic Philippine domestic and traditional sleeping mats:
  - Neon Plastic Banig (modeled off synthetic polypropylene beach/sleeping mats with electric cyan,
    neon orange, yellow, and lime stripes, as in reference media_1791275240484.png)
  - Pastel & Faded Banig (modeled off retro sun-bleached domestic mats with dusty rose, lavender,
    soft sage, and stepped zig-zag / rick-rack border stripes, as in reference media_1791275198244.png)
  - Traditional Natural Banig (organic unbleached reed / tikog / pandan straw with vegetable-dyed
    madder red, indigo, and forest green stripes and fibrous leaf grain)
  - Geometric Samar Tikog Banig (traditional Basey Samar / Laminusa nested concentric diamond twill
    and 'mata-mata' / 'saruk' geometric lozenge weaves)

Outputs textures into sorted subdirectories under `banig/`, seamlessly tileable with
micro-furrowed plastic ribbon or natural reed substrate.
"""

from __future__ import annotations

import argparse
import math
import os
from pathlib import Path
import sys
from typing import Dict, List, Tuple

import numpy as np
from PIL import Image


# ---------------------------------------------------------------------------
# Color utilities
# ---------------------------------------------------------------------------

def hex_to_rgb(hex_str: str) -> np.ndarray:
    """Parse #RRGGBB or #RGB to float [0, 1] RGB array."""
    h = hex_str.lstrip('#')
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    return np.array([int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4)], dtype=np.float32)


def rgb_to_uint8(rgb_arr: np.ndarray) -> np.ndarray:
    """Convert float [0, 1] RGB array to uint8 [0, 255]."""
    return np.clip(rgb_arr * 255.0 + 0.5, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------------------
# Banig Ribbon / Straw Weave Substrate & Lighting
# ---------------------------------------------------------------------------

def compute_ribbon_lighting(
    width: int,
    height: int,
    strip_w: float,
    is_warp: np.ndarray,
    material_type: str = "plastic",  # "plastic" or "natural"
    seed: int = 42,
) -> np.ndarray:
    """Compute micro-lighting, edge furrows, and material surface properties for woven ribbon straws.
    
    Returns a [H, W] float array modulating the base color.
    """
    rng = np.random.default_rng(seed)
    
    x = np.arange(width)
    y = np.arange(height)
    X, Y = np.meshgrid(x, y)
    
    # Local normalized coordinate [0, 1) across the width of each strip
    u = (X % strip_w) / strip_w
    v = (Y % strip_w) / strip_w
    
    # Furrow profile (shadow crease where adjacent flat ribbons meet)
    furrow_u = np.sin(np.pi * u) ** 0.45
    furrow_v = np.sin(np.pi * v) ** 0.45
    top_furrow = np.where(is_warp, furrow_u, furrow_v)
    
    if material_type == "plastic":
        # Synthetic polypropylene ribbon: smooth reflective crest with specular sheen
        sheen_u = 1.0 + 0.16 * np.exp(-((u - 0.38) / 0.18) ** 2)
        sheen_v = 1.0 + 0.16 * np.exp(-((v - 0.38) / 0.18) ** 2)
        sheen = np.where(is_warp, sheen_u, sheen_v)
        
        # Micro synthetic extrusion striations
        extrusion = 1.0 + 0.02 * np.sin(np.where(is_warp, 8 * np.pi * u, 8 * np.pi * v))
        lighting = (0.76 + 0.24 * top_furrow) * sheen * extrusion
    else:
        # Natural dried plant reed (tikog / pandan): matte, fibrous longitudinal grain
        grain_u = np.zeros((height, width), dtype=np.float32)
        for freq in [1, 2, 4, 8]:
            grain_u += (0.02 / freq) * np.sin(freq * 2 * np.pi * u + rng.uniform(0, 2*np.pi))
        
        # Subtle organic tone variation per reed strip
        cols = int(width / strip_w)
        rows = int(height / strip_w)
        col_idx = (X / strip_w).astype(int) % cols
        row_idx = (Y / strip_w).astype(int) % rows
        reed_rand_x = rng.uniform(0.97, 1.03, size=cols).astype(np.float32)[col_idx]
        reed_rand_y = rng.uniform(0.97, 1.03, size=rows).astype(np.float32)[row_idx]
        reed_var = np.where(is_warp, reed_rand_x, reed_rand_y)
        
        lighting = (0.74 + 0.26 * top_furrow) * (1.0 + grain_u) * reed_var
        
    return lighting


# ---------------------------------------------------------------------------
# 1. Neon Plastic Banig (Modeled on media_1791275240484.png)
# ---------------------------------------------------------------------------

NEON_BANIG_PALETTES = {
    "neon_cyan_lagoon": {
        # Exact match to Reference 2 front cyan mat
        "weft_ground": "#00BBD4",  # Electric cyan weft
        "warp_ground": "#00BBD4",  # Matching cyan ground warp
        "stripes": [
            ("#FF5722", 5),        # Neon blaze orange
            ("#FFEE00", 5),        # Electric yellow
            ("#76FF03", 3),        # Acid lime green
            ("#FFEE00", 5),        # Electric yellow
            ("#FF5722", 5),        # Neon blaze orange
            ("#76FF03", 3),        # Acid lime green
            ("#FFD600", 2),        # Golden accent pinstripe
        ],
    },
    "neon_fiesta_purple": {
        # Exact match to Reference 2 middle purple/orange mat
        "weft_ground": "#7B1FA2",  # Vivid purple weft
        "warp_ground": "#7B1FA2",
        "stripes": [
            ("#FF5722", 6),        # Blaze orange
            ("#D50000", 4),        # Scarlet red
            ("#FFD600", 5),        # Sunny yellow
            ("#FF5722", 6),        # Blaze orange
            ("#AA00FF", 3),        # Electric violet
            ("#FFD600", 2),        # Accent yellow line
        ],
    },
    "neon_emerald_chartreuse": {
        # Exact match to Reference 2 top green mat
        "weft_ground": "#00E676",  # Electric emerald weft
        "warp_ground": "#00E676",
        "stripes": [
            ("#AEEA00", 5),        # Chartreuse
            ("#00B0FF", 4),        # Sky cyan
            ("#FFD600", 5),        # Bright gold
            ("#AEEA00", 5),        # Chartreuse
            ("#00E676", 3),        # Emerald
            ("#FFD600", 2),        # Gold accent
        ],
    },
    "neon_royal_hot_pink": {
        # High-contrast Philippine festival mat
        "weft_ground": "#1565C0",  # Royal blue weft
        "warp_ground": "#1565C0",
        "stripes": [
            ("#FF1744", 6),        # Hot pink / neon red
            ("#FFEA00", 5),        # High-voltage yellow
            ("#FF6D00", 4),        # Tangerine orange
            ("#00E5FF", 3),        # Cyan pinstripe
            ("#FF1744", 5),        # Hot pink
        ],
    },
    "neon_sunburst_tangerine": {
        # Saturated sunburst sleeping mat
        "weft_ground": "#FF6D00",  # Tangerine orange weft
        "warp_ground": "#FF6D00",
        "stripes": [
            ("#FFD600", 6),        # Golden yellow
            ("#E91E63", 4),        # Vivid magenta
            ("#00C853", 4),        # Shamrock green
            ("#2979FF", 3),        # Electric blue
            ("#FFD600", 5),        # Golden yellow
        ],
    },
}

def generate_neon_plastic_banig(
    width: int,
    height: int,
    palette_name: str = "neon_cyan_lagoon",
    strip_w: float = 4.0,
    seed: int = 101,
) -> np.ndarray:
    """Generate authentic neon synthetic polypropylene woven straw banig."""
    pal = NEON_BANIG_PALETTES.get(palette_name, NEON_BANIG_PALETTES["neon_cyan_lagoon"])
    weft_c = hex_to_rgb(pal["weft_ground"])
    warp_ground_c = hex_to_rgb(pal["warp_ground"])

    cols = int(width / strip_w)
    rows = int(height / strip_w)

    x = np.arange(width)
    y = np.arange(height)
    X, Y = np.meshgrid(x, y)

    col_idx = (X / strip_w).astype(int) % cols
    row_idx = (Y / strip_w).astype(int) % rows
    
    # 1-over, 1-under plain basket weave
    is_warp = ((col_idx + row_idx) % 2) == 0

    # Build striped warp columns across the period
    # Divide cols into two symmetric repeats for seamless wrap
    num_clusters = 2
    cluster_stride = cols // num_clusters
    warp_cols = np.ones((cols, 3), dtype=np.float32) * warp_ground_c[None, :]

    for c in range(num_clusters):
        start_col = c * cluster_stride + (cluster_stride // 4)
        curr = start_col
        for (hex_color, width_strips) in pal["stripes"]:
            col_val = hex_to_rgb(hex_color)
            end_col = min(cols, curr + width_strips)
            warp_cols[curr:end_col] = col_val
            curr = end_col + 1

    warp_color = warp_cols[col_idx]
    weft_color = weft_c[None, None, :]

    # In synthetic straw banig, weft passes over warp, creating the two-tone optic grid
    canvas = np.where(is_warp[:, :, None], warp_color, weft_color)

    lighting = compute_ribbon_lighting(width, height, strip_w, is_warp, material_type="plastic", seed=seed)
    return np.clip(canvas * lighting[:, :, None], 0.0, 1.0)


# ---------------------------------------------------------------------------
# 2. Pastel & Faded Banig with Rick-Rack Borders (Modeled on media_1791275198244.png)
# ---------------------------------------------------------------------------

PASTEL_BANIG_PALETTES = {
    "pastel_rose_periwinkle": {
        # Exact match to Reference 1 folded sleeping mat
        "straw_base": "#E8DEB7",       # Warm straw cream base
        "rose_band": "#DF6E7A",        # Dusty salmon/rose pink
        "periwinkle_band": "#7C88BA",  # Soft lavender / periwinkle blue
        "sage_accent": "#8DA88C",      # Pale muted sage green
        "zigzag_line": "#4A627E",      # Deep periwinkle rick-rack line
    },
    "pastel_foamgreen_peach": {
        # Soft DepEd foam green & peach domestic mat
        "straw_base": "#EDE5C8",       # Ecru straw
        "rose_band": "#E5927D",        # Soft peach coral
        "periwinkle_band": "#5FA37D",  # Faded foam green
        "sage_accent": "#B6C9B0",      # Light celadon
        "zigzag_line": "#3B694E",      # Palmyra green rick-rack
    },
    "sunfaded_retro_mint": {
        # Sun-bleached 80s Filipino bedroom mat
        "straw_base": "#F0EAD2",       # Bleached straw
        "rose_band": "#6DA592",        # Faded seafoam mint
        "periwinkle_band": "#E0A96D",  # Faded warm apricot
        "sage_accent": "#A3B899",      # Soft sage
        "zigzag_line": "#4B7A6A",      # Deep mint rick-rack
    },
    "faded_lavender_sage": {
        # Dusty lilac and meadow green
        "straw_base": "#EBE2C8",       # Warm ecru
        "rose_band": "#A67CA8",        # Dusty lavender
        "periwinkle_band": "#82A379",  # Meadow sage
        "sage_accent": "#D1A3B0",      # Faded blush
        "zigzag_line": "#5E4268",      # Plum rick-rack
    },
    "coastal_bleached_blue": {
        # Island sun-bleached beach mat
        "straw_base": "#EDE4CA",       # Natural sand
        "rose_band": "#6494B8",        # Bleached nautical blue
        "periwinkle_band": "#C87563",  # Weathered terracotta
        "sage_accent": "#A8C0C8",      # Pale sea spray
        "zigzag_line": "#2C5070",      # Navy rick-rack
    },
}

def generate_pastel_faded_banig(
    width: int,
    height: int,
    palette_name: str = "pastel_rose_periwinkle",
    strip_w: float = 4.0,
    seed: int = 202,
) -> np.ndarray:
    """Generate sun-faded domestic banig with stepped zig-zag / rick-rack border stripes."""
    pal = PASTEL_BANIG_PALETTES.get(palette_name, PASTEL_BANIG_PALETTES["pastel_rose_periwinkle"])
    c_base = hex_to_rgb(pal["straw_base"])
    c_rose = hex_to_rgb(pal["rose_band"])
    c_peri = hex_to_rgb(pal["periwinkle_band"])
    c_sage = hex_to_rgb(pal["sage_accent"])
    c_zz = hex_to_rgb(pal["zigzag_line"])

    cols = int(width / strip_w)
    rows = int(height / strip_w)

    x = np.arange(width)
    y = np.arange(height)
    X, Y = np.meshgrid(x, y)

    col_idx = (X / strip_w).astype(int) % cols
    row_idx = (Y / strip_w).astype(int) % rows
    is_warp = ((col_idx + row_idx) % 2) == 0

    # Rhythmic stripe sequence across columns:
    # 2 repeats of: Straw base -> Sage accent -> Zigzag -> Rose band -> Zigzag -> Straw base -> Periwinkle band
    P_cycle = cols // 2
    rel_col = col_idx % P_cycle

    # Triangle wave for stepped zig-zag rick-rack stripes along row_idx
    # Period 16 rows divides height evenly (128 / 16 = 8 cycles) for seamless wrapping
    zz_period = 16
    t_row = 2 * np.pi * row_idx / float(zz_period)
    tri_wave = (2.0 / np.pi) * np.arcsin(np.sin(t_row))
    zz_offset = np.round(1.5 * tri_wave).astype(int)

    # Base warp color assignment
    warp_color = np.ones((height, width, 3), dtype=np.float32) * c_base[None, None, :]

    # 1. Broad Rose Band with flanking zig-zags
    rose_start = int(0.20 * P_cycle)
    rose_end = int(0.48 * P_cycle)
    mask_rose = (rel_col >= rose_start) & (rel_col < rose_end)
    warp_color[mask_rose] = c_rose

    # 2. Broad Periwinkle Band
    peri_start = int(0.68 * P_cycle)
    peri_end = int(0.88 * P_cycle)
    mask_peri = (rel_col >= peri_start) & (rel_col < peri_end)
    warp_color[mask_peri] = c_peri

    # 3. Sage accent thin bands
    sage_mask = (rel_col >= (rose_start - 4)) & (rel_col < (rose_start - 1))
    warp_color[sage_mask] = c_sage

    # 4. Stepped Zig-Zag Rick-Rack border lines
    # Flank the rose band with 2-strip wide zig-zag lines
    zz_line_a = (rel_col == (rose_start + zz_offset)) | (rel_col == (rose_start + zz_offset + 1))
    zz_line_b = (rel_col == (rose_end - 1 + zz_offset)) | (rel_col == (rose_end + zz_offset))
    warp_color[zz_line_a | zz_line_b] = c_zz

    # Weft straw: slightly tinted straw base with subtle pastel tone blending
    weft_color = (0.75 * c_base + 0.25 * hex_to_rgb("#F5F0DC"))[None, None, :]

    canvas = np.where(is_warp[:, :, None], warp_color, weft_color)

    lighting = compute_ribbon_lighting(width, height, strip_w, is_warp, material_type="plastic", seed=seed)
    return np.clip(canvas * lighting[:, :, None], 0.0, 1.0)


# ---------------------------------------------------------------------------
# 3. Traditional Natural Banig (Organic Tikog / Pandan / Buri Reed)
# ---------------------------------------------------------------------------

NATURAL_BANIG_PALETTES = {
    "samar_madder_ochre": {
        # Basey, Samar vegetable dyed reed mat
        "natural_reed": "#D6C39B",     # Dried tikog straw
        "madder_red": "#8C2E25",       # Vegetable-dyed sapan red
        "forest_green": "#2D4F35",     # Natural leaf green
        "turmeric_gold": "#C2872A",    # Turmeric dyed reed
        "accent_dark": "#2E2420",      # Deep bark brown
    },
    "sulu_mangosteen_emerald": {
        # Laminusa, Sulu traditional colors
        "natural_reed": "#D4C5A2",     # Dried pandan leaf
        "madder_red": "#4E283E",       # Mangosteen purple
        "forest_green": "#2B5838",     # Deep emerald
        "turmeric_gold": "#CFA138",    # Golden reed
        "accent_dark": "#1F3B29",      # Dark forest
    },
    "antique_unbleached_rush": {
        # Minimalist traditional raw dried rush
        "natural_reed": "#DECBA5",     # Pale dried reed
        "madder_red": "#B59E74",       # Toasted straw
        "forest_green": "#9C835A",     # Aged brown reed
        "turmeric_gold": "#D0BA8A",    # Golden straw
        "accent_dark": "#634E35",      # Dark root brown
    },
    "ilocos_inabel_earth": {
        # Northern Luzon earthy banig
        "natural_reed": "#CEBA8E",     # Warm tan
        "madder_red": "#9E4232",       # Terracotta red
        "forest_green": "#46634A",     # Olive green
        "turmeric_gold": "#D49C3D",    # Mustard gold
        "accent_dark": "#28343C",      # Slate navy
    },
}

def generate_traditional_natural_banig(
    width: int,
    height: int,
    palette_name: str = "samar_madder_ochre",
    strip_w: float = 4.0,
    seed: int = 303,
) -> np.ndarray:
    """Generate traditional natural tikog reed banig with organic plant strip grain."""
    pal = NATURAL_BANIG_PALETTES.get(palette_name, NATURAL_BANIG_PALETTES["samar_madder_ochre"])
    c_reed = hex_to_rgb(pal["natural_reed"])
    c_red = hex_to_rgb(pal["madder_red"])
    c_green = hex_to_rgb(pal["forest_green"])
    c_gold = hex_to_rgb(pal["turmeric_gold"])
    c_dark = hex_to_rgb(pal["accent_dark"])

    cols = int(width / strip_w)
    rows = int(height / strip_w)

    x = np.arange(width)
    y = np.arange(height)
    X, Y = np.meshgrid(x, y)

    col_idx = (X / strip_w).astype(int) % cols
    row_idx = (Y / strip_w).astype(int) % rows
    is_warp = ((col_idx + row_idx) % 2) == 0

    # Traditional alternating reed stripes across columns and rows (cross-banded)
    P_cycle = cols // 2
    rel_col = col_idx % P_cycle
    rel_row = row_idx % P_cycle

    warp_color = np.ones((height, width, 3), dtype=np.float32) * c_reed[None, None, :]
    weft_color = np.ones((height, width, 3), dtype=np.float32) * c_reed[None, None, :]

    # Symmetrical traditional band placement
    # Warp stripes
    warp_color[(rel_col >= 8) & (rel_col < 16)] = c_red
    warp_color[(rel_col >= 16) & (rel_col < 20)] = c_gold
    warp_color[(rel_col >= 20) & (rel_col < 22)] = c_dark
    warp_color[(rel_col >= 22) & (rel_col < 30)] = c_green
    warp_color[(rel_col >= 30) & (rel_col < 32)] = c_dark
    warp_color[(rel_col >= 32) & (rel_col < 36)] = c_gold
    warp_color[(rel_col >= 36) & (rel_col < 44)] = c_red

    # Weft cross-bands
    weft_color[(rel_row >= 10) & (rel_row < 14)] = c_gold
    weft_color[(rel_row >= 14) & (rel_row < 16)] = c_dark
    weft_color[(rel_row >= 28) & (rel_row < 32)] = c_green

    canvas = np.where(is_warp[:, :, None], warp_color, weft_color)

    lighting = compute_ribbon_lighting(width, height, strip_w, is_warp, material_type="natural", seed=seed)
    return np.clip(canvas * lighting[:, :, None], 0.0, 1.0)


# ---------------------------------------------------------------------------
# 4. Geometric Tikog Banig (Samar Diamond Twill / Mata-Mata)
# ---------------------------------------------------------------------------

def generate_geometric_tikog_banig(
    width: int,
    height: int,
    palette_name: str = "samar_madder_ochre",
    diamond_size: int = 32,
    strip_w: float = 4.0,
    seed: int = 404,
) -> np.ndarray:
    """Generate authentic Basey Samar diamond twill ('mata-mata' / 'saruk') geometric woven banig."""
    pal = NATURAL_BANIG_PALETTES.get(palette_name, NATURAL_BANIG_PALETTES["samar_madder_ochre"])
    c_reed = hex_to_rgb(pal["natural_reed"])
    c_red = hex_to_rgb(pal["madder_red"])
    c_green = hex_to_rgb(pal["forest_green"])
    c_gold = hex_to_rgb(pal["turmeric_gold"])

    cols = int(width / strip_w)
    rows = int(height / strip_w)

    x = np.arange(width)
    y = np.arange(height)
    X, Y = np.meshgrid(x, y)

    col_idx = (X / strip_w).astype(int) % cols
    row_idx = (Y / strip_w).astype(int) % rows

    # Ensure diamond period divides cols and rows evenly
    P = max(8, int(round(diamond_size / strip_w)))
    if P % 2 != 0:
        P += 1

    # Concentric Manhattan / diamond distance from cell centers
    half_p = P // 2
    di = np.abs((col_idx % P) - half_p)
    dj = np.abs((row_idx % P) - half_p)
    dist = di + dj  # Range 0 to P

    # 2/2 twill weave structure
    is_warp = ((col_idx + row_idx) % 4) < 2

    # Map concentric diamond rings to traditional natural reed colors
    canvas = np.ones((height, width, 3), dtype=np.float32) * c_reed[None, None, :]
    
    # Ring 1 (outer border): Madder Red
    canvas[(dist >= (P * 0.72)) & (dist < P)] = c_red
    # Ring 2 (intermediate): Turmeric Gold
    canvas[(dist >= (P * 0.45)) & (dist < (P * 0.72))] = c_gold
    # Ring 3 (inner diamond): Forest Green
    canvas[(dist >= (P * 0.22)) & (dist < (P * 0.45))] = c_green
    # Center eye ('mata'): Natural reed
    canvas[dist < (P * 0.22)] = c_reed

    lighting = compute_ribbon_lighting(width, height, strip_w, is_warp, material_type="natural", seed=seed)
    return np.clip(canvas * lighting[:, :, None], 0.0, 1.0)


# ---------------------------------------------------------------------------
# Gallery & Index Generator
# ---------------------------------------------------------------------------

def generate_html_preview(output_root: Path, categories_map: Dict[str, List[Path]]):
    """Write an interactive HTML preview gallery into output_root/index.html."""
    html_lines = [
        "<!doctype html>",
        '<html lang="en">',
        "<head>",
        '  <meta charset="utf-8">',
        '  <meta name="viewport" content="width=device-width, initial-scale=1">',
        '  <title>Foam Green City — Banig Pattern Bank</title>',
        '  <style>',
        '    :root { --bg: #f4f6f0; --card: #ffffff; --text: #24352b; --accent: #4e7c63; }',
        '    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); padding: 24px; }',
        '    h1 { margin-top: 0; font-size: 24px; color: var(--accent); }',
        '    p.lead { font-size: 15px; color: #556b5f; max-width: 820px; line-height: 1.5; margin-bottom: 24px; }',
        '    .filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }',
        '    .filter-btn { font: inherit; font-size: 13px; padding: 6px 14px; border: 1px solid #ccd8d0; border-radius: 20px; background: #fff; color: var(--text); cursor: pointer; transition: all 0.15s; }',
        '    .filter-btn.active, .filter-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }',
        '    .category { margin-bottom: 40px; background: var(--card); padding: 20px 24px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }',
        '    .category h2 { margin: 0 0 4px 0; font-size: 18px; text-transform: capitalize; color: var(--accent); }',
        '    .category p.desc { margin: 0 0 16px 0; font-size: 13px; color: #667e71; }',
        '    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 18px; }',
        '    .card { background: #fafafa; border: 1px solid #e2e8e3; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; }',
        '    .card .preview-box { height: 180px; position: relative; background-repeat: repeat; background-size: 100px 100px; border-bottom: 1px solid #e2e8e3; transition: background-size 0.2s; }',
        '    .card .info { padding: 10px 12px; font-size: 12px; }',
        '    .card .name { font-weight: 600; margin-bottom: 4px; word-break: break-all; }',
        '    .card .details { color: #728479; font-size: 11px; }',
        '    .controls { display: flex; gap: 6px; margin-top: 8px; }',
        '    .controls button { font-size: 11px; padding: 3px 8px; border: 1px solid #ccd6ce; border-radius: 4px; background: #fff; cursor: pointer; }',
        '    .controls button:hover { background: #eef3ef; }',
        '  </style>',
        "</head>",
        "<body>",
        "  <h1>Foam Green City — Banig Pattern Bank</h1>",
        "  <p class=\"lead\">Procedural sleeping mat textures (banig) generated for Philippine domestic interiors and floor surfaces. Modeled off synthetic neon polypropylene beach mats, sun-faded domestic pastel mats with rick-rack borders, and traditional Basey Samar vegetable-dyed tikog diamond twills. Toggle 1× / 2× / 4× repeat to preview seamless tiling.</p>",
        '  <div class="filter-bar">',
        '    <button class="filter-btn active" onclick="filterCat(\'all\', this)">All Categories</button>',
    ]

    for cat_name in categories_map.keys():
        clean_title = cat_name.replace("_", " ")
        html_lines.append(f'    <button class="filter-btn" onclick="filterCat(\'{cat_name}\', this)">{clean_title}</button>')
    html_lines.append('  </div>')

    for cat_name, files in categories_map.items():
        if not files:
            continue
        clean_title = cat_name.replace("_", " ")
        html_lines.append(f'  <div class="category" data-cat="{cat_name}">')
        html_lines.append(f'    <h2>{clean_title}</h2>')
        html_lines.append(f'    <p class="desc">{len(files)} generated seamless banig textures</p>')
        html_lines.append('    <div class="grid">')
        for f in files:
            rel_path = f.relative_to(output_root).as_posix()
            stem = f.stem
            html_lines.append('      <div class="card">')
            html_lines.append(f'        <div class="preview-box" id="prev-{stem}" style="background-image: url(\'{rel_path}\');"></div>')
            html_lines.append('        <div class="info">')
            html_lines.append(f'          <div class="name">{stem}</div>')
            html_lines.append(f'          <div class="details"><a href="{rel_path}" target="_blank">Full image</a> &bull; Seamless</div>')
            html_lines.append('          <div class="controls">')
            html_lines.append(f'            <button onclick="document.getElementById(\'prev-{stem}\').style.backgroundSize=\'contain\'">1&times;</button>')
            html_lines.append(f'            <button onclick="document.getElementById(\'prev-{stem}\').style.backgroundSize=\'100px 100px\'">2&times;</button>')
            html_lines.append(f'            <button onclick="document.getElementById(\'prev-{stem}\').style.backgroundSize=\'50px 50px\'">4&times;</button>')
            html_lines.append('          </div>')
            html_lines.append('        </div>')
            html_lines.append('      </div>')
        html_lines.append('    </div>')
        html_lines.append('  </div>')

    html_lines.extend([
        "  <script>",
        "    function filterCat(cat, btn) {",
        "      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));",
        "      btn.classList.add('active');",
        "      document.querySelectorAll('.category').forEach(el => {",
        "        el.style.display = (cat === 'all' || el.getAttribute('data-cat') === cat) ? 'block' : 'none';",
        "      });",
        "    }",
        "  </script>",
        "</body>",
        "</html>",
    ])

    (output_root / "index.html").write_text("\n".join(html_lines), encoding="utf-8")


# ---------------------------------------------------------------------------
# Main Orchestration
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parents[1] / "banig",
                        help="Root output directory (default: <project>/banig)")
    parser.add_argument("--category", choices=["all", "neon_plastic", "pastel_faded", "traditional_natural", "geometric_tikog"],
                        default="all", help="Pattern category to generate (default: all)")
    parser.add_argument("--size", type=int, default=512, help="Image resolution in pixels (default: 512)")
    parser.add_argument("--seed", type=int, default=42, help="Base random seed (default: 42)")
    args = parser.parse_args()

    out_root = args.output_dir
    out_root.mkdir(parents=True, exist_ok=True)
    size = args.size
    base_seed = args.seed

    cats_to_run = [args.category] if args.category != "all" else [
        "neon_plastic",
        "pastel_faded",
        "traditional_natural",
        "geometric_tikog",
    ]

    generated_map: Dict[str, List[Path]] = {}

    print(f"Generating banig patterns into {out_root} (size={size}x{size})...")

    # 1. Neon Plastic Banig
    if "neon_plastic" in cats_to_run:
        cat_dir = out_root / "neon_plastic"
        cat_dir.mkdir(parents=True, exist_ok=True)
        files = []
        for i, (pname, _) in enumerate(NEON_BANIG_PALETTES.items()):
            rgb = generate_neon_plastic_banig(size, size, palette_name=pname, strip_w=4.0, seed=base_seed + i * 11)
            img = Image.fromarray(rgb_to_uint8(rgb))
            out_path = cat_dir / f"banig_neon_{pname}.png"
            img.save(out_path)
            files.append(out_path)
        generated_map["neon_plastic"] = files
        print(f"  [neon_plastic] {len(files)} textures generated.")

    # 2. Pastel & Faded Banig
    if "pastel_faded" in cats_to_run:
        cat_dir = out_root / "pastel_faded"
        cat_dir.mkdir(parents=True, exist_ok=True)
        files = []
        for i, (pname, _) in enumerate(PASTEL_BANIG_PALETTES.items()):
            rgb = generate_pastel_faded_banig(size, size, palette_name=pname, strip_w=4.0, seed=base_seed + 100 + i * 13)
            img = Image.fromarray(rgb_to_uint8(rgb))
            out_path = cat_dir / f"banig_pastel_{pname}.png"
            img.save(out_path)
            files.append(out_path)
        generated_map["pastel_faded"] = files
        print(f"  [pastel_faded] {len(files)} textures generated.")

    # 3. Traditional Natural Banig
    if "traditional_natural" in cats_to_run:
        cat_dir = out_root / "traditional_natural"
        cat_dir.mkdir(parents=True, exist_ok=True)
        files = []
        for i, (pname, _) in enumerate(NATURAL_BANIG_PALETTES.items()):
            rgb = generate_traditional_natural_banig(size, size, palette_name=pname, strip_w=4.0, seed=base_seed + 200 + i * 17)
            img = Image.fromarray(rgb_to_uint8(rgb))
            out_path = cat_dir / f"banig_traditional_{pname}.png"
            img.save(out_path)
            files.append(out_path)
        generated_map["traditional_natural"] = files
        print(f"  [traditional_natural] {len(files)} textures generated.")

    # 4. Geometric Samar Tikog Banig
    if "geometric_tikog" in cats_to_run:
        cat_dir = out_root / "geometric_tikog"
        cat_dir.mkdir(parents=True, exist_ok=True)
        files = []
        for i, (pname, _) in enumerate(NATURAL_BANIG_PALETTES.items()):
            rgb = generate_geometric_tikog_banig(size, size, palette_name=pname, diamond_size=64, strip_w=4.0, seed=base_seed + 300 + i * 19)
            img = Image.fromarray(rgb_to_uint8(rgb))
            out_path = cat_dir / f"banig_geometric_tikog_{pname}.png"
            img.save(out_path)
            files.append(out_path)
        generated_map["geometric_tikog"] = files
        print(f"  [geometric_tikog] {len(files)} textures generated.")

    generate_html_preview(out_root, generated_map)
    total_textures = sum(len(f) for f in generated_map.values())
    print(f"\nDone! Generated {total_textures} banig textures across {len(generated_map)} categories.")
    print(f"HTML preview gallery generated at: {out_root / 'index.html'}")


if __name__ == "__main__":
    main()
