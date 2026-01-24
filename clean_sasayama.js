
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/data/course_sasayama.json');

try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    if (data.features) {
        data.features.forEach(f => {
            if (f.geometry && f.geometry.coordinates) {
                // Strip Z
                f.geometry.coordinates = f.geometry.coordinates.map(c => [c[0], c[1]]);
            }
        });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
    console.log('Successfully cleaned course_sasayama.json');
} catch (e) {
    console.error('Error cleaning file:', e);
    process.exit(1);
}
