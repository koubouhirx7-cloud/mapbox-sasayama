import courseSasayama from './course_sasayama.json';
import courseTamba from './course_tamba.json';
import courseFukusumi from './course_fukusumi.json';
import courseTannan from './course_tannan.json';
import courseJoto from './course_joto.json';
import courseNishiki from './course_nishiki.json';
import courseLoop from './course_loop.json';
import courseTachikui from './course_tachikui.json';

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
        name: '妻入り造り・城下町コース (丹波篠山 西部)',
        startPoint: [135.21742, 35.07400], // Start of course_tamba.json
        color: '#2D5A27',
        category: 'route',
        data: courseTamba
    },
    {
        id: 'fukusumi-ride',
        name: '宿場町 福住コース (丹波篠山 東部)',
        startPoint: [135.34359, 35.07127], // Start of course_fukusumi.json
        color: '#5D4037',
        category: 'route',
        data: courseFukusumi
    },
    {
        id: 'sasayama-loop',
        name: '篠山口駅・城下町 1周コース',
        startPoint: [135.17886, 35.05581], // Start of course_loop.json
        color: '#1E88E5',
        category: 'route',
        data: courseLoop
    },
    {
        id: 'tannan-ride',
        name: '丹南エリア 渓谷コース',
        startPoint: [135.15413, 35.07742], // Start of course_tannan.json
        color: '#43A047',
        category: 'route',
        data: courseTannan
    },
    {
        id: 'joto-ride',
        name: '城東エリア 歴史街道コース',
        startPoint: [135.2784, 35.07028], // Start of course_joto.json
        color: '#D84315',
        category: 'route',
        data: courseJoto
    },
    {
        id: 'nishiki-ride',
        name: '西紀エリア 四季コース',
        startPoint: [135.1616, 35.07501], // Start of course_nishiki.json
        color: '#8E24AA',
        category: 'route',
        data: courseNishiki
    },
    {
        id: 'tachikui-ride',
        name: '立杭エリア (今田町) 陶芸コース',
        startPoint: [135.13075, 34.98046], // Start of course_tachikui.json
        color: '#795548',
        category: 'route',
        data: courseTachikui
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
