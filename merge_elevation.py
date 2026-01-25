
import json
import subprocess

# 1. Get current file content
with open('/Users/murakamidaisuke/Downloads/Antigraviti/mapbox/src/data/course_sasayama.json', 'r', encoding='utf-8') as f:
    current_file = json.load(f)

# 2. Get old file content from git e85764a
old_file_content = subprocess.check_output(['git', 'show', 'e85764a:src/data/course_sasayama.json'], cwd='/Users/murakamidaisuke/Downloads/Antigraviti/mapbox').decode('utf-8')
old_file = json.loads(old_file_content)

# 3. Extract the elevation-rich LineString coordinates
old_route_feature = next(f for f in old_file['features'] if f['geometry']['type'] == 'LineString')
print(f"Old coordinates count: {len(old_route_feature['geometry']['coordinates'])}")

# 4. Update the current file's LineString
current_route_feature = next(f for f in current_file['features'] if f['geometry']['type'] == 'LineString')
current_route_feature['geometry']['coordinates'] = old_route_feature['geometry']['coordinates']
print(f"New coordinates count: {len(current_route_feature['geometry']['coordinates'])}")

# 5. Write back to file
with open('/Users/murakamidaisuke/Downloads/Antigraviti/mapbox/src/data/course_sasayama.json', 'w', encoding='utf-8') as f:
    json.dump(current_file, f, ensure_ascii=False, indent=4)

print("Successfully merged elevation data.")
