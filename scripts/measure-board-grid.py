"""Measure raster grid lines; originals are read-only. Requires Pillow and NumPy."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'references/board.webp'
OUT = ROOT / 'docs/board-calibration'
OUT.mkdir(parents=True, exist_ok=True)
image = Image.open(SOURCE).convert('RGB')
gray = np.asarray(image, dtype=float).mean(axis=2)


def scan(axis, start, end, boundary=False):
    values = []
    for pixel in range(start, end):
        if axis == 'x':
            line = gray[230:1340, pixel]
            before = gray[230:1340, pixel - (1 if boundary else 5)]
            after = gray[230:1340, pixel + 5]
        else:
            line = gray[pixel, 75:1095]
            before = gray[pixel - (1 if boundary else 5), 75:1095]
            after = gray[pixel + 5, 75:1095]
        contrast = line - before if boundary else line - (before + after) / 2
        score = abs(float(np.median(contrast))) if boundary else float(np.median(contrast))
        values.append((pixel, score))
    return values


def interior_edges(axis, start, end):
    # Nine persistent bright lines. Suppression separates adjacent raster samples
    # of one line; it does not assume equal spacing between lines.
    selected = []
    for pixel, score in sorted(scan(axis, start, end), key=lambda item: item[1], reverse=True):
        if all(abs(pixel - other) > 40 for other, _ in selected):
            selected.append((pixel, score))
        if len(selected) == 9:
            return sorted(selected)
    raise RuntimeError('Could not identify nine interior boundaries')


def outer_edge(axis, start, end):
    return max(scan(axis, start, end, boundary=True), key=lambda item: item[1])[0]


columns = [outer_edge('x', 30, 100)] + [p for p, _ in interior_edges('x', 90, 1080)] + [outer_edge('x', 1070, 1140)]
rows = [outer_edge('y', 180, 240)] + [p for p, _ in interior_edges('y', 250, 1320)] + [outer_edge('y', 1320, 1380)]
width, height = image.size
result = {
    'source': 'references/board.webp',
    'sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'imageWidth': width, 'imageHeight': height,
    'columnEdgesPx': columns, 'rowEdgesPx': rows,
    'boundsPx': {'left': columns[0], 'top': rows[0], 'right': columns[-1], 'bottom': rows[-1]},
    'boundsNormalized': {'left': columns[0]/width, 'top': rows[0]/height, 'right': columns[-1]/width, 'bottom': rows[-1]/height},
    'columnWidthsPx': np.diff(columns).tolist(), 'rowHeightsPx': np.diff(rows).tolist(),
    'method': 'Interior boundaries: peak median local bright-line contrast across the raster. Outer boundaries: peak absolute median first difference. Integer sample positions identify the strongest boundary samples; antialiasing is approximately 1–3 source pixels.',
}
(OUT / 'source-measurements.json').write_text(json.dumps(result, indent=2))
overlay = Image.new('RGBA', image.size)
draw = ImageDraw.Draw(overlay)
for x in columns:
    draw.line([(x, rows[0]), (x, rows[-1])], fill=(0, 255, 255, 180), width=1)
for y in rows:
    draw.line([(columns[0], y), (columns[-1], y)], fill=(0, 255, 255, 180), width=1)
draw.rectangle((columns[0], rows[0], columns[-1], rows[-1]), outline=(255, 0, 0, 255), width=2)
for row in range(10):
    for col in range(10):
        x = (columns[col] + columns[col+1])/2
        y = (rows[row] + rows[row+1])/2
        draw.line([(x-4,y),(x+4,y)], fill=(255,255,0,255))
        draw.line([(x,y-4),(x,y+4)], fill=(255,255,0,255))
Image.alpha_composite(image.convert('RGBA'), overlay).save(OUT / 'source-grid-overlay.png')
print(json.dumps(result, indent=2))
