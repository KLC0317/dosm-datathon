import json
import math

with open("data/malaysia.state.min.geojson", "r", encoding="utf-8") as f:
    geo = json.load(f)

for feat in geo["features"]:
    name = feat["properties"]["name"]
    if name in ["WP K Lumpur", "WP Putrajaya", "WP Labuan"]:
        coords = feat["geometry"]["coordinates"]
        print(f"Found {name}: geom_type={feat['geometry']['type']}, num_rings={len(coords)}")
