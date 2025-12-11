#!/usr/bin/env python3
"""
dimensions_mm_levels.py (CAD-style presentation: bold SHX + architectural ticks)

Visual changes only:
 - Bold SHX text style (TXT_BOLD_SHX -> txtbold.shx)
 - Architectural 45° ticks (no arrows)
 - Lineweight set to 35 for dim/extension/tick lines
 - "mm" appended to numeric values, text centered on dim lines

Functional logic (bbox, level detection, grouping into 4) left intact.
"""
import argparse, math, sys
from pathlib import Path

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("infile")
    p.add_argument("outfile")
    p.add_argument("--layers", nargs="+", default=None, help="Optional layers to include in bbox")
    p.add_argument("--dim_layer", default="DIMS", help="Layer for created dimensions/graphics")
    p.add_argument("--text_height_mm", type=float, default=3.0, help="Text height in mm (display size)")
    p.add_argument("--precision", type=int, default=1, help="Decimal places for displayed values (mm)")
    p.add_argument("--output_dims_only", action="store_true", help="Save only created dims/text/graphics")
    return p.parse_args()

args = parse_args()

IN = Path(args.infile)
OUT = Path(args.outfile)
LAYER_FILTER = args.layers
DIM_LAYER = args.dim_layer
TEXT_HEIGHT_MM = float(args.text_height_mm)
PRECISION = int(args.precision)
OUTPUT_DIMS_ONLY = args.output_dims_only

if not IN.exists():
    sys.exit(f"Input file not found: {IN}")

# ---- import ezdxf ----
try:
    import ezdxf
except Exception as e:
    sys.exit("Install ezdxf (pip install ezdxf). Error: " + str(e))

doc = ezdxf.readfile(str(IN))
msp = doc.modelspace()

# ---- presentation config ----
TEXT_FONT_SHX = "txtbold.shx"     # Bold SHX file name requested (TEXT STYLE A)
TEXT_STYLE_NAME = "TXT_BOLD_SHX"  # internal DXF text style name
LINEWEIGHT = 55                   # 0.35 mm lineweight

# ---- helpers ----
def to_mm(val_m):
    return val_m * 1000.0

def fmt_mm(val_m):
    return f"{to_mm(val_m):.{PRECISION}f}"

def set_text_position(text_entity, pos, align="CENTER"):
    # robust placement across ezdxf versions
    x, y = float(pos[0]), float(pos[1])
    z = float(pos[2]) if len(pos) > 2 else 0.0
    try:
        if hasattr(text_entity, "set_placement"):
            text_entity.set_placement((x, y, z), align=align)
            return
    except Exception:
        pass
    try:
        if hasattr(text_entity, "set_pos"):
            text_entity.set_pos((x, y, z), align=align)
            return
    except Exception:
        pass
    try:
        text_entity.dxf.insert = (x, y, z)
        halign = {"LEFT":0, "CENTER":1, "RIGHT":2}.get(align.upper(), 1)
        try:
            text_entity.dxf.halign = int(halign)
            text_entity.dxf.valign = int(1)
        except Exception:
            pass
    except Exception:
        pass

def _add_pt(lst, p):
    if p is None: return
    if len(p) == 2:
        lst.append((float(p[0]), float(p[1]), 0.0))
    else:
        lst.append((float(p[0]), float(p[1]), float(p[2])))

def gather_points(msp, layer_filter=None):
    pts = []
    for e in msp:
        try:
            if layer_filter and e.dxf.layer not in layer_filter:
                continue
        except Exception:
            pass
        t = e.dxftype()
        try:
            if t == "LINE":
                _add_pt(pts, e.dxf.start); _add_pt(pts, e.dxf.end)
            elif t == "LWPOLYLINE":
                for x,y,*_ in e.get_points():
                    _add_pt(pts, (x,y, getattr(e.dxf, 'elevation', 0.0)))
            elif t == "POLYLINE":
                for v in e.vertices():
                    _add_pt(pts, (v.dxf.location.x, v.dxf.location.y, 0.0))
            elif t == "CIRCLE":
                c = e.dxf.center; r = e.dxf.radius
                _add_pt(pts, (c[0]+r, c[1], c[2] if len(c)>2 else 0.0))
                _add_pt(pts, (c[0]-r, c[1], c[2] if len(c)>2 else 0.0))
                _add_pt(pts, (c[0], c[1]+r, c[2] if len(c)>2 else 0.0))
                _add_pt(pts, (c[0], c[1]-r, c[2] if len(c)>2 else 0.0))
            elif t == "ARC":
                c = e.dxf.center; r = e.dxf.radius
                sa = math.radians(e.dxf.start_angle); ea = math.radians(e.dxf.end_angle)
                _add_pt(pts, (c[0] + r*math.cos(sa), c[1] + r*math.sin(sa), c[2] if len(c)>2 else 0.0))
                _add_pt(pts, (c[0] + r*math.cos(ea), c[1] + r*math.sin(ea), c[2] if len(c)>2 else 0.0))
            elif t == "POINT":
                _add_pt(pts, e.dxf.location)
            elif t == "INSERT":
                _add_pt(pts, e.dxf.insert)
        except Exception:
            continue
    return pts

# ---- ensure text style exists in document ----
try:
    if TEXT_STYLE_NAME not in doc.styles:
        doc.styles.add(TEXT_STYLE_NAME, font=TEXT_FONT_SHX)
except Exception:
    # style creation may fail if font not available — continue with default style
    pass

# ---- compute bbox and basic dims ----
pts = gather_points(msp, layer_filter=LAYER_FILTER)
if not pts:
    sys.exit("No geometry found in chosen layers (or file).")

xs = [p[0] for p in pts]; ys = [p[1] for p in pts]; zs = [p[2] for p in pts]
bbox_min = (min(xs), min(ys), min(zs)); bbox_max = (max(xs), max(ys), max(zs))
width_m = bbox_max[0] - bbox_min[0]
height_m = bbox_max[1] - bbox_min[1]
depth_m = bbox_max[2] - bbox_min[2]

print("Bounding box (m) min:", bbox_min, "max:", bbox_max)
print("Width (m):", width_m, "Height (m):", height_m, "Depth (m):", depth_m)
print("Displayed units: mm (values shown will be in mm)")

# create / ensure dims layer exists
if DIM_LAYER not in doc.layers:
    try:
        doc.layers.add(DIM_LAYER, dxfattribs={"color": 3})
    except Exception:
        pass

# compute text height in drawing units (meters) from mm
text_height_m = TEXT_HEIGHT_MM / 1000.0

# ---- utility: draw architectural tick (45° slash) ----
def draw_tick(msp, x, y, size, direction=1):
    # direction: +1 draws towards +X, -1 towards -X (mirrored)
    dx = size * 0.7 * direction
    dy = size * 0.7
    msp.add_line((x, y, 0.0), (x + dx, y + dy, 0.0),
                 dxfattribs={"layer": DIM_LAYER, "lineweight": LINEWEIGHT})

# ---- utility: add bold SHX text and center it ----
def add_bold_shx_text(text, pos, height=None, align="CENTER"):
    if height is None:
        height = text_height_m
    try:
        t = msp.add_text(text, dxfattribs={"height": height, "layer": DIM_LAYER, "style": TEXT_STYLE_NAME})
        set_text_position(t, pos, align=align)
        return t
    except Exception:
        # fallback to plain text when style/font not available
        t = msp.add_text(text, dxfattribs={"height": height, "layer": DIM_LAYER})
        set_text_position(t, pos, align=align)
        return t

# ---- find vertical lines to infer outer/inner/center (unchanged) ----
VERT_TOL = max(1e-6, (bbox_max[0]-bbox_min[0]) * 1e-3)
MIN_VERT_SPAN = max((bbox_max[1]-bbox_min[1]) * 0.25, 1e-4)
vertical_lines = []
for e in msp.query('LINE'):
    try:
        x1,y1,_ = e.dxf.start; x2,y2,_ = e.dxf.end
        dx = x2 - x1; dy = y2 - y1
        if abs(dx) <= VERT_TOL and abs(dy) > MIN_VERT_SPAN:
            x = (x1 + x2)/2.0
            vertical_lines.append((x, e))
    except Exception:
        pass

vertical_xs = sorted([x for x,_ in vertical_lines])

outer_left_m = bbox_min[0]; outer_right_m = bbox_max[0]
margin = (outer_right_m - outer_left_m) * 0.02
inner_candidates = [x for x in vertical_xs if (outer_left_m + margin) < x < (outer_right_m - margin)]
inner_candidates = sorted(set(inner_candidates))

inner_left_m = None; inner_right_m = None
if inner_candidates:
    inner_left_m = max([x for x in inner_candidates if x <= (outer_left_m + (outer_right_m-outer_left_m)/2.0)] or [None])
    inner_right_m = min([x for x in inner_candidates if x >= (outer_left_m + (outer_right_m-outer_left_m)/2.0)] or [None])

centers = [x for x in vertical_xs if (outer_left_m + margin) < x < (outer_right_m - margin)]
center_left_m = None; center_right_m = None
if len(centers) >= 2:
    max_pair = None; max_sep = -1
    for i in range(len(centers)):
        for j in range(i+1,len(centers)):
            sep = abs(centers[j]-centers[i])
            if sep > max_sep:
                max_sep = sep; max_pair = (centers[i], centers[j])
    if max_pair:
        center_left_m, center_right_m = max_pair

# ---- detect horizontal lines that look like level markers (unchanged) ----
HOR_TOL = max(1e-6, (bbox_max[1]-bbox_min[1]) * 1e-3)
MIN_HOR_SPAN = max((bbox_max[0]-bbox_min[0]) * 0.15, 1e-4)
level_line_segments = []
for e in msp.query('LINE'):
    try:
        x1,y1,_ = e.dxf.start; x2,y2,_ = e.dxf.end
        dx = x2 - x1; dy = y2 - y1
        if abs(dy) <= HOR_TOL and abs(dx) > MIN_HOR_SPAN:
            y = (y1 + y2) / 2.0
            xmin = min(x1, x2); xmax = max(x1, x2)
            level_line_segments.append((y, xmin, xmax))
    except Exception:
        pass

def merge_segments_by_y(segments, y_tol):
    if not segments: return []
    segments_sorted = sorted(segments, key=lambda s: s[0])
    merged = []
    for y, xmin, xmax in segments_sorted:
        if not merged:
            merged.append([y, xmin, xmax])
        else:
            last = merged[-1]
            if abs(y - last[0]) <= y_tol:
                last[1] = min(last[1], xmin)
                last[2] = max(last[2], xmax)
                last[0] = (last[0] + y) / 2.0
            else:
                merged.append([y, xmin, xmax])
    return [(m[0], m[1], m[2]) for m in merged]

LEVEL_Y_TOL = (bbox_max[1] - bbox_min[1]) * 1e-4
levels_merged = merge_segments_by_y(level_line_segments, LEVEL_Y_TOL)
levels_sorted_bot_top = sorted(levels_merged, key=lambda L: L[0])

# ---- helper: try to add true linear dim (unchanged) ----
def try_add_linear_dim(p1, p2, dimline_pos, label_text=None):
    created = False
    try:
        from ezdxf.addons import dimensions as ezdims
        try:
            ezdims.add_linear_dim(doc, msp, p1, p2, dimline_pos, dimstyle="STANDARD")
        except TypeError:
            ezdims.add_linear_dim(doc, msp, p1, p2, dimline_pos)
        created = True
    except Exception:
        try:
            from ezdxf.addons.drawing import dimension as ezdim2
            ezdim2.add_linear_dimension(msp, p1, p2, dimline_pos)
            created = True
        except Exception:
            created = False

    if created:
        try:
            for ent in reversed(list(msp)):
                if ent.dxftype() == "DIMENSION":
                    try:
                        ent.dxf.layer = DIM_LAYER
                    except Exception:
                        pass
                    dist_m = math.hypot(p2[0]-p1[0], p2[1]-p1[1])
                    txt = fmt_mm(dist_m)
                    if label_text:
                        txt = f"{txt} {label_text}"
                    try:
                        ent.dxf.dimtxt = txt
                    except Exception:
                        try:
                            ent.dxf.text = txt
                        except Exception:
                            pass
        except Exception:
            pass
    return created

# ---- improved graphic dim: CAD-style ticks + bold SHX text ----
def add_graphic_dim(p1, p2, dim_line_pos, label_text):
    x1,y1 = p1[0], p1[1]; x2,y2 = p2[0], p2[1]
    dx, dy = x2-x1, y2-y1
    horizontal = abs(dx) >= abs(dy)
    tick_size = text_height_m * 1.2

    if horizontal:
        y_dim = dim_line_pos[1]
        # main dim line
        msp.add_line((x1, y_dim, 0), (x2, y_dim, 0), dxfattribs={"layer": DIM_LAYER, "lineweight": LINEWEIGHT})
        # extension lines
        msp.add_line((x1, y1, 0), (x1, y_dim, 0), dxfattribs={"layer": DIM_LAYER, "lineweight": LINEWEIGHT})
        msp.add_line((x2, y2, 0), (x2, y_dim, 0), dxfattribs={"layer": DIM_LAYER, "lineweight": LINEWEIGHT})
        # ticks (45°)
        draw_tick(msp, x1, y_dim, tick_size, +1)
        draw_tick(msp, x2, y_dim, tick_size, -1)
        # text above dim line
        txt = f"{fmt_mm(abs(x2-x1))} mm"
        if label_text:
            txt = f"{txt} {label_text}"
        add_bold_shx_text(txt, ((x1+x2)/2.0, y_dim + text_height_m*1.1, 0), height=text_height_m)
    else:
        x_dim = dim_line_pos[0]
        # main dim line
        msp.add_line((x_dim, y1, 0), (x_dim, y2, 0), dxfattribs={"layer": DIM_LAYER, "lineweight": LINEWEIGHT})
        # extension lines
        msp.add_line((x1, y1, 0), (x_dim, y1, 0), dxfattribs={"layer": DIM_LAYER, "lineweight": LINEWEIGHT})
        msp.add_line((x2, y2, 0), (x_dim, y2, 0), dxfattribs={"layer": DIM_LAYER, "lineweight": LINEWEIGHT})
        # ticks
        draw_tick(msp, x_dim, y1, tick_size, +1)
        draw_tick(msp, x_dim, y2, tick_size, -1)
        # text right of dim line
        txt = f"{fmt_mm(abs(y2-y1))} mm"
        if label_text:
            txt = f"{txt} {label_text}"
        add_bold_shx_text(txt, (x_dim - text_height_m*1.1, (y1+y2)/2.0, 0), height=text_height_m)

# ---- place width dims: O/O, I/I, C/C (unchanged logic but improved fallback graphic dims) ----
left_pt = (outer_left_m, (bbox_min[1]+bbox_max[1])/2.0, 0.0)
right_pt = (outer_right_m, (bbox_min[1]+bbox_max[1])/2.0, 0.0)
offset = max(width_m, height_m) * 0.04 if max(width_m, height_m) > 0 else 0.1
dim_y_outer = bbox_min[1] - offset
label_outer = "O/O"
if not try_add_linear_dim(left_pt, right_pt, ((left_pt[0]+right_pt[0])/2.0, dim_y_outer, 0.0), label_outer):
    add_graphic_dim(left_pt, right_pt, ((left_pt[0]+right_pt[0])/2.0, dim_y_outer, 0.0), label_outer)

# Inner-to-Inner (if candidates found)
if inner_left_m is not None and inner_right_m is not None:
    left_i = (inner_left_m, (bbox_min[1]+bbox_max[1])/2.0, 0.0)
    right_i = (inner_right_m, (bbox_min[1]+bbox_max[1])/2.0, 0.0)
    dim_y_inner = bbox_min[1] - offset*1.6
    label_inner = "I/I"
    if not try_add_linear_dim(left_i, right_i, ((left_i[0]+right_i[0])/2.0, dim_y_inner, 0.0), label_inner):
        add_graphic_dim(left_i, right_i, ((left_i[0]+right_i[0])/2.0, dim_y_inner, 0.0), label_inner)
else:
    print("No clear inner vertical lines found to create I/I dimension (heuristic).")

# Center-to-Center (if detected)
if center_left_m is not None and center_right_m is not None:
    left_c = (center_left_m, (bbox_min[1]+bbox_max[1])/2.0, 0.0)
    right_c = (center_right_m, (bbox_min[1]+bbox_max[1])/2.0, 0.0)
    dim_y_center = bbox_min[1] - offset*2.2
    label_center = "C/C"
    if not try_add_linear_dim(left_c, right_c, ((left_c[0]+right_c[0])/2.0, dim_y_center, 0.0), label_center):
        add_graphic_dim(left_c, right_c, ((left_c[0]+right_c[0])/2.0, dim_y_center, 0.0), label_center)
else:
    print("No clear centerlines found to create C/C dimension (heuristic).")

# ---- overall height dimension (outer) ----
bottom_pt = ((bbox_min[0]+bbox_max[0])/2.0, bbox_min[1], 0.0)
top_pt = ((bbox_min[0]+bbox_max[0])/2.0, bbox_max[1], 0.0)
dim_x_outer = bbox_min[0] - offset
label_h = ""  # main height label not given special token
if not try_add_linear_dim(bottom_pt, top_pt, (dim_x_outer, (bottom_pt[1]+top_pt[1])/2.0, 0.0), label_h):    
    add_graphic_dim(bottom_pt, top_pt, (dim_x_outer, (bottom_pt[1]+top_pt[1])/2.0, 0.0), "")

# ---- AGGREGATE into 4 groups and draw grouped dims (presentation updated) ----------
num_levels = len(levels_sorted_bot_top)
if num_levels < 2:
    print("Not enough merged levels found to aggregate into 4 groups.")
else:
    groups = []
    base = num_levels // 4
    rem = num_levels % 4
    counts = []
    for i in range(4):
        c = base + (1 if i < rem else 0)
        counts.append(c)
    counts = [c for c in counts if c > 0]
    idx = 0
    for c in counts:
        start = idx
        end = idx + c - 1
        groups.append((start, end))
        idx += c

    # Draw dims for each group
    base_x_for_groups = bbox_min[0] - offset * 1.1
    tick_len = text_height_m * 0.8
    gap_stagger = text_height_m * 2.5

    for g_idx, (start_i, end_i) in enumerate(groups):
        y_bottom, xmin_bottom, xmax_bottom = levels_sorted_bot_top[start_i]
        y_top, xmin_top, xmax_top = levels_sorted_bot_top[end_i]

        if y_top < y_bottom:
            y_bottom, y_top = y_top, y_bottom
            xmin_bottom, xmax_bottom, xmin_top, xmax_top = xmin_top, xmax_top, xmin_bottom, xmax_bottom

        xmin_group = min(levels_sorted_bot_top[i][1] for i in range(start_i, end_i+1))
        xmax_group = max(levels_sorted_bot_top[i][2] for i in range(start_i, end_i+1))

        dim_x = base_x_for_groups - g_idx * gap_stagger

        # main vertical dim line with lineweight
        msp.add_line((dim_x, y_bottom, 0.0), (dim_x, y_top, 0.0),
                     dxfattribs={"layer": DIM_LAYER, "lineweight": LINEWEIGHT})

        # ticks at group's horizontal span (top and bottom)
        draw_tick(msp, xmin_group, y_top, tick_len, +1)
        draw_tick(msp, xmax_group, y_top, tick_len, -1)
        draw_tick(msp, xmin_group, y_bottom, tick_len, +1)
        draw_tick(msp, xmax_group, y_bottom, tick_len, -1)

        # label: Level N <value> mm (group own height)
        group_height_m = abs(y_top - y_bottom)
        label_text = f"Level {g_idx+1} {fmt_mm(group_height_m)} mm"
        add_bold_shx_text(label_text, (dim_x - tick_len*0.6, (y_top + y_bottom)/2.0, 0.0), height=text_height_m)

    # overall dim (ground -> top-most)
    # y_ground, xmin_g, xmax_g = levels_sorted_bot_top[0]
    # y_overall_top, xmin_o, xmax_o = levels_sorted_bot_top[-1]
    # overall_dim_x = base_x_for_groups - len(groups) * gap_stagger - gap_stagger
    # msp.add_line((overall_dim_x, y_ground, 0.0), (overall_dim_x, y_overall_top, 0.0),
    #              dxfattribs={"layer": DIM_LAYER, "lineweight": LINEWEIGHT})
    # xmin_all = min(l[1] for l in levels_sorted_bot_top)
    # xmax_all = max(l[2] for l in levels_sorted_bot_top)
    # draw_tick(msp, xmin_all, y_ground, tick_len, +1)
    # draw_tick(msp, xmax_all, y_ground, tick_len, -1)
    # draw_tick(msp, xmin_all, y_overall_top, tick_len, +1)
    # draw_tick(msp, xmax_all, y_overall_top, tick_len, -1)
    # add_bold_shx_text(f"Overall {fmt_mm(abs(y_overall_top - y_ground))} mm",
    #                   (overall_dim_x - tick_len*0.6, (y_overall_top + y_ground)/2.0, 0.0),
    #                   height=text_height_m)

# ---- save file (dims-only or full) ----
if OUTPUT_DIMS_ONLY:
    newdoc = ezdxf.new(dxfversion=doc.dxfversion)
    newmsp = newdoc.modelspace()
    try:
        newdoc.styles.add(TEXT_STYLE_NAME, font=TEXT_FONT_SHX)
    except Exception:
        pass
    try:
        newdoc.layers.add(DIM_LAYER)
    except Exception:
        pass
    for e in doc.modelspace():
        try:
            if e.dxftype() == "DIMENSION":
                newmsp.add_entity(e.copy())
            elif e.dxftype() in ("TEXT","MTEXT","LINE","LWPOLYLINE","POLYLINE"):
                try:
                    if e.dxf.layer == DIM_LAYER:
                        newmsp.add_entity(e.copy())
                except Exception:
                    pass
        except Exception:
            continue
    newdoc.saveas(str(OUT))
    print("Saved dimensions-only DXF to:", OUT)
else:
    doc.saveas(str(OUT))
    print("Saved annotated DXF to:", OUT)

print("Done.")
