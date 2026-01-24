export interface ExplorationRoute {
    id: string;
    name: string;
    startPoint: [number, number]; // [lng, lat]
    color: string;
}

export const explorationRoutes: ExplorationRoute[] = [
    {
        id: 'sasayama-main',
        name: '丹波篠山 散策コース',
        startPoint: [135.16195, 35.0747], // Start of course.json
        color: '#2D5A27'
    },
    {
        id: 'mock-loop-west',
        name: '西の里山 緩やか周回',
        startPoint: [135.148337, 35.064192],
        color: '#4A3728'
    },
    {
        id: 'mock-hills-north',
        name: '北の峠越えコース',
        startPoint: [135.166, 35.063],
        color: '#879166'
    }
];
