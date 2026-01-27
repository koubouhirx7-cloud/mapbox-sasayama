export interface POI {
    id: number;
    lat: number;
    lon: number;
    name: string;
    type: 'restaurant' | 'cafe' | 'toilet' | 'tourism' | 'convenience';
    tags: any;
}

export async function fetchPOIs(bounds: { south: number, west: number, north: number, east: number }): Promise<POI[]> {
    const query = `
        [out:json][timeout:25];
        (
          node["amenity"="restaurant"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          node["amenity"="cafe"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          node["amenity"="toilets"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          node["tourism"="information"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          node["shop"="convenience"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        );
        out body;
        >;
        out skel qt;
    `;

    const url = 'https://overpass-api.de/api/interpreter';

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: query
        });

        if (!response.ok) {
            throw new Error(`Overpass API error: ${response.statusText}`);
        }

        const data = await response.json();
        const pois: POI[] = [];

        data.elements.forEach((element: any) => {
            if (element.type === 'node' && element.tags) {
                let type: POI['type'] = 'restaurant';
                if (element.tags.amenity === 'cafe') type = 'cafe';
                else if (element.tags.amenity === 'toilets') type = 'toilet';
                else if (element.tags.tourism === 'information') type = 'tourism';
                else if (element.tags.shop === 'convenience') type = 'convenience';

                // Skip unnamed toilets/convenience stores if prefered, but usually we want them all
                // For restaurants, names are better but we can show unnamed ones too

                // Name resolution
                let name = element.tags.name || element.tags['name:ja'] || element.tags['name:en'];

                // Special handling for toilets: if unnamed, call it "Public Toilet"
                if (!name && type === 'toilet') {
                    name = '公衆トイレ';
                }

                // If still no name, skip it (User requested removal of "Name Unregistered" items)
                if (!name) return;

                pois.push({
                    id: element.id,
                    lat: element.lat,
                    lon: element.lon,
                    name: name,
                    type: type,
                    tags: element.tags
                });
            }
        });

        return pois;
    } catch (error) {
        console.error('Failed to fetch POIs:', error);
        return [];
    }
}
