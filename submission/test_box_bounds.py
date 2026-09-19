for is_zoomed in [False, True]:
    print(f"=== IS_ZOOMED = {is_zoomed} ===")
    for st in ['Kuala Lumpur', 'Putrajaya', 'Penang', 'Johor', 'Pahang', 'Terengganu', 'Labuan', 'Sabah', 'Sarawak']:
        is_east = st in ['Labuan', 'Sabah', 'Sarawak']
        w = 500 if is_east else 470
        if is_zoomed:
            cx, cy = w / 2, 240
            bx, by = 45, -35
            b_left = cx + 45
        else:
            coords = {'Kuala Lumpur': 202, 'Putrajaya': 203, 'Penang': 92, 'Johor': 333, 'Pahang': 274, 'Terengganu': 302, 'Labuan': 272, 'Sabah': 420, 'Sarawak': 200}
            cx = coords[st]
            if st in ['Johor', 'Pahang', 'Terengganu', 'Sabah', 'Labuan']:
                bx, by = -45, -35
                b_left = cx - 45 - 184
            else:
                bx, by = 45, -35
                b_left = cx + 45
        ok = (0 <= b_left and b_left + 184 <= w)
        print(f"{st:15}: box_x = [{b_left:5.1f}, {b_left+184:5.1f}] in [0, {w}] (OK={ok})")
