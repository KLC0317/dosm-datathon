import json

with open("data/malaysia.state.min.geojson", "r", encoding="utf-8") as f:
    geo = json.load(f)

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

GEO_NAME_MAP = {
    'WP K Lumpur': 'Kuala Lumpur',
    'W.P. Kuala Lumpur': 'Kuala Lumpur',
    'WP Putrajaya': 'Putrajaya',
    'W.P. Putrajaya': 'Putrajaya',
    'WP Labuan': 'Labuan',
    'W.P. Labuan': 'Labuan',
    'Pulau Pinang': 'Pulau Pinang',
}

state_zoom_config = {}
for feat in geo["features"]:
    raw_name = feat["properties"]["name"]
    name = GEO_NAME_MAP.get(raw_name, raw_name)
    min_x, max_x, min_y, max_y = get_bounds(feat)
    cx = (min_x + max_x) / 2
    cy = (min_y + max_y) / 2
    dx = max_x - min_x
    dy = max_y - min_y
    max_span = max(dx, dy)
    # Estimate zoom scale for a 470x480 container
    # At scale S, 1 deg is S * pi / 180 pixels.
    # We want max_span * (S * pi / 180) to be around 260px (leaving 100px padding for callout box)
    target_scale = int(260 / (max_span * 3.14159 / 180)) if max_span > 0 else 5000
    # Cap between 3000 and 32000
    target_scale = max(3000, min(32000, target_scale))
    state_zoom_config[name] = {
        'center': [round(cx, 4), round(cy, 4)],
        'scale': target_scale,
        'span': [round(dx, 4), round(dy, 4)]
    }

for name, cfg in sorted(state_zoom_config.items()):
    print(f"'{name}': {{ center: [{cfg['center'][0]}, {cfg['center'][1]}], scale: {cfg['scale']} }}, // span: {cfg['span']}")
