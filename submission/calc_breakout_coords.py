import json
import math

with open("data/malaysia.state.min.geojson", "r", encoding="utf-8") as f:
    geo = json.load(f)

def mercator(lon, lat, center_lon, center_lat, scale, width, height):
    x = (lon - center_lon) * (scale * math.pi / 180) + width / 2
    y_lat = math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    y_center = math.log(math.tan(math.pi / 4 + math.radians(center_lat) / 2))
    y = height / 2 - (y_lat - y_center) * scale
    return x, y

def get_bounds(feature):
    pts = []
    geom = feature["geometry"]
    coords = geom["coordinates"]
    def collect(c):
        if isinstance(c[0], (int, float)):
            pts.append(c)
        else:
            for sub in c: collect(sub)
    collect(coords)
    lons = [p[0] for p in pts]
    lats = [p[1] for p in pts]
    return min(lons), max(lons), min(lats), max(lats)

feats = {f["properties"]["name"]: f for f in geo["features"]}

print("=== KL & PUTRAJAYA ===")
kl_min_lon, kl_max_lon, kl_min_lat, kl_max_lat = get_bounds(feats["WP K Lumpur"])
pj_min_lon, pj_max_lon, pj_min_lat, pj_max_lat = get_bounds(feats["WP Putrajaya"])

comb_min_lon = min(kl_min_lon, pj_min_lon)
comb_max_lon = max(kl_max_lon, pj_max_lon)
comb_min_lat = min(kl_min_lat, pj_min_lat)
comb_max_lat = max(kl_max_lat, pj_max_lat)

center_lon = (comb_min_lon + comb_max_lon) / 2
center_lat = (comb_min_lat + comb_max_lat) / 2
print(f"KL + PJ combined: lon [{comb_min_lon:.4f}, {comb_max_lon:.4f}], lat [{comb_min_lat:.4f}, {comb_max_lat:.4f}]")
print(f"Center: [{center_lon:.4f}, {center_lat:.4f}]")
print(f"Span: dLon={comb_max_lon - comb_min_lon:.4f}, dLat={comb_max_lat - comb_min_lat:.4f}")

# Test with width=260, height=260, scale=36000
for scale in [28000, 32000, 36000, 40000]:
    x1, y1 = mercator(comb_min_lon, comb_max_lat, center_lon, center_lat, scale, 260, 260)
    x2, y2 = mercator(comb_max_lon, comb_min_lat, center_lon, center_lat, scale, 260, 260)
    print(f"Scale {scale}: width={x2-x1:.1f}px, height={y2-y1:.1f}px (margins x={(260-(x2-x1))/2:.1f}px, y={(260-(y2-y1))/2:.1f}px)")

print("\n=== LABUAN ===")
lb_min_lon, lb_max_lon, lb_min_lat, lb_max_lat = get_bounds(feats["WP Labuan"])
lb_center_lon = (lb_min_lon + lb_max_lon) / 2
lb_center_lat = (lb_min_lat + lb_max_lat) / 2
print(f"Labuan: lon [{lb_min_lon:.4f}, {lb_max_lon:.4f}], lat [{lb_min_lat:.4f}, {lb_max_lat:.4f}]")
print(f"Center: [{lb_center_lon:.4f}, {lb_center_lat:.4f}]")
print(f"Span: dLon={lb_max_lon - lb_min_lon:.4f}, dLat={lb_max_lat - lb_min_lat:.4f}")

for scale in [35000, 42000, 50000, 58000]:
    x1, y1 = mercator(lb_min_lon, lb_max_lat, lb_center_lon, lb_center_lat, scale, 260, 260)
    x2, y2 = mercator(lb_max_lon, lb_min_lat, lb_center_lon, lb_center_lat, scale, 260, 260)
    print(f"Scale {scale}: width={x2-x1:.1f}px, height={y2-y1:.1f}px (margins x={(260-(x2-x1))/2:.1f}px, y={(260-(y2-y1))/2:.1f}px)")
