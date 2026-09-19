import math

def merc(lon, lat, c_lon, c_lat, sc, w, h):
    x = (lon - c_lon) * (sc * math.pi / 180) + w / 2
    y_lat = math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    y_c = math.log(math.tan(math.pi / 4 + math.radians(c_lat) / 2))
    return x, h / 2 - (y_lat - y_c) * sc

# KL & PJ test
kl_x, kl_y = merc(101.699, 3.144, 101.686, 3.062, 25000, 460, 220)
print(f"KL marker: ({kl_x:.1f}, {kl_y:.1f}) | Box x: [{kl_x + 65:.1f}, {kl_x + 65 + 130:.1f}], y: [{kl_y - 28:.1f}, {kl_y - 28 + 36:.1f}]")

pj_x, pj_y = merc(101.687, 2.930, 101.686, 3.062, 25000, 460, 220)
print(f"PJ marker: ({pj_x:.1f}, {pj_y:.1f}) | Box x: [{pj_x - 185:.1f}, {pj_x - 185 + 125:.1f}], y: [{pj_y - 18:.1f}, {pj_y - 18 + 36:.1f}]")

# Labuan test
lb_x, lb_y = merc(115.22, 5.30, 115.24, 5.29, 30000, 460, 220)
print(f"LB marker: ({lb_x:.1f}, {lb_y:.1f}) | Box x: [{lb_x - 195:.1f}, {lb_x - 195 + 130:.1f}], y: [{lb_y - 28:.1f}, {lb_y - 28 + 36:.1f}]")
