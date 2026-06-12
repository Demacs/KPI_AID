import math

# --- Етап 1: Вихідні дані (Варіант 2) ---
POINTS = [
    (154, 368, 202), 
    (15, 449, 410), 
    (443, 365, 227), 
    (242, 471, 479)
]
Z_SLICE = 256  # Площина перетину 


THRESHOLD_META = 0.00008 

THRESHOLD_LEMN = 2000000000 

# --- Етап 2: Математичні функції ---

def get_dist(x, y, z, p):
    return math.sqrt((x - p[0])**2 + (y - p[1])**2 + (z - p[2])**2)

def f_metaballs(x, y):
    """Сума обернених квадратів відстаней: f(x,y) = sum(1/d^2)"""
    res = 0
    for p in POINTS:
        d = get_dist(x, y, Z_SLICE, p)
        if d < 1e-5: return 1e9
        res += 1.0 / (d**2)
    return res

def f_lemniscate(x, y):
    """Добуток відстаней до фокусів: f(x,y) = product(d)"""
    res = 1.0
    for p in POINTS:
        res *= get_dist(x, y, Z_SLICE, p)
    return res

# --- Етап 3: Алгоритм Marching Squares  ---

def get_state(v1, v2, v3, v4, threshold, is_meta):

    def inside(val):
        return val > threshold if is_meta else val < threshold
    
    state = 0
    if inside(v1): state += 8
    if inside(v2): state += 4
    if inside(v3): state += 2
    if inside(v4): state += 1
    return state

def interpolate(p1, p2, v1, v2, threshold):
    """Лінійна інтерполяція для знаходження точки на ребрі"""
    if abs(v1 - v2) < 1e-9: return p1
    t = (threshold - v1) / (v2 - v1)
    return (p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1]))

def generate_contours(func, threshold, is_meta, size=600, res=5):
    segments = []
    
    for x in range(0, size, res):
        for y in range(0, size, res):
            
            v1 = func(x, y)
            v2 = func(x + res, y)
            v3 = func(x + res, y + res)
            v4 = func(x, y + res)
            
            state = get_state(v1, v2, v3, v4, threshold, is_meta)
            
           
            top    = interpolate((x, y), (x + res, y), v1, v2, threshold)
            right  = interpolate((x + res, y), (x + res, y + res), v2, v3, threshold)
            bottom = interpolate((x + res, y + res), (x, y + res), v3, v4, threshold)
            left   = interpolate((x, y + res), (x, y), v4, v1, threshold)
            
         
            if state in [1, 14]: segments.append((left, bottom))
            elif state in [2, 13]: segments.append((bottom, right))
            elif state in [3, 12]: segments.append((left, right))
            elif state in [4, 11]: segments.append((top, right))
            elif state in [5]:     segments.append((top, left)); segments.append((bottom, right))
            elif state in [6, 9]:  segments.append((top, bottom))
            elif state in [7, 8]:  segments.append((top, left))
            elif state in [10]:    segments.append((top, right)); segments.append((bottom, left))
            if state != 0 and state != 15:
                print("State:", state)
    return segments

# --- Етап 4: Генерація SVG ---

def save_to_svg(filename, meta_segs, lemn_segs):
    with open(filename, "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8" ?>\n')
        f.write('<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">\n')
        f.write('<rect width="100%" height="100%" fill="white" />\n')
        
        for s in meta_segs:
            f.write(f'<line x1="{s[0][0]}" y1="{s[0][1]}" x2="{s[1][0]}" y2="{s[1][1]}" stroke="blue" stroke-width="1.5" />\n')
        
       
        for s in lemn_segs:
            f.write(f'<line x1="{s[0][0]}" y1="{s[0][1]}" x2="{s[1][0]}" y2="{s[1][1]}" stroke="red" stroke-width="3"/>\n')
        
        
        for p in POINTS:
            f.write(f'<circle cx="{p[0]}" cy="{p[1]}" r="3" fill="black" />\n')
            
        f.write('</svg>')

# Виконання
print("Розрахунок контурів...")
meta_segments = generate_contours(f_metaballs, THRESHOLD_META, True)
lemn_segments = generate_contours(f_lemniscate, THRESHOLD_LEMN, False)
print(len(meta_segments))
print(len(lemn_segments))
mn = float('inf')
mx = float('-inf')

for x in range(0, 600, 5):
    for y in range(0, 600, 5):
        v = f_lemniscate(x, y)
        mn = min(mn, v)
        mx = max(mx, v)

print("Min:", mn)
print("Max:", mx)
threshold = 2000000000

below = 0
above = 0

for x in range(0, 600, 5):
    for y in range(0, 600, 5):
        v = f_lemniscate(x, y)

        if v < threshold:
            below += 1
        else:
            above += 1

print("Below:", below)
print("Above:", above)
save_to_svg("lab2_AID_variant2.svg", meta_segments, lemn_segments)
print("Готово! Результат у файлі lab2_AID_variant2.svg")