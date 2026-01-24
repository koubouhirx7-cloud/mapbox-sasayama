import courseSasayama from './course_sasayama.json';
import courseTamba from './course_tamba.json';
import courseFukusumi from './course_fukusumi.json';

export interface ExplorationRoute {
    id: string;
    name: string;
    startPoint: [number, number]; // [lng, lat]
    color: string;
    category: 'route' | 'area';
    data?: any;
}

export const explorationRoutes: ExplorationRoute[] = [
    {
        id: 'sasayama-main',
        name: '味間ルート (丹波篠山 散策)',
        startPoint: [135.16195, 35.0747], // Start of course_sasayama.json
        color: '#2D5A27',
        category: 'route',
        data: courseSasayama
    },
    {
        id: 'tamba-ride',
        name: '妻入り造り・城下町コース',
        startPoint: [135.21742, 35.07400], // Start of course_tamba.json
        color: '#2D5A27',
        category: 'route',
        data: courseTamba
    },
    {
        id: 'fukusumi-ride',
        name: '宿場町 福住コース (丹波篠山 東部)',
        startPoint: [135.34359, 35.07127], // Start of course_fukusumi.json
        color: '#5D4037', // Earthy brown/dark wood color for Shukuba-machi style
        category: 'route',
        data: courseFukusumi
    },
    {
        id: 'station-area',
        name: '篠山口駅エリア',
        startPoint: [135.1740, 35.0610],
        color: '#FF8C00',
        category: 'area'
    },
    {
        id: 'jokamachi-area',
        name: '城下町エリア',
        startPoint: [135.2166, 35.0755],
        color: '#800000',
        category: 'area'
    }
];
