import json

with open("data/malaysia.state.min.geojson", "r", encoding="utf-8") as f:
    d = json.load(f)

sel = d["features"][12]["geometry"]["coordinates"]
print("Selangor polygon count:", len(sel))
for p_idx, poly in enumerate(sel):
    print(f"Polygon {p_idx}: {len(poly)} rings")
    for r_idx, ring in enumerate(poly):
        print(f"  Ring {r_idx}: {len(ring)} coords, first={ring[0]}")
