import math

def mercator(lon, lat, c_lon, c_lat, scale, w, h):
    x = (lon - c_lon) * (scale * math.pi / 180) + w / 2
    y_lat = math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    y_c = math.log(math.tan(math.pi / 4 + math.radians(c_lat) / 2))
    return x, h / 2 - (y_lat - y_c) * scale

west_states = {
    'Perlis': [100.246, 6.491],
    'Kedah': [100.60, 5.95],
    'Pulau Pinang': [100.28, 5.38],
    'Perak': [101.06, 4.75],
    'Kelantan': [102.00, 5.30],
    'Terengganu': [102.95, 4.90],
    'Pahang': [102.60, 3.80],
    'Selangor': [101.35, 3.45],
    'Kuala Lumpur': [101.686, 3.142],
    'Putrajaya': [101.695, 2.930],
    'Negeri Sembilan': [102.35, 2.78],
    'Melaka': [102.25, 2.25],
    'Johor': [103.35, 1.95],
}

print("=== OVERVIEW CALLOUT TEST (WEST MALAYSIA 470x480) ===")
for name, (lon, lat) in west_states.items():
    x, y = mercator(lon, lat, 102.1, 4.0, 4500, 470, 480)
    # If on right side of peninsula (x > 240) or special, put box on right or left
    if name in ['Pulau Pinang', 'Selangor', 'Putrajaya', 'Melaka']:
        dx = -45
        box_x = x + dx - 180
    else:
        dx = 45
        box_x = x + dx
    box_y = y - 25 - 24
    print(f"{name:16}: pos=({x:5.1f}, {y:5.1f}) | box_x=[{box_x:5.1f}, {box_x+180:5.1f}], box_y=[{box_y:5.1f}, {box_y+54:5.1f}]")
