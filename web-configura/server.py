from flask import Flask, request, jsonify
from flask_cors import CORS
import ezdxf
import tempfile
import os
import math
import uuid

app = Flask(__name__)
CORS(app)

# -------------------------------------------------
# Helpers
# -------------------------------------------------

def uid():
    return str(uuid.uuid4())

def v3(p):
    return [float(p.x), float(p.y), float(getattr(p, "z", 0.0))]

def is_annotation_layer(name: str):
    n = name.lower()
    return (
        "text" in n or
        "dim" in n or
        "anno" in n or
        "note" in n
    )

def layer_visible(layer):
    return not layer.is_off() and not layer.is_frozen()

# -------------------------------------------------
# Geometry extractors
# -------------------------------------------------

def extract_line(e):
    return {
        "id": uid(),
        "type": "LINE",
        "layer": e.dxf.layer,
        "start": v3(e.dxf.start),
        "end": v3(e.dxf.end),
    }

def extract_polyline(e):
    pts = []

    if e.dxftype() == "LWPOLYLINE":
        for p in e.get_points():
            pts.append([float(p[0]), float(p[1]), 0.0])
    else:
        for v in e.vertices:
            pts.append(v3(v.dxf.location))

    return {
        "id": uid(),
        "type": "POLYLINE",
        "layer": e.dxf.layer,
        "points": pts,
        "closed": e.closed if hasattr(e, "closed") else False
    }

def extract_circle(e, segments=64):
    c = v3(e.dxf.center)
    r = float(e.dxf.radius)

    pts = []
    for i in range(segments):
        a = 2 * math.pi * i / segments
        pts.append([
            c[0] + r * math.cos(a),
            c[1] + r * math.sin(a),
            0.0
        ])

    return {
        "id": uid(),
        "type": "POLYLINE",
        "layer": e.dxf.layer,
        "points": pts,
        "closed": True
    }

def extract_arc(e, segments=32):
    c = v3(e.dxf.center)
    r = float(e.dxf.radius)
    a1 = math.radians(e.dxf.start_angle)
    a2 = math.radians(e.dxf.end_angle)

    pts = []
    for i in range(segments + 1):
        t = a1 + (a2 - a1) * i / segments
        pts.append([
            c[0] + r * math.cos(t),
            c[1] + r * math.sin(t),
            0.0
        ])

    return {
        "id": uid(),
        "type": "POLYLINE",
        "layer": e.dxf.layer,
        "points": pts
    }

# -------------------------------------------------
# BLOCK EXPLOSION
# -------------------------------------------------

def explode_insert(doc, insert):
    block = doc.blocks.get(insert.dxf.name)
    if not block:
        return []

    angle = math.radians(insert.dxf.rotation or 0)
    sx = insert.dxf.xscale or 1
    sy = insert.dxf.yscale or 1
    ox, oy, _ = v3(insert.dxf.insert)

    cos_a = math.cos(angle)
    sin_a = math.sin(angle)

    entities = []

    for e in block:
        if e.dxftype() != "LINE":
            continue

        x1, y1, _ = v3(e.dxf.start)
        x2, y2, _ = v3(e.dxf.end)

        def tx(x, y):
            x *= sx
            y *= sy
            return (
                ox + x * cos_a - y * sin_a,
                oy + x * sin_a + y * cos_a,
                0.0
            )

        entities.append({
            "id": uid(),
            "type": "LINE",
            "layer": insert.dxf.layer,
            "start": list(tx(x1, y1)),
            "end": list(tx(x2, y2))
        })

    return entities

# -------------------------------------------------
# API
# -------------------------------------------------

@app.route("/api/parse-dxf", methods=["POST"])
def parse_dxf():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file"}), 400

    fd, path = tempfile.mkstemp(suffix=".dxf")
    file.save(path)

    try:
        doc = ezdxf.readfile(path)
        msp = doc.modelspace()

        # Visible layers only
        visible_layers = {
            l.dxf.name for l in doc.layers
            if layer_visible(l) and not is_annotation_layer(l.dxf.name)
        }

        entities = []

        for e in msp:
            layer = e.dxf.layer
            if layer not in visible_layers:
                continue

            t = e.dxftype()

            if t == "LINE":
                entities.append(extract_line(e))

            elif t in ("LWPOLYLINE", "POLYLINE"):
                entities.append(extract_polyline(e))

            elif t == "CIRCLE":
                entities.append(extract_circle(e))

            elif t == "ARC":
                entities.append(extract_arc(e))

            elif t == "INSERT":
                entities.extend(explode_insert(doc, e))

            elif t == "DIMENSION":
                try:
                    entities.extend(extract_dimension_geometry(e))
                except Exception as err:
                    print(f"Skipped DIMENSION {e.dxf.handle}: {err}")


            # ❌ DROP TEXT, MTEXT, DIMENSION FOR NOW

        return jsonify({
            "filename": file.filename,
            "entities": entities,
            "layers": sorted(list(visible_layers))
        })

    finally:
        os.close(fd)
        os.remove(path)

def extract_dimension_geometry(e):
    """
    Convert DIMENSION entity to line geometry
    """
    g = e.dxf

    # Required points
    p1 = v3(g.defpoint2)
    p2 = v3(g.defpoint3)
    dim_line = v3(g.defpoint)

    lines = []

    # Extension lines
    lines.append({
        "id": uid(),
        "type": "LINE",
        "layer": e.dxf.layer,
        "start": p1,
        "end": dim_line
    })

    lines.append({
        "id": uid(),
        "type": "LINE",
        "layer": e.dxf.layer,
        "start": p2,
        "end": dim_line
    })

    # Dimension line
    lines.append({
        "id": uid(),
        "type": "LINE",
        "layer": e.dxf.layer,
        "start": p1,
        "end": p2
    })

    return lines


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    print("CAD-normalized DXF backend running on http://localhost:9000")
    app.run(host="0.0.0.0", port=9000, debug=True)
