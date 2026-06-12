import math
import time

    
BASE_WIDTH = 17
BASE_HEIGHT = 22
THRESHOLD = 128


MULTIPLIER = 2

WIDTH = BASE_WIDTH * MULTIPLIER
HEIGHT = BASE_HEIGHT * MULTIPLIER

def generate_scaled_raster(w, h):
    raster = []
    for y in range(h):
        row = []
        for x in range(w):
            dist = (((x - w/2)/(0.8 * MULTIPLIER))**2 + ((y - h/2)/(0.6 * MULTIPLIER))**2)**0.5
            val = 0 if dist < 8 * MULTIPLIER else 255
            row.append(val)
        raster.append(row)
    return raster

def lerp_edge(p1, p2, v1, v2, threshold):
    if abs(v1 - v2) < 1e-6: return p1
    t = (threshold - v1) / (v2 - v1)
    return (p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1]))

def get_vector_segments(raster, threshold):
    segments = []
    for x in range(WIDTH - 1):
        for y in range(HEIGHT - 1):
            v1 = raster[y][x]
            v2 = raster[y][x+1]
            v3 = raster[y+1][x+1]
            v4 = raster[y+1][x]
            
            state = 0
            if v1 < threshold: state += 8
            if v2 < threshold: state += 4
            if v3 < threshold: state += 2
            if v4 < threshold: state += 1
            
            top    = lerp_edge((x, y), (x+1, y), v1, v2, threshold)
            right  = lerp_edge((x+1, y), (x+1, y+1), v2, v3, threshold)
            bottom = lerp_edge((x+1, y+1), (x, y+1), v3, v4, threshold)
            left   = lerp_edge((x, y+1), (x, y), v4, v1, threshold)
            
            if state in [1, 14]: segments.append((left, bottom))
            elif state in [2, 13]: segments.append((bottom, right))
            elif state in [3, 12]: segments.append((left, right))
            elif state in [4, 11]: segments.append((top, right))
            elif state in [5]: segments.append((top, left)); segments.append((bottom, right))
            elif state in [6, 9]: segments.append((top, bottom))
            elif state in [7, 8]: segments.append((top, left))
            elif state in [10]: segments.append((top, right)); segments.append((bottom, left))
    return segments

# --- Замір часу та виконання ---
start_time = time.time()

raster_data = generate_scaled_raster(WIDTH, HEIGHT)
vector_segments = get_vector_segments(raster_data, THRESHOLD)

end_time = time.time()
execution_time = (end_time - start_time) * 1000 # у мілісекундах

print(f"--- Результати для масштабу {MULTIPLIER}x ({WIDTH}x{HEIGHT}) ---")
print(f"Кількість оброблених пікселів: {WIDTH * HEIGHT}")
print(f"Час виконання векторизації: {execution_time:.2f} мс")

# Збереження SVG (масштаб відображення зменшуємо, щоб файл не був величезним)
def export_svg(segments, filename):
    scale = 20 / MULTIPLIER
    with open(filename, 'w') as f:
        f.write(f'<svg width="{WIDTH*scale}" height="{HEIGHT*scale}" viewBox="0 0 {WIDTH} {HEIGHT}" xmlns="http://www.w3.org/2000/svg">\n')
        path_data = "".join([f"M {s[0][0]},{s[0][1]} L {s[1][0]},{s[1][1]} " for s in segments])
        f.write(f'<path d="{path_data}" stroke="blue" stroke-width="0.1" fill="none" />\n')
        f.write('</svg>')

export_svg(vector_segments, f"lab3_AID_{MULTIPLIER}x.svg")