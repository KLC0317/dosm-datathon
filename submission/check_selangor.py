import json

with open("data/malaysia.state.min.geojson", "r", encoding="utf-8") as f:
    d = json.load(f)

for i, feat in enumerate(d["features"]):
    props = feat["properties"]
    g = feat["geometry"]
    print(f"Index {i:2d}: {props['name']:15s} type={g['type']}, rings={len(g['coordinates'])}")
    if props["name"] == "Selangor":
        # check number of rings
        for r_idx, ring in enumerate(g["coordinates"]):
            print(f"  Selangor ring {r_idx}: {len(ring)} points")
