
const fs = require('fs');
const { execSync } = require('child_process');

// 1. Get current file content (with properties and checkpoints)
const currentFile = JSON.parse(fs.readFileSync('/Users/murakamidaisuke/Downloads/Antigraviti/mapbox/src/data/course_sasayama.json', 'utf8'));

// 2. Get old file content (with elevation coordinates) from git e85764a
const oldFileContent = execSync('git show e85764a:src/data/course_sasayama.json').toString();
const oldFile = JSON.parse(oldFileContent);

// 3. Extract the elevation-rich LineString coordinates from the old file
const oldRouteFeature = oldFile.features.find(f => f.geometry.type === 'LineString');
console.log('Old coordinates count:', oldRouteFeature.geometry.coordinates.length);

// 4. Update the current file's LineString with the old coordinates
const currentRouteFeature = currentFile.features.find(f => f.geometry.type === 'LineString');
currentRouteFeature.geometry.coordinates = oldRouteFeature.geometry.coordinates;
console.log('New coordinates count:', currentRouteFeature.geometry.coordinates.length);

// 5. Write back to file
fs.writeFileSync('/Users/murakamidaisuke/Downloads/Antigraviti/mapbox/src/data/course_sasayama.json', JSON.stringify(currentFile, null, 4));
console.log('Successfully merged elevation data.');
