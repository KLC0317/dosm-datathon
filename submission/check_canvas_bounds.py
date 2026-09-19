import json, math
with open("data/malaysia.state.min.geojson", encoding="utf-8") as f:
    geo = json.load(f)

def mercator(lon, lat, c_lon, c_lat, scale, w, h):
    x = (lon - c_lon) * (scale * math.pi / 180) + w / 2
    y_lat = math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    y_c = math.log(math.tan(math.pi / 4 + math.radians(c_lat) / 2))
    return x, h / 2 - (y_lat - y_c) * scale

pts_west = []
pts_east = []
for feat in geo["features"]:
    name = feat["properties"]["name"]
    coords = feat["geometry"]["coordinates"]
    def coll(c, arr):
        if isinstance(c[0], (int, float)): arr.append(c)
        else:
            for s in c: coll(s, arr)
    if name in ["Sabah", "Sarawak", "WP Labuan"]:
        coll(coords, pts_east)
    else:
        coll(coords, pts_west)

w_xs = [mercator(p[0], p[1], 102.1, 4.0, 4500, 470, 480)[0] for p in pts_west]
w_ys = [mercator(p[0], p[1], 102.1, 4.0, 4500, 470, 480)[1] for p in pts_west]
print(f"West bounds on 470x480: x=[{min(w_xs):.1f}, {max(w_xs):.1f}], y=[{min(w_ys):.1f}, {max(w_ys):.1f}]")

e_xs = [mercator(p[0], p[1], 114.4, 4.1, 2750, 500, 480)[0] for p in pts_east]
e_ys = [mercator(p[0], p[1], 114.4, 4.1, 2750, 500, 480)[1] for p in pts_east]
print(f"East bounds on 500x480: x=[{min(e_xs):.1f}, {max(e_xs):.1f}], y=[{min(e_ys):.1f}, {max(e_ys):.1f}]")
