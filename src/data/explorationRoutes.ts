export interface ExplorationRoute {
    id: string;
    name: string;
    startPoint: [number, number]; // [lng, lat]
    color: string;
}

export const explorationRoutes: ExplorationRoute[] = [
    {
        id: 'sasayama-main',
        name: '味間ルート (丹波篠山 散策)',
        startPoint: [135.16195, 35.0747], // Start of course.json
        color: '#2D5A27'
    },
    {
        id: 'station-area',
        name: '篠山口駅エリア',
        startPoint: [135.1740, 35.0610],
        color: '#FF8C00'
    },
    {
        id: 'jokamachi-area',
        name: '城下町エリア',
        startPoint: [135.2166, 35.0755],
        color: '#800000'
    }
];
