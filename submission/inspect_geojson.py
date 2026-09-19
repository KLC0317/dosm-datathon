import json

with open("data/malaysia.state.min.geojson", "r", encoding="utf-8") as f:
    d = json.load(f)

def flatten(coords):
    if isinstance(coords[0], (int, float)):
        return [coords]
    res = []
    for c in coords:
        res.extend(flatten(c))
    return res

for f in d["features"]:
    name = f["properties"]["name"]
    sname = f["properties"].get("state_name")
    pts = flatten(f["geometry"]["coordinates"])
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    cx = sum(xs) / len(xs)
    cy = sum(ys) / len(ys)
    span_x = max(xs) - min(xs)
    span_y = max(ys) - min(ys)
    print(f"{name:15s} ({sname:18s}): center lon={cx:.3f}, lat={cy:.3f} | span lon={span_x:.4f}, lat={span_y:.4f}")
