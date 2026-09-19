import math

def mercator_proj(lon, lat, center_lon, center_lat, scale, width, height):
    x = (lon - center_lon) * (scale * math.pi / 180) + width / 2
    y_lat = math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    y_center = math.log(math.tan(math.pi / 4 + math.radians(center_lat) / 2))
    y = height / 2 - (y_lat - y_center) * scale
    return x, y

west_centers = {
    'Perlis': [100.246, 6.491],
    'Kedah': [100.550, 5.950],
    'Penang': [100.320, 5.380],
    'Perak': [101.058, 4.801],
    'Kelantan': [102.001, 5.395],
    'Terengganu': [102.936, 4.923],
    'Pahang': [102.600, 3.750],
    'Selangor': [101.450, 3.450],
    'Kuala Lumpur': [101.690, 3.142],
    'Putrajaya': [101.695, 2.930],
    'Negeri Sembilan': [102.200, 2.780],
    'Melaka': [102.220, 2.273],
    'Johor': [103.350, 1.950],
}

print('WEST MALAYSIA PIXEL COORDS (scale=4900, w=480, h=460):')
for name, (lon, lat) in west_centers.items():
    x, y = mercator_proj(lon, lat, 102.0, 4.0, 4900, 480, 460)
    print(f'{name:15}: x={x:6.1f}, y={y:6.1f}')

east_centers = {
    'Sarawak': [113.0, 2.8],
    'Sabah': [117.2, 5.6],
    'Labuan': [115.22, 5.29],
}

print('\nEAST MALAYSIA PIXEL COORDS (scale=3200, w=480, h=460):')
for name, (lon, lat) in east_centers.items():
    x, y = mercator_proj(lon, lat, 114.5, 4.1, 3200, 480, 460)
    print(f'{name:15}: x={x:6.1f}, y={y:6.1f}')
