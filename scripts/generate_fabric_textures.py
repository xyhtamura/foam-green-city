"""Generate procedural fabric pattern textures for Foam Green City curtains and textiles.

Models patterns off authentic Philippine domestic fabrics, including:
  - Kurtina slub / painted multi-stripes (modeled off 2026-10-03 17-28-41.png, 17-28-35.png, 17-28-25.png)
  - Cabana / awning stripes with triplet pinstripes (modeled off 2026-10-06 14-00-18.png)
  - Woven gingham checks (modeled off 2026-10-03 17-08-19.png)
  - Polka dots (staggered hexagonal and aligned grids, pindot, classic, and coin sizes)
  - Woven Inabel / Madras / Kumot plaids (traditional blanket / tablecloth checks, incl. 2026-10-06 15-52-00.png)
  - Ditsy / Sampaguita retro florals (scattered blossoms on plain or striped ground)
  - Domestic mattress ticking stripes (paired fine pinstripes on linen)
  - Retro wavy / rick-rack chevron curtains

Outputs textures into sorted subdirectories under `tela/`, seamlessly tileable with
micro-weave yarn substrate and slub details.
"""

from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path
import random
import sys
from typing import Callable, Dict, List, Tuple

import numpy as np
from PIL import Image, ImageDraw


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
# Fabric Weave & Slub Substrate
# ---------------------------------------------------------------------------

def generate_fabric_weave_overlay(
    width: int,
    height: int,
    thread_period: float = 4.0,
    slub_intensity: float = 0.08,
    weave_depth: float = 0.07,
    seed: int = 42,
) -> np.ndarray:
    """Generate a seamlessly tileable micro-weave and yarn slub modulation map.
    
    Returns a 2D float array in range [1 - depth, 1 + depth] centered near 1.0.
    Ensures exact integer thread counts so boundaries wrap with zero seam.
    """
    rng = np.random.default_rng(seed)
    
    # Ensure thread count divides width and height into exact integers for seamless wrap
    num_threads_x = max(16, int(round(width / thread_period)))
    num_threads_y = max(16, int(round(height / thread_period)))
    
    x = np.linspace(0, 2 * np.pi * num_threads_x, width, endpoint=False)
    y = np.linspace(0, 2 * np.pi * num_threads_y, height, endpoint=False)
    X, Y = np.meshgrid(x, y)
    
    warp_profile = np.sin(X) ** 2
    weft_profile = np.sin(Y) ** 2
    
    # Plain weave (over-1, under-1) interlacing
    checker_x = ((X / np.pi).astype(int)) % 2
    checker_y = ((Y / np.pi).astype(int)) % 2
    is_warp = (checker_x ^ checker_y) == 0
    
    yarn_height = np.where(is_warp, 0.65 * warp_profile + 0.35 * (1.0 - weft_profile),
                                    0.65 * weft_profile + 0.35 * (1.0 - warp_profile))
    
    weave = (yarn_height - 0.5) * weave_depth
    
    # Vertical slub yarn variations (low-frequency periodic horizontal sine bank)
    slub_v = np.zeros((height, width), dtype=np.float32)
    for freq in [1, 2, 3, 4, 6, 8, 12]:
        phase_x = rng.uniform(0, 2 * np.pi)
        phase_y = rng.uniform(0, 2 * np.pi)
        drift = 0.25 * np.sin(np.linspace(0, 2 * np.pi, height, endpoint=False)[:, None] + phase_y)
        slub_v += (0.5 / np.sqrt(freq)) * np.sin(np.linspace(0, 2 * np.pi * freq, width, endpoint=False)[None, :] + phase_x + drift)
    
    slub_v = (slub_v / (np.std(slub_v) + 1e-6)) * (slub_intensity * 0.4)
    
    # Fine fiber fuzz (periodic high-frequency micro-grain)
    # Using small fast 2D periodic noise, wrapped on edges
    gw, gh = width // 8, height // 8
    grain_raw = rng.normal(0, 1.0, (gh, gw)).astype(np.float32)
    grain_img = Image.fromarray(grain_raw).resize((width, height), resample=Image.Resampling.BICUBIC)
    grain = np.array(grain_img, dtype=np.float32)
    grain = (grain / (np.std(grain) + 1e-6)) * (slub_intensity * 0.2)
    
    factor = 1.0 + weave + slub_v + grain
    return factor


def apply_weave_to_rgb(rgb_map: np.ndarray, weave_factor: np.ndarray) -> np.ndarray:
    """Apply weave luminance modulation to [H, W, 3] float RGB array."""
    modulated = rgb_map * weave_factor[:, :, None]
    return np.clip(modulated, 0.0, 1.0)


# ---------------------------------------------------------------------------
# Pattern Generators
# ---------------------------------------------------------------------------

# 1. Kurtina Slub Stripes (modeled off 17-28-41, 17-28-35, 17-28-25, 17-28-47)

KURTINA_PALETTES = {
    "manila_bay_blue_gold": {
        "ground": "#F7F6F1",
        "primary": "#E5A91E",     # Golden yellow (matches 17-28-41)
        "accent": "#275FA6",      # Royal blue
        "secondary": "#76A7D8",   # Sky blue
        "pinstripe": "#1B3B6F",   # Deep navy accent
        "tint": "#EED8C2",        # Warm peach
    },
    "palmyra_olive_yellow": {
        "ground": "#FAF8F3",
        "primary": "#E8CF25",     # Lemon yellow (matches 17-28-35)
        "accent": "#385226",      # Deep olive
        "secondary": "#7E994E",   # Willow green
        "pinstripe": "#263B18",   # Dark forest accent
        "tint": "#C6D7BD",        # Soft sage
    },
    "sampaguita_rose_gold": {
        "ground": "#FBF8F5",
        "primary": "#ECAE23",     # Goldenrod (matches 17-28-25)
        "accent": "#B83669",      # Magenta rose
        "secondary": "#DF7290",   # Coral blush
        "pinstripe": "#661838",   # Maroon accent
        "tint": "#EAA786",        # Warm melon
    },
    "sunflower_amber_brown": {
        "ground": "#F8F6F0",
        "primary": "#E5A31E",     # Sunflower gold (matches 17-28-47)
        "accent": "#8A3C1D",      # Amber brown
        "secondary": "#E57E2F",   # Warm orange
        "pinstripe": "#4D1F0E",   # Deep sepia accent
        "tint": "#EAD6BD",        # Light tan
    },
    "deped_foam_harvest": {
        "ground": "#F4F5F0",
        "primary": "#C29B27",     # Harvest ochre
        "accent": "#4E7C63",      # Palmyra green
        "secondary": "#BFDCC9",   # Foam green
        "pinstripe": "#203C21",   # Dark green accent
        "tint": "#E7E0CC",        # MPSS light beige
    },
    "calamansi_citrus": {
        "ground": "#F9F8F2",
        "primary": "#7AC142",     # Calamansi lime
        "accent": "#237A68",      # Deep teal
        "secondary": "#F4B324",   # Mango yellow
        "pinstripe": "#124B40",   # Forest teal accent
        "tint": "#F5E9A6",        # Pale cream lemon
    },
}

def generate_kurtina_slub_stripes(
    width: int,
    height: int,
    palette_name: str = "manila_bay_blue_gold",
    num_cycles: int = 2,
    seed: int = 101,
) -> np.ndarray:
    """Generate painted slub vertical multi-stripes seamlessly tileable horizontally and vertically."""
    pal = KURTINA_PALETTES.get(palette_name, KURTINA_PALETTES["manila_bay_blue_gold"])
    ground_c = hex_to_rgb(pal["ground"])
    primary_c = hex_to_rgb(pal["primary"])
    accent_c = hex_to_rgb(pal["accent"])
    second_c = hex_to_rgb(pal["secondary"])
    pin_c = hex_to_rgb(pal["pinstripe"])
    tint_c = hex_to_rgb(pal["tint"])

    rng = np.random.default_rng(seed)
    cycle_w = width / float(num_cycles)
    
    canvas = np.ones((height, width, 3), dtype=np.float32) * ground_c[None, None, :]
    
    # Rhythmic stripe zones across one cycle [0, 1]
    # (rel_center, rel_width, color, dry_brush_intensity)
    zones = [
        (0.08, 0.07, primary_c, 0.25),
        (0.18, 0.05, tint_c, 0.15),
        (0.23, 0.015, pin_c, 0.05),
        (0.32, 0.08, accent_c, 0.35),
        (0.42, 0.06, second_c, 0.20),
        (0.50, 0.018, pin_c, 0.05),
        (0.62, 0.11, primary_c, 0.30),
        (0.72, 0.015, pin_c, 0.05),
        (0.78, 0.07, second_c, 0.22),
        (0.88, 0.05, tint_c, 0.15),
    ]

    # Precompute vertical dry-brush striation fields (periodic in Y)
    v_streaks = np.zeros((height, width), dtype=np.float32)
    y_phase = np.linspace(0, 2 * np.pi, height, endpoint=False)
    for k in range(1, 10):
        freq_x = rng.integers(24, 64)
        amp = 1.0 / (k ** 0.6)
        v_streaks += amp * np.sin(np.linspace(0, 2 * np.pi * freq_x, width, endpoint=False)[None, :] + rng.uniform(0, 2*np.pi)) * \
                           np.cos(y_phase[:, None] * k + rng.uniform(0, 2*np.pi))
    v_streaks = (v_streaks - np.min(v_streaks)) / (np.max(v_streaks) - np.min(v_streaks) + 1e-6)

    x_coords = np.arange(width)
    for c in range(num_cycles):
        offset = c * cycle_w
        for (rel_center, rel_width, col, brush_amt) in zones:
            stripe_center = offset + rel_center * cycle_w
            stripe_half_w = (rel_width * cycle_w) * 0.5
            
            # Toroidal distance in X
            dx = np.abs((x_coords - stripe_center + width * 0.5) % width - width * 0.5)
            
            feather = max(1.0, stripe_half_w * 0.08)
            alpha_x = np.clip((stripe_half_w - dx) / feather, 0.0, 1.0)
            
            core_factor = np.clip((stripe_half_w * 0.7 - dx) / (stripe_half_w * 0.7 + 1e-6), 0.0, 1.0)
            striation = 1.0 - brush_amt * (1.0 - core_factor) * (1.0 - v_streaks)
            
            mask = alpha_x[None, :] * striation
            mask = np.clip(mask, 0.0, 1.0)[:, :, None]
            
            canvas = canvas * (1.0 - mask) + col[None, None, :] * mask

    weave = generate_fabric_weave_overlay(width, height, thread_period=4.0, slub_intensity=0.10, weave_depth=0.06, seed=seed)
    return apply_weave_to_rgb(canvas, weave)


# 2. Cabana Awning Stripes with Triplet Pinstripes (modeled off 14-00-18)

CABANA_PALETTES = {
    "deped_kelly_green": {
        "color": "#12B858",     # Vivid authentic curtain green (matches 14-00-18)
        "white": "#FFFFFF",
        "pinstripe": "#12B858",
    },
    "foam_green_classic": {
        "color": "#4E7C63",     # Palmyra / Foam green tone
        "white": "#F1F1EC",
        "pinstripe": "#4E7C63",
    },
    "pacific_royal_blue": {
        "color": "#1D64B8",     # Deep vivid royal blue
        "white": "#FFFFFF",
        "pinstripe": "#1D64B8",
    },
    "fiesta_crimson_red": {
        "color": "#C92A2A",     # Festive Philippine red
        "white": "#FDFBF7",
        "pinstripe": "#C92A2A",
    },
    "sunflower_yellow": {
        "color": "#E5A112",     # Warm sunflower yellow
        "white": "#FFFFFF",
        "pinstripe": "#D4900C",
    },
    "manila_maroon": {
        "color": "#7A1828",     # State maroon
        "white": "#F6F3EC",
        "pinstripe": "#7A1828",
    },
    "terracotta_orange": {
        "color": "#BD4C2A",     # Earthy terracotta
        "white": "#FAF8F5",
        "pinstripe": "#BD4C2A",
    },
}

def generate_cabana_pinstripes(
    width: int,
    height: int,
    palette_name: str = "deped_kelly_green",
    repeats: int = 2,  # 2 repeats divides 512 into exact 256px periods
    pinstripe_count: int = 3,
    seed: int = 202,
) -> np.ndarray:
    """Generate cabana awning stripes with centered triplet pinstripes in the white band."""
    pal = CABANA_PALETTES.get(palette_name, CABANA_PALETTES["deped_kelly_green"])
    color_c = hex_to_rgb(pal["color"])
    white_c = hex_to_rgb(pal["white"])
    pin_c = hex_to_rgb(pal["pinstripe"])

    # Ensure repeats is an integer divisor
    period = width / float(repeats)
    x = np.arange(width) % period
    
    # 0 to 0.5 * period is solid color band; 0.5 to 1.0 * period is white band
    is_color_band = x < (0.5 * period)
    canvas = np.where(is_color_band[None, :, None], color_c[None, None, :], white_c[None, None, :])
    
    # Triplet pinstripes inside the white band:
    center_white = 0.75 * period
    pin_spacing = period * 0.065
    pin_half_w = max(1.0, period * 0.012)
    
    pin_offsets = [-pin_spacing, 0.0, pin_spacing] if pinstripe_count == 3 else [0.0]
    
    for offset in pin_offsets:
        target_x = center_white + offset
        dx = np.abs(x - target_x)
        pin_mask = np.clip((pin_half_w - dx) / 0.8, 0.0, 1.0)
        canvas = canvas * (1.0 - pin_mask[None, :, None]) + pin_c[None, None, :] * pin_mask[None, :, None]
    
    weave = generate_fabric_weave_overlay(width, height, thread_period=4.0, slub_intensity=0.06, weave_depth=0.05, seed=seed)
    return apply_weave_to_rgb(canvas, weave)


# 3. Gingham Check (modeled off 17-08-19)

GINGHAM_PALETTES = {
    "sunshine_yellow": {
        "color": "#DFA518",     # Warm yellow (matches 17-08-19)
        "white": "#FFFFFF",
    },
    "carinderia_red": {
        "color": "#C92A2A",     # Classic canteen / picnic red
        "white": "#FFFFFF",
    },
    "deped_foam_green": {
        "color": "#58A374",     # Soft mint / foam green
        "white": "#F1F1EC",
    },
    "palmyra_dark_green": {
        "color": "#3B6D4A",     # Deep olive / palmyra green
        "white": "#FAF8F2",
    },
    "breeze_sky_blue": {
        "color": "#3B82C4",     # Pastel sky blue
        "white": "#FFFFFF",
    },
    "school_navy": {
        "color": "#1E3A70",     # Deep navy blue
        "white": "#FFFFFF",
    },
    "vintage_rose": {
        "color": "#C25B7B",     # Soft dusty rose
        "white": "#FAF5F7",
    },
    "warm_terracotta": {
        "color": "#B45330",     # Terracotta rust
        "white": "#F7F3EE",
    },
    "monochrome_black": {
        "color": "#242424",     # Vintage black check
        "white": "#FFFFFF",
    },
}

def generate_gingham(
    width: int,
    height: int,
    palette_name: str = "sunshine_yellow",
    check_size: int = 32,
    seed: int = 303,
) -> np.ndarray:
    """Generate authentic woven gingham check with optical yarn crossover zones."""
    pal = GINGHAM_PALETTES.get(palette_name, GINGHAM_PALETTES["sunshine_yellow"])
    c_color = hex_to_rgb(pal["color"])
    c_white = hex_to_rgb(pal["white"])

    # Ensure check counts are EVEN integers for seamless 2D wrap without double-check seams
    checks_x = max(2, int(round(width / float(check_size))))
    if checks_x % 2 != 0:
        checks_x += 1
    checks_y = max(2, int(round(height / float(check_size))))
    if checks_y % 2 != 0:
        checks_y += 1

    actual_sx = width / float(checks_x)
    actual_sy = height / float(checks_y)

    x = np.arange(width)
    y = np.arange(height)
    X, Y = np.meshgrid(x, y)

    warp_dyed = ((X / actual_sx).astype(int) % 2) == 1
    weft_dyed = ((Y / actual_sy).astype(int) % 2) == 1

    half_tint = 0.52 * c_color + 0.48 * c_white

    canvas = np.zeros((height, width, 3), dtype=np.float32)
    
    both_dyed = warp_dyed & weft_dyed
    warp_only = warp_dyed & (~weft_dyed)
    weft_only = (~warp_dyed) & weft_dyed
    both_white = (~warp_dyed) & (~weft_dyed)

    canvas[both_dyed] = c_color
    canvas[warp_only] = half_tint
    canvas[weft_only] = half_tint
    canvas[both_white] = c_white

    weave = generate_fabric_weave_overlay(width, height, thread_period=4.0, slub_intensity=0.08, weave_depth=0.07, seed=seed)
    return apply_weave_to_rgb(canvas, weave)


# 4. Polka Dots

POLKA_PALETTES = {
    "white_on_foam_green": {
        "ground": "#5EA878",
        "dot": "#FFFFFF",
    },
    "white_on_palmyra_green": {
        "ground": "#3B634A",
        "dot": "#F4F4EF",
    },
    "foam_green_on_cream": {
        "ground": "#F7F6F0",
        "dot": "#4E7C63",
    },
    "carnival_red_on_cream": {
        "ground": "#FAF6F0",
        "dot": "#C82828",
    },
    "sunshine_on_sky_blue": {
        "ground": "#4388CC",
        "dot": "#E8BA23",
    },
    "navy_on_crisp_white": {
        "ground": "#FFFFFF",
        "dot": "#1B3363",
    },
    "dusty_rose_on_ecru": {
        "ground": "#F9F6F2",
        "dot": "#BD4C75",
    },
}

def generate_polka_dots(
    width: int,
    height: int,
    palette_name: str = "white_on_foam_green",
    style: str = "staggered",  # "staggered" (hexagonal) or "aligned" (grid)
    size_variant: str = "classic",  # "pindot", "classic", "coin"
    spacing: int = 48,
    seed: int = 404,
) -> np.ndarray:
    """Generate seamless polka dot pattern with anti-aliased edge ink-bleed."""
    pal = POLKA_PALETTES.get(palette_name, POLKA_PALETTES["white_on_foam_green"])
    ground_c = hex_to_rgb(pal["ground"])
    dot_c = hex_to_rgb(pal["dot"])

    radius_ratios = {"pindot": 0.12, "classic": 0.25, "coin": 0.38}
    r_ratio = radius_ratios.get(size_variant, 0.25)

    num_cols = max(4, int(round(width / float(spacing))))
    cell_w = width / float(num_cols)
    
    if style == "staggered":
        num_rows = max(4, int(round(height / (spacing * 0.866))))
        if num_rows % 2 != 0:
            num_rows += 1
        cell_h = height / float(num_rows)
    else:
        num_rows = max(4, int(round(height / float(spacing))))
        cell_h = height / float(num_rows)

    dot_radius = r_ratio * min(cell_w, cell_h)

    centers = []
    for r in range(num_rows):
        y_center = (r + 0.5) * cell_h
        x_shift = (cell_w * 0.5) if (style == "staggered" and r % 2 == 1) else 0.0
        for c in range(num_cols):
            x_center = (c * cell_w + x_shift + cell_w * 0.5) % width
            centers.append((x_center, y_center))

    x = np.arange(width)
    y = np.arange(height)
    X, Y = np.meshgrid(x, y)

    min_dist_sq = np.full((height, width), 1e9, dtype=np.float32)
    for (cx, cy) in centers:
        dx = np.abs(X - cx)
        dx = np.minimum(dx, width - dx)
        dy = np.abs(Y - cy)
        dy = np.minimum(dy, height - dy)
        dist_sq = dx * dx + dy * dy
        min_dist_sq = np.minimum(min_dist_sq, dist_sq)

    dist = np.sqrt(min_dist_sq)
    dot_mask = np.clip((dot_radius - dist) / 1.2, 0.0, 1.0)[:, :, None]

    canvas = ground_c[None, None, :] * (1.0 - dot_mask) + dot_c[None, None, :] * dot_mask

    weave = generate_fabric_weave_overlay(width, height, thread_period=4.0, slub_intensity=0.07, weave_depth=0.06, seed=seed)
    return apply_weave_to_rgb(canvas, weave)


# 5. Plaid / Madras / Inabel Checks (modeled partly on 2026-10-06 15-52-00)

PLAID_PALETTES = {
    "inabel_fiesta_check": {
        # Authentic multi-color inabel check (modeled directly on 2026-10-06 15-52-00)
        "ground": "#E91E63",      # Vibrant magenta base
        "primary": "#FF9800",     # Vivid orange
        "secondary": "#FFEB3B",   # Sunny yellow
        "accent": "#4CAF50",      # Kelly green
        "line": "#673AB7",        # Royal purple
    },
    "ilocano_red_gold_navy": {
        "ground": "#FAF7F0",
        "primary": "#B22222",      # Crimson red
        "secondary": "#E5A31E",    # Golden yellow
        "accent": "#1A3A68",       # Deep navy
        "line": "#202020",         # Charcoal line
    },
    "deped_green_harvest": {
        "ground": "#F3F5EE",
        "primary": "#4E7C63",      # Palmyra green
        "secondary": "#BFDCC9",    # Foam green
        "accent": "#C99A24",       # Harvest ochre
        "line": "#203C21",         # Dark olive
    },
    "vintage_pastel_blanket": {
        "ground": "#FDFBF7",
        "primary": "#4CA585",      # Seafoam
        "secondary": "#E89B74",    # Peach
        "accent": "#6C82B8",       # Lavender blue
        "line": "#8A5A44",         # Warm umber
    },
    "rustic_earth_flannel": {
        "ground": "#F5EFE6",
        "primary": "#8B3A2B",      # Terracotta
        "secondary": "#4E5D32",    # Forest olive
        "accent": "#D4A343",       # Warm mustard
        "line": "#3B261D",         # Espresso
    },
}

def generate_plaid_madras(
    width: int,
    height: int,
    palette_name: str = "inabel_fiesta_check",
    repeats: int = 2,
    seed: int = 505,
) -> np.ndarray:
    """Generate traditional woven plaid / madras with multi-bar warp and weft intersections."""
    pal = PLAID_PALETTES.get(palette_name, PLAID_PALETTES["inabel_fiesta_check"])
    ground_c = hex_to_rgb(pal["ground"])
    prim_c = hex_to_rgb(pal["primary"])
    sec_c = hex_to_rgb(pal["secondary"])
    acc_c = hex_to_rgb(pal["accent"])
    line_c = hex_to_rgb(pal["line"])

    canvas = np.ones((height, width, 3), dtype=np.float32) * ground_c[None, None, :]
    period = width / float(repeats)

    stripe_defs = [
        (0.12, 0.14, prim_c, 0.55),
        (0.24, 0.04, sec_c, 0.50),
        (0.32, 0.015, line_c, 0.70),
        (0.50, 0.18, acc_c, 0.45),
        (0.68, 0.015, line_c, 0.70),
        (0.76, 0.04, sec_c, 0.50),
        (0.88, 0.14, prim_c, 0.55),
    ]

    x = np.arange(width)
    for r in range(repeats):
        base_x = r * period
        for (rel_pos, rel_w, col, alpha) in stripe_defs:
            cx = base_x + rel_pos * period
            hw = rel_w * period * 0.5
            dx = np.abs((x - cx + width * 0.5) % width - width * 0.5)
            mask_x = np.clip((hw - dx) / 1.0, 0.0, 1.0) * alpha
            canvas = canvas * (1.0 - mask_x[None, :, None]) + col[None, None, :] * mask_x[None, :, None]

    y = np.arange(height)
    for r in range(repeats):
        base_y = r * period
        for (rel_pos, rel_w, col, alpha) in stripe_defs:
            cy = base_y + rel_pos * period
            hw = rel_w * period * 0.5
            dy = np.abs((y - cy + height * 0.5) % height - height * 0.5)
            mask_y = np.clip((hw - dy) / 1.0, 0.0, 1.0) * alpha
            canvas = canvas * (1.0 - mask_y[:, None, None]) + col[None, None, :] * mask_y[:, None, None]

    weave = generate_fabric_weave_overlay(width, height, thread_period=4.0, slub_intensity=0.08, weave_depth=0.07, seed=seed)
    return apply_weave_to_rgb(canvas, weave)


# 6. Ditsy / Sampaguita Retro Florals

FLORAL_PALETTES = {
    "sampaguita_on_foam_green": {
        "ground": "#5EA878",
        "petal": "#FFFFFF",
        "center": "#F0C832",
        "leaf": "#285836",
    },
    "blue_forget_me_not_on_cream": {
        "ground": "#FAF8F2",
        "petal": "#2E75CE",
        "center": "#F4C428",
        "leaf": "#468A3E",
    },
    "retro_orange_daisy_on_mint": {
        "ground": "#BFDCC9",
        "petal": "#E65A28",
        "center": "#FAD44A",
        "leaf": "#306B49",
    },
    "vintage_pink_blossom_on_ecru": {
        "ground": "#F8F5EE",
        "petal": "#D85E86",
        "center": "#ECC438",
        "leaf": "#4E7C4A",
    },
}

def generate_ditsy_floral(
    width: int,
    height: int,
    palette_name: str = "sampaguita_on_foam_green",
    flower_count: int = 16,
    petal_radius: float = 9.0,
    seed: int = 606,
) -> np.ndarray:
    """Generate seamless ditsy 5-petal floral print on woven cotton ground."""
    pal = FLORAL_PALETTES.get(palette_name, FLORAL_PALETTES["sampaguita_on_foam_green"])
    ground_c = hex_to_rgb(pal["ground"])
    petal_c = hex_to_rgb(pal["petal"])
    center_c = hex_to_rgb(pal["center"])
    leaf_c = hex_to_rgb(pal["leaf"])

    rng = np.random.default_rng(seed)

    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    grid_dim = int(math.ceil(math.sqrt(flower_count)))
    cell_w = width / float(grid_dim)
    cell_h = height / float(grid_dim)

    def draw_flower_at(fx: float, fy: float, angle_offset: float, scale: float):
        r_petal = petal_radius * scale
        r_dist = r_petal * 1.3
        
        for leaf_angle in [angle_offset + 0.6, angle_offset + 2.8]:
            lx = fx + math.cos(leaf_angle) * (r_dist * 1.6)
            ly = fy + math.sin(leaf_angle) * (r_dist * 1.6)
            lr = r_petal * 0.75
            bbox = [lx - lr, ly - lr * 0.6, lx + lr, ly + lr * 0.6]
            draw.ellipse(bbox, fill=tuple((leaf_c * 255).astype(int)) + (240,))
        
        for p in range(5):
            th = angle_offset + (2 * math.pi * p / 5.0)
            px = fx + math.cos(th) * r_dist
            py = fy + math.sin(th) * r_dist
            bbox = [px - r_petal, py - r_petal, px + r_petal, py + r_petal]
            draw.ellipse(bbox, fill=tuple((petal_c * 255).astype(int)) + (255,))
        
        cr = r_petal * 0.65
        draw.ellipse([fx - cr, fy - cr, fx + cr, fy + cr], fill=tuple((center_c * 255).astype(int)) + (255,))

    for gx in range(grid_dim):
        for gy in range(grid_dim):
            base_x = (gx + 0.5) * cell_w + rng.uniform(-0.35 * cell_w, 0.35 * cell_w)
            base_y = (gy + 0.5) * cell_h + rng.uniform(-0.35 * cell_h, 0.35 * cell_h)
            angle = rng.uniform(0, 2 * math.pi)
            scale = rng.uniform(0.85, 1.15)

            for ox in [-width, 0, width]:
                for oy in [-height, 0, height]:
                    draw_flower_at(base_x + ox, base_y + oy, angle, scale)

    flower_arr = np.array(img, dtype=np.float32) / 255.0
    fg_rgb = flower_arr[:, :, :3]
    fg_alpha = flower_arr[:, :, 3:]
    canvas = ground_c[None, None, :] * (1.0 - fg_alpha) + fg_rgb * fg_alpha

    weave = generate_fabric_weave_overlay(width, height, thread_period=4.0, slub_intensity=0.07, weave_depth=0.06, seed=seed)
    return apply_weave_to_rgb(canvas, weave)


# 7. Domestic Ticking Stripes (paired fine pinstripes)

TICKING_PALETTES = {
    "navy_on_linen": {
        "ground": "#F4EFE6",      # Unbleached linen
        "stripe": "#203A62",      # Deep navy
    },
    "red_on_cream": {
        "ground": "#FAF5ED",      # Warm cream
        "stripe": "#B82E2E",      # Domestic red
    },
    "palmyra_on_foam": {
        "ground": "#BFDCC9",      # Foam green
        "stripe": "#2C543D",      # Palmyra dark
    },
    "charcoal_on_ecru": {
        "ground": "#F0EDE4",      # Soft ecru
        "stripe": "#333333",      # Soft black
    },
}

def generate_ticking_stripes(
    width: int,
    height: int,
    palette_name: str = "navy_on_linen",
    repeats: int = 8,
    seed: int = 707,
) -> np.ndarray:
    """Generate classic domestic mattress/curtain ticking: paired fine vertical lines."""
    pal = TICKING_PALETTES.get(palette_name, TICKING_PALETTES["navy_on_linen"])
    ground_c = hex_to_rgb(pal["ground"])
    stripe_c = hex_to_rgb(pal["stripe"])

    canvas = np.ones((height, width, 3), dtype=np.float32) * ground_c[None, None, :]
    period = width / float(repeats)
    x = np.arange(width)

    pair_sep = period * 0.12
    line_w = max(1.2, period * 0.04)

    for r in range(repeats):
        cx = (r + 0.5) * period
        for sign in [-1, 1]:
            lx = cx + sign * (pair_sep * 0.5)
            dx = np.abs((x - lx + width * 0.5) % width - width * 0.5)
            mask = np.clip((line_w - dx) / 0.8, 0.0, 1.0)
            canvas = canvas * (1.0 - mask[None, :, None]) + stripe_c[None, None, :] * mask[None, :, None]

    weave = generate_fabric_weave_overlay(width, height, thread_period=4.0, slub_intensity=0.09, weave_depth=0.06, seed=seed)
    return apply_weave_to_rgb(canvas, weave)


# 8. Retro Wavy / Rick-Rack Chevron Curtains

WAVE_PALETTES = {
    "foam_green_waves": {
        "ground": "#FAF8F2",
        "wave_a": "#BFDCC9",      # Foam green
        "wave_b": "#4E7C63",      # Palmyra green
        "line": "#203C21",
    },
    "ocean_gold_waves": {
        "ground": "#F7F6EE",
        "wave_a": "#73A8D4",      # Sky blue
        "wave_b": "#E5A822",      # Gold
        "line": "#1E3B68",
    },
    "sunset_rose_waves": {
        "ground": "#FAF5F0",
        "wave_a": "#E07794",      # Rose pink
        "wave_b": "#E89F48",      # Amber orange
        "line": "#6E1F3D",
    },
}

def generate_retro_waves(
    width: int,
    height: int,
    palette_name: str = "foam_green_waves",
    vertical_cycles: int = 4,
    horizontal_waves: int = 2,
    amplitude: float = 24.0,
    seed: int = 808,
) -> np.ndarray:
    """Generate retro sinusoidal rick-rack wave bands seamlessly tileable in 2D."""
    pal = WAVE_PALETTES.get(palette_name, WAVE_PALETTES["foam_green_waves"])
    ground_c = hex_to_rgb(pal["ground"])
    c_a = hex_to_rgb(pal["wave_a"])
    c_b = hex_to_rgb(pal["wave_b"])
    c_line = hex_to_rgb(pal["line"])

    x = np.arange(width)
    y = np.arange(height)
    X, Y = np.meshgrid(x, y)

    wave_disp = amplitude * np.sin(2 * np.pi * horizontal_waves * X / float(width))
    effective_y = (Y + wave_disp) % height

    period_y = height / float(vertical_cycles)
    rel_y = (effective_y % period_y) / period_y

    canvas = np.ones((height, width, 3), dtype=np.float32) * ground_c[None, None, :]
    
    mask_a = (rel_y >= 0.25) & (rel_y < 0.75)
    mask_b = (rel_y >= 0.50) & (rel_y < 0.75)
    mask_line = (np.abs(rel_y - 0.50) < 0.02) | (np.abs(rel_y - 0.75) < 0.02) | (np.abs(rel_y - 0.25) < 0.02)

    canvas[mask_a] = c_a
    canvas[mask_b] = c_b
    canvas[mask_line] = c_line

    weave = generate_fabric_weave_overlay(width, height, thread_period=4.0, slub_intensity=0.07, weave_depth=0.06, seed=seed)
    return apply_weave_to_rgb(canvas, weave)


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
        '  <title>Foam Green City — Tela Pattern Bank</title>',
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
        "  <h1>Foam Green City — Tela Pattern Bank</h1>",
        "  <p class=\"lead\">Procedural fabric textures generated for Philippine domestic interiors, curtains (kurtina), and tablecloths (mantel). Modeled off authentic archival reference photos, with woven yarn plain-weave micro-relief and slub substrate. Toggle 1× / 2× / 4× repeat to preview seamless tiling.</p>",
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
        html_lines.append(f'    <p class="desc">{len(files)} generated seamless fabric textures</p>')
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
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parents[1] / "tela",
                        help="Root output directory (default: <project>/tela)")
    parser.add_argument("--category", choices=["all", "kurtina_slub_stripes", "cabana_pinstripes", "gingham",
                                               "polka_dots", "plaid_madras", "ditsy_floral", "ticking_stripes", "retro_waves"],
                        default="all", help="Pattern category to generate (default: all)")
    parser.add_argument("--size", type=int, default=512, help="Image resolution in pixels (default: 512)")
    parser.add_argument("--seed", type=int, default=42, help="Base random seed (default: 42)")
    args = parser.parse_args()

    out_root = args.output_dir
    out_root.mkdir(parents=True, exist_ok=True)
    size = args.size
    base_seed = args.seed

    cats_to_run = [args.category] if args.category != "all" else [
        "kurtina_slub_stripes",
        "cabana_pinstripes",
        "gingham",
        "polka_dots",
        "plaid_madras",
        "ditsy_floral",
        "ticking_stripes",
        "retro_waves",
    ]

    generated_map: Dict[str, List[Path]] = {}

    print(f"Generating fabric patterns into {out_root} (size={size}x{size})...")

    # 1. Kurtina Slub Stripes
    if "kurtina_slub_stripes" in cats_to_run:
        cat_dir = out_root / "kurtina_slub_stripes"
        cat_dir.mkdir(parents=True, exist_ok=True)
        files = []
        for i, (pname, _) in enumerate(KURTINA_PALETTES.items()):
            rgb = generate_kurtina_slub_stripes(size, size, palette_name=pname, num_cycles=2, seed=base_seed + i * 11)
            img = Image.fromarray(rgb_to_uint8(rgb))
            out_path = cat_dir / f"kurtina_slub_{pname}.png"
            img.save(out_path)
            files.append(out_path)
        generated_map["kurtina_slub_stripes"] = files
        print(f"  [kurtina_slub_stripes] {len(files)} textures generated.")

    # 2. Cabana Pinstripes
    if "cabana_pinstripes" in cats_to_run:
        cat_dir = out_root / "cabana_pinstripes"
        cat_dir.mkdir(parents=True, exist_ok=True)
        files = []
        for i, (pname, _) in enumerate(CABANA_PALETTES.items()):
            rgb = generate_cabana_pinstripes(size, size, palette_name=pname, repeats=2, pinstripe_count=3, seed=base_seed + 100 + i * 7)
            img = Image.fromarray(rgb_to_uint8(rgb))
            out_path = cat_dir / f"cabana_pinstripe_{pname}.png"
            img.save(out_path)
            files.append(out_path)
        generated_map["cabana_pinstripes"] = files
        print(f"  [cabana_pinstripes] {len(files)} textures generated.")

    # 3. Gingham
    if "gingham" in cats_to_run:
        cat_dir = out_root / "gingham"
        cat_dir.mkdir(parents=True, exist_ok=True)
        files = []
        for i, (pname, _) in enumerate(GINGHAM_PALETTES.items()):
            csize = 32 if (i % 2 == 0) else 48
            rgb = generate_gingham(size, size, palette_name=pname, check_size=csize, seed=base_seed + 200 + i * 13)
            img = Image.fromarray(rgb_to_uint8(rgb))
            out_path = cat_dir / f"gingham_{pname}_{csize}px.png"
            img.save(out_path)
            files.append(out_path)
        generated_map["gingham"] = files
        print(f"  [gingham] {len(files)} textures generated.")

    # 4. Polka Dots
    if "polka_dots" in cats_to_run:
        cat_dir = out_root / "polka_dots"
        cat_dir.mkdir(parents=True, exist_ok=True)
        files = []
        pal_list = list(POLKA_PALETTES.keys())
        for i, pname in enumerate(pal_list):
            variant = ["classic", "pindot", "coin"][i % 3]
            style = "staggered" if (i % 4 != 3) else "aligned"
            spacing = 48 if variant == "classic" else (36 if variant == "pindot" else 64)
            rgb = generate_polka_dots(size, size, palette_name=pname, style=style, size_variant=variant, spacing=spacing, seed=base_seed + 300 + i * 17)
            img = Image.fromarray(rgb_to_uint8(rgb))
            out_path = cat_dir / f"polka_{pname}_{variant}_{style}.png"
            img.save(out_path)
            files.append(out_path)
        generated_map["polka_dots"] = files
        print(f"  [polka_dots] {len(files)} textures generated.")

    # 5. Plaid / Madras
    if "plaid_madras" in cats_to_run:
        cat_dir = out_root / "plaid_madras"
        cat_dir.mkdir(parents=True, exist_ok=True)
        files = []
        for i, (pname, _) in enumerate(PLAID_PALETTES.items()):
            rgb = generate_plaid_madras(size, size, palette_name=pname, repeats=2, seed=base_seed + 400 + i * 19)
            img = Image.fromarray(rgb_to_uint8(rgb))
            out_path = cat_dir / f"plaid_{pname}.png"
            img.save(out_path)
            files.append(out_path)
        generated_map["plaid_madras"] = files
        print(f"  [plaid_madras] {len(files)} textures generated.")

    # 6. Ditsy Floral
    if "ditsy_floral" in cats_to_run:
        cat_dir = out_root / "ditsy_floral"
        cat_dir.mkdir(parents=True, exist_ok=True)
        files = []
        for i, (pname, _) in enumerate(FLORAL_PALETTES.items()):
            rgb = generate_ditsy_floral(size, size, palette_name=pname, flower_count=20, petal_radius=8.5, seed=base_seed + 500 + i * 23)
            img = Image.fromarray(rgb_to_uint8(rgb))
            out_path = cat_dir / f"floral_{pname}.png"
            img.save(out_path)
            files.append(out_path)
        generated_map["ditsy_floral"] = files
        print(f"  [ditsy_floral] {len(files)} textures generated.")

    # 7. Ticking Stripes
    if "ticking_stripes" in cats_to_run:
        cat_dir = out_root / "ticking_stripes"
        cat_dir.mkdir(parents=True, exist_ok=True)
        files = []
        for i, (pname, _) in enumerate(TICKING_PALETTES.items()):
            rgb = generate_ticking_stripes(size, size, palette_name=pname, repeats=8, seed=base_seed + 600 + i * 29)
            img = Image.fromarray(rgb_to_uint8(rgb))
            out_path = cat_dir / f"ticking_{pname}.png"
            img.save(out_path)
            files.append(out_path)
        generated_map["ticking_stripes"] = files
        print(f"  [ticking_stripes] {len(files)} textures generated.")

    # 8. Retro Waves
    if "retro_waves" in cats_to_run:
        cat_dir = out_root / "retro_waves"
        cat_dir.mkdir(parents=True, exist_ok=True)
        files = []
        for i, (pname, _) in enumerate(WAVE_PALETTES.items()):
            rgb = generate_retro_waves(size, size, palette_name=pname, vertical_cycles=4, horizontal_waves=2, amplitude=20.0, seed=base_seed + 700 + i * 31)
            img = Image.fromarray(rgb_to_uint8(rgb))
            out_path = cat_dir / f"wave_{pname}.png"
            img.save(out_path)
            files.append(out_path)
        generated_map["retro_waves"] = files
        print(f"  [retro_waves] {len(files)} textures generated.")

    generate_html_preview(out_root, generated_map)
    total_textures = sum(len(f) for f in generated_map.values())
    print(f"\nDone! Generated {total_textures} textures across {len(generated_map)} categories.")
    print(f"HTML preview gallery generated at: {out_root / 'index.html'}")


if __name__ == "__main__":
    main()
