import json

d = json.load(open('data/malaysia.state.min.geojson', encoding='utf-8'))
def bbox(coords):
    pts = []
    def flat(c):
        if isinstance(c[0], (int, float)): pts.append(c)
        else:
            for x in c: flat(x)
    flat(coords)
    lons = [p[0] for p in pts]
    lats = [p[1] for p in pts]
    return min(lons), min(lats), max(lons), max(lats), (min(lons)+max(lons))/2, (min(lats)+max(lats))/2

west_names = ['Kedah', 'Kelantan', 'Perak', 'Pulau Pinang', 'WP K Lumpur', 'Negeri Sembilan', 'Melaka', 'Perlis', 'Pahang', 'Terengganu', 'WP Putrajaya', 'Selangor', 'Johor']

for f in d['features']:
    name = f['properties']['name']
    b = bbox(f['geometry']['coordinates'])
    print(f'{name:15}: lon [{b[0]:.3f}, {b[2]:.3f}], lat [{b[1]:.3f}, {b[3]:.3f}], center: [{b[4]:.3f}, {b[5]:.3f}]')

w_lons = []
w_lats = []
e_lons = []
e_lats = []
for f in d['features']:
    name = f['properties']['name']
    b = bbox(f['geometry']['coordinates'])
    if name in west_names:
        w_lons.extend([b[0], b[2]])
        w_lats.extend([b[1], b[3]])
    else:
        e_lons.extend([b[0], b[2]])
        e_lats.extend([b[1], b[3]])

print("---")
print(f"West Malaysia bbox: lon [{min(w_lons):.3f}, {max(w_lons):.3f}], lat [{min(w_lats):.3f}, {max(w_lats):.3f}], center: [{(min(w_lons)+max(w_lons))/2:.3f}, {(min(w_lats)+max(w_lats))/2:.3f}]")
print(f"East Malaysia bbox: lon [{min(e_lons):.3f}, {max(e_lons):.3f}], lat [{min(e_lats):.3f}, {max(e_lats):.3f}], center: [{(min(e_lons)+max(e_lons))/2:.3f}, {(min(e_lats)+max(e_lats))/2:.3f}]")
