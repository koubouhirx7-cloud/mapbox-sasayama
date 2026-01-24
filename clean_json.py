import json

input_path = 'src/data/course_sasayama.json'
output_path = 'src/data/course_sasayama.json'

def clean_coords(coords):
    new_coords = []
    for c in coords:
        if isinstance(c, list):
            # Keep only first 2 elements (lng, lat)
            new_coords.append(c[:2])
    return new_coords

try:
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if data['type'] == 'FeatureCollection':
        for feature in data['features']:
            if feature['geometry']['type'] == 'LineString':
                feature['geometry']['coordinates'] = clean_coords(feature['geometry']['coordinates'])

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    print(f"Successfully cleaned {input_path}")

except Exception as e:
    print(f"Error: {e}")
