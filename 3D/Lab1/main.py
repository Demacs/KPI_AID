def generate_svg_bezier(points, k=0.16):

    extended = [points[-1]] + points + points[:2]
    
    path_data = []
    # Початкова точка (M)
    path_data.append(f"M {points[0][0]},{points[0][1]}")
    
    # Будуємо 5 сегментів кривої
    for i in range(1, len(points) + 1):
        p0 = extended[i-1]
        p1 = extended[i]
        p2 = extended[i+1]
        p3 = extended[i+2]
        
       
        c1_x = p1[0] + (p2[0] - p0[0]) * k
        c1_y = p1[1] + (p2[1] - p0[1]) * k
        
        c2_x = p2[0] - (p3[0] - p1[0]) * k
        c2_y = p2[1] - (p3[1] - p1[1]) * k
        
        
        path_data.append(f"C {c1_x:.2f},{c1_y:.2f} {c2_x:.2f},{c2_y:.2f} {p2[0]},{p2[1]}")
    
    # Формуємо повний SVG файл
    svg_content = f'''<?xml version="1.0" encoding="UTF-8" ?>
<svg width="1600" height="1600" viewBox="0 0 1600 1600" xmlns="http://www.w3.org/2000/svg">
    <path fill="none" stroke="black" stroke-width="2" d="{" ".join(path_data)} Z" />
    { "".join([f'<circle cx="{p[0]}" cy="{p[1]}" r="4" fill="red" />' for p in points]) }
</svg>'''
    return svg_content

# Точки варіанту 2 
variant_2_points = [
    (220, 339), 
    (227, 202), 
    (292, 80), 
    (243, 148), 
    (340, 152)
]

# Генеруємо SVG для основного завдання (k = 0.15)
with open("lab1_AID_variant2-K.svg", "w", encoding="utf-8") as f:
    f.write(generate_svg_bezier(variant_2_points, k=0.15))

print("Файл lab1_AID_variant2.svg успішно створено!")